/** Printable monthly sponsorship revenue statement for a venue operator. */
import { redirect } from "next/navigation";

import { PrintButton } from "@/components/organizers/PrintButton";

import { getUser } from "@/lib/auth";
import { formatMoneyFromPence } from "@/lib/currency";
import { formatDateGB } from "@/lib/dates";
import { getPartnerForUser } from "@/lib/queries/partners";
import { getVenueBySlug } from "@/lib/queries/venues";
import { getEarningsByVenue } from "@/lib/queries/venue-earnings";

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata = {
  title: "Sponsorship revenue statement",
  robots: { index: false, follow: false },
};

export default async function VenueEarningsStatementPage({ params }: Props) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const venue = await getVenueBySlug(slug);
  if (!venue) redirect("/");

  const partner = await getPartnerForUser(user.id);
  if (!partner || venue.partner_id !== partner.id) redirect("/");

  const earnings = await getEarningsByVenue(venue.id);
  const preparedOn = formatDateGB(new Date().toISOString().slice(0, 10));

  return (
    <div className="min-h-screen bg-neutral-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl px-6 print:max-w-none print:px-0">
        <div className="mb-4 flex items-center justify-end print:hidden">
          <PrintButton />
        </div>

        <article className="border border-neutral-200 bg-white p-8 print:border-0 print:p-0">
          <header className="border-b border-neutral-200 pb-4">
            <h1 className="text-2xl font-bold text-neutral-900">
              Sponsorship revenue statement
            </h1>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {venue.name}
            </p>
            <p className="mt-0.5 text-sm text-neutral-600">
              Prepared {preparedOn}
            </p>
          </header>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-300 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-3 py-2 font-medium">Placement</th>
                  <th className="px-3 py-2 font-medium">Revenue model</th>
                  <th className="px-3 py-2 text-right font-medium">Booked</th>
                  <th className="px-3 py-2 text-right font-medium">
                    Your share
                  </th>
                </tr>
              </thead>
              <tbody>
                {earnings.placements.map((p) => (
                  <tr
                    key={p.placementId}
                    className="border-b border-neutral-200 last:border-0"
                  >
                    <td className="px-3 py-2.5 text-neutral-900">{p.label}</td>
                    <td className="px-3 py-2.5 text-neutral-700">
                      {p.modelLabel ?? "Not configured"}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-neutral-900">
                      {formatMoneyFromPence(p.bookedPence)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-neutral-900">
                      {p.sharePence !== null
                        ? formatMoneyFromPence(p.sharePence)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-neutral-900 font-semibold text-neutral-900">
                  <td className="px-3 py-3" colSpan={2}>
                    Total
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {formatMoneyFromPence(earnings.bookedPence)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {formatMoneyFromPence(earnings.sharePence)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-neutral-600">
            Booked revenue is the sum of reserved, live and completed
            sponsorship slots at their agreed prices. Your share is computed
            under the revenue model agreed per placement. Figures are stated in
            GBP.
          </p>
        </article>
      </div>
    </div>
  );
}
