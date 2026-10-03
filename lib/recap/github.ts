import type { Snapshot, Repo } from './types.ts';
import { parseUsername } from './stats.ts';
class GitHubError extends Error {
    status: number;
    retryAt?: string;
    constructor(message: string, status: number, retryAt?: string) { super(message); this.status = status; this.retryAt = retryAt; }
}
// Keep only reset times, never credentials, across requests in this browser tab.
const cooldowns = new WeakMap<typeof fetch, {public: number; authenticated: number}>();
async function api(path: string, token: string | undefined, signal: AbortSignal | undefined, fetcher: typeof fetch) {
    signal?.throwIfAborted();
    const bucket = token ? 'authenticated' : 'public';
    const limits = cooldowns.get(fetcher) ?? {public: 0, authenticated: 0};
    cooldowns.set(fetcher, limits);
    if (limits[bucket] > Date.now()) throw new GitHubError('GitHub’s request limit is still active. Wait for the reset before retrying.', 429, new Date(limits[bucket]).toISOString());
    if (!path.startsWith('/') || path.startsWith('//'))
        throw new Error('Invalid GitHub API path.');
    const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    if (token)
        headers.Authorization = `Bearer ${token}`;
    const response = await fetcher('https://api.github.com' + path, { headers, signal, credentials: 'omit', redirect: 'error', cache: 'no-store' });
    if (response.status === 401)
        throw new GitHubError('That GitHub token is invalid or expired. Disconnect and try a new read-only token.', 401);
    if (response.status === 403 || response.status === 429) {
        const data = await response.json().catch(() => ({ message: '' }));
        if (response.headers.get('x-ratelimit-remaining') === '0' || response.status === 429 || /rate limit|secondary rate|abuse/i.test((data as {
            message?: string;
        }).message ?? '')) {
            const seconds = response.headers.get('retry-after');
            const reset = response.headers.get('x-ratelimit-reset');
            const requestedReset = seconds ? Date.now() + Number(seconds) * 1000 : reset ? Number(reset) * 1000 : Date.now() + 60000;
            limits[bucket] = Number.isFinite(requestedReset) ? Math.max(Date.now() + 1000, requestedReset) : Date.now() + 60000;
            const retryAt = new Date(limits[bucket]).toISOString();
            throw new GitHubError('GitHub’s request limit was reached. Your progress is kept in this tab. Resume after the reset, or connect for a higher limit.', 429, retryAt);
        }
        throw new GitHubError('This repository is not accessible with the current permissions.', 403);
    }
    if (response.status === 404)
        throw new GitHubError('GitHub could not find that account or repository, or access is unavailable.', 404);
    if (response.status === 409)
        return [];
    if (!response.ok)
        throw new GitHubError(`GitHub could not finish this request (${response.status}). Try again shortly.`, response.status);
    return response.json();
}
export async function collectProfile(input: string, token?: string, signal?: AbortSignal, fetcher: typeof fetch = fetch): Promise<Snapshot> {
    const username = input ? parseUsername(input) : '';
    if (!username && !token)
        throw new Error('Enter a GitHub username.');
    const profile = await api(token ? '/user' : `/users/${username}`, token, signal, fetcher) as {
        login: string;
        type: string;
        name: string | null;
        avatar_url: string;
        html_url: string;
        created_at: string;
        followers: number;
        public_repos: number;
    };
    if (!profile || typeof profile.login !== 'string' || !Number.isFinite(Date.parse(profile.created_at)))
        throw new Error('GitHub returned an unexpected profile.');
    if (token && username && profile.login.toLowerCase() !== username.toLowerCase())
        throw new Error('The connected GitHub account does not match this username.');
    if (profile.type !== 'User')
        throw new Error('Use a personal GitHub account. Organization recaps are not supported yet.');
    const result: Snapshot = { version: 1, profile: { login: profile.login, name: profile.name ?? profile.login, avatar: profile.avatar_url ?? '', url: profile.html_url, createdAt: profile.created_at, followers: profile.followers ?? 0, publicRepos: profile.public_repos ?? 0 }, repos: [], commits: [], fetchedAt: new Date().toISOString(), demo: false, repoListComplete: false, requests: 1 };
    for (let page = 1; page <= 20; page++) {
        try {
            const rows = await api(token ? `/user/repos?affiliation=owner&per_page=100&sort=updated&page=${page}` : `/users/${profile.login}/repos?type=owner&per_page=100&sort=updated&page=${page}`, token, signal, fetcher);
            result.requests++;
            if (!Array.isArray(rows))
                throw new Error('GitHub returned an unexpected repository list.');
            const mapped: Repo[] = rows.filter(r => r.owner?.login?.toLowerCase() === profile.login.toLowerCase()).map(r => ({ id: r.id, name: r.name, fullName: r.full_name, url: r.html_url, private: Boolean(r.private), fork: Boolean(r.fork), stars: r.stargazers_count ?? 0, language: r.language ?? null, branch: r.default_branch ?? 'main', status: 'pending', page: 1 }));
            result.repos.push(...mapped.filter(r => !result.repos.some(other => other.id === r.id)));
            if (rows.length < 100) {
                result.repoListComplete = true;
                break;
            }
        }
        catch (error) {
            if (signal?.aborted)
                throw error;
            if (result.repos.length === 0)
                throw error;
            result.message = error instanceof Error ? error.message : 'Repository discovery paused.';
            if (error instanceof GitHubError)
                result.retryAt = error.retryAt;
            break;
        }
    }
    if (!result.repoListComplete && !result.message)
        result.message = 'The first 2,000 repositories were loaded. Repository discovery is incomplete.';
    return result;
}
export async function scanHistory(snapshot: Snapshot, onProgress: (s: Snapshot) => void, token?: string, signal?: AbortSignal, fetcher: typeof fetch = fetch): Promise<Snapshot> {
    signal?.throwIfAborted();
    let state: Snapshot = { ...snapshot, repos: snapshot.repos.map(r => ({ ...r })), commits: [...snapshot.commits], fetchedAt: new Date().toISOString(), message: snapshot.repoListComplete ? undefined : snapshot.message, retryAt: undefined };
    let requestCount = 0;
    const budget = token ? 400 : 45;
    const publish = () => { state = { ...state, repos: state.repos.map(r => ({ ...r })), commits: [...state.commits] }; onProgress(state); };
    for (let index = 0; index < state.repos.length; index++) {
        if (state.repos[index].fork || state.repos[index].status === 'complete')
            continue;
        while (true) {
            signal?.throwIfAborted();
            let repo = state.repos[index];
            if (requestCount >= budget || state.commits.length >= 250000) {
                repo.status = 'pending';
                state.message = state.commits.length >= 250000 ? 'Browser history limit reached (250,000 commit records). This report is partial; download the data already collected.' : 'Scan paused to respect GitHub’s limits. Resume to continue from the last page.';
                publish();
                return state;
            }
            repo.status = 'scanning';
            repo.error = undefined;
            publish();
            repo = state.repos[index];
            try {
                const rows = await api(`/repos/${repo.fullName.split('/').map(encodeURIComponent).join('/')}/commits?sha=${encodeURIComponent(repo.branch)}&author=${encodeURIComponent(state.profile.login)}&per_page=100&page=${repo.page}`, token, signal, fetcher);
                requestCount++;
                state.requests++;
                if (!Array.isArray(rows))
                    throw new Error('GitHub returned an unexpected commit list.');
                const seen = new Set(state.commits.filter(c => c.repoId === repo.id).map(c => c.sha));
                for (const c of rows)
                    if (typeof c.sha === 'string' && c.commit?.author?.date && !seen.has(c.sha)) {
                        const date = c.commit.author.date;
                        if (Number.isFinite(Date.parse(date)))
                            state.commits.push({ sha: c.sha, date, repoId: repo.id, merge: (c.parents?.length ?? 0) > 1 });
                        seen.add(c.sha);
                    }
                repo.page++;
                repo.status = rows.length < 100 ? 'complete' : 'scanning';
                publish();
                if (rows.length < 100)
                    break;
            }
            catch (error) {
                if (signal?.aborted)
                    throw error;
                if (error instanceof GitHubError && (error.status === 429 || error.status === 401)) {
                    repo.status = 'pending';
                    state.message = error.message;
                    state.retryAt = error.retryAt;
                    publish();
                    return state;
                }
                repo.status = 'error';
                repo.error = error instanceof Error ? error.message : 'Repository scan failed.';
                publish();
                break;
            }
        }
    }
    return state;
}
