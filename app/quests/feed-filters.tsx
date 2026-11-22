"use client";

import { useRouter } from "next/navigation";
import { startTransition, useOptimistic } from "react";
import IdeaSelect from "./idea-select";

type Filters = { neighborhood: string; mood: string; search: string };

const allBoroughs = "All boroughs";
const allMoods = "All moods";

export default function FeedFilters({ boroughs, moods, neighborhood, mood, search, sort }: Filters & {
  boroughs: string[];
  moods: string[];
  sort?: string;
}) {
  const router = useRouter();
  const [filters, setFilters] = useOptimistic({ neighborhood, mood, search });

  function updateFilter(name: keyof Filters, value: string) {
    const next = { ...filters, [name]: value };
    const params = new URLSearchParams();
    if (sort === "top") params.set("sort", "top");
    if (next.neighborhood) params.set("neighborhood", next.neighborhood);
    if (next.mood) params.set("mood", next.mood);
    if (next.search) params.set("q", next.search);
    const query = params.toString();

    startTransition(() => {
      setFilters(next);
      router.push(query ? `/quests?${query}#feed` : "/quests#feed", { scroll: false });
    });
  }

  return <>
    <form key={filters.search} role="search" aria-label="Plans" className="feed-search" onSubmit={event => {
      event.preventDefault();
      const query = String(new FormData(event.currentTarget).get("q") ?? "").trim();
      updateFilter("search", query);
    }}>
      <label htmlFor="plan-search" className="font-semibold">Search plans</label>
      <div className="feed-search-controls">
        <input id="plan-search" className="field" type="search" name="q" defaultValue={filters.search} placeholder="Try coffee or bookstores" />
        <button className="vote-button" type="submit">Search</button>
        {filters.search && <button className="vote-button" type="button" onClick={() => updateFilter("search", "")}>Clear search</button>}
      </div>
    </form>
    <fieldset className="feed-filters">
      <legend className="font-semibold">Filter</legend>
      <IdeaSelect name="neighborhood" label="Borough" options={[allBoroughs, ...boroughs]}
        value={filters.neighborhood || allBoroughs}
        onValueChange={value => updateFilter("neighborhood", value === allBoroughs ? "" : value)} hint="" icon="↗" />
      <IdeaSelect name="mood" label="Mood" options={[allMoods, ...moods]}
        value={filters.mood || allMoods}
        onValueChange={value => updateFilter("mood", value === allMoods ? "" : value)} hint="" icon="✦" />
    </fieldset>
  </>;
}
