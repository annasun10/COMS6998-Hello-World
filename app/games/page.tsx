import Link from "next/link";
import { createAuthClient } from "@/lib/supabase/server";
import { connection } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

export default async function Home() {
  await connection();
  const auth = await createAuthClient();
  const { data: { user } } = await auth.auth.getUser();

  let games: { id: number | string; name: string | null; genre: string | null }[] = [];
  let failed = false;

  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("games")
      .select("id, name, genre")
      .order("id", { ascending: true });

    if (error) {
      console.error("Unable to load games:", error.code);
      failed = true;
    } else {
      games = data ?? [];
    }
  } catch {
    console.error("Unable to connect to Supabase.");
    failed = true;
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-24">
      <header className="mb-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
          Game library
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Find your next adventure.</h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          A collection of games, from cozy worlds to competitive arenas.
        </p>
      </header>

      <section className="panel mb-10">
        <h2 className="text-xl font-semibold">{user ? "Your player space is ready" : "A little more adventure awaits"}</h2>
        <p className="mt-2 mb-4 text-zinc-600 dark:text-zinc-400">{user ? "Visit the members club or personalize your profile." : "Sign in to unlock the members club and create your player profile."}</p>
        <Link className="button" href={user ? "/club" : "/login"}>{user ? "Enter the club" : "Join with Google"}</Link>
      </section>
      {failed ? (
        <section role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-6 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
          <h2 className="text-lg font-semibold">Couldn’t load the games</h2>
          <p className="mt-2">Please try again in a moment.</p>
          <form action="/games" method="get">
            <button type="submit" className="mt-4 cursor-pointer font-medium underline underline-offset-4">Try again</button>
          </form>
        </section>
      ) : games.length === 0 ? (
        <section className="rounded-2xl border border-zinc-200 p-8 dark:border-zinc-800">
          <h2 className="text-xl font-semibold">No games yet</h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">Your game collection will appear here.</p>
        </section>
      ) : (
        <section aria-labelledby="games-heading">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 id="games-heading" className="text-xl font-semibold">All games</h2>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">{games.length} {games.length === 1 ? "game" : "games"}</span>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2">
            {games.map((game) => (
              <li key={game.id} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {game.genre || "Uncategorized"}
                </span>
                <h3 className="mt-5 break-words text-2xl font-semibold tracking-tight">{game.name || "Untitled game"}</h3>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
