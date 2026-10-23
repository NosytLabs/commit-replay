# Commit Replay

A free, open-source GitHub recap: public username lookup, optional private repository access, an interactive dashboard, a four-part story, and downloadable share cards.

## Run it

Node 22.13 or newer is required.

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

Open the printed local URL. No API keys, database, or paid services are required. Use `npm test`, `npm run typecheck`, and `npm run build` to verify changes. Production output targets Cloudflare Workers through the included Sites/Vinext starter; `.openai/hosting.json` identifies the managed Sites project, not a secret.

The `build/` directory contains maintained Vite plugins and Worker entry points required by `vite.config.ts`. Keep it in version control. Generated output lives in `dist/` and `.vinext/`.

## Included

- Real public GitHub lookup by username or profile URL.
- Optional fine-grained GitHub token for the visitor's own account and selected private repositories.
- Authored commit totals, busiest day, longest streak, active days, monthly charts, daily heatmaps, repository rankings, weekday/hour patterns, language mix, and current stars.
- Period, timezone, and repository filters.
- Pause and resume at API page boundaries, with explicit incomplete coverage and rate-limit messages.
- About, Privacy, Data, Help, card gallery, and a custom 404 page.
- Original generated mascot and optional developer jokes; all jokes are independent of measured statistics.
- Four manually navigated story cards. No autoplay.
- PNG and SVG cards in three dimensions and three colors; JSON summary and daily CSV exports.
- Private repositories excluded from all downloads unless explicitly included in the export dialog.
- Responsive layouts, keyboard-accessible controls, reduced-motion support, and a date input as the keyboard alternative to clicking heatmap cells.
- Optional WebMCP tools in supporting browsers. Public summaries never return credentials or private totals.

## What the data means

Read [data definitions](docs/data-definitions.md). This is available authored history in owned repositories' **current default branches**, not GitHub profile contributions, lifetime push counts, hours worked, or a productivity score. Merge commits count; forks and coauthor-only attribution do not. Equal commit IDs are deduplicated globally. Repository totals may overlap.

The fictional demo is explicitly marked and contains no real personal or private repository data.

## Privacy and GitHub access

All GitHub requests are made directly by the visitor's browser to `https://api.github.com`. Credentials and reports remain in memory; the application does not send them to its hosting server or save them in localStorage, sessionStorage, IndexedDB, or a database. Disconnecting discards the report and credential. Reloading closes the session. Downloaded files are deliberately persistent and are the visitor's responsibility.

Private access requires a GitHub fine-grained personal access token with selected repositories and **Contents: Read-only** access. This permission can read source code; Commit Replay only requests repository details and commit metadata, and discards commit messages from responses. Select a short expiration and revoke the credential when done. The tool cannot determine what private repositories were withheld by permissions, so it reports only available access.

The hosting provider handles ordinary page requests; GitHub processes API requests. No app analytics or third-party tracker is included. No reports are automatically published or sent to anyone.

## Limits and next steps

- GitHub's anonymous rate limit is small and shared by clients on the same public IP. Connecting increases the allowance. No workaround or credential pooling is used.
- One pass reads at most 45 unauthenticated or 400 authenticated commit pages. Continue scans from the saved page within the same tab. Discovery is capped at 2,000 repositories; history at 250,000 records. Caps are visibly labeled as partial.
- Large accounts may take time. Scans are sequential to avoid overwhelming GitHub. The current default branch can change while scanning, and GitHub's pagination is not an atomic historical snapshot.
- GitHub organizations, contributions in others' repositories, branch selection, local Git imports, persisted scan sessions, and one-click GitHub App OAuth are future work. They are not disguised as active features.
- OAuth needs a registered GitHub App and a supported secure server callback path. Never put a client secret into frontend code.
- No automatic public report links, repository comparison rankings, or AI-generated personality claims.

## Contributing

Improvements to accessibility, import support, data accuracy, and themes are welcome. Keep credentials out of storage and server logs, preserve explicit coverage labels, and include a focused regression test for changes to data collection or calculations. Avoid tests that merely duplicate styling.

App code lives in `components/recap-*` and `lib/recap/`. Shared shadcn primitives live in `components/ui/`. No local personal GitHub credentials are bundled. The project uses the MIT license; dependencies retain their own licenses.

## Reference checks

GitHub API pagination and cooldown handling, and React request cleanup, were checked against official documentation using Context7. See [design notes](docs/design-notes.md) for comparisons and asset provenance.
