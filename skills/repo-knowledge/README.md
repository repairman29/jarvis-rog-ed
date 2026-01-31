# Repo Knowledge Skill

Semantic search and summaries across repairman29 repos using Supabase + local embeddings.

## Setup

1. Apply the schema in `scripts/repo-knowledge.sql` to Supabase.
2. Ensure `%USERPROFILE%\.clawdbot\.env` has:

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

3. Run the indexer: `node scripts/index-repos.js --repo JARVIS --dry-run` then remove `--dry-run`.

## Tools

- `repo_search` — semantic search across repos
- `repo_summary` — get indexed repo summary
- `repo_file` — fetch indexed chunks for a file
- `repo_map` — repo structure overview
