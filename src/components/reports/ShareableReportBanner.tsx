/** Shareable report banner — publish toggle and copy-link for public report sharing */
"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <Card className="border-border bg-card/72 backdrop-blur-xl">
      <CardContent className="p-5">
        {isPublished && shareToken ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-success" />
              <span className="text-sm font-medium text-foreground">
                Board-ready — share with stakeholders
              </span>
              <Badge variant="success" className="ml-auto">Published</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Public link + export (PDF / CSV / Excel). This is the proof artefact that renews the next buy.
            </p>

            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-lg bg-surface-glass/50 border border-border/60 px-3 py-2">
                <LinkIcon size={12} className="text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate">
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
              className="text-muted-foreground hover:text-destructive"
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
                <p className="text-sm font-medium text-foreground">
                  Share this report
                </p>
                <p className="text-xs text-muted-foreground">
                  Generate a public link for your client
                </p>
              </div>
            </div>
            <Button
              onClick={handlePublishToggle}
              disabled={isPending}
              variant="brand"
              className={cn(isPending && "opacity-70")}
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
