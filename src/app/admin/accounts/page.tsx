/** Admin account management — view all accounts with user/event counts. */
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2 } from "lucide-react";

import { AdminPageShell, EditorialEyebrow } from "@/components/brand";
import { Pagination } from "@/components/ui/Pagination";

import { getUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { getAccountsPaginated } from "@/lib/queries/admin";
import { getUnreadCount } from "@/lib/queries/notifications";
import { parsePage } from "@/lib/pagination";

interface AccountsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminAccountsPage({
  searchParams,
}: AccountsPageProps) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!isAdminRole(user.role)) redirect("/");

  const params = await searchParams;
  const page = parsePage(params);

  const [result, unread] = await Promise.all([
    getAccountsPaginated(page),
    getUnreadCount(user.id),
  ]);

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Accounts"
      title="Every account."
      subtitle={`${result.totalCount} organisation${result.totalCount === 1 ? "" : "s"} on the platform.`}
    >
      <section className="py-8">
        <EditorialEyebrow accent>All accounts</EditorialEyebrow>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-overline text-muted-foreground">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Slug</th>
                <th className="py-2 pr-4 text-right">Users</th>
                <th className="py-2 pr-4 text-right">Events</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {result.data.map((acct) => (
                <tr
                  key={acct.id}
                  className="border-b border-border/20 hover:bg-accent/20 transition-colors"
                >
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <Building2
                        size={14}
                        className="text-muted-foreground shrink-0"
                      />
                      <span className="font-medium text-foreground">
                        {acct.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-muted-foreground font-mono text-xs">
                    {acct.slug}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-foreground">
                    {acct.userCount}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-foreground">
                    {acct.eventCount}
                  </td>
                  <td className="py-2.5">
                    <Link
                      href={`/admin/accounts/${acct.id}`}
                      className="text-overline text-[var(--color-bb-cobalt)] hover:underline"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
              {result.data.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={result.totalPages}
          basePath="/admin/accounts"
        />
      </section>
    </AdminPageShell>
  );
}
