"use client";

import Link from "next/link";

export default function CommunityIdeasLink() {
  return <Link href="/quests#feed" onNavigate={event => {
    if (window.location.pathname !== "/quests") return;

    const feed = document.getElementById("feed");
    if (!feed) return;

    event.preventDefault();
    if (window.location.hash !== "#feed") window.location.hash = "feed";
    feed.scrollIntoView({ block: "start" });
  }}>Community ideas</Link>;
}
