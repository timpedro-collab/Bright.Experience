/**
 * Renders the canonical capability slugs a customer asked for as outcome-line
 * chips, so the AE on /admin/quotes/[id] sees the moment the customer chose,
 * not the slugs underneath.
 *
 * Read-only in PR 1. Editable in a later pass.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCapabilities, sanitiseCapabilitySlugs } from "@/lib/capabilities";

interface RequestedCapabilitiesProps {
  /** Raw addons value off the quote — usually a string[] but tolerant of unknowns from jsonb. */
  addons: unknown;
}

export function RequestedCapabilities({ addons }: RequestedCapabilitiesProps) {
  const slugs = sanitiseCapabilitySlugs(addons);
  const capabilities = getCapabilities(slugs);

  return (
    <Card tone="subtle">
      <CardHeader>
        <CardTitle className="text-base">Capabilities the customer asked for</CardTitle>
      </CardHeader>
      <CardContent>
        {capabilities.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            None requested. The customer accepted the always-on activation as-is.
          </p>
        ) : (
          <div className="space-y-3">
            <ul className="flex flex-wrap gap-2">
              {capabilities.map((cap) => (
                <li key={cap.slug}>
                  <Badge variant="info" className="font-normal">
                    {cap.outcome}
                  </Badge>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              Build line items that reflect these outcomes. The customer reads
              the outcome lines on the proposal — not the slugs.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
