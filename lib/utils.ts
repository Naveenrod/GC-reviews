export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatRating(rating: number): string {
  return rating > 0 ? rating.toFixed(1) : "New";
}

// Text shown next to the rating. Venues with no member reviews show their
// imported Google rating, so label it rather than showing "(0)".
export function ratingSource(avgRating: number, reviewCount: number): string {
  if (reviewCount > 0) return `(${reviewCount})`;
  return avgRating > 0 ? "on Google" : "";
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}
