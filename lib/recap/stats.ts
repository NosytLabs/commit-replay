import type { Snapshot, Options, RecapStats, Day } from './types.ts';
export function parseUsername(input: string): string {
    let name = input.trim().replace(/^@/, '');
    if (/^https?:\/\//i.test(name) || name.startsWith('github.com/')) {
        let url: URL;
        try {
            url = new URL(name.startsWith('github.com/') ? 'https://' + name : name);
        }
        catch {
            throw new Error('Enter a GitHub username or profile URL.');
        }
        if (url.hostname !== 'github.com' || url.username || url.password || url.port || url.search || url.hash)
            throw new Error('Use a profile URL on github.com.');
        name = url.pathname.replace(/^\//, '').replace(/\/$/, '');
    }
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(name) || name.includes('--'))
        throw new Error('Enter a valid GitHub username, not a repository URL.');
    return name;
}
export function dayKey(date: string, timezone: string): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(date));
}
function shiftDay(day: string, amount: number) { return new Date(Date.parse(day + 'T12:00:00Z') + amount * 86400000).toISOString().slice(0, 10); }
export function computeStats(snapshot: Snapshot, options: Options): RecapStats {
    const now = options.now ?? snapshot.fetchedAt;
    const today = dayKey(now, options.timezone);
    const selected = new Set(options.repoIds ?? snapshot.repos.filter(r => !r.fork).map(r => r.id));
    const repos = snapshot.repos.filter(r => selected.has(r.id) && (options.includePrivate || !r.private));
    const ids = new Set(repos.map(r => r.id));
    const relevant = snapshot.commits.filter(c => ids.has(c.repoId) && Date.parse(c.date) <= Date.parse(now));
    const format = new Intl.DateTimeFormat('en-CA', { timeZone: options.timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' });
    const global = new Set<string>();
    const perRepo = new Map<number, Set<string>>();
    const daily = new Map<string, Day>();
    const weekdays = Array(7).fill(0) as number[];
    const hours = Array(24).fill(0) as number[];
    for (const commit of relevant) {
        const parts = Object.fromEntries(format.formatToParts(new Date(commit.date)).map(p => [p.type, p.value]));
        const date = `${parts.year}-${parts.month}-${parts.day}`;
        if (options.year !== 'all' && parts.year !== options.year)
            continue;
        const set = perRepo.get(commit.repoId) ?? new Set<string>();
        set.add(commit.sha);
        perRepo.set(commit.repoId, set);
        if (global.has(commit.sha))
            continue;
        global.add(commit.sha);
        const d = daily.get(date) ?? { date, count: 0, repos: {} };
        d.count++;
        d.repos[commit.repoId] = (d.repos[commit.repoId] ?? 0) + 1;
        daily.set(date, d);
        weekdays[new Date(date + 'T12:00:00Z').getUTCDay()]++;
        hours[Number(parts.hour)]++;
    }
    const active = [...daily.values()].sort((a, b) => a.date.localeCompare(b.date));
    const first = active[0]?.date ?? null;
    const last = active.at(-1)?.date ?? null;
    const start = options.year === 'all' ? (first ?? snapshot.profile.createdAt.slice(0, 10)) : `${options.year}-01-01`;
    const end = options.year === 'all' || options.year === today.slice(0, 4) ? today : `${options.year}-12-31`;
    const days: Day[] = [];
    for (let d = start; d <= end; d = shiftDay(d, 1)) {
        days.push(daily.get(d) ?? { date: d, count: 0, repos: {} });
        if (days.length > 37000)
            break;
    }
    let run = 0, runStart: string | null = null;
    const streak = { count: 0, start: null as string | null, end: null as string | null };
    const monthMap = new Map<string, number>();
    for (const d of days) {
        monthMap.set(d.date.slice(0, 7), (monthMap.get(d.date.slice(0, 7)) ?? 0) + d.count);
        if (d.count) {
            if (!run)
                runStart = d.date;
            run++;
            if (run > streak.count) {
                streak.count = run;
                streak.start = runStart;
                streak.end = d.date;
            }
        }
        else {
            run = 0;
            runStart = null;
        }
    }
    let currentStreak = 0;
    let cursor = daily.has(today) ? today : shiftDay(today, -1);
    while (daily.has(cursor)) {
        currentStreak++;
        cursor = shiftDay(cursor, -1);
    }
    const languageCounts = new Map<string, number>();
    for (const r of repos)
        if (r.language)
            languageCounts.set(r.language, (languageCounts.get(r.language) ?? 0) + 1);
    const languageTotal = [...languageCounts.values()].reduce((a, b) => a + b, 0);
    const complete = repos.filter(r => r.status === 'complete').length;
    return { total: global.size, activeDays: active.length, first, last, days, months: [...monthMap].map(([date, count]) => ({ date, count })), peak: active.length ? [...active].sort((a, b) => b.count - a.count || a.date.localeCompare(b.date))[0] : null, streak, currentStreak, weekdays, hours, repos: repos.map(r => ({ ...r, commits: perRepo.get(r.id)?.size ?? 0 })).sort((a, b) => b.commits - a.commits), languages: [...languageCounts].map(([name, count]) => ({ name, count, percent: languageTotal ? count / languageTotal * 100 : 0 })).sort((a, b) => b.count - a.count), coverage: { total: repos.length, complete, errors: repos.filter(r => r.status === 'error').length, partial: complete < repos.length || !snapshot.repoListComplete }, stars: repos.reduce((n, r) => n + r.stars, 0), start, end, timezone: options.timezone, year: options.year, demo: snapshot.demo };
}
export function availableYears(snapshot:Snapshot,timezone:string):string[]{
 const format=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric'});
 const latest=Number(format.format(new Date(snapshot.fetchedAt)));
 let earliest=Number(format.format(new Date(snapshot.profile.createdAt)));
 for(const commit of snapshot.commits){const date=new Date(commit.date);if(date.getTime()<=Date.parse(snapshot.fetchedAt))earliest=Math.min(earliest,Number(format.format(date)));}
 return Array.from({length:Math.min(150,Math.max(1,latest-earliest+1))},(_,i)=>String(latest-i));
}
