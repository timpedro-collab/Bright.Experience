/**
 * Clear the partner attribution cookie and redirect to catalog.
 *
 * The cookie was set with `path: "/"` so the delete must match the same
 * path — otherwise the browser ignores the deletion silently.
 */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete({ name: "bb_partner", path: "/" });
  const url = new URL("/catalog", request.url);
  return NextResponse.redirect(url);
}
