/**
 * Machine instance status card — shows connectivity, firmware, and
 * operational state. When the status changes while the dashboard is
 * open, the badge pulses so the transition doesn't go unnoticed.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface MachineStatusCardProps {
  machine: {
    serialNumber: string;
    nickname?: string;
    status: string;
    lastHeartbeat?: string;
    firmwareVersion?: string;
  };
  /** Customers see friendly labels and no hardware serial/firmware detail. */
  isCustomer?: boolean;
}

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string; customerLabel: string }
> = {
  available: { bg: "bg-success/10", text: "text-success", label: "Available", customerLabel: "Ready" },
  deployed: { bg: "bg-brand/10", text: "text-brand", label: "Deployed", customerLabel: "On site" },
  maintenance: { bg: "bg-warning/10", text: "text-warning", label: "Maintenance", customerLabel: "Being serviced" },
  retired: { bg: "bg-muted", text: "text-muted-foreground", label: "Retired", customerLabel: "Offline" },
};

function getRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function MachineStatusCard({ machine, isCustomer = false }: MachineStatusCardProps) {
  // Pulse the badge when the status flips mid-session (not on mount).
  const prevStatusRef = useRef(machine.status);
  const [statusPulse, setStatusPulse] = useState(false);
  useEffect(() => {
    if (prevStatusRef.current !== machine.status) {
      prevStatusRef.current = machine.status;
      setStatusPulse(true);
      const t = setTimeout(() => setStatusPulse(false), 2000);
      return () => clearTimeout(t);
    }
  }, [machine.status]);

  const style = STATUS_STYLES[machine.status] ?? STATUS_STYLES.retired;
  const statusLabel = isCustomer ? style.customerLabel : style.label;
  const title = machine.nickname ?? (isCustomer ? "Activation unit" : machine.serialNumber);
  const isOnline =
    machine.lastHeartbeat &&
    // eslint-disable-next-line react-hooks/purity -- heartbeat freshness is a transient UI signal that re-renders on parent revalidation; not a derived hook dependency
    Date.now() - new Date(machine.lastHeartbeat).getTime() < 5 * 60 * 1000;

  return (
    <Card className="border-glass-border bg-surface-glass backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0">
            <p className="text-heading text-sm font-semibold text-foreground truncate">
              {title}
            </p>
            {machine.nickname && !isCustomer && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {machine.serialNumber}
              </p>
            )}
          </div>
          <Badge
            className={cn(
              "text-xs",
              style.bg,
              style.text,
              "border-0",
              statusPulse && "status-pulse"
            )}
          >
            {statusLabel}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            {isOnline ? (
              <Wifi size={12} className="text-success" />
            ) : (
              <WifiOff size={12} className="text-muted-foreground" />
            )}
            <span className={isOnline ? "text-success" : "text-muted-foreground"}>
              {machine.lastHeartbeat
                ? getRelativeTime(machine.lastHeartbeat)
                : "No signal"}
            </span>
          </div>
          {machine.firmwareVersion && !isCustomer && (
            <span className="text-muted-foreground">
              v{machine.firmwareVersion}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
