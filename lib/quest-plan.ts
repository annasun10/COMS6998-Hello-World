/** Split sequential numbered steps, including older plans stored on one line. */
export function splitQuestPlan(plan: string): string[] {
  const text = plan.trim();
  if (!text) return [];
  const markers = [...text.matchAll(/(?:^|\s)(\d{1,2})[.)]\s+/g)];
  if (markers.length >= 2 && markers.every((marker, index) => Number(marker[1]) === index + 1)) {
    const intro = text.slice(0, markers[0].index).trim();
    const steps = markers.map((marker, index) => text.slice(
      marker.index! + marker[0].length,
      markers[index + 1]?.index ?? text.length,
    ).trim());
    if (steps.every(Boolean)) {
      if (intro) steps[0] = `${intro}\n\n${steps[0]}`;
      return steps;
    }
  }
  return text.split(/\n\s*\n/).map(part => part.trim()).filter(Boolean);
}
