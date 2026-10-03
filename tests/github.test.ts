import test from 'node:test';
import assert from 'node:assert/strict';
import { collectProfile, scanHistory } from '../lib/recap/github.ts';
import type { Snapshot } from '../lib/recap/types.ts';
const s: Snapshot = { version: 1, profile: { login: 'alice', name: 'Alice', avatar: '', url: 'https://github.com/alice', createdAt: '2025-01-01', followers: 0, publicRepos: 1 }, repos: [{ id: 1, name: 'repo', fullName: 'alice/repo', url: 'https://github.com/alice/repo', private: false, fork: false, stars: 0, language: null, branch: 'main', status: 'pending', page: 1 }], commits: [], fetchedAt: '2026-10-03T00:00:00Z', demo: false, repoListComplete: true, requests: 0 };
test('collector paginates history and discards source messages', async () => { let n = 0; const fake: typeof fetch = async (input) => { assert.ok(String(input).startsWith('https://api.github.com/repos/alice/repo/commits?')); n++; return Response.json(n === 1 ? Array.from({ length: 100 }, (_, i) => ({ sha: String(i), commit: { author: { date: '2026-01-01T12:00:00Z' }, message: 'SECRET MESSAGE' }, parents: [{}] })) : []); }; const result = await scanHistory(s, () => { }, undefined, undefined, fake); assert.equal(n, 2); assert.equal(result.commits.length, 100); assert.equal(result.repos[0].status, 'complete'); assert.ok(!JSON.stringify(result).includes('SECRET')); });
test('rate limits leave a resumable partial report', async () => { const result = await scanHistory(s, () => { }, undefined, undefined, async () => Response.json({ message: 'API rate limit exceeded' }, { status: 403, headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '2000000000' } })); assert.equal(result.repos[0].status, 'pending'); assert.equal(result.commits.length, 0); assert.ok(result.retryAt); assert.match(result.message ?? '', /limit/i); });
test('bad credentials are rejected rather than silently switching identity', async () => { await assert.rejects(() => collectProfile('alice', 'bad-token', undefined, async () => Response.json({ message: 'Bad credentials' }, { status: 401 })), /token/i); });
test('abort stops collection without converting cancellation into a repo failure', async () => { const abort = new AbortController(); abort.abort(); await assert.rejects(() => scanHistory(s, () => { }, undefined, abort.signal, async () => Response.json([])), { name: 'AbortError' }); });
test('authenticated profile must match the requested account', async () => { await assert.rejects(() => collectProfile('bob', 'token', undefined, async () => Response.json({ login: 'alice', type: 'User', created_at: '2024-01-01T00:00:00Z' })), /signed-in|connected|account/i); });
test('repeated requests respect GitHub cooldown without making another network call',async()=>{
 let calls=0;const fetcher:typeof fetch=async()=>{calls++;return Response.json({message:'secondary rate limit'},{status:429,headers:{'retry-after':'60'}});};
 await scanHistory(s,()=>{},undefined,undefined,fetcher);
 await assert.rejects(()=>collectProfile('alice',undefined,undefined,fetcher),/limit/i);
 assert.equal(calls,1);
});
test('a zero-size repository still has its commit history scanned',async()=>{
 let calls=0;const fetcher:typeof fetch=async()=>Response.json(++calls===1?{login:'alice',type:'User',created_at:'2024-01-01T00:00:00Z'}:[{id:1,name:'tiny',full_name:'alice/tiny',owner:{login:'alice'},size:0,default_branch:'main'}]);
 const result=await collectProfile('alice',undefined,undefined,fetcher);assert.equal(result.repos[0].status,'pending');
});
