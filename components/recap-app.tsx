'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GitCommitHorizontal, GitBranch, RotateCcw, Sparkles, Flame, CalendarDays, FolderGit2, SlidersHorizontal, ShieldCheck, KeyRound, Info, Lock, Check, Pause, ArrowRight, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { createDemo } from '@/lib/recap/demo';
import { computeStats, availableYears } from '@/lib/recap/stats';
import { collectProfile, scanHistory } from '@/lib/recap/github';
import { Rhythm, Breakdowns, Story, Choice, num } from './recap-charts';
import {SiteHeader,SiteFooter} from './site-chrome';
import { ExportRecap } from './recap-export';
import type { Snapshot } from '@/lib/recap/types';
const TIMEZONES = ['UTC', 'America/St_Johns', 'America/Halifax', 'America/Moncton', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Africa/Johannesburg', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Auckland'];
function About() { return <Dialog><DialogTrigger asChild><button className="footer-link">How it works & privacy</button></DialogTrigger><DialogContent className="text-dialog"><DialogHeader><DialogTitle>Good stats tell you what they count.</DialogTitle><DialogDescription>Commit Replay is a free community tool. No subscription, no paid AI, no account required for public profiles.</DialogDescription></DialogHeader><h4>What is counted?</h4><p>Authored commits on the current default branches of repositories you own. Merge commits are included. The same commit ID appears once in the overall total, but may appear in more than one repository total. Forks are excluded.</p><h4>What does “all time” mean?</h4><p>All available history in the repositories successfully scanned. Deleted repositories, inaccessible projects, non-default branches, coauthor-only credits, and work in other people’s repositories are outside this report. Changing the year filters commits; stars and languages remain current snapshots.</p><h4>Commits are different from pushes.</h4><p>A push may contain many commits. GitHub’s Events API only exposes a limited recent history, so an accurate lifetime push count cannot be reconstructed. The daily chart shows authored commits, never invented push totals.</p><h4>Your data stays with you.</h4><p>The browser talks directly to api.github.com. Optional credentials stay in memory until you disconnect, reload, or close the tab. We do not save reports or credentials to a database or browser storage. GitHub receives your API requests; the hosting provider processes ordinary page requests.</p><h4>Sharing is your choice.</h4><p>Downloads exclude private repositories by default. Adding private data to an export requires a separate choice. Your downloaded files remain yours to keep or share. There is no automatic posting or public report link.</p><p className="fine-print">Commit counts describe activity, not skill or productivity. Commit Replay is independent and is not affiliated with GitHub.</p></DialogContent></Dialog>; }
function Connect({ onConnect, busy }: {
    onConnect: (token: string) => Promise<void>;
    busy: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('');
    return <Dialog open={open} onOpenChange={v => { setOpen(v); setValue(''); }}><DialogTrigger asChild><button className="text-button" disabled={busy}><KeyRound size={14}/>Connect private repos</button></DialogTrigger><DialogContent className="text-dialog"><DialogHeader><DialogTitle>Bring more of your story.</DialogTitle><DialogDescription>Use an optional GitHub token for your own account, private repositories, and a higher API allowance.</DialogDescription></DialogHeader><ol><li><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">Create a fine-grained GitHub token ↗</a> with a short expiration.</li><li>Choose your account as the resource owner and select only the repositories you want to include.</li><li>Under repository permissions, allow <strong>Contents: Read-only</strong>. Metadata read access is included by GitHub.</li></ol><div className="privacy-note"><ShieldCheck size={20}/><p>Contents access can read repository source. This tool requests only repository details and commit metadata. The token is sent directly to GitHub and stays only in this tab’s memory.</p></div><form onSubmit={e => { e.preventDefault(); const token = value.trim(); setValue(''); setOpen(false); void onConnect(token); }}><label htmlFor="github-token">Fine-grained personal access token</label><Input id="github-token" type="password" value={value} onChange={e => setValue(e.target.value)} autoComplete="off" placeholder="github_pat_…" required/><Button className="w-full mt-3" disabled={busy || !value.trim()}>Connect & make my recap<ArrowRight size={16}/></Button></form><p className="fine-print">Only repositories this credential can access are included. Revoke it any time in GitHub settings. One-click GitHub sign-in is not configured in this version.</p></DialogContent></Dialog>;
}
export default function RecapApp() {
    const [ready,setReady]=useState(false);
    const [snapshot, setSnapshot] = useState<Snapshot>(createDemo);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [connected, setConnected] = useState('');
    const [year, setYear] = useState('all');
    const [timezone, setTimezone] = useState('UTC');
    const [repoIds, setRepoIds] = useState<number[] | undefined>();
    const [includePrivate, setIncludePrivate] = useState(false);
    const [view, setView] = useState('dashboard');
    const controller = useRef<AbortController | null>(null);
    const token = useRef('');
    useEffect(() => { setReady(true); setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'); return () => { controller.current?.abort(); controller.current = null; token.current = ''; }; }, []);
    const options = useMemo(() => ({ timezone, year, includePrivate, repoIds }), [timezone, year, includePrivate, repoIds]);
    const stats = useMemo(() => computeStats(snapshot, options), [snapshot, options]);
    const years = useMemo(() => availableYears(snapshot, timezone), [snapshot, timezone]);
    function stop() { controller.current?.abort(); controller.current = null; setBusy(false); }
    function demo() { stop(); token.current = ''; setConnected(''); setSnapshot(createDemo()); setYear('all'); setRepoIds(undefined); setIncludePrivate(false); setError(''); setView('dashboard'); }
    async function load(username: string, credential?: string) {
        stop();
        const next = new AbortController();
        controller.current = next;
        token.current = '';
        setConnected('');
        setBusy(true);
        setError('');
        setSnapshot(createDemo());
        setYear('all');
        setRepoIds(undefined);
        setIncludePrivate(false);
        setView('dashboard');
        try {
            const initial = await collectProfile(username, credential, next.signal);
            if (controller.current !== next)
                return;
            token.current = credential ?? '';
            setConnected(credential ? initial.profile.login : '');
            setInput(initial.profile.login);
            setSnapshot(initial);
            setIncludePrivate(!!credential);
            const result = await scanHistory(initial, s => { if (controller.current === next)
                setSnapshot(s); }, credential, next.signal);
            if (controller.current === next)
                setSnapshot(result);
        }
        catch (e) {
            if (controller.current === next && !next.signal.aborted)
                setError(e instanceof Error ? e.message : 'Unable to reach GitHub. Try again.');
        }
        finally {
            if (controller.current === next)
                setBusy(false);
        }
    }
    async function resume() { stop(); const next = new AbortController(); controller.current = next; setBusy(true); setError(''); try {
        const result = await scanHistory(snapshot, s => { if (controller.current === next)
            setSnapshot(s); }, token.current || undefined, next.signal);
        if (controller.current === next)
            setSnapshot(result);
    }
    catch (e) {
        if (controller.current === next && !next.signal.aborted)
            setError(e instanceof Error ? e.message : 'Scan interrupted.');
    }
    finally {
        if (controller.current === next)
            setBusy(false);
    } }
    const currentRefs = useRef({ load, stats, snapshot });
    useEffect(() => { currentRefs.current = { load, stats, snapshot }; });
    useEffect(() => {
        type ModelContext = {
            registerTool: (tool: {
                name: string;
                description: string;
                inputSchema: object;
                execute: (args: Record<string, unknown>) => Promise<unknown>;
            }) => void;
            unregisterTool: (name: string) => void;
        };
        const ctx = (navigator as Navigator & {
            modelContext?: ModelContext;
        }).modelContext;
        if (!ctx)
            return;
        const names = ['get_github_recap_summary', 'generate_public_github_recap'];
        try {
            ctx.registerTool({ name: names[0], description: 'Read the currently displayed GitHub recap summary and data coverage. Never returns credentials, repository names or private totals.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, execute: async () => { const current = currentRefs.current; const publicStats = computeStats(current.snapshot, { timezone: current.stats.timezone, year: current.stats.year, includePrivate: false, repoIds: current.stats.repos.map(r => r.id) }); return { content: [{ type: 'text', text: JSON.stringify({ login: current.snapshot.profile.login, demo: publicStats.demo, total: publicStats.total, peak: publicStats.peak ? { date: publicStats.peak.date, count: publicStats.peak.count } : null, streak: publicStats.streak, coverage: publicStats.coverage, timezone: publicStats.timezone, scope: 'Owned public repositories, authored current-default-branch commits' }) }] }; } });
            ctx.registerTool({ name: names[1], description: 'Generate a recap for a public GitHub username. Replaces the current report and disconnects any private credential.', inputSchema: { type: 'object', properties: { username: { type: 'string' } }, required: ['username'], additionalProperties: false }, execute: async (args) => { if (typeof args.username !== 'string')
                    throw new Error('A GitHub username is required.'); await currentRefs.current.load(args.username); return { content: [{ type: 'text', text: 'Lookup finished. Read the page for the report, coverage, or any error.' }] }; } });
        }
        catch { /* WebMCP is optional and may be unavailable in this browser. */ }
        return () => { for (const name of names)
            try {
                ctx.unregisterTool(name);
            }
            catch { } };
    }, []);
    const selected = new Set(repoIds ?? snapshot.repos.filter(r => !r.fork).map(r => r.id));
    return <div className="site-shell" data-ready={ready}><SiteHeader keepReport/><main id="main-content"><section className="intro"><div><p className="eyebrow">ALL THE LITTLE COMMITS. ONE BIG STORY.</p><h1>Your GitHub,<br /><span>on repeat.</span></h1><p className="intro-copy">Your projects, progress, and personal bests. <br />An all-time recap, made from your GitHub history.</p></div><div className="lookup-panel"><label htmlFor="github-user">Start with your GitHub</label><form onSubmit={e => { e.preventDefault(); void load(input); }} className="lookup-form"><div className="input-wrap"><GitBranch size={20}/><Input id="github-user" placeholder="username or github.com/you" value={input} onChange={e => setInput(e.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} required/></div><Button type="submit" className="primary-button" disabled={busy||!ready}>{busy ? 'Reading history…' : <>Make my recap<ArrowRight size={17}/></>}</Button></form><p className="helper">Public profiles. No account needed.</p><div className="lookup-links"><button className="text-button" disabled={!ready} onClick={demo}><RotateCcw size={14}/>Try the sample</button>{connected ? <button className="text-button" disabled={!ready} onClick={demo}><LogOut size={14}/>Disconnect @{connected}</button> : <Connect busy={busy||!ready} onConnect={t => load('', t)}/>}</div>{error && <div className="error-message" role="alert">{error}</div>}</div></section>
 <section className="recap-board" aria-label="GitHub recap"><div className="report-heading"><div className="profile-info"><div className="profile-avatar">{snapshot.profile.login.slice(0, 2).toUpperCase()}</div><div><div className="eyebrow">{snapshot.demo ? 'SAMPLE RECAP · FICTIONAL DATA' : connected ? 'YOUR CONNECTED RECAP' : 'YOUR PUBLIC RECAP'}</div><h2>{snapshot.demo ? 'A builder’s greatest hits' : snapshot.profile.name}</h2><p>{snapshot.demo ? 'Fictional data. Your actual recap starts with a username.' : '@' + snapshot.profile.login + ' · ' + stats.start + ' → ' + stats.end}</p></div></div><ExportRecap key={snapshot.profile.login} snapshot={snapshot} options={options} disabled={busy||!ready}/></div>
 <div className="report-toolbar"><div className="filter-controls"><Choice label="Report period" value={year} onChange={setYear} items={[{ value: 'all', label: 'All time' }, ...years.map(y => ({ value: y, label: y }))]}/><Choice label="Timezone" value={timezone} onChange={setTimezone} items={[...new Set([timezone, ...TIMEZONES])].map(z => ({ value: z, label: z.replaceAll('_', ' ') }))}/><Dialog><DialogTrigger asChild><Button variant="outline" size="sm"><SlidersHorizontal size={14}/>Repositories</Button></DialogTrigger><DialogContent className="text-dialog"><DialogHeader><DialogTitle>Make this recap yours.</DialogTitle><DialogDescription>Choose repositories to include. Forks are excluded. Filters update the graphs, story and downloads.</DialogDescription></DialogHeader>{snapshot.repos.some(r => r.private) && <label className="check-label"><Checkbox checked={includePrivate} onCheckedChange={v => setIncludePrivate(v === true)}/><Lock size={14}/>Include private repositories in my view</label>}<div className="filter-actions"><button className="text-button" onClick={() => setRepoIds(undefined)}>Select all originals</button><button className="text-button" onClick={() => setRepoIds([])}>Clear selection</button></div><div className="repo-picker">{snapshot.repos.map(r => <label className="check-label" key={r.id}><Checkbox disabled={r.fork || r.private && !includePrivate} checked={selected.has(r.id) && !r.fork} onCheckedChange={v => { const next = new Set(selected); if (v)
        next.add(r.id);
    else
        next.delete(r.id); setRepoIds([...next]); }}/><span>{r.name}<small>{r.private ? 'Private' : 'Public'}{r.fork ? ' · Fork excluded' : ''}</small></span></label>)}</div></DialogContent></Dialog></div><Dialog><DialogTrigger asChild><button className={`coverage-button ${stats.coverage.partial ? 'partial' : ''}`}>{stats.coverage.partial ? <Info size={14}/> : <Check size={14}/>} {stats.coverage.partial ? 'Partial scan' : snapshot.demo ? 'Sample coverage' : 'Available history scanned'} · {stats.coverage.complete}/{stats.coverage.total}</button></DialogTrigger><DialogContent className="text-dialog"><DialogHeader><DialogTitle>What this report covers.</DialogTitle><DialogDescription>Counts reflect only available, scanned history. “All time” does not guarantee every commit you have ever made.</DialogDescription></DialogHeader><p>{stats.coverage.complete} of {stats.coverage.total} selected repositories fully scanned. Repository list: {snapshot.repoListComplete ? 'loaded within current access' : 'incomplete'}.</p><p>Owned repositories · authored commits · current default branches · merge commits included · forks excluded.</p><p>Fetched {new Date(snapshot.fetchedAt).toLocaleString()}. {connected ? 'Only repositories allowed by your credential are visible.' : 'Only publicly accessible repositories are visible.'}</p><div className="coverage-list">{stats.repos.map(r => <div key={r.id}><span>{r.name}</span><span>{r.status === 'scanning' ? 'Reading' : r.status}{r.error ? ' · ' + r.error : ''}</span></div>)}</div><p className="fine-print">Inaccessible or deleted repositories and commits on other branches may be absent. Repo totals can overlap when a commit exists in multiple repositories.</p></DialogContent></Dialog></div>
 {busy && <div className="scan-progress" aria-live="polite"><div><span>Reading your history · {stats.coverage.complete} of {stats.coverage.total} selected repositories</span><Button variant="ghost" size="sm" onClick={stop}><Pause size={14}/>Pause</Button></div><Progress value={snapshot.demo ? 0 : stats.coverage.total ? stats.coverage.complete / stats.coverage.total * 100 : 0}/></div>}
 {!busy && !snapshot.demo && (snapshot.message || stats.coverage.partial) && <div className="scan-notice"><Info size={18}/><div><strong>There’s more to this story.</strong><p>{snapshot.message ?? 'Some repositories are not fully scanned. These totals are partial.'}{snapshot.retryAt ? ' GitHub suggests retrying after ' + new Date(snapshot.retryAt).toLocaleTimeString() + '.' : ''}</p>{!snapshot.repoListComplete && <p>Reload the profile to retry the repository list. Continuing scans only repositories already found.</p>}</div><Button variant="outline" size="sm" onClick={() => void resume()}>Continue scan</Button></div>}
 <Tabs value={view} onValueChange={setView} className="main-tabs"><TabsList aria-label="Recap view"><TabsTrigger value="dashboard">The dashboard</TabsTrigger><TabsTrigger value="story"><Sparkles size={14}/>Your replay</TabsTrigger></TabsList><TabsContent value="dashboard"><div className="stats-grid"><article className="headline-stat"><span><GitCommitHorizontal size={19}/>COMMIT COLLECTION</span><strong>{num(stats.total)}</strong><p>authored commits{stats.coverage.partial ? ' found so far' : ''}.</p><div className="stat-bottom">{num(stats.activeDays)} active days<Sparkles size={20}/></div></article><article className="stat-card"><CalendarDays /><span>Biggest day</span><strong>{num(stats.peak?.count ?? 0)}</strong><p>{stats.peak?.date ?? 'No commits yet'}</p></article><article className="stat-card"><Flame /><span>Longest streak</span><strong>{stats.streak.count}<small>days</small></strong><p>{stats.streak.start ? new Date(stats.streak.start+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'})+' – '+new Date(stats.streak.end+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}) : 'Your next chapter awaits.'}</p></article><article className="stat-card"><FolderGit2 /><span>Projects in the mix</span><strong>{stats.repos.length}</strong><p>{num(stats.stars)} stars today</p></article></div><Rhythm stats={stats}/><Breakdowns stats={stats}/></TabsContent><TabsContent value="story"><Story stats={stats} login={snapshot.profile.login}/></TabsContent></Tabs>
 <div className="scope-note"><ShieldCheck size={18}/><p>Available authored history on owned repositories’ current default branches. Commits aren’t pushes, and activity isn’t a measure of skill. <About /></p></div></section></main><SiteFooter keepReport/></div>;
}
