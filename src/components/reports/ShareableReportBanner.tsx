/** Shareable report banner — publish toggle and copy-link for public report sharing */
"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Copy,
  Check,
  Loader2,
  LinkIcon,
  EyeOff,
} from "lucide-react";
import {
  publishReport,
  unpublishReport,
} from "@/app/actions/reports";

interface ShareableReportBannerProps {
  reportId: string;
  shareToken?: string;
  isPublished: boolean;
}

/** Renders a publish/unpublish toggle with shareable link copy for published reports */
export function ShareableReportBanner({
  reportId,
  shareToken,
  isPublished: initialPublished,
}: ShareableReportBannerProps) {
  const [isPublished, setIsPublished] = useState(initialPublished);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const shareUrl =
    typeof window !== "undefined" && shareToken
      ? `${window.location.origin}/report/${shareToken}`
      : "";

  function handlePublishToggle() {
    startTransition(async () => {
      if (isPublished) {
        const result = await unpublishReport(reportId);
        if (result.success) setIsPublished(false);
      } else {
        const result = await publishReport(reportId);
        if (result.success) setIsPublished(true);
      }
    });
  }

  async function handleCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="border-white/[0.08] bg-card-dark/72 backdrop-blur-xl">
      <CardContent className="p-5">
        {isPublished && shareToken ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-success" />
              <span className="text-sm font-medium text-text-primary">
                Report is live
              </span>
              <span className="badge badge-green ml-auto">Published</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-lg bg-surface-glass/50 border border-white/[0.06] px-3 py-2">
                <LinkIcon size={12} className="text-text-muted shrink-0" />
                <span className="text-xs text-text-secondary truncate">
                  {shareUrl}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check size={14} className="text-success" />
                ) : (
                  <Copy size={14} />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handlePublishToggle}
              disabled={isPending}
              className="text-text-muted hover:text-destructive"
            >
              {isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <EyeOff size={14} />
              )}
              Unpublish
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 border border-brand/15">
                <Globe size={18} className="text-brand" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Share this report
                </p>
                <p className="text-xs text-text-muted">
                  Generate a public link for your client
                </p>
              </div>
            </div>
            <Button
              onClick={handlePublishToggle}
              disabled={isPending}
              className={cn(
                "btn-primary",
                isPending && "opacity-70"
              )}
            >
              {isPending && (
                <Loader2 size={14} className="animate-spin" />
              )}
              Publish Report
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
