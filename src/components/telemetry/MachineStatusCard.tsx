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
import { useStableStatus } from "@/hooks/useStableStatus";

interface MachineStatusCardProps {
  machine: {
    id?: string;
    serialNumber: string;
    nickname?: string;
    status: string;
    lastHeartbeat?: string;
    firmwareVersion?: string;
  };
  /** Customers see friendly labels and no hardware serial/firmware detail. */
  isCustomer?: boolean;
  /** When set, the card filters the live feed to this machine. */
  onSelect?: () => void;
  isSelected?: boolean;
}

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string; customerLabel: string }
> = {
  available: { bg: "bg-success/15", text: "text-success border-success/30", label: "Available", customerLabel: "Ready" },
  deployed: { bg: "bg-primary/15", text: "text-primary border-primary/30", label: "Deployed", customerLabel: "On site" },
  maintenance: { bg: "bg-warning/15", text: "text-warning border-warning/30", label: "Maintenance", customerLabel: "Being serviced" },
  retired: { bg: "bg-muted", text: "text-muted-foreground border-border", label: "Retired", customerLabel: "Offline" },
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

export function MachineStatusCard({
  machine,
  isCustomer = false,
  onSelect,
  isSelected = false,
}: MachineStatusCardProps) {
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
  const rawOnline = Boolean(
    machine.lastHeartbeat &&
      // eslint-disable-next-line react-hooks/purity -- heartbeat freshness is a transient UI signal that re-renders on parent revalidation; not a derived hook dependency
      Date.now() - new Date(machine.lastHeartbeat).getTime() < 5 * 60 * 1000
  );
  // Heartbeat threshold can jitter at the 5-minute boundary — debounce colours only.
  const isOnline = useStableStatus(rawOnline);

  const card = (
    <Card
      className={cn(
        "border-glass-border bg-surface-glass backdrop-blur-sm",
        onSelect && "transition-colors hover:bg-foreground/[0.03]",
        isSelected && "ring-2 ring-brand/40"
      )}
    >
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
              "text-xs border",
              style.bg,
              style.text,
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

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={isSelected}
        className="w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {card}
      </button>
    );
  }

  return card;
}
