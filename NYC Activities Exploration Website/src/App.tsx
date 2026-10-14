import { useMemo, useState } from "react";

type Idea = {
  title: string;
  description: string;
  borough: string;
  mood: string;
  time: string;
  image: string;
  author: string;
  votes: number;
};

const photos = [
  "https://images.unsplash.com/photo-1665399319700-90b454c69d1e?auto=format&fit=crop&w=1000&q=85",
  "https://images.unsplash.com/photo-1604509082195-1d60a05fbe1e?auto=format&fit=crop&w=1000&q=85",
  "https://images.unsplash.com/photo-1665399319535-f61942adb69f?auto=format&fit=crop&w=1000&q=85",
  "https://images.unsplash.com/photo-1664353657558-ab3cc4b8c5c8?auto=format&fit=crop&w=1000&q=85",
];

const starterIdeas: Idea[] = [
  {
    title: "Bookshops, brownstones & a perfect slice",
    description:
      "Start at a tiny Cobble Hill bookshop, wander the leafy side streets, then split a square pie at a neighborhood classic.",
    borough: "Brooklyn",
    mood: "Slow & cozy",
    time: "3 hours",
    image: photos[1],
    author: "Maya R.",
    votes: 128,
  },
  {
    title: "A little art crawl above 125th",
    description:
      "Gallery-hop through Harlem, find the best public murals, and finish with live jazz in an intimate corner bar.",
    borough: "Manhattan",
    mood: "Inspired",
    time: "4 hours",
    image: photos[0],
    author: "Theo J.",
    votes: 94,
  },
  {
    title: "Dumplings, neon & late-night karaoke",
    description:
      "Taste your way through Flushing's food courts, browse the night market, then sing your heart out in a private room.",
    borough: "Queens",
    mood: "High energy",
    time: "5 hours",
    image: photos[2],
    author: "June K.",
    votes: 76,
  },
];

const generatedTitles: Record<string, string[]> = {
  Adventurous: ["The borough-wide wildcard trail", "A no-map neighborhood quest"],
  Relaxed: ["A slow afternoon, perfectly unplanned", "Parks, pages & a long lunch"],
  Romantic: ["A dreamy two-person city escape", "Golden hour and hidden tables"],
  Creative: ["Make, browse & get inspired", "An offbeat art lover's afternoon"],
  Social: ["The perfect group-chat plan", "Good food, loud laughs, no planning"],
};

