# SDD ledger — plan: docs/implementation-plan.md

Ruling: Proceed natively after the user accepted the researched scope and explicitly instructed “make it real”; do not add another design-approval loop.
Ruling: New isolated task-owned project directory preserves the research and original private data outside the deployable source. Sites owns source registration and publishing.
Ruling: Sites' current starter authentication path does not establish support for app-owned external OAuth. Deliver functional private access using an optional fine-grained token in browser memory; document one-click GitHub App sign-in as not configured. This trades onboarding convenience for a working private path without pretending an OAuth integration exists.
Ruling: Count authored commits returned by GitHub's author-filtered current-default-branch history. Do not imply coauthor or full profile-contribution coverage. Language mix uses repository primary-language counts, avoiding misleading claims about authored bytes or coding time.
Pre-flight: Task 1 produces Snapshot and RecapStats consumed unchanged by Task 2 exports/UI; Task 3 verifies the same reports and production artifacts.

Task 1: Calculations, collector and export tests passed (16/16); TypeScript check passed.
Task 2: Public NosytLabs lookup completed against GitHub in-browser: 766 unique authored commits, 10 owned public original repositories, 166 commits on 2026-09-19 in America/Moncton. Story, daily inspection, PNG download and mobile overflow check passed.
Ruling: Local Git imports are deferred; this release exports summaries and daily CSV, but does not accept arbitrary imported snapshots. This avoids implying imported Git data has the same provenance as live API data. Cost: very large/offline accounts cannot use that alternate path yet.
Ruling: This is a new isolated Sites project, so the managed source workflow owns Git registration and the final source commit. The review reads the new product files rather than an unrelated parent-directory Git history.
Task 2 extension: User requested more pages, jokes, stronger cards, generated assets, comparable-site research, and Context7. Added About/Privacy/Data/Help/Cards/404, source download, three themes and optional joke/sticker controls, README Markdown copy, and original generated mascot. Compared GitHub Unwrapped and GitHub README Stats without copying assets.
Task 2 verification: Browser QA passed private export exclusion/opt-in/reset, private disconnect clearing, token destinations, browser storage checks, canceled-request isolation, two optional WebMCP tools via a test shim, all five content routes plus real 404 status, and 390px mobile overflow. Real API lookup and real PNG export were also exercised separately.
Task 2 fixes: SSR primary controls now wait for hydration before accepting clicks; rate-limit cooldown test was RED then GREEN; timezone-year boundary test was RED then GREEN. Tests currently total 19.

User correction: Removed the entire intermission component and its styles; kept the cat as the brand logo and optional share-card detail. Share-card captions now default to none.

Final independent review: no actionable findings. Reviewer independently verified 19 tests, TypeScript, source ZIP fidelity, public-only exports, parsing, scope, timezone logic and stale-request guards.
Final: Ruling: Reviewer deferred production hosting/access and repeat browser QA to the owner agent; existing live/mock browser evidence covers interactions, and native terminal deployment status will cover hosting. No unverified production-success claim will be made.
Final verification: All three PNG dimensions downloaded successfully in-browser; no intermission remains, and cat logo is present. Build completed for all six app routes. No deferred minor findings.
