/** Create new event — internal-only form page */
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";

import { AdminPageShell, EditorialEyebrow } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { getAccountOptions } from "@/lib/queries/admin";
import { getUnreadCount } from "@/lib/queries/notifications";
import { createEventFromForm } from "@/app/actions/events";

export const metadata = {
  title: "New event",
};

export default async function NewEventPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!isInternalRole(user.role)) redirect("/");

  const [accounts, unread] = await Promise.all([
    getAccountOptions(),
    getUnreadCount(user.id),
  ]);

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="New event"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "New event" },
      ]}
      title="Create a new event."
      subtitle="Add a new event for an existing account. Templates and assets can be applied after creation."
    >
      <section className="py-8 max-w-3xl">
        <EditorialEyebrow accent>The basics</EditorialEyebrow>
        <div className="mt-6 border border-border/60 bg-card/30 rounded-md p-6 md:p-8">
          <form action={createEventFromForm} className="space-y-5">
            <div>
              <Label htmlFor="accountId" className="text-overline mb-1.5 block">
                Customer account
              </Label>
              <select
                id="accountId"
                name="accountId"
                required
                className="flex h-10 w-full rounded-[var(--radius-control)] border border-input bg-[hsl(233,48%,15%,0.6)] backdrop-blur-sm px-3.5 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select an account…</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="name" className="text-overline mb-1.5 block">
                Event name
              </Label>
              <Input id="name" name="name" required placeholder="Sponsor Activation — Spring '26" />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <Label htmlFor="eventType" className="text-overline mb-1.5 block">
                  Event type
                </Label>
                <select
                  id="eventType"
                  name="eventType"
                  defaultValue="activation"
                  className="flex h-10 w-full rounded-[var(--radius-control)] border border-input bg-[hsl(233,48%,15%,0.6)] px-3.5 text-sm text-foreground"
                >
                  <option value="activation">Activation</option>
                  <option value="sampling">Sampling</option>
                  <option value="vending">Vending</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <Label htmlFor="packageType" className="text-overline mb-1.5 block">
                  Package tier
                </Label>
                <select
                  id="packageType"
                  name="packageType"
                  defaultValue="standard"
                  className="flex h-10 w-full rounded-[var(--radius-control)] border border-input bg-[hsl(233,48%,15%,0.6)] px-3.5 text-sm text-foreground"
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="machineType" className="text-overline mb-1.5 block">
                Machine (optional)
              </Label>
              <Input
                id="machineType"
                name="machineType"
                placeholder="Claw, Vault, Carousel…"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <Label htmlFor="venueName" className="text-overline mb-1.5 block">
                  Venue name
                </Label>
                <Input id="venueName" name="venueName" placeholder="ExCeL London" />
              </div>
              <div>
                <Label htmlFor="venueAddress" className="text-overline mb-1.5 block">
                  Address
                </Label>
                <Input id="venueAddress" name="venueAddress" placeholder="Royal Victoria Dock, E16 1XL" />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <Label htmlFor="eventDateStart" className="text-overline mb-1.5 block">
                  Start date
                </Label>
                <Input id="eventDateStart" name="eventDateStart" type="date" required />
              </div>
              <div>
                <Label htmlFor="eventDateEnd" className="text-overline mb-1.5 block">
                  End date (optional)
                </Label>
                <Input id="eventDateEnd" name="eventDateEnd" type="date" />
              </div>
            </div>

            <div>
              <Label
                htmlFor="pipedriveDealId"
                className="text-overline mb-1.5 block"
              >
                Pipedrive deal (optional)
              </Label>
              <Input
                id="pipedriveDealId"
                name="pipedriveDealId"
                placeholder="https://your-org.pipedrive.com/deal/1234 or 1234"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Paste the deal URL or numeric ID. Delivery milestones will write back as notes &amp; custom fields on this deal. Leave blank to skip.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border/40 pt-5">
              <Button asChild variant="glass">
                <Link href="/">Cancel</Link>
              </Button>
              <Button type="submit" variant="brand">
                <CalendarPlus className="h-4 w-4" />
                Create event
              </Button>
            </div>
          </form>
        </div>
      </section>
    </AdminPageShell>
  );
}
