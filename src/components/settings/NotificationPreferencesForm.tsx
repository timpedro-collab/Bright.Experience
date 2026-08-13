"use client";

/**
 * Notification preferences form — server-rendered map handed in by the
 * settings page, optimistic toggles persisted via the
 * `updateNotificationPreference` server action.
 *
 * Class A archetypes show the in-portal lane as "Always on" (non-editable)
 * with a tooltip-style note. Class B archetypes give full control over
 * both lanes.
 */

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ARCHETYPES,
  CLASS_A_KINDS,
  CLASS_B_KINDS,
  type NotificationKind,
} from "@/lib/notifications/archetypes";
import { updateNotificationPreference } from "@/app/actions/notification-preferences";

type EmailMode = "immediate" | "digest" | "off";

interface PrefValue {
  inPortal: boolean;
  emailMode: EmailMode;
}

interface Props {
  initialPreferences: Record<string, PrefValue>;
  /**
   * Which side of the fence the viewer sits on. Archetypes whose audience is
   * the other side are hidden — a customer can never receive an
   * internal-only kind, so offering them a toggle for it is just noise.
   */
  viewerAudience: "customer" | "internal";
}

const EMAIL_OPTIONS: { value: EmailMode; label: string; hint: string }[] = [
  {
    value: "immediate",
    label: "Immediate",
    hint: "Email me as soon as it happens.",
  },
  {
    value: "digest",
    label: "Daily digest",
    hint: "Bundle into one daily email, sent once a day outside your quiet hours.",
  },
  { value: "off", label: "Off", hint: "Don't email me — portal only." },
];

const IN_PORTAL_OPTIONS: { value: boolean; label: string }[] = [
  { value: true, label: "Show in portal" },
  { value: false, label: "Hidden" },
];

export function NotificationPreferencesForm({
  initialPreferences,
  viewerAudience,
}: Props) {
  const relevant = (kind: NotificationKind) => {
    const audience = ARCHETYPES[kind].audience;
    return audience === "both" || audience === viewerAudience;
  };
  const classAKinds = CLASS_A_KINDS.filter(relevant);
  const classBKinds = CLASS_B_KINDS.filter(relevant);

  const [prefs, setPrefs] = useState<Record<string, PrefValue>>(() => {
    const out: Record<string, PrefValue> = { ...initialPreferences };
    for (const k of [...classAKinds, ...classBKinds]) {
      if (!out[k]) {
        const a = ARCHETYPES[k];
        out[k] = {
          inPortal: a.defaults.inPortal,
          emailMode: a.defaults.emailMode,
        };
      }
    }
    return out;
  });
  const [pending, startTransition] = useTransition();

  function update(kind: NotificationKind, patch: Partial<PrefValue>) {
    const archetype = ARCHETYPES[kind];
    const next: PrefValue = {
      ...prefs[kind],
      ...patch,
      // Class A: in_portal is enforced true at the app layer; mirror that
      // in the optimistic state so the row stays consistent.
      inPortal:
        archetype.classOf === "action_required"
          ? true
          : (patch.inPortal ?? prefs[kind].inPortal),
    };
    setPrefs({ ...prefs, [kind]: next });
    startTransition(async () => {
      const result = await updateNotificationPreference({
        kind,
        emailMode: next.emailMode,
        inPortal: archetype.classOf === "fyi" ? next.inPortal : undefined,
      });
      if (!result.success) {
        toast.error(result.error ?? "Could not save your preference.");
      }
    });
  }

  return (
    <div className="space-y-10">
      <Section
        heading="Action items"
        description="These are project-critical — we won't let you silence them in the portal. You can downgrade email or turn it off, but the reminder system may re-email you anyway if something stays stuck."
      >
        <p className="text-xs text-muted-foreground italic mb-4">
          Action items always show up in the portal. Reminders may email you
          anyway if something stays stuck — we&apos;d rather knock twice than
          let your event stall.
        </p>
        <div className="space-y-2">
          {classAKinds.map((kind) => (
            <PreferenceRow
              key={kind}
              kind={kind}
              value={prefs[kind]}
              pending={pending}
              onChange={(patch) => update(kind, patch)}
              actionRequired
            />
          ))}
        </div>
      </Section>

      <Section
        heading="FYI"
        description="Useful, but not project-critical. Silence them and your event will still hum along."
      >
        <div className="space-y-2">
          {classBKinds.map((kind) => (
            <PreferenceRow
              key={kind}
              kind={kind}
              value={prefs[kind]}
              pending={pending}
              onChange={(patch) => update(kind, patch)}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({
  heading,
  description,
  children,
}: {
  heading: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card tone="subtle">
      <CardHeader className="pb-3">
        <CardTitle>{heading}</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function PreferenceRow({
  kind,
  value,
  onChange,
  pending,
  actionRequired,
}: {
  kind: NotificationKind;
  value: PrefValue;
  onChange: (patch: Partial<PrefValue>) => void;
  pending: boolean;
  actionRequired?: boolean;
}) {
  const archetype = ARCHETYPES[kind];

  return (
    <div
      id={kind}
      className="rounded-[var(--radius-control)] border border-border/60 bg-muted/40 p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {archetype.subjectTemplate
              .replace(/\{eventName\}/g, "your event")
              .replace(/\{assetName\}/g, "an asset")
              .replace(/\{taskTitle\}/g, "a task")
              .replace(/\{contactName\}/g, "a customer")
              .replace(/\{stageLabel\}/g, "a new stage")
              .replace(/\{senderName\}/g, "a teammate")
              .replace(/\{leadCount\}/g, "X")}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
            {archetype.bodyTemplate
              .replace(/\{[a-zA-Z]+\}/g, "…")
              .slice(0, 140)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-overline text-muted-foreground mb-2">In portal</p>
          {actionRequired ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
              Always on
            </span>
          ) : (
            <SegmentedToggle
              options={IN_PORTAL_OPTIONS}
              value={value.inPortal}
              disabled={pending}
              onChange={(inPortal) => onChange({ inPortal })}
            />
          )}
        </div>

        <div>
          <p className="text-overline text-muted-foreground mb-2">Email</p>
          <SegmentedToggle
            options={EMAIL_OPTIONS}
            value={value.emailMode}
            disabled={pending}
            onChange={(emailMode) => onChange({ emailMode })}
          />
        </div>
      </div>
    </div>
  );
}

interface SegmentedOption<T> {
  value: T;
  label: string;
  hint?: string;
}

function SegmentedToggle<T extends string | boolean>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (next: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex rounded-[var(--radius-control)] border border-border/60 bg-muted/40 p-0.5">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            title={option.hint}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-[calc(var(--radius-control)-2px)]",
              "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
