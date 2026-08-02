"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Send, Loader2, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  saveGameConfiguration,
  updateGameConfigStatus,
  type GameConfiguration,
  type PrizeMode,
  type PrizeEntry,
  type FormFieldEntry,
  type CaptureMethod,
} from "@/app/actions/game-config";
import { CaptureQualitySection } from "@/components/configuration/CaptureQualitySection";
import { PRIZE_MODES, CAPTURE_METHODS } from "@/lib/configuration/config-labels";
import {
  defaultCaptureRules,
  DEFAULT_RETENTION_DAYS,
  type CaptureRules,
} from "@/lib/capture-rules";
import type { UserRole } from "@/types";

interface GameConfigFormProps {
  eventId: string;
  config: GameConfiguration | null;
  viewerRole: UserRole;
  /**
   * Set to configure one machine instead of the whole show. The form then
   * writes a per-machine override rather than the show-wide default.
   */
  machineInstanceId?: string | null;
  /** How this machine is labelled in the inheritance notice. */
  machineLabel?: string;
  /** False when the machine is still inheriting the show-wide default. */
  isOverride?: boolean;
}

/** Roles that author the configuration. QA verifies (read-only + sign-off). */
const EDIT_ROLES: UserRole[] = [
  "customer_user",
  "customer_admin",
  "creative_lead",
  "events_lead",
  "admin",
];

