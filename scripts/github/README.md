# GitHub Audit Scripts

## `audit-public-repos.mjs`
Generates a scored matrix for public repositories and writes outputs to `content/work/`.

### Usage
```bash
node scripts/github/audit-public-repos.mjs anipotts
```

### Outputs
- `content/work/github-audit.json`
- `content/work/github-audit.md`

Scores combine recency, stars, language fit, naming clarity, and description quality.
