# Data definitions

| Metric | Definition |
| --- | --- |
| Total commits | Unique commit SHA values returned by GitHub's default-branch commit-history endpoint with `author=<login>`, in selected repositories and period. Includes merges. |
| Biggest day | Most such commits grouped by author timestamp in the chosen timezone. Ties choose the earliest date. |
| Longest streak | Longest series of calendar dates with at least one such commit. Dates use the chosen timezone. |
| Active days | Number of calendar dates containing at least one such commit. |
| Monthly, weekday, hour | The same deduplicated commits grouped by their author timestamp, not push time. |
| Repository ranking | Unique authored commit SHAs within each selected repository. A commit shared across repositories can count in each repository but once globally. Daily inspection assigns a shared commit to the first encountered selected repository. |
| Language mix | Count of selected repositories by current primary language. Repositories without a language are omitted from the percentage denominator. This does not measure authored bytes or time. |
| Stars | Current star counts across selected repositories, regardless of the chosen history period. |
| All time | All available authored commit history returned by the scan. The visible chart begins at the earliest included authored commit, or account creation when empty. |
| Complete scan | Every selected, discovered repository was scanned to the end of accessible current-default-branch history. Never implies all GitHub activity or every inaccessible/deleted repository. |

The account must be a personal account. Owned original repositories are scanned; forks are excluded. Private access is limited to what a credential can see. Work in others' repositories, issues, pull requests, reviews, coauthor-only credits, and non-default branches are outside this version's report.

Author timestamps can predate account creation, be rewritten, or be set inaccurately by a contributor. Counts are not an assessment of skill, effort, or working hours. Future timestamps are excluded relative to the scan's recorded time.

A push is an event that can contain multiple commits. GitHub's public Events API is limited to recent events, so it cannot provide trustworthy lifetime push counts. This tool deliberately presents commits instead.

A scan can stop at a rate limit, denied access, network failure, 2,000 discovered repositories, or 250,000 commit records. Partial data is retained in memory and labeled. Continue resumes commit pages; retry the username to reload an incomplete repository list. Reloading the browser discards scan progress.

## Official references

- [List commits](https://docs.github.com/en/rest/commits/commits#list-commits)
- [REST API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- [GitHub contribution rules](https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference)
- [Events API limits](https://docs.github.com/en/rest/activity/events)
- [Fine-grained personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
