/**
 * On-machine live QR print sheet — A4 portrait page ops can print and place
 * near the unit so visitors can scan straight to the public live-proof page.
 *
 * Lives in the bare (print) route group (no site chrome). Auth required via
 * the authenticated Supabase server client; RLS scopes the event to the viewer.
 */
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Live QR sheet",
  description: "Printable QR code for the event live-proof page.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LiveQrPrintPage({ params }: PageProps) {
  const user = await getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const supabase = await createClient();
  const { data: eventRow } = await supabase
    .from("events")
    .select("id, name, live_share_token")
    .eq("id", id)
    .maybeSingle();

  if (!eventRow?.live_share_token) notFound();

  const eventName = String(eventRow.name ?? "Event");

  return (
    <main className="theme-light mx-auto flex min-h-screen max-w-[210mm] flex-col items-center justify-between bg-white px-12 py-16 text-slate-900 print:min-h-0 print:py-12">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-bold leading-tight tracking-tight">
          Scan for live results
        </h1>

        {/* eslint-disable-next-line @next/next/no-img-element -- print sheet embeds the authenticated PNG route */}
        <img
          src={`/api/events/${id}/live-qr`}
          alt={`QR code for ${eventName} live results`}
          width={600}
          height={600}
          className="my-10 h-auto w-full max-w-[320px]"
        />

        <p className="text-2xl font-semibold">{eventName}</p>
        <p className="mt-3 max-w-md text-lg text-slate-600">
          Watch plays and leads land in real time.
        </p>
      </div>

      <p className="text-sm font-bold text-slate-400">bright.blue</p>
    </main>
  );
}
