/** Admin user management — view, search, filter, and deactivate profiles. */
import { redirect } from "next/navigation";

import { AdminPageShell } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/Pagination";
import { UserToggleButton } from "@/components/admin/UserToggleButton";

import { getUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { getProfilesPaginated } from "@/lib/queries/admin";
import { getUnreadCount } from "@/lib/queries/notifications";
import { parsePage } from "@/lib/pagination";
import { formatDateMedium } from "@/lib/dates";

interface UsersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!isAdminRole(user.role)) redirect("/");

  const params = await searchParams;
  const page = parsePage(params);
  const search = typeof params.q === "string" ? params.q : undefined;
  const roleFilter = typeof params.role === "string" ? params.role : undefined;

  const [result, unread] = await Promise.all([
    getProfilesPaginated(page, search, roleFilter),
    getUnreadCount(user.id),
  ]);

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Users"
      title="Every user."
      subtitle={`${result.totalCount} profile${result.totalCount === 1 ? "" : "s"} across all accounts.`}
    >
      <section className="py-8">
        <form method="GET" className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            name="q"
            defaultValue={search}
            aria-label="Search users by name or email"
            placeholder="Search name or email…"
            className="h-9 rounded-md border border-border bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-64"
          />
          <select
            name="role"
            aria-label="Filter by role"
            defaultValue={roleFilter ?? ""}
            className="h-9 rounded-md border border-border bg-transparent px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All roles</option>
            <option value="customer_user">Customer</option>
            <option value="customer_admin">Customer Admin</option>
            <option value="admin">Admin</option>
            <option value="events_lead">Events Lead</option>
            <option value="creative_lead">Creative Lead</option>
            <option value="operations_lead">Operations Lead</option>
            <option value="qa_lead">QA Lead</option>
            <option value="partner_member">Partner Member</option>
            <option value="partner_admin">Partner Admin</option>
          </select>
          <button
            type="submit"
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:brightness-110"
          >
            Filter
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-overline text-muted-foreground">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Account</th>
                <th className="py-2 pr-4">Active</th>
                <th className="py-2 pr-4">Joined</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {result.data.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border/20 hover:bg-accent/20 transition-colors"
                >
                  <td className="py-2.5 pr-4 font-medium text-foreground">
                    {p.name ?? "—"}
                  </td>
                  <td className="py-2.5 pr-4 text-muted-foreground">
                    {p.email}
                  </td>
                  <td className="py-2.5 pr-4">
                    <Badge variant="muted" className="capitalize">
                      {p.role.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="py-2.5 pr-4 text-muted-foreground">
                    {p.accountName ?? "—"}
                  </td>
                  <td className="py-2.5 pr-4">
                    <Badge variant={p.isActive ? "success" : "muted"}>
                      {p.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="py-2.5 pr-4 text-muted-foreground tabular-nums">
                    {formatDateMedium(p.createdAt)}
                  </td>
                  <td className="py-2.5">
                    <UserToggleButton
                      userId={p.id}
                      isActive={p.isActive}
                    />
                  </td>
                </tr>
              ))}
              {result.data.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={result.totalPages}
          basePath="/admin/users"
        />
      </section>
    </AdminPageShell>
  );
}
