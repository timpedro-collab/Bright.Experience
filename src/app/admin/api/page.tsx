/** Internal API key and webhook management with tabbed interface. */
import { redirect } from "next/navigation";
import { Plug } from "lucide-react";

import { AdminPageShell } from "@/components/brand";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiKeyManager } from "@/components/api/ApiKeyManager";
import { WebhookManager } from "@/components/api/WebhookManager";

import { getUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { isPublicApiEnabled } from "@/lib/integration-flags";
import { getApiKeys, getWebhookSubscriptions } from "@/lib/queries/api";
import { getUnreadCount } from "@/lib/queries/notifications";

export const metadata = {
  title: "API & integrations",
};

export default async function ApiManagementPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!isAdminRole(user.role)) redirect("/");

  // The keys and subscriptions this page issues aren't wired to anything yet —
  // see `isPublicApiEnabled`. Until they are, show a read-only "request
  // access" state rather than a 404, so an admin who lands here knows the
  // surface exists and who to talk to.
  if (!isPublicApiEnabled()) {
    const unread = await getUnreadCount(user.id);
    return (
      <AdminPageShell
        user={user}
        unreadCount={unread}
        section="API & integrations"
        title="API & integrations."
        subtitle="Manage API keys and webhook subscriptions for downstream systems."
      >
        <div className="py-8">
          <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-border/60 bg-muted/40 p-16 text-center">
            <Plug size={24} className="mb-4 text-muted-foreground" />
            <p className="max-w-[48ch] text-sm text-muted-foreground">
              API access is not enabled for this workspace yet — contact your
              Bright.Blue lead to enable it.
            </p>
          </div>
        </div>
      </AdminPageShell>
    );
  }

  const [unread, keys, webhooks] = await Promise.all([
    getUnreadCount(user.id),
    getApiKeys(),
    getWebhookSubscriptions(),
  ]);

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="API & integrations"
      title="API & integrations."
      subtitle="Manage API keys and webhook subscriptions for downstream systems."
    >
      <div className="py-8">
        <Tabs defaultValue="api-keys" className="space-y-6">
          <TabsList>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>
          <TabsContent value="api-keys">
            <div className="border border-border/60 bg-card/30 rounded-md p-6">
              <ApiKeyManager keys={keys} />
            </div>
          </TabsContent>
          <TabsContent value="webhooks">
            <div className="border border-border/60 bg-card/30 rounded-md p-6">
              <WebhookManager subscriptions={webhooks} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminPageShell>
  );
}
