# Repo Knowledge — Cross-Repo RAG

Use this skill for **cross-repo questions**, **repo summaries**, and **file-level context** across repairman29 repos. It queries Supabase vectors built by the repo indexer.

## Setup

1. Apply `scripts/repo-knowledge.sql` in Supabase.
2. Set env vars in `%USERPROFILE%\.clawdbot\.env`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (preferred) or `SUPABASE_ANON_KEY`
3. Run `node scripts/index-repos.js --repo JARVIS` to populate the index.

## When to use

- "Search all repos for how OAuth refresh tokens are handled."
- "Give me a summary of BEAST-MODE."
- "Find the file that defines embeddings in echeo-web."
- "Show me the repo map for smuggler."

## Tools

| Tool | Use for |
|------|---------|
| `repo_search` | Semantic search across all repos or a single repo |
| `repo_summary` | Get a repo-level summary |
| `repo_file` | Return indexed chunks for a file path |
| `repo_map` | List key file paths for a repo |
