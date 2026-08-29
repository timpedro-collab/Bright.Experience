/** Integration status widget — shows webhook and Cloud API connection state. */
"use client";

import { Wifi, WifiOff, Cloud, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntegrationStatusProps {
  webhookConfigured: boolean;
  cloudApiConfigured: boolean;
  className?: string;
}

export function IntegrationStatus({
  webhookConfigured,
  cloudApiConfigured,
  className,
}: IntegrationStatusProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-border/30 p-4 space-y-3",
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Integration status
      </p>
      <StatusRow
        label="Webhooks"
        connected={webhookConfigured}
        connectedIcon={Wifi}
        disconnectedIcon={WifiOff}
      />
      <StatusRow
        label="Cloud API"
        connected={cloudApiConfigured}
        connectedIcon={Cloud}
        disconnectedIcon={CloudOff}
      />
    </div>
  );
}

function StatusRow({
  label,
  connected,
  connectedIcon: ConnectedIcon,
  disconnectedIcon: DisconnectedIcon,
}: {
  label: string;
  connected: boolean;
  connectedIcon: React.ElementType;
  disconnectedIcon: React.ElementType;
}) {
  const Icon = connected ? ConnectedIcon : DisconnectedIcon;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon
          size={14}
          className={cn(
            connected ? "text-success" : "text-muted-foreground",
          )}
        />
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <span
        className={cn(
          "text-xs font-medium",
          connected ? "text-success" : "text-muted-foreground",
        )}
      >
        {connected ? "Connected" : "Not configured"}
      </span>
    </div>
  );
}
