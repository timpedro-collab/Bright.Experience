/** Internal API key and webhook management with tabbed interface. */
import { redirect } from "next/navigation";

import { AdminPageShell } from "@/components/brand";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiKeyManager } from "@/components/api/ApiKeyManager";
import { WebhookManager } from "@/components/api/WebhookManager";

import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { getUnreadCount } from "@/lib/queries/notifications";

export default async function ApiManagementPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!isInternalRole(user.role)) redirect("/");

  const supabase = await createClient();
  const unread = await getUnreadCount(user.id);

  const { data: rawKeys } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, is_active, last_used_at, created_at")
    .order("created_at", { ascending: false });

  const { data: rawWebhooks } = await supabase
    .from("webhook_subscriptions")
    .select("id, url, events, is_active, failure_count")
    .order("created_at", { ascending: false });

  const keys = (rawKeys ?? []).map((k) => ({
    id: k.id as string,
    name: k.name as string,
    keyPrefix: k.key_prefix as string,
    isActive: k.is_active as boolean,
    lastUsedAt: (k.last_used_at as string) ?? undefined,
    createdAt: k.created_at as string,
  }));

  const webhooks = (rawWebhooks ?? []).map((w) => ({
    id: w.id as string,
    url: w.url as string,
    events: (w.events ?? []) as string[],
    isActive: w.is_active as boolean,
    failureCount: (w.failure_count ?? 0) as number,
  }));

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
