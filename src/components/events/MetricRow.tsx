/** Compact KPI row used in the event overview sidebar. */

type Tone = "default" | "muted" | "warning" | "destructive";

const TONE_CLASS: Record<Tone, string> = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  warning: "text-warning",
  destructive: "text-destructive",
};

export function MetricRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: Tone;
}) {
  return (
    <li className="flex items-center justify-between py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-base font-semibold tabular-nums ${TONE_CLASS[tone]}`}>
        {value}
      </span>
    </li>
  );
}
