import { NextResponse } from "next/server";
import { getRandomVenue } from "@/lib/queries";

export const dynamic = "force-dynamic";

// GET /random → redirects to a random venue page.
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const v = await getRandomVenue();
  if (!v || !v.location || !v.category) {
    return NextResponse.redirect(`${origin}/search`);
  }
  return NextResponse.redirect(
    `${origin}/${v.location.slug}/${v.category.slug}/${v.slug}?surprise=1`
  );
}
