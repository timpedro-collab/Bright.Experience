/** Internal API key and webhook management with tabbed interface. */
import { notFound, redirect } from "next/navigation";

import { AdminPageShell } from "@/components/brand";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiKeyManager } from "@/components/api/ApiKeyManager";
import { WebhookManager } from "@/components/api/WebhookManager";

import { getUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { isPublicApiEnabled } from "@/lib/integration-flags";
import { getApiKeys, getWebhookSubscriptions } from "@/lib/queries/api";
import { getUnreadCount } from "@/lib/queries/notifications";

export default async function ApiManagementPage() {
  // The keys and subscriptions this page issues aren't wired to anything yet —
  // see `isPublicApiEnabled`. Until they are, the page doesn't exist.
  if (!isPublicApiEnabled()) notFound();

  const user = await getUser();
  if (!user) redirect("/login");
  if (!isAdminRole(user.role)) redirect("/");

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
