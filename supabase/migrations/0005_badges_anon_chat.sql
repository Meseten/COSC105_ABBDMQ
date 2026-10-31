-- Culina 0005: public chat reads + badge normalization.
grant select on public.chat_messages to anon;

-- Flatten in case any badge rows were double-nested.
update public.profiles set badges = (
  select coalesce(jsonb_agg(distinct flat), '[]'::jsonb)
  from jsonb_array_elements(badges) as el,
       lateral (select case when jsonb_typeof(el) = 'array' then el -> 0 else el end as flat) x
  where flat is not null
);
