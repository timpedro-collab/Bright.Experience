/**
 * What one unit is set up to run — read from the resolved configuration.
 *
 * Read-only by design. Configuration is authored with the delivery team and
 * the brand whose activation it is; the organizer needs to know what a unit
 * will do on the day, not to change it from behind the show desk. The badge
 * says which scope the settings came from, so "why is this one different"
 * has an answer on the page.
 */

import { Gamepad2, Gift, ScanLine, ShieldCheck, Clock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  prizeModeLabel,
  captureMethodLabel,
} from "@/lib/configuration/config-labels";
import type { GameConfiguration } from "@/app/actions/game-config";

interface MachineConfigCardProps {
  config: GameConfiguration | null;
  /** True when this unit carries its own settings rather than the show default. */
  isOverride: boolean;
  /** Resolved from `config.gameId` by the caller — never show a raw id. */
  gameName?: string | null;
  /** Where an organizer asks for a change. */
  contactHint?: string;
}

function Row({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-sm font-medium text-foreground">{value}</p>
        </div>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

export function MachineConfigCard({
  config,
  isOverride,
  gameName,
  contactHint = "Changes go through your Bright.Blue contact.",
}: MachineConfigCardProps) {
  if (!config) {
    return (
      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">
            Nothing configured yet. Once the game and prizes are set for this
            show they appear here, including anything set specifically for this
            unit.
          </p>
        </CardContent>
      </Card>
    );
  }

  const prizeCount = config.prizesJson.reduce(
    (sum, prize) => sum + (Number(prize.quantity) || 0),
    0
  );
  const rules = config.captureRulesJson;
  const guards = [
    rules.businessEmailsOnly ? "business emails only" : null,
    rules.blockDuplicates ? "one entry per person" : null,
    rules.consentRequired ? "consent required" : null,
  ].filter(Boolean);

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-1 flex items-center justify-between gap-3">
          <p className="text-heading text-sm font-semibold text-foreground">
            Running on this unit
          </p>
          <Badge variant="outline" className="text-[0.65rem]">
            {isOverride ? "Set for this unit" : "Show default"}
          </Badge>
        </div>
        <p className="mb-2 text-xs text-muted-foreground">{contactHint}</p>

        <div className="divide-y divide-border/50">
          <Row
            icon={Gamepad2}
            label="Game"
            value={gameName ?? (config.gameId ? "Set" : "Not chosen yet")}
          />
          <Row
            icon={Gift}
            label="Prizes"
            value={
              prizeCount > 0
                ? `${prizeCount} across ${config.prizesJson.length} line${
                    config.prizesJson.length === 1 ? "" : "s"
                  }`
                : "None loaded"
            }
            hint={`${prizeModeLabel(config.prizeMode)} — ${
              config.prizeMode === "guaranteed"
                ? "everyone wins"
                : config.prizeMode === "score_based"
                  ? "win by reaching a score"
                  : "picked at random"
            }`}
          />
          <Row
            icon={ScanLine}
            label="Capture"
            value={captureMethodLabel(config.captureMethod)}
            hint={`${config.formFieldsJson.length} field${
              config.formFieldsJson.length === 1 ? "" : "s"
            } on the entry form`}
          />
          <Row
            icon={ShieldCheck}
            label="Data quality"
            value={guards.length > 0 ? `${guards.length} of 3 on` : "Off"}
            hint={guards.length > 0 ? guards.join(", ") : "No capture guards set"}
          />
          <Row
            icon={Clock}
            label="Retention"
            value={`${config.retentionDays} days`}
            hint="Captured contacts are deleted automatically after this window."
          />
        </div>
      </CardContent>
    </Card>
  );
}
