import { computeStats } from './stats.ts';
import type { Snapshot, Options, RecapStats } from './types.ts';
export type ShareReport = {
    version: 1;
    login: string;
    name: string;
    fetchedAt: string;
    privateIncluded: boolean;
    scope: string;
    stats: RecapStats;
};
export type CardFormat = 'square' | 'portrait' | 'landscape';
export type CardTheme = 'replay' | 'midnight' | 'paper';
export type CardCaption = 'none' | 'one-more' | 'works' | 'final';
export type CardDecoration = {mascot?:string;caption?:CardCaption};
export const captions:Record<CardCaption,string>={none:'', 'one-more':'Just one more commit.',works:'Works on my machine.',final:'final_final_actually_final'};
export function makeReport(snapshot: Snapshot, options: Options, allowPrivate = false): ShareReport {
    const stats = computeStats(snapshot, { ...options, includePrivate: allowPrivate && options.includePrivate });
    return { version: 1, login: snapshot.profile.login, name: snapshot.profile.name, fetchedAt: snapshot.fetchedAt, privateIncluded: stats.repos.some(r => r.private), scope: 'Authored commits on scanned current default branches of owned repositories. Unique commit IDs; merge commits included. Not profile contributions or push events.', stats };
}
const esc = (s: unknown) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!));
const short = (s: string, n: number) => s.length > n ? s.slice(0, n - 1) + '…' : s;
const n = (v: number) => v.toLocaleString('en-US');
export function renderCard(report:ShareReport,format:CardFormat,theme:CardTheme,decoration:CardDecoration={}):string {
 const [w,h]=format==='portrait'?[1080,1350]:format==='landscape'?[1600,900]:[1080,1080];
 const s=report.stats, dark=theme==='midnight', paper=theme==='paper', wide=format==='landscape', tall=format==='portrait';
 const bg=dark?'#262438':paper?'#f6f3e9':'#d1f579',ink=dark?'#f7f3ff':'#272836',muted=dark?'#b9b0cd':'#535a48',accent=dark?'#d1f579':'#7251d6',panel=dark?'#363249':paper?'#ffffff':'#e3f9ab';
 const p=64, mainY=wide?260:tall?352:300, statTop=wide?355:tall?465:410, statHeight=142, repoY=statTop+(wide?175:195);
 const chartY=wide?655:tall?945:790, chartH=wide?73:tall?210:110;
 const text=(x:number,y:number,value:unknown,size=22,color=ink,weight=400,extra='')=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-weight="${weight}" ${extra}>${esc(value)}</text>`;
 const max=Math.max(1,...s.months.map(m=>m.count)),barW=(w-p*2)/Math.max(1,s.months.length);
 const stride=Math.max(1,Math.ceil(s.months.length/(wide?16:10)));
 const bars=s.months.map((m,i)=>{const height=m.count/max*chartH;const label=i%stride===0||i===s.months.length-1;return `<rect x="${p+i*barW}" y="${chartY+chartH-height}" width="${Math.max(.5,barW*.68)}" height="${height}" rx="${Math.min(4,barW*.1)}" fill="${accent}"/>`+(label?text(p+i*barW,chartY+chartH+25,m.date.slice(2),15,muted):'');}).join('');
 const scope=s.coverage.partial?`PARTIAL SCAN · ${s.coverage.complete}/${s.coverage.total} REPOSITORIES`:`${s.coverage.complete} REPOSITORIES SCANNED`;
 const label=s.demo?'SAMPLE · FICTIONAL DATA':report.privateIncluded?'PRIVATE DATA INCLUDED':'PUBLIC DATA';
 const cellW=(w-p*2-24)/3;
 const cells=[{v:n(s.peak?.count??0),label:'BIGGEST DAY',detail:s.peak?.date??'No commits yet'},{v:String(s.streak.count),label:'LONGEST STREAK',detail:'consecutive calendar days'},{v:n(s.activeDays),label:'ACTIVE DAYS',detail:'at least one authored commit'}].map((c,i)=>{const x=p+i*(cellW+12);return `<rect x="${x}" y="${statTop}" width="${cellW}" height="${statHeight}" rx="16" fill="${panel}"/>`+text(x+22,statTop+55,c.v,44,ink,700)+text(x+22,statTop+90,c.label,17,muted,600)+text(x+22,statTop+117,c.detail,16,muted);}).join('');
 const top=s.repos.find(r=>r.commits);const caption=captions[decoration.caption??'none'];
 const mascot=decoration.mascot&&/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(decoration.mascot)?`<image href="${decoration.mascot}" x="${w-p-(wide?265:255)}" y="${wide?165:mainY-140}" width="${wide?185:225}" height="${wide?185:225}"/>`:'';
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(report.login)} GitHub recap"><rect width="${w}" height="${h}" fill="${bg}"/><g font-family="Arial,Helvetica,sans-serif">${text(p,83,'commit replay',30,ink,700)}${text(w-p,83,s.year==='all'?'ALL TIME':s.year,22,ink,600,'text-anchor="end"')}<line x1="64" y1="111" x2="${w-p}" y2="111" stroke="${muted}" opacity=".25"/>${text(p,155,'@'+report.login,24,ink,600)}${text(w-p,155,label,17,muted,600,'text-anchor="end"')}${text(p,mainY,n(s.total),wide?114:132,ink,700)}${text(p,mainY+43,'authored commits',28,muted)}${caption?text(p,mainY+79,caption,19,muted,500,'font-family="monospace"'):''}${mascot}${cells}${text(p,repoY,'ON HEAVY ROTATION',17,muted,600)}${text(p,repoY+43,short(top?.name??'Your next idea',wide?42:27),34,ink,700)}${text(p,repoY+77,top?`${n(top.commits)} authored commits in this project`:'No commits found in this selection',18,muted)}${text(w-p,repoY+37,n(s.stars),36,ink,700,'text-anchor="end"')}${text(w-p,repoY+70,'stars today',18,muted,400,'text-anchor="end"')}${text(p,chartY-22,'YOUR MONTHLY RHYTHM',17,muted,600)}${bars}<line x1="64" y1="${h-128}" x2="${w-p}" y2="${h-128}" stroke="${muted}" opacity=".25"/>${text(p,h-101,`${s.start} → ${s.end} · ${s.timezone}`,18,muted)}${text(p,h-73,scope,17,ink,700)}${text(p,h-45,'Authored · owned repos · current default branches · merges included',16,muted)}${text(p,h-20,`Fetched ${report.fetchedAt.slice(0,10)} · commit replay`,14,muted)}</g></svg>`;
}
export function toCSV(report: ShareReport): string {
    const s = report.stats;
    const fields = ['date', 'authored_commits', 'timezone', 'period', 'partial_scan', 'sample_data', 'private_included'];
    return fields.join(',') + '\n' + s.days.map(d => [d.date, d.count, s.timezone, s.year, s.coverage.partial, s.demo, report.privateIncluded].join(',')).join('\n') + '\n';
}
export function saveBlob(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 20000); }
export async function downloadPNG(svg: string, filename: string) {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
        const image = new Image();
        await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Image export failed. Try SVG instead.')); image.src = url; });
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            throw new Error('This browser cannot export PNG. Try SVG instead.');
        ctx.drawImage(image, 0, 0);
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Image export failed.')), 'image/png'));
        saveBlob(blob, filename);
    }
    finally {
        URL.revokeObjectURL(url);
    }
}
