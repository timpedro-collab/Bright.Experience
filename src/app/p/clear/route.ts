/** Clear the partner attribution cookie and redirect to catalog */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("bb_partner");
  const url = new URL("/catalog", request.url);
  return NextResponse.redirect(url);
}
