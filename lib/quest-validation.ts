export const boroughs = ["Manhattan", "Brooklyn", "Queens", "The Bronx", "Staten Island"] as const;
export const moods = [
  "Quiet solo reset",
  "Catch up with friends",
  "Discover hidden corners",
  "Art & creative inspiration",
  "Nature & fresh air",
  "Active city walk",
  "Romantic afternoon",
] as const;
export function validatePreferences(form: FormData) {
  const borough = String(form.get("borough") || "");
  const mood = String(form.get("mood") || "");
  const idea = String(form.get("idea") || "").trim();
  if (!boroughs.includes(borough as typeof boroughs[number]) || !moods.includes(mood as typeof moods[number]) || idea.length < 3 || idea.length > 300) {
    throw new Error("Choose a borough and mood, and write an idea between 3 and 300 characters.");
  }
  return { borough, mood, idea };
}
export function validateGeneration(value: unknown): { title: string; caption: string; plan: string } {
  if (!value || typeof value !== "object") throw new Error("AI returned an invalid idea. Please try again.");
  const input = value as Record<string, unknown>;
  const result: Record<string, string> = {};
  for (const [key, max] of [["title",100],["caption",280],["plan",1200]] as const) {
    const text = input[key];
    if (typeof text !== "string" || !text.trim() || text.trim().length > max) throw new Error("AI returned an incomplete idea. Please try again.");
    result[key] = text.trim();
  }
  return result as { title: string; caption: string; plan: string };
}

export function boroughForLocation(location: string): string {
  return ["Morningside Heights", "Upper West Side", "Central Park", "Lower Manhattan"].includes(location) ? "Manhattan" : location;
}
