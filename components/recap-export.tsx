'use client';
import { useMemo, useState } from 'react';
import { Download, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Choice } from './recap-charts';
import { makeReport, renderCard, downloadPNG, saveBlob, toCSV, type CardFormat, type CardCaption, type CardTheme } from '@/lib/recap/export';
import {useMascot} from './use-mascot';
import type { Snapshot, Options } from '@/lib/recap/types';
export function ExportRecap({ snapshot, options, disabled }: {
    snapshot: Snapshot;
    options: Options;
    disabled: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [allowPrivate, setAllowPrivate] = useState(false);
    const [format, setFormat] = useState<CardFormat>('square');
    const [theme, setTheme] = useState<CardTheme>('replay');
    const [caption,setCaption]=useState<CardCaption>('none');
    const [sticker,setSticker]=useState(true);
    const [copied,setCopied]=useState(false);
    const mascot=useMascot();
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const report = useMemo(() => makeReport(snapshot, options, allowPrivate), [snapshot, options, allowPrivate]);
    const svg = useMemo(() => renderCard(report, format, theme, {mascot:sticker?mascot:undefined,caption}), [report, format, theme,mascot,caption,sticker]);
    const filename = `commit-replay-${snapshot.profile.login}-${options.year}`;
    function download(type: 'svg' | 'png' | 'json' | 'csv') { setError(''); if (type === 'png') {
        setBusy(true);
        void downloadPNG(svg, filename + '.png').catch(e => setError(e.message)).finally(() => setBusy(false));
    }
    else if (type === 'svg')
        saveBlob(new Blob([svg], { type: 'image/svg+xml' }), filename + '.svg');
    else if (type === 'json')
        saveBlob(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }), filename + '.json');
    else
        saveBlob(new Blob([toCSV(report)], { type: 'text/csv;charset=utf-8' }), filename + '.csv'); }
    return <Dialog open={open} onOpenChange={value => { setOpen(value); setAllowPrivate(false); setError(''); }}><DialogTrigger asChild><Button disabled={disabled} className="share-button"><Download size={16}/>Export recap</Button></DialogTrigger><DialogContent className="export-dialog"><DialogHeader><DialogTitle>A little something to show for it.</DialogTitle><DialogDescription>Save a card, or take your daily data with you. Everything is created in your browser.</DialogDescription></DialogHeader><div className="export-layout"><div className="card-preview"><img src={'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)} alt={`Share card preview for ${report.login}: ${report.stats.total} authored commits`}/></div><div className="export-options"><label>Shape</label><Choice label="Card shape" value={format} onChange={v => setFormat(v as CardFormat)} items={[{ value: 'square', label: 'Square · 1080 × 1080' }, { value: 'portrait', label: 'Portrait · 1080 × 1350' }, { value: 'landscape', label: 'Landscape · 1600 × 900' }]}/><label>Color</label><Choice label="Card color" value={theme} onChange={v => setTheme(v as CardTheme)} items={[{ value: 'replay', label: 'Replay lime' }, { value: 'midnight', label: 'After hours' }, {value:'paper',label:'Notebook'}]}/><label>Little developer joke</label><Choice label="Card caption" value={caption} onChange={v=>setCaption(v as CardCaption)} items={[{value:'none',label:'Keep it clean'},{value:'one-more',label:'Just one more commit.'},{value:'works',label:'Works on my machine.'},{value:'final',label:'final_final_actually_final'}]}/><label className="check-label"><Checkbox checked={sticker} onCheckedChange={v=>setSticker(v===true)}/>Add the commit cat</label><p className="fine-print">Captions are jokes, not quotes from your commits.</p><div className="privacy-note"><ShieldCheck size={18}/><p>{report.privateIncluded ? 'This download includes private repository names and statistics.' : 'Private repositories are excluded from downloads by default.'}</p></div>{options.includePrivate && snapshot.repos.some(r => r.private) && <label className="check-label"><Checkbox checked={allowPrivate} onCheckedChange={v => setAllowPrivate(v === true)}/>Include my private data in this download</label>}<Button onClick={() => download('png')} disabled={busy}>{busy ? 'Creating image…' : 'Download PNG'}</Button><Button variant="outline" onClick={() => download('svg')}>Download SVG</Button><div className="export-data"><button className="text-button" onClick={() => download('json')}>JSON report</button><button className="text-button" onClick={() => download('csv')}>Daily CSV</button></div><button className="text-button" onClick={async()=>{try{await navigator.clipboard.writeText(`![${snapshot.profile.login}'s GitHub recap](./${filename}.png)`);setCopied(true);setTimeout(()=>setCopied(false),2500);}catch{setError('Clipboard is unavailable. Use the downloaded image directly.');}}}>{copied?'Copied! Add the PNG to your repo.':'Copy README Markdown'}</button><p className="fine-print">Upload the downloaded PNG beside your README. This is a snapshot, not an automatically updating card.</p><p className="fine-print">{report.stats.coverage.partial ? 'Partial scan. Missing history is labeled on every card.' : 'Cards include the period, timezone and scanned repository coverage.'}</p>{error && <p role="alert" className="error-message">{error}</p>}</div></div></DialogContent></Dialog>;
}