export function GameConfigForm({
  eventId,
  config,
  viewerRole,
  machineInstanceId = null,
  machineLabel,
  isOverride = true,
}: GameConfigFormProps) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const [submitting, startSubmit] = useTransition();
  const [verifying, startVerify] = useTransition();

  const canEdit = EDIT_ROLES.includes(viewerRole);
  const canVerify = viewerRole === "qa_lead";

  const [prizeMode, setPrizeMode] = useState<PrizeMode>(config?.prizeMode ?? "random");
  const [prizes, setPrizes] = useState<PrizeEntry[]>(config?.prizesJson ?? []);
  const [formFields, setFormFields] = useState<FormFieldEntry[]>(
    config?.formFieldsJson ?? [
      { label: "First Name", type: "text", required: true },
      { label: "Last Name", type: "text", required: true },
      { label: "Email", type: "email", required: true },
    ]
  );
  const [includeScore, setIncludeScore] = useState(config?.includeScoreInExport ?? false);
  const [leaderboard, setLeaderboard] = useState(config?.leaderboardEnabled ?? false);
  const [captureRules, setCaptureRules] = useState<CaptureRules>(
    config?.captureRulesJson ?? defaultCaptureRules()
  );
  const [retentionDays, setRetentionDays] = useState(
    config?.retentionDays ?? DEFAULT_RETENTION_DAYS
  );
  const [brandedLanding, setBrandedLanding] = useState(config?.brandedLanding ?? false);
  const [captureMethod, setCaptureMethod] = useState<CaptureMethod>(
    config?.captureMethod ?? "form"
  );

  const isSubmitted = config?.status === "submitted" || config?.status === "configured" || config?.status === "tested";
  const isInheriting = Boolean(machineInstanceId) && !isOverride;

  function buildPayload() {
    return {
      prizeMode,
      prizesJson: prizes,
      formFieldsJson: formFields,
      includeScoreInExport: includeScore,
      leaderboardEnabled: leaderboard,
      gameParametersJson: config?.gameParametersJson ?? {},
      idleScreenConfigJson: config?.idleScreenConfigJson ?? {},
      captureRulesJson: captureRules,
      retentionDays,
      brandedLanding,
      captureMethod,
      machineInstanceId,
    };
  }

  function handleSave() {
    startSave(async () => {
      const result = await saveGameConfiguration(eventId, buildPayload(), false);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Configuration saved");
      router.refresh();
    });
  }

  function handleSubmit() {
    startSubmit(async () => {
      const result = await saveGameConfiguration(eventId, buildPayload(), true);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Configuration submitted");
      router.refresh();
    });
  }

  function handleMarkTested() {
    startVerify(async () => {
      const result = await updateGameConfigStatus(eventId, "tested");
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Configuration marked as tested");
      router.refresh();
    });
  }

  return (
    <Card tone="subtle" className="p-6 space-y-6">
      {isSubmitted && (
        <div className="flex items-center gap-2 text-sm text-success">
          <CheckCircle2 size={14} />
          Configuration {config?.status === "tested" ? "tested and ready" : "submitted"}
          <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30 ml-auto">
            {config?.status}
          </Badge>
        </div>
      )}

      {canVerify && !canEdit && (
        <div className="rounded-lg border border-info/25 bg-info/8 px-4 py-3 text-sm text-muted-foreground">
          QA view — review the configuration below, then mark it as tested when
          everything checks out.
        </div>
      )}

      {isInheriting && (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {machineLabel ?? "This machine"} is running the show default. Saving
          here creates an override for this unit only; every other machine keeps
          following the default.
        </div>
      )}

      <fieldset disabled={!canEdit} className="space-y-6 border-0 p-0 m-0 disabled:opacity-70">
      {/* Prize mode */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Prize mode</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PRIZE_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => setPrizeMode(mode.value)}
              className={cn(
                "p-3 rounded-lg border text-left text-sm transition-colors",
                prizeMode === mode.value
                  ? "border-[var(--color-bb-cobalt)] bg-[var(--color-bb-cobalt)]/10"
                  : "border-border bg-muted/40 hover:bg-accent"
              )}
            >
              <p className="font-medium text-foreground">{mode.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{mode.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Prizes */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Prizes</label>
        <div className="space-y-2">
          {prizes.map((prize, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={prize.name}
                onChange={(e) => {
                  const next = [...prizes];
                  next[i] = { ...next[i], name: e.target.value };
                  setPrizes(next);
                }}
                placeholder="Prize name"
                className="flex-1 px-3 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="number"
                value={prize.quantity}
                onChange={(e) => {
                  const next = [...prizes];
                  next[i] = { ...next[i], quantity: Number(e.target.value) };
                  setPrizes(next);
                }}
                placeholder="Qty"
                className="w-20 px-3 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
              <Button variant="ghost" size="icon" onClick={() => setPrizes(prizes.filter((_, j) => j !== i))}>
                <Trash2 size={14} className="text-muted-foreground" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setPrizes([...prizes, { name: "", quantity: 1 }])}>
            <Plus size={12} /> Add prize
          </Button>
        </div>
      </div>

      {/* Form fields */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Data capture fields</label>
        <div className="space-y-2">
          {formFields.map((field, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={field.label}
                onChange={(e) => {
                  const next = [...formFields];
                  next[i] = { ...next[i], label: e.target.value };
                  setFormFields(next);
                }}
                placeholder="Field label"
                className="flex-1 px-3 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
              />
              <select
                aria-label={`Field type for ${field.label || `field ${i + 1}`}`}
                value={field.type}
                onChange={(e) => {
                  const next = [...formFields];
                  next[i] = { ...next[i], type: e.target.value as FormFieldEntry["type"] };
                  setFormFields(next);
                }}
                className="px-3 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground outline-none"
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="tel">Phone</option>
                <option value="select">Dropdown</option>
                <option value="checkbox">Checkbox</option>
              </select>
              <label className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => {
                    const next = [...formFields];
                    next[i] = { ...next[i], required: e.target.checked };
                    setFormFields(next);
                  }}
                  className="accent-[var(--color-bb-cobalt)]"
                />
                Req
              </label>
              <Button variant="ghost" size="icon" onClick={() => setFormFields(formFields.filter((_, j) => j !== i))}>
                <Trash2 size={14} className="text-muted-foreground" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setFormFields([...formFields, { label: "", type: "text", required: false }])}>
            <Plus size={12} /> Add field
          </Button>
        </div>
      </div>

      {/* How a play is unlocked and identity established */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          How attendees enter
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {CAPTURE_METHODS.map((method) => (
            <button
              key={method.value}
              type="button"
              onClick={() => setCaptureMethod(method.value)}
              className={cn(
                "p-3 rounded-lg border text-left text-sm transition-colors",
                captureMethod === method.value
                  ? "border-[var(--color-bb-cobalt)] bg-[var(--color-bb-cobalt)]/10"
                  : "border-border bg-muted/40 hover:bg-accent"
              )}
            >
              <p className="font-medium text-foreground">{method.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{method.description}</p>
            </button>
          ))}
        </div>
        {captureMethod !== "form" && (
          <p className="mt-2 text-xs text-muted-foreground">
            Badge scanning needs the show organizer&apos;s registration provider
            connected before the event. Confirm it with your Bright.Blue contact.
          </p>
        )}
      </div>

      {/* Capture quality guardrails (business emails, dedupe, consent…) */}
      <CaptureQualitySection
        rules={captureRules}
        onRulesChange={setCaptureRules}
        retentionDays={retentionDays}
        onRetentionChange={setRetentionDays}
        brandedLanding={brandedLanding}
        onBrandedLandingChange={setBrandedLanding}
      />

      {/* Options */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={leaderboard}
            onChange={(e) => setLeaderboard(e.target.checked)}
            className="accent-[var(--color-bb-cobalt)]"
          />
          Enable leaderboard
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={includeScore}
            onChange={(e) => setIncludeScore(e.target.checked)}
            className="accent-[var(--color-bb-cobalt)]"
          />
          Include scores in lead export
        </label>
      </div>
      </fieldset>

      {canEdit && (
        <div className="flex flex-col-reverse gap-3 pt-4 border-t border-border/60 sm:flex-row sm:items-center">
          <Button onClick={handleSave} disabled={saving} variant="glass">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Saving…" : "Save draft"}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} variant="brand" className="sm:ml-auto">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {submitting ? "Submitting…" : "Submit configuration"}
          </Button>
        </div>
      )}

      {canVerify && (
        <div className="flex flex-col-reverse gap-3 pt-4 border-t border-border/60 sm:flex-row sm:items-center">
          <Button
            onClick={handleMarkTested}
            disabled={verifying || config?.status === "tested"}
            variant="brand"
            className="sm:ml-auto"
          >
            {verifying ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {config?.status === "tested" ? "Tested" : "Mark as tested"}
          </Button>
        </div>
      )}
    </Card>
  );
}