export default function App() {
  const [borough, setBorough] = useState("Brooklyn");
  const [mood, setMood] = useState("Adventurous");
  const [ideas, setIdeas] = useState(starterIdeas);
  const [generated, setGenerated] = useState<Idea | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState<Record<number, number>>({});

  const imageIndex = useMemo(
    () => (borough.length + mood.length) % photos.length,
    [borough, mood],
  );

  function generateIdea() {
    setLoading(true);
    setTimeout(() => {
      const titleList = generatedTitles[mood] ?? generatedTitles.Adventurous;
      const next: Idea = {
        title: titleList[borough.length % titleList.length],
        description: `Begin with a neighborhood favorite, follow a curious detour through ${borough}, and end somewhere locals stay longer than they planned. Built for a ${mood.toLowerCase()} kind of day.`,
        borough,
        mood,
        time: "3–4 hours",
        image: photos[imageIndex],
        author: "Sidequest AI",
        votes: 0,
      };
      setGenerated(next);
      setIdeas((current) => [next, ...current.filter((idea) => idea !== generated)]);
      setLoading(false);
    }, 700);
  }

  function vote(index: number, direction: number) {
    if (!signedIn) {
      setSignedIn(true);
      return;
    }
    const previous = voted[index] ?? 0;
    setIdeas((current) =>
      current.map((idea, i) =>
        i === index
          ? { ...idea, votes: idea.votes - previous + direction }
          : idea,
      ),
    );
    setVoted((current) => ({ ...current, [index]: direction }));
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#fff7fc] text-[#2d2035]">
      <header className="relative z-20 mx-auto flex max-w-[1280px] items-center justify-between px-5 py-5 md:px-10">
        <a href="#" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#ed4b9a] text-sm font-black text-white">
            SQ
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            Sidequest
          </span>
        </a>
        <nav className="hidden items-center gap-8 text-sm font-semibold md:flex">
          <a className="transition hover:text-[#ed4b9a]" href="#generator">
            Make a plan
          </a>
          <a className="transition hover:text-[#ed4b9a]" href="#ideas">
            Community ideas
          </a>
        </nav>
        <button
          onClick={() =>
            signedIn ? setShowProfile(true) : setSignedIn(true)
          }
          className="rounded-full border border-[#2d2035] bg-white px-5 py-2.5 text-sm font-bold shadow-[3px_3px_0_#2d2035] transition hover:-translate-y-0.5 hover:shadow-[4px_5px_0_#2d2035]"
        >
          {signedIn ? "My profile" : "Sign in with Google"}
        </button>
      </header>

      <section className="relative mx-auto grid max-w-[1280px] items-center gap-10 px-5 pb-20 pt-12 md:min-h-[670px] md:grid-cols-[1.08fr_.92fr] md:px-10 md:pb-24 md:pt-16">
        <div className="relative z-10">
          <p className="mb-5 inline-flex -rotate-2 rounded-full bg-[#b9e1ff] px-4 py-2 text-xs font-black uppercase tracking-[.16em]">
            NYC has plans for you
          </p>
          <h1 className="font-display max-w-3xl text-[clamp(3.7rem,7.4vw,7rem)] font-bold leading-[.88] tracking-[-.065em]">
            Find your next
            <span className="block text-[#ed4b9a]">NYC story.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#6d5b74] md:text-xl">
            Tell us where you want to go and how you want to feel. We’ll dream
            up a one-of-a-kind day in the city.
          </p>
          <a
            href="#generator"
            className="mt-8 inline-flex items-center gap-4 rounded-full bg-[#ed4b9a] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#d63b87]"
          >
            Find me something to do <span aria-hidden>→</span>
          </a>
        </div>
        <div className="relative mx-auto h-[430px] w-full max-w-[520px] md:h-[560px]">
          <div className="absolute inset-8 rotate-6 rounded-[2.5rem] bg-[#bca7ff]" />
          <img
            src={photos[0]}
            alt="A lively New York City neighborhood street"
            className="absolute inset-0 h-full w-full -rotate-3 rounded-[2.5rem] border-[6px] border-white object-cover shadow-2xl"
          />
          <div className="absolute -bottom-2 -left-5 rotate-3 rounded-2xl border-2 border-[#2d2035] bg-[#f5b8da] px-5 py-4 shadow-[5px_5px_0_#2d2035]">
            <p className="text-xs font-black uppercase tracking-widest">
              Today’s energy
            </p>
            <p className="font-display text-2xl font-bold">Go somewhere new.</p>
          </div>
        </div>
      </section>

      <section id="generator" className="bg-[#39264a] px-5 py-20 text-white md:px-10 md:py-28">
        <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-[.2em] text-[#b9e1ff]">
              Your personal idea machine
            </p>
            <h2 className="font-display text-5xl font-bold leading-[.98] tracking-tight md:text-6xl">
              What are you in the mood for?
            </h2>
            <p className="mt-5 max-w-md text-[#d9cbe1]">
              Pick two things. We’ll handle the overthinking.
            </p>
          </div>
          <div className="rounded-[2rem] bg-[#fff7fc] p-6 text-[#2d2035] shadow-[12px_12px_0_#ed4b9a] md:p-9">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-black">
                BOROUGH
                <select
                  value={borough}
                  onChange={(event) => setBorough(event.target.value)}
                  className="mt-2 w-full appearance-none rounded-xl border-2 border-[#e4d7e7] bg-white px-4 py-4 text-base font-semibold outline-none focus:border-[#ed4b9a]"
                >
                  {["Brooklyn", "Manhattan", "Queens", "The Bronx", "Staten Island"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-black">
                MOOD
                <select
                  value={mood}
                  onChange={(event) => setMood(event.target.value)}
                  className="mt-2 w-full appearance-none rounded-xl border-2 border-[#e4d7e7] bg-white px-4 py-4 text-base font-semibold outline-none focus:border-[#ed4b9a]"
                >
                  {["Adventurous", "Relaxed", "Romantic", "Creative", "Social"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>
            <button
              onClick={generateIdea}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-[#ed4b9a] px-6 py-4 font-black text-white transition hover:bg-[#d63b87] disabled:opacity-70"
            >
              {loading ? "Dreaming up your day..." : "Generate my sidequest →"}
            </button>
            {generated && !loading && (
              <div className="mt-6 grid animate-[reveal_.5s_ease-out] gap-5 border-t-2 border-dashed border-[#ddcfe2] pt-6 sm:grid-cols-[120px_1fr]">
                <img src={generated.image} alt="" className="h-28 w-full rounded-xl object-cover" />
                <div>
                  <div className="mb-2 flex gap-2 text-[11px] font-black uppercase tracking-wider text-[#806c87]">
                    <span>{generated.borough}</span><span>·</span><span>{generated.time}</span>
                  </div>
                  <h3 className="font-display text-2xl font-bold">{generated.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#6d5b74]">{generated.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="ideas" className="mx-auto max-w-[1280px] px-5 py-20 md:px-10 md:py-28">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[.2em] text-[#ed4b9a]">
              Fresh from the five boroughs
            </p>
            <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              Plans worth stealing
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[#6d5b74]">
            Real ideas generated by curious New Yorkers. Vote for the ones you’d
            actually leave the apartment for.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {ideas.slice(0, 3).map((idea, index) => (
            <article key={`${idea.title}-${index}`} className="group overflow-hidden rounded-[1.5rem] border border-[#eaddea] bg-white transition hover:-translate-y-1 hover:shadow-xl">
              <img src={idea.image} alt="" className="h-56 w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="p-6">
                <div className="flex gap-2 text-[11px] font-black uppercase tracking-wider text-[#ed4b9a]">
                  <span>{idea.borough}</span><span>·</span><span>{idea.mood}</span>
                </div>
                <h3 className="font-display mt-3 text-2xl font-bold leading-tight">{idea.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#6d5b74]">{idea.description}</p>
                <div className="mt-6 flex items-center justify-between border-t border-[#f0e5f0] pt-4">
                  <span className="text-xs font-bold text-[#806c87]">by {idea.author}</span>
                  <div className="flex items-center gap-1 rounded-full bg-[#f7ebf4] p-1">
                    <button aria-label="Upvote" onClick={() => vote(index, 1)} className={`h-8 w-8 rounded-full font-black ${voted[index] === 1 ? "bg-[#b9e1ff]" : "hover:bg-white"}`}>↑</button>
                    <span className="min-w-7 text-center text-xs font-black">{idea.votes}</span>
                    <button aria-label="Downvote" onClick={() => vote(index, -1)} className={`h-8 w-8 rounded-full font-black ${voted[index] === -1 ? "bg-[#f5b8da]" : "hover:bg-white"}`}>↓</button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#eaddea] px-5 py-8 md:px-10">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between text-xs font-semibold text-[#806c87]">
          <span>Sidequest NYC</span><span>Made for wandering.</span>
        </div>
      </footer>

      {showProfile && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#2d2035]/70 p-5" onClick={() => setShowProfile(false)}>
          <div className="w-full max-w-md rounded-[2rem] bg-[#fff7fc] p-8 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-3xl font-bold">Your profile</h2>
              <button onClick={() => setShowProfile(false)} className="text-xl font-bold">×</button>
            </div>
            <label className="mb-4 block text-xs font-black uppercase tracking-wider">Display name<input defaultValue="Curious New Yorker" className="mt-2 w-full rounded-xl border border-[#dfd0e2] bg-white p-3 text-sm normal-case outline-none focus:border-[#ed4b9a]" /></label>
            <label className="mb-5 block text-xs font-black uppercase tracking-wider">Home borough<select className="mt-2 w-full rounded-xl border border-[#dfd0e2] bg-white p-3 text-sm normal-case"><option>Brooklyn</option><option>Manhattan</option><option>Queens</option><option>The Bronx</option><option>Staten Island</option></select></label>
            <button onClick={() => setShowProfile(false)} className="w-full rounded-xl bg-[#ed4b9a] p-3.5 text-sm font-black text-white">Save changes</button>
          </div>
        </div>
      )}
    </main>
  );
}
