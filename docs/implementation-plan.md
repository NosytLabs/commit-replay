# Commit Replay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a working free GitHub recap website with real username lookup, optional private access, inspectable statistics, and share-card exports.

**Architecture:** A portable React/Vinext site uses a browser-side GitHub collector and a pure calculation module. Reports and optional read-only GitHub credentials stay in browser memory; exports are rendered locally. Sites supplies deployment, with no reuse of the owner's local GitHub token or private recap data.

**Tech Stack:** React, TypeScript, installed shadcn primitives, SVG/Canvas, native fetch, Node test runner, Vinext on Sites.

**Spec:** ../../github-recap-community-research.md (parent output research), accepted by the user's instruction to make it real.

## Global Constraints
- Completely free community project; no payments or paid AI dependency.
- Public username lookup must call GitHub, not substitute demo data.
- All-time means available authored commit history on scanned current default branches; explicit incomplete coverage.
- Private access uses an optional fine-grained read-only token held only in memory and sent only to api.github.com. One-click OAuth is a future integration requiring GitHub App registration and a suitable external-auth deployment path.
- No source code, commit messages, credentials, or the original private NosytLabs dataset in shared site source or exports.
- Every export carries period, timezone, coverage, and demo status. Private data is excluded by default.

## Review Focus
- Input that resembles a GitHub URL but is another hostname must be rejected.
- Partially scanned repositories, inaccessible repositories, and rate limits must not become complete zero totals.
- Local midnight, duplicate commit IDs, and a partial current day must preserve correct daily/streak totals.
- Private reports and API tokens must not leak to browser storage, server requests, or default exports.
- A lookup canceled/replaced by another account must not contaminate the new report.

## Task 1: Calculations and collection
Files: lib/recap/types.ts, lib/recap/stats.ts, lib/recap/github.ts, lib/recap/demo.ts, tests/recap.test.ts, tests/github.test.ts.
Interfaces: parseUsername(input): string; computeStats(snapshot, options): RecapStats; collectProfile(input, token?, signal?): Promise<Snapshot>; scanHistory(snapshot, onProgress, token?, signal?): Promise<Snapshot>.
- [x] Write behavior tests for URL validation, SHA deduplication, timezone peaks, streaks through yesterday, private exclusions, pagination, and rate-limit partial state.
- [x] Observe tests fail, implement typed collector and calculations, then pass the complete suite.

## Task 2: Working report and exports
Files: app/page.tsx, app/globals.css, app/layout.tsx, components/recap-app.tsx, components/recap-charts.tsx, components/recap-export.tsx, lib/recap/export.ts, public/favicon.svg.
Interfaces: shared Snapshot/RecapStats feed dashboard, story, heatmaps, and SVG/PNG/JSON/CSV exports.
- [x] Implement the first coherent product slice and show its local preview.
- [x] Complete public lookup, abort/resume, year/timezone/repository controls, meaningful empty/error states, token connection/disconnection, share preview and export.
- [x] Verify privacy-safe exports and browser interactions, responsive layout, and actual GitHub lookup.

## Task 3: Delivery
Files: README.md, docs/data-definitions.md, tests/export.test.ts; hosting manifest and build artifacts.
- [x] Document JSON/CSV exports and deferred local Git imports; add machine-readable page tools when supported.
- [x] Run tests, TypeScript check, production build, and one independent code review; fix important findings.
- [ ] Publish the tested source with Sites and verify terminal deployment success. Hand off the URL and configuration limitations accurately.
