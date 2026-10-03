import type { Snapshot, Repo, Commit } from './types.ts';
export function createDemo(): Snapshot {
    const names = ['midnight-studio', 'tiny-tools', 'orbit-notes', 'weekend-lab', 'paper-plane', 'little-engine', 'dotfiles', 'garden-api'];
    const repos: Repo[] = names.map((name, i) => ({ id: i + 1, name, fullName: 'demo/' + name, url: '', private: false, fork: false, stars: [128, 64, 37, 21, 13, 8, 5, 3][i], language: ['TypeScript', 'TypeScript', 'Python', 'JavaScript', 'Rust', 'TypeScript', 'Shell', 'Go'][i], branch: 'main', status: 'complete', page: 1 }));
    const commits: Commit[] = [];
    let n = 0;
    for (let day = 0; day < 580; day++) {
        const count = day === 499 ? 86 : (day % 17 < 3 ? 0 : Math.floor((Math.sin(day * 2.34) + 1) * 7 + (day / 580) * 9));
        for (let j = 0; j < count; j++) {
            const d = new Date(Date.UTC(2025, 2, 1) + day * 86400000 + (j * 3719 % 86400) * 1000);
            commits.push({ sha: 'demo-' + n++, date: d.toISOString(), repoId: 1 + ((j + day) % 100 < 46 ? 0 : (day + j) % 7 + 1), merge: false });
        }
    }
    return { version: 1, profile: { login: 'demo', name: 'Demo developer', avatar: '', url: '', createdAt: '2025-03-01T00:00:00Z', followers: 42, publicRepos: 8 }, repos, commits, fetchedAt: '2026-10-03T23:59:59Z', demo: true, repoListComplete: true, requests: 0 };
}
