"use client";

/**
 * Pipedrive setup form — client component.
 *
 * Renders the editable fields plus three side-by-side actions:
 *   - Save settings
 *   - Test connection (round-trips /v1/users/me)
 *   - Drain outbox now
 *
 * The API token field shows a masked preview when already configured
 * and only writes a new value when the input is non-empty — so an AE
 * can change the field keys without re-entering the token.
 */

import { useState, useTransition } from "react";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  runDrain,
  saveConfig,
  testConnection,
} from "@/app/actions/pipedrive-config";

interface InitialValues {
  apiTokenMasked: string;
  baseUrl: string;
  fieldKeyLastActivityAt: string;
  fieldKeyHealthStatus: string;
  fieldKeyDeliveredEvents: string;
  healthOptionGreenId: number | null;
  healthOptionAmberId: number | null;
  healthOptionRedId: number | null;
  defaultPipelineId: number | null;
}

interface Props {
  initialValues: InitialValues;
  tokenConfigured: boolean;
}

type StatusMessage =
  | { tone: "success"; text: string }
  | { tone: "error"; text: string }
  | null;

export function PipedriveSetupForm({ initialValues, tokenConfigured }: Props) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<StatusMessage>(null);

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const res = await saveConfig(formData);
          if ("error" in res) {
            setStatus({ tone: "error", text: res.error });
          } else {
            setStatus({ tone: "success", text: "Settings saved." });
          }
        });
      }}
      className="space-y-5"
    >
      <div>
        <Label htmlFor="apiToken" className="text-overline mb-1.5 block">
          API token
        </Label>
        <Input
          id="apiToken"
          name="apiToken"
          type="password"
          placeholder={
            tokenConfigured
              ? initialValues.apiTokenMasked || "Token stored — paste to replace"
              : "Personal API token from Pipedrive → Settings → Personal preferences → API"
          }
          autoComplete="off"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          {tokenConfigured
            ? "A token is configured. Leave blank to keep it, or paste a new one to replace."
            : "Required. Stored server-side and never exposed to the browser."}
        </p>
      </div>

      <div>
        <Label htmlFor="baseUrl" className="text-overline mb-1.5 block">
          Base URL
        </Label>
        <Input
          id="baseUrl"
          name="baseUrl"
          defaultValue={initialValues.baseUrl}
          placeholder="https://api.pipedrive.com"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FieldKeyInput
          id="fieldKeyLastActivityAt"
          label="Last-activity field key"
          hint="Date field"
          defaultValue={initialValues.fieldKeyLastActivityAt}
        />
        <FieldKeyInput
          id="fieldKeyHealthStatus"
          label="Health-status field key"
          hint="Single-option"
          defaultValue={initialValues.fieldKeyHealthStatus}
        />
        <FieldKeyInput
          id="fieldKeyDeliveredEvents"
          label="Delivered-events field key"
          hint="Number field"
          defaultValue={initialValues.fieldKeyDeliveredEvents}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <OptionIdInput
          id="healthOptionGreenId"
          label="Green option ID"
          defaultValue={initialValues.healthOptionGreenId}
        />
        <OptionIdInput
          id="healthOptionAmberId"
          label="Amber option ID"
          defaultValue={initialValues.healthOptionAmberId}
        />
        <OptionIdInput
          id="healthOptionRedId"
          label="Red option ID"
          defaultValue={initialValues.healthOptionRedId}
        />
        <OptionIdInput
          id="defaultPipelineId"
          label="Default pipeline ID"
          defaultValue={initialValues.defaultPipelineId}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-5">
        <Button type="submit" variant="brand" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
        <TestConnectionButton setStatus={setStatus} />
        <RunDrainButton setStatus={setStatus} />
      </div>

      {status && (
        <div
          className={
            status.tone === "success"
              ? "inline-flex items-center gap-2 text-sm text-success"
              : "inline-flex items-center gap-2 text-sm text-destructive"
          }
        >
          {status.tone === "success" ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <AlertCircle className="size-4" />
          )}
          {status.text}
        </div>
      )}
    </form>
  );
}

function FieldKeyInput({
  id,
  label,
  hint,
  defaultValue,
}: {
  id: string;
  label: string;
  hint: string;
  defaultValue: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-overline mb-1.5 block">
        {label}
      </Label>
      <Input id={id} name={id} defaultValue={defaultValue} placeholder="abcd1234…" />
      <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function OptionIdInput({
  id,
  label,
  defaultValue,
}: {
  id: string;
  label: string;
  defaultValue: number | null;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-overline mb-1.5 block">
        {label}
      </Label>
      <Input
        id={id}
        name={id}
        type="number"
        defaultValue={defaultValue ?? ""}
        placeholder="42"
      />
    </div>
  );
}

function TestConnectionButton({
  setStatus,
}: {
  setStatus: (s: StatusMessage) => void;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="glass"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await testConnection();
          if (res.ok) {
            setStatus({
              tone: "success",
              text: `Connected as ${res.name} (${res.email}).`,
            });
          } else {
            setStatus({
              tone: "error",
              text: `Connection failed: ${res.error}`,
            });
          }
        })
      }
    >
      {pending ? "Testing…" : "Test connection"}
    </Button>
  );
}

function RunDrainButton({
  setStatus,
}: {
  setStatus: (s: StatusMessage) => void;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="glass"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await runDrain();
          if (res.ok) {
            setStatus({
              tone: "success",
              text: `Drain complete: ${res.result.succeeded} sent, ${res.result.failed} failed.`,
            });
          } else {
            setStatus({ tone: "error", text: `Drain failed: ${res.error}` });
          }
        })
      }
    >
      <RefreshCw className="size-4" />
      {pending ? "Draining…" : "Drain outbox now"}
    </Button>
  );
}
