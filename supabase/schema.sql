-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enable pgvector extension for semantic search
create extension if not exists vector;

-- 1. SOURCES TABLE
create table if not exists sources (
  id uuid primary key default uuid_generate_v4(),
  name text not null, 
  url text not null unique,
  type text check (type in ('rss', 'atom', 'html', 'sitemap')) default 'rss', -- Scrape method
  last_scraped_at timestamp with time zone, -- Track when last scraped
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- 2. RAW NEWS TABLE (Replaces articles)
-- Stores raw text and vector embeddings
create table if not exists raw_news (
  id uuid primary key default uuid_generate_v4(),
  source_id uuid references sources(id),
  title text not null,
  url text not null unique,
  content text, 
  content_hash text unique, -- MD5 hash for fast 0ms deduplication
  embedding vector(768), -- Gemini text-embedding-004 dimension is 768
  published_date timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- 2.1 HNSW INDEX for O(logn) vector search (Critical for scale)
-- m=16, ef_construction=64 balances speed vs storage
create index if not exists raw_news_embedding_idx 
on raw_news using hnsw (embedding vector_cosine_ops)
with (m = 16, ef_construction = 64);

-- 3. DAILY DIGESTS TABLE (Replaces summaries)
create table if not exists daily_digests (
  id uuid primary key default uuid_generate_v4(),
  digest_date date not null default current_date,
  transcript text not null, -- The full script
  summary_json jsonb, -- Optional: structured summary data
  audio_url text, -- Optional: if we decide to upload later
  created_at timestamp with time zone default now()
);

-- 4. MATCH NEWS FUNCTION (Proximity Search - Optimized)
create or replace function match_news (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  title text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    raw_news.id,
    raw_news.title,
    1 - (raw_news.embedding <=> query_embedding) as similarity
  from raw_news
  where 1 - (raw_news.embedding <=> query_embedding) > match_threshold
  order by raw_news.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- RLS Policies
alter table sources enable row level security;
alter table raw_news enable row level security;
alter table daily_digests enable row level security;

create policy "Make sources public" on sources for select using (true);
create policy "Make raw_news public" on raw_news for select using (true);
create policy "Make daily_digests public" on daily_digests for select using (true);
