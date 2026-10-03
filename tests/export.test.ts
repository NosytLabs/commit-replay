import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeReport, renderCard, toCSV } from '../lib/recap/export.ts';
import { sample } from './fixture.ts';
test('exports exclude private repositories and recompute totals by default', () => { const r = makeReport(sample, { timezone: 'UTC', year: 'all', includePrivate: true }); assert.equal(r.stats.total, 2); assert.equal(JSON.stringify(r).includes('secret'), false); assert.equal(r.privateIncluded, false); });
test('private export is a separate explicit choice', () => { const r = makeReport(sample, { timezone: 'UTC', year: 'all', includePrivate: true }, true); assert.equal(r.stats.total, 3); assert.equal(r.privateIncluded, true); });
test('cards escape names, retain scope, date and sample labels', () => { const s = { ...sample, demo: true, profile: { ...sample.profile, name: '<script>bad</script>' } }; const svg = renderCard(makeReport(s, { timezone: 'UTC', year: '2026', includePrivate: false }), 'square', 'replay'); assert.ok(!svg.includes('<script>')); assert.ok(svg.includes('SAMPLE')); assert.ok(svg.includes('UTC')); assert.ok(svg.includes('Authored')); assert.ok(svg.includes('2026')); });
test('CSV daily totals match the share report and have labeled columns', () => { const r = makeReport(sample, { timezone: 'UTC', year: 'all', includePrivate: false }); const csv = toCSV(r); assert.ok(csv.startsWith('date,authored_commits')); assert.equal(csv.trim().split('\n').slice(1).reduce((n, line) => n + Number(line.split(',')[1]), 0), r.stats.total); });
