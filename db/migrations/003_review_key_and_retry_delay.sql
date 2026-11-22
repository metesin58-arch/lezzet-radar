-- Long reviews overflowed the btree row limit (2704 bytes) in a unique index on text; use a hash key instead.
alter table reviews add column review_key text;
update reviews set review_key = md5(author || chr(31) || text);
alter table reviews alter column review_key set not null;
alter table reviews drop constraint reviews_place_id_author_text_key;
alter table reviews add constraint reviews_place_key_uniq unique (place_id, review_key);

-- Failed jobs are retried after a delay, not immediately.
alter table scrape_jobs add column run_after timestamptz not null default now();
