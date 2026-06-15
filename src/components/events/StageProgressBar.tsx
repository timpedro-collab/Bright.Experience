import type { Stage } from "@/types";
import { STAGE_CONFIG } from "@/types";

const STAGES_ORDERED: Stage[] = [
  "confirmed",
  "kickoff_complete",
  "creative_assets",
  "approvals",
  "build_configuration",
  "qa_readiness",
  "logistics_confirmed",
  "event_live",
  "reporting",
  "complete",
];

export function StageProgressBar({ currentStage }: { currentStage: Stage }) {
  const currentIndex = STAGES_ORDERED.indexOf(currentStage);

  return (
    <div className="w-full">
      <div className="flex items-center gap-1">
        {STAGES_ORDERED.map((stage, i) => {
          const isPast = i < currentIndex;
          const isCurrent = i === currentIndex;

          return (
            <div key={stage} className="flex-1 flex flex-col items-center gap-2">
              {/* Bar segment */}
              <div className="w-full h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isPast
                      ? "bg-success/60"
                      : isCurrent
                        ? "bg-brand"
                        : "bg-white/[0.06]"
                  }`}
                  style={{
                    width: isPast || isCurrent ? "100%" : "100%",
                    transitionTimingFunction: "var(--bb-ease-emphasized)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Labels for key stages */}
      <div className="flex justify-between mt-2">
        {STAGES_ORDERED.filter((_, i) => i % 3 === 0 || i === STAGES_ORDERED.length - 1).map(
          (stage) => {
            const config = STAGE_CONFIG[stage];
            const isCurrent = stage === currentStage;
            return (
              <span
                key={stage}
                className={`text-[0.6rem] font-medium ${
                  isCurrent ? "text-brand" : "text-muted-foreground"
                }`}
                style={{ fontFamily: "var(--bb-font-overline)" }}
              >
                {config.shortLabel}
              </span>
            );
          }
        )}
      </div>
    </div>
  );
}
