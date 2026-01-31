-- Repo Knowledge schema for Jarvis cross-repo search

create extension if not exists vector;

create table if not exists repo_sources (
  id bigserial primary key,
  name text not null,
  ssh_url text not null,
  visibility text not null,
  updated_at timestamptz,
  last_indexed_at timestamptz,
  created_at timestamptz default now()
);

create unique index if not exists repo_sources_name_idx on repo_sources (name);

create table if not exists repo_files (
  id bigserial primary key,
  repo_id bigint references repo_sources(id) on delete cascade,
  path text not null,
  sha text,
  size_bytes bigint,
  language text,
  last_indexed_at timestamptz,
  created_at timestamptz default now()
);

create unique index if not exists repo_files_repo_path_idx on repo_files (repo_id, path);

create table if not exists repo_chunks (
  id bigserial primary key,
  repo_id bigint references repo_sources(id) on delete cascade,
  file_id bigint references repo_files(id) on delete cascade,
  content text not null,
  embedding vector(768),
  token_count int,
  start_line int,
  end_line int,
  created_at timestamptz default now()
);

create index if not exists repo_chunks_repo_idx on repo_chunks (repo_id);
create index if not exists repo_chunks_file_idx on repo_chunks (file_id);
create index if not exists repo_chunks_embedding_idx on repo_chunks using ivfflat (embedding vector_cosine_ops);

create table if not exists repo_summaries (
  id bigserial primary key,
  repo_id bigint references repo_sources(id) on delete cascade,
  summary text not null,
  updated_at timestamptz default now()
);

create unique index if not exists repo_summaries_repo_idx on repo_summaries (repo_id);

create or replace function match_repo_chunks(
  query_embedding vector(768),
  match_count int,
  repo_filter text default null
)
returns table (
  chunk_id bigint,
  repo_name text,
  file_path text,
  content text,
  similarity float
)
language sql
stable
as $$
  select
    repo_chunks.id as chunk_id,
    repo_sources.name as repo_name,
    repo_files.path as file_path,
    repo_chunks.content,
    1 - (repo_chunks.embedding <=> query_embedding) as similarity
  from repo_chunks
  join repo_sources on repo_sources.id = repo_chunks.repo_id
  join repo_files on repo_files.id = repo_chunks.file_id
  where repo_filter is null or repo_sources.name = repo_filter
  order by repo_chunks.embedding <=> query_embedding
  limit match_count;
$$;
