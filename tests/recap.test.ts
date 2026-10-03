import test from 'node:test';
import assert from 'node:assert/strict';
import { computeStats, parseUsername, availableYears } from '../lib/recap/stats.ts';
import { sample } from './fixture.ts';
test('accepts usernames and exact GitHub profile URLs, rejects hostile and repository URLs', () => {
    assert.equal(parseUsername(' @alice '), 'alice');
    assert.equal(parseUsername('https://github.com/alice/'), 'alice');
    for (const input of ['https://github.com.evil.test/alice', 'https://evil.test/alice', 'https://github.com/alice/project', 'alice/bob', '', 'a--b'])
        assert.throws(() => parseUsername(input));
});
test('deduplicates global SHA totals while retaining per-repository counts', () => { const s = computeStats(sample, { timezone: 'UTC', year: 'all', includePrivate: true }); assert.equal(s.total, 3); assert.equal(s.repos.reduce((n, r) => n + r.commits, 0), 4); });
test('private data is excluded from default public statistics', () => { const s = computeStats(sample, { timezone: 'UTC', year: 'all', includePrivate: false }); assert.equal(s.total, 2); assert.equal(s.repos.length, 1); assert.equal(s.stars, 3); });
test('groups authored timestamps in selected timezone', () => { const s = computeStats(sample, { timezone: 'America/Moncton', year: 'all', includePrivate: true }); assert.equal(s.days.find(d => d.date === '2026-09-19')?.count, 1); assert.equal(s.streak.count, 3); assert.equal(s.currentStreak, 3); });
test('keeps yesterday-ending streak current during a partial today', () => { const s = computeStats(sample, { timezone: 'UTC', year: 'all', includePrivate: true }); assert.equal(s.currentStreak, 2); });
test('year filter and incomplete repository coverage remain explicit', () => { const s = computeStats({ ...sample, repos: [{ ...sample.repos[0], status: 'pending' }] }, { timezone: 'UTC', year: '2025', includePrivate: false }); assert.equal(s.total, 0); assert.equal(s.coverage.partial, true); assert.equal(s.peak, null); });
test('does not let future timestamps or excluded repositories inflate results', () => { const s = computeStats({ ...sample, commits: [...sample.commits, { sha: 'future', repoId: 1, date: '2027-01-01T00:00:00Z', merge: false }] }, { timezone: 'UTC', year: 'all', includePrivate: true, repoIds: [1] }); assert.equal(s.total, 2); });

test('year choices include local dates across a UTC year boundary and empty intervening years',()=>{const snapshot={...sample,profile:{...sample.profile,createdAt:'2024-01-01T00:00:00Z'},commits:[{sha:'new-year',date:'2023-01-01T01:00:00Z',repoId:1,merge:false}]};assert.deepEqual(availableYears(snapshot,'America/Moncton'),['2026','2025','2024','2023','2022']);});
