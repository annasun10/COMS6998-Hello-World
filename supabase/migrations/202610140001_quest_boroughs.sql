begin;
-- Keep the existing storage column and older quests compatible while allowing
-- the new borough selector to save all five NYC boroughs.
alter table public.quests drop constraint if exists quests_neighborhood_check;
alter table public.quests add constraint quests_neighborhood_check check (
  neighborhood in (
    'Manhattan', 'Brooklyn', 'Queens', 'The Bronx', 'Staten Island',
    'Morningside Heights', 'Upper West Side', 'Central Park', 'Lower Manhattan'
  )
);
commit;
