begin;
-- Preserve existing quests while accepting the more specific mood choices.
alter table public.quests drop constraint if exists quests_mood_check;
alter table public.quests add constraint quests_mood_check check (
  mood in (
    'Cozy', 'Social', 'Curious', 'Main character',
    'Quiet solo reset',
    'Catch up with friends',
    'Discover hidden corners',
    'Art & creative inspiration',
    'Nature & fresh air',
    'Active city walk',
    'Romantic afternoon'
  )
);
commit;
