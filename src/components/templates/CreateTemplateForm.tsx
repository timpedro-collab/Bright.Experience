/** Client form for creating a new event template. */
"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTemplate } from "@/app/actions/templates";

export function CreateTemplateForm() {
  const [state, formAction, pending] = useActionState(createTemplate, null);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Template name
        </label>
        <Input id="name" name="name" placeholder="e.g. Standard Activation" required />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium text-foreground">
          Description
        </label>
        <Input
          id="description"
          name="description"
          placeholder="One-line summary of what this template provides"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="eventType" className="text-sm font-medium text-foreground">
            Event type
          </label>
          <select
            id="eventType"
            name="eventType"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors"
            defaultValue="activation"
          >
            <option value="activation">Activation</option>
            <option value="sampling">Sampling</option>
            <option value="vending">Vending</option>
            <option value="hybrid">Hybrid</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="packageType" className="text-sm font-medium text-foreground">
            Package type
          </label>
          <select
            id="packageType"
            name="packageType"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors"
            defaultValue="standard"
          >
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      {state && !state.success && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create template"}
      </Button>
    </form>
  );
}
