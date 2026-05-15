/** Machine instance status card — shows connectivity, firmware, and operational state */
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
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  available: { bg: "bg-success/10", text: "text-success", label: "Available" },
  deployed: { bg: "bg-brand/10", text: "text-brand", label: "Deployed" },
  maintenance: { bg: "bg-warning/10", text: "text-warning", label: "Maintenance" },
  retired: { bg: "bg-white/[0.06]", text: "text-text-muted", label: "Retired" },
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

export function MachineStatusCard({ machine }: MachineStatusCardProps) {
  const style = STATUS_STYLES[machine.status] ?? STATUS_STYLES.retired;
  const isOnline =
    machine.lastHeartbeat &&
    Date.now() - new Date(machine.lastHeartbeat).getTime() < 5 * 60 * 1000;

  return (
    <Card className="border-glass-border bg-surface-glass backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0">
            <p className="text-heading text-sm font-semibold text-text-primary truncate">
              {machine.nickname ?? machine.serialNumber}
            </p>
            {machine.nickname && (
              <p className="text-xs text-text-muted mt-0.5">
                {machine.serialNumber}
              </p>
            )}
          </div>
          <Badge className={cn("text-xs", style.bg, style.text, "border-0")}>
            {style.label}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            {isOnline ? (
              <Wifi size={12} className="text-success" />
            ) : (
              <WifiOff size={12} className="text-text-muted" />
            )}
            <span className={isOnline ? "text-success" : "text-text-muted"}>
              {machine.lastHeartbeat
                ? getRelativeTime(machine.lastHeartbeat)
                : "No signal"}
            </span>
          </div>
          {machine.firmwareVersion && (
            <span className="text-text-muted">
              v{machine.firmwareVersion}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
