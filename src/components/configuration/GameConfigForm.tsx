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
  type GameConfiguration,
  type PrizeMode,
  type PrizeEntry,
  type FormFieldEntry,
} from "@/app/actions/game-config";

interface GameConfigFormProps {
  eventId: string;
  config: GameConfiguration | null;
  isInternal: boolean;
}

const PRIZE_MODES: { value: PrizeMode; label: string; description: string }[] = [
  { value: "random", label: "Random", description: "Each play randomly awards a prize" },
  { value: "score_based", label: "Score-based", description: "Players earn prizes based on score thresholds" },
  { value: "guaranteed", label: "Guaranteed", description: "Every player receives a prize" },
];

export function GameConfigForm({ eventId, config, isInternal }: GameConfigFormProps) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const [submitting, startSubmit] = useTransition();

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

  const isSubmitted = config?.status === "submitted" || config?.status === "configured" || config?.status === "tested";

  function buildPayload() {
    return {
      prizeMode,
      prizesJson: prizes,
      formFieldsJson: formFields,
      includeScoreInExport: includeScore,
      leaderboardEnabled: leaderboard,
      gameParametersJson: config?.gameParametersJson ?? {},
      idleScreenConfigJson: config?.idleScreenConfigJson ?? {},
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
                  : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]"
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
                className="flex-1 px-3 py-2 rounded-[var(--radius-control)] border border-white/[0.08] bg-white/[0.02] text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
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
                className="w-20 px-3 py-2 rounded-[var(--radius-control)] border border-white/[0.08] bg-white/[0.02] text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
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
                className="flex-1 px-3 py-2 rounded-[var(--radius-control)] border border-white/[0.08] bg-white/[0.02] text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
              />
              <select
                value={field.type}
                onChange={(e) => {
                  const next = [...formFields];
                  next[i] = { ...next[i], type: e.target.value as FormFieldEntry["type"] };
                  setFormFields(next);
                }}
                className="px-3 py-2 rounded-[var(--radius-control)] border border-white/[0.08] bg-white/[0.02] text-sm text-foreground outline-none"
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

      <div className="flex flex-col-reverse gap-3 pt-4 border-t border-white/[0.06] sm:flex-row sm:items-center">
        <Button onClick={handleSave} disabled={saving} variant="glass">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving…" : "Save draft"}
        </Button>
        <Button onClick={handleSubmit} disabled={submitting} variant="brand" className="sm:ml-auto">
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {submitting ? "Submitting…" : "Submit configuration"}
        </Button>
      </div>
    </Card>
  );
}
