# Product and design notes

Reviewed October 3, 2026.

## Comparable projects

- [GitHub Unwrapped](https://githubunwrapped.com/) uses a direct username entry and a personalized yearly video. Borrow the clear entry point and a short story arc; Commit Replay uses an interactive all-time report and local image exports.
- [GitHub README Stats](https://github.com/anuraghazra/github-readme-stats) offers themed cards and README integration. Its documented limitations include API rate limits and public-instance reliability. Its current README points to a successor project. Borrow explicit customization and convenient Markdown; avoid a shared server-side GitHub credential pool and keep exports as transparent snapshots.

These are product observations, not claims that this release reproduces their full feature sets. No competitor code or art was copied.

## Documentation checked through Context7

- GitHub REST API: `/websites/github_en_rest`; authored commit filters, 100-item pagination, sequential requests, primary and secondary cooldown behavior.
- React: `/reactjs/react.dev`; cleanup and explicit stale-response guards, in addition to aborting network requests.
- [GitHub rate-limit docs](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api).
- [GitHub commit API](https://docs.github.com/en/rest/commits/commits#list-commits).
- [React Effect cleanup](https://react.dev/learn/synchronizing-with-effects).

Applied fixes: cooldowns block repeated API requests; canceled and replaced requests cannot overwrite another report; year choices account for timezone boundaries. Exact dataset scope is visible in both UI and downloads.

## Visual system

Deep ink, purple, lime, and quiet paper panels. Three card colors, three export dimensions, one original mascot. Charts use actual computed values; jokes are optional captions and never inferred from private commit messages. Mobile charts scroll inside their own panel rather than widening the page.

## Generated asset

`public/assets/commit-cat.png` was created with the built-in image-generation tool. The original transparent PNG is preserved. UI displays it at a smaller size without modifying its pixels.

Prompt: “A small original mascot sticker for Commit Replay: a charming mischievous black house cat with lime green eyes hunched over a lavender laptop, one paw pressing a key, a tiny lime coffee mug beside it. Smug and slightly sleep deprived; a joke about one last commit. Bold dark ink outlines, deep ink #262438, lilac #b9a4ed, lime #d1f579, off-white highlights. Compact full-body composition, white sticker edge, actual transparency. No text, logos, watermark, GitHub Octocat silhouette, extra characters, or surrounding scene.”

Share cards and charts are deterministic SVG/Canvas output, so values remain accurate, selectable in source, and testable.
