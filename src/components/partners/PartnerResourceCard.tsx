/** Sales collateral resource card with download action */
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download, FileText, Image, Film, Presentation } from "lucide-react";

interface PartnerResourceCardProps {
  title: string;
  description: string;
  fileUrl?: string;
  category: string;
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
}: PartnerResourceCardProps) {
  const Icon = CATEGORY_ICONS[category] ?? FileText;
  const badgeClass = CATEGORY_STYLES[category] ?? "bg-white/[0.06] text-text-muted border-white/[0.06]";

  return (
    <Card className="border-white/[0.06] bg-white/[0.02] backdrop-blur-sm transition-colors hover:bg-white/[0.04]">
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04]">
            <Icon size={20} className="text-text-secondary" />
          </div>
          <Badge className={cn("border text-xs capitalize", badgeClass)}>
            {category.replace(/-/g, " ")}
          </Badge>
        </div>
        <div>
          <h3 className="text-heading text-sm font-semibold text-text-primary">
            {title}
          </h3>
          <p className="mt-1 text-xs text-text-muted line-clamp-2">
            {description}
          </p>
        </div>
        {fileUrl ? (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full border-white/[0.06] bg-white/[0.02] text-text-primary hover:bg-white/[0.06]"
          >
            <a href={fileUrl} download>
              <Download size={14} className="mr-2" />
              Download
            </a>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="w-full border-white/[0.06] bg-white/[0.02]"
          >
            Coming Soon
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
