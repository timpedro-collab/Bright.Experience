"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, CheckCircle2, X, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createStudioRequest } from "@/app/actions/studio";
import { celebrateFromElement } from "@/lib/celebrate";
import type { StudioServiceType } from "@/types";

export function StudioRequestForm({
  eventId,
  serviceType,
  defaultTitle,
  tierPrice,
  onClose,
}: {
  eventId: string;
  serviceType: StudioServiceType;
  defaultTitle?: string;
  tierPrice?: string;
  onClose: () => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState("");
  const [express, setExpress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const submitRef = useRef<HTMLButtonElement | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData();
    fd.set("eventId", eventId);
    fd.set("serviceType", serviceType);
    fd.set(
      "title",
      `${defaultTitle ?? "Studio Request"} × ${quantity} asset${quantity > 1 ? "s" : ""}${express ? " (Express)" : ""}`
    );
    fd.set(
      "description",
      [
        description,
        express ? "EXPRESS TURNAROUND REQUESTED" : "",
      ]
        .filter(Boolean)
        .join("\n\n")
    );
    const result = await createStudioRequest(fd);
    setLoading(false);
    if (!result.success) {
      toast.error("Couldn't submit your request", {
        description: result.error,
      });
      return;
    }
    setDone(true);
    toast.success("Studio request submitted", {
      description: "Our team will confirm and begin work within 1 working day.",
    });
    celebrateFromElement(submitRef.current);
    router.refresh();
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 size={32} className="text-success" />
        <p className="text-sm text-foreground font-medium">Order submitted</p>
        <p className="text-xs text-muted-foreground">
          Our team will confirm and begin work within 1 working day.
        </p>
        <Button onClick={onClose} variant="ghost" size="sm" className="mt-2">
          Close
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-heading text-sm font-semibold text-foreground">
          {defaultTitle}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      <div>
        <label className="block text-xs text-muted-foreground mb-1.5">
          Number of assets
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="h-9 w-9 rounded-[var(--radius-control)] border border-border text-foreground hover:bg-accent flex items-center justify-center text-lg transition-colors"
          >
            −
          </button>
          <span className="text-heading text-lg font-bold text-foreground tabular-nums w-8 text-center">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            className="h-9 w-9 rounded-[var(--radius-control)] border border-border text-foreground hover:bg-accent flex items-center justify-center text-lg transition-colors"
          >
            +
          </button>
          {tierPrice && (
            <span className="text-xs text-muted-foreground ml-auto">
              {quantity} × {tierPrice} ={" "}
              <span className="text-foreground font-semibold">
                {tierPrice.replace(/[\d,.]+/, (m) => {
                  const base = parseFloat(m.replace(",", ""));
                  const total = base * quantity * (express ? 1.5 : 1);
                  return total.toLocaleString("en-US", { minimumFractionDigits: 0 });
                })}
              </span>
              {express && <span className="text-warning ml-1">(inc. express)</span>}
            </span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs text-muted-foreground mb-1.5">
          What do you need?
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          required
          placeholder="Describe the assets you need — file names, what each one should look like, any references..."
          className="w-full px-3 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      <button
        type="button"
        onClick={() => setExpress(!express)}
        className={`flex items-center gap-3 w-full p-3 rounded-[var(--radius-control)] border transition-all text-left ${
          express
            ? "border-warning/30 bg-warning/5"
            : "border-border/60 hover:bg-accent"
        }`}
      >
        <Zap
          size={16}
          className={express ? "text-warning" : "text-muted-foreground"}
        />
        <div className="flex-1 min-w-0">
          <p
            className={`text-xs font-medium ${express ? "text-warning" : "text-foreground"}`}
          >
            Express turnaround
          </p>
          <p className="text-xs text-muted-foreground">
            Under 7 working days (+50% surcharge)
          </p>
        </div>
        <div
          className={`h-5 w-9 rounded-full transition-colors relative ${
            express ? "bg-warning" : "bg-muted"
          }`}
        >
          <div
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              express ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </div>
      </button>

      <Button
        ref={submitRef}
        type="submit"
        disabled={loading || !description.trim()}
        variant="brand"
        className="w-full"
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Send size={14} />
        )}
        {loading ? "Submitting…" : "Place order"}
      </Button>
    </form>
  );
}
