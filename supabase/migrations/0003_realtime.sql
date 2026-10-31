-- Culina 0003: put the live chat on realtime broadcast.
do $$
begin
  execute 'alter publication supabase_realtime add table public.chat_messages';
exception when others then null;
end $$;
