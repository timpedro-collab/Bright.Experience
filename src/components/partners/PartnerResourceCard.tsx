/** Sales collateral resource card with download action */
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Download,
  FileText,
  Image,
  Film,
  Presentation,
  ExternalLink,
} from "lucide-react";

interface PartnerResourceCardProps {
  title: string;
  description: string;
  fileUrl?: string;
  category: string;
  /** Open in a new tab to view (instead of forcing a file download). */
  viewInBrowser?: boolean;
}

const CATEGORY_STYLES: Record<string, string> = {
  "pitch-deck": "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "product-sheet": "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "case-study": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  branding: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  video: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "pitch-deck": Presentation,
  "product-sheet": FileText,
  "case-study": FileText,
  branding: Image,
  video: Film,
};

export function PartnerResourceCard({
  title,
  description,
  fileUrl,
  category,
  viewInBrowser = false,
}: PartnerResourceCardProps) {
  const Icon = CATEGORY_ICONS[category] ?? FileText;
  const badgeClass = CATEGORY_STYLES[category] ?? "bg-muted/40 text-muted-foreground border-border/60";

  return (
    <Card className="border-border/60 bg-muted/40 backdrop-blur-sm transition-colors hover:bg-accent">
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/40">
            <Icon size={20} className="text-muted-foreground" />
          </div>
          <Badge className={cn("border text-xs capitalize", badgeClass)}>
            {category.replace(/-/g, " ")}
          </Badge>
        </div>
        <div>
          <h3 className="text-heading text-sm font-semibold text-foreground">
            {title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>
        {fileUrl ? (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full border-border/60 bg-muted/40 text-foreground hover:bg-accent"
          >
            {viewInBrowser ? (
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} className="mr-2" />
                View report
              </a>
            ) : (
              <a href={fileUrl} download>
                <Download size={14} className="mr-2" />
                Download
              </a>
            )}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="w-full border-border/60 bg-muted/40"
          >
            Coming soon — ask your partner manager
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
