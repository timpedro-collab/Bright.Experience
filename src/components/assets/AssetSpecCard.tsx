/** Visual spec card for an asset slot — shows dimensions, format, safe zones, animation notes, etc. */
import {
  Ruler,
  FileType,
  Timer,
  Target,
  Sparkles,
  Link2,
  Download,
  Package,
} from "lucide-react";
import type { Asset } from "@/types";

interface AssetSpecCardProps {
  asset: Asset;
}

function SpecRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function AssetSpecCard({ asset }: AssetSpecCardProps) {
  const hasSpecs =
    asset.requiredFormat ||
    asset.requiredDimensions ||
    asset.requiredResolutionMin ||
    asset.requiredDurationRange ||
    asset.requiredFileTypes?.length ||
    asset.animationRequirements ||
    asset.safeZoneDescription ||
    asset.isPhysical;

  if (!hasSpecs) return null;

  return (
    <div className="mt-3 p-3 rounded-lg bg-muted/40 border border-border/60 space-y-2.5">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
        Specifications
      </p>

      {asset.isPhysical && (
        <div className="flex items-center gap-1.5 text-xs text-amber-400">
          <Package size={12} />
          Physical branding (wrap, print, or signage)
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {asset.requiredFormat && (
          <SpecRow icon={<FileType size={12} />} label="Format" value={asset.requiredFormat} />
        )}
        {asset.requiredDimensions && (
          <SpecRow icon={<Ruler size={12} />} label="Dimensions" value={asset.requiredDimensions} />
        )}
        {asset.requiredResolutionMin && (
          <SpecRow icon={<Ruler size={12} />} label="Min resolution" value={asset.requiredResolutionMin} />
        )}
        {asset.requiredDurationRange && (
          <SpecRow icon={<Timer size={12} />} label="Duration" value={`${asset.requiredDurationRange}s`} />
        )}
        {asset.requiredFileTypes && asset.requiredFileTypes.length > 0 && (
          <SpecRow
            icon={<FileType size={12} />}
            label="Accepted types"
            value={asset.requiredFileTypes.join(", ")}
          />
        )}
      </div>

      {asset.safeZoneDescription && (
        <SpecRow icon={<Target size={12} />} label="Safe zone" value={asset.safeZoneDescription} />
      )}
      {asset.animationRequirements && (
        <SpecRow icon={<Sparkles size={12} />} label="Animation" value={asset.animationRequirements} />
      )}

      <div className="flex items-center gap-3 mt-1">
        {asset.referenceUrl && (
          <a
            href={asset.referenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[var(--color-bb-cobalt)] hover:underline"
          >
            <Link2 size={10} /> View reference
          </a>
        )}
        {asset.specDocumentUrl && (
          <a
            href={asset.specDocumentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[var(--color-bb-cobalt)] hover:underline"
          >
            <Download size={10} /> Download template
          </a>
        )}
      </div>
    </div>
  );
}
