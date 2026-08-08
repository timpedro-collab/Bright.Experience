/**
 * Internal machine-placement slot map.
 *
 * One page that renders every (machine variant × placement) placeholder slot,
 * so Theo can verify all 27 positions before dropping in real cabinet art and
 * his preview system. Each cell shows the labeled placeholder via
 * `MachinePreview` with no creative overlay.
 */

import { redirect } from "next/navigation";

import { AdminPageShell, EditorialEyebrow, Hairline } from "@/components/brand";
import { MachinePreview } from "@/components/assets/MachinePreview";

import { getUser } from "@/lib/auth";
import { canViewCreativeProduct } from "@/lib/roles";
import { getUnreadCount } from "@/lib/queries/notifications";
import { MACHINE_VARIANTS } from "@/lib/asset-requirements/slot-registry";
import { slotsForMachine } from "@/lib/asset-requirements/machine-placements";

export const metadata = {
  title: "Machine placements",
};

export default async function MachinePlacementsPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCreativeProduct(user.role)) redirect("/");

  const unread = await getUnreadCount(user.id);

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Catalog"
      title="Machine placement map."
      subtitle="Every on-machine creative position, by hardware variant. Placeholders are wired in and ready for final art + the preview system."
    >
      <div className="space-y-12 py-8">
        {MACHINE_VARIANTS.map((variant) => {
          const slots = slotsForMachine(variant.slug);
          return (
            <section key={variant.slug}>
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <EditorialEyebrow accent>{variant.label}</EditorialEyebrow>
                <span className="text-overline text-muted-foreground tabular-nums">
                  {slots.length} slots · backdrop {variant.screenImage}
                </span>
              </div>
              <Hairline className="opacity-60" />
              <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                {slots.map((slot) => (
                  <div key={slot.slotKey} className="space-y-1.5">
                    <MachinePreview
                      preview={slot.preview}
                      slot={slot}
                      overlaySrc={null}
                    />
                    <p className="text-overline text-muted-foreground">
                      {slot.slotLetter} · {slot.placementLabel}
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground/70">
                      {slot.slotKey}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </AdminPageShell>
  );
}
