/** Partner attribution redirect — sets partner cookie and redirects to catalog */
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getPartnerByCode } from "@/lib/queries/partners";

interface AttributionPageProps {
  params: Promise<{ code: string }>;
}

export default async function PartnerAttributionPage({ params }: AttributionPageProps) {
  const { code } = await params;

  const partner = await getPartnerByCode(code);

  if (partner) {
    const cookieStore = await cookies();
    cookieStore.set("bb_partner", code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  }

  redirect("/catalog");
}
