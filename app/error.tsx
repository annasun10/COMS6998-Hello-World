"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="page-shell"><h1 className="page-title">Something went wrong.</h1><p className="my-6">We couldn’t load this page. Please try again.</p><button className="button" onClick={reset}>Try again</button></main>;
}
