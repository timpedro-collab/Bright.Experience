/**
 * Visual presentation of the three NRS go-to-market models as one programme.
 *
 * Deliberately keeps the model numbering from Informa's own briefing deck
 * (Model 1 / 2 / 3) so the buyer recognises what they proposed, while the
 * roles (engine / flagship / pilot) carry Bright.Blue's "one structure,
 * three tiers" negotiating frame. Includes a schematic campus map of the
 * placements and a money-flow diagram of the revenue share. Buyer-facing:
 * deck-visible numbers only.
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MODELS = [
  {
    number: "Model 3",
    role: "The engine",
    name: "Prospectus inventory",
    retail: "$45,000–$70,000",
    retailNote: "per unit, full show. Top of band is for premium positions",
    accent: false,
    description:
      "Single machines sold by your sponsorship team as prospectus line items, sitting one notch above the $37k aisle signage. Except these capture leads, run games and report live. No new sales motion. It's a new line in a book your buyers already read.",
    marker: "single" as const,
  },
  {
    number: "Model 2",
    role: "The flagship",
    name: "Cross-Hall Takeover",
    retail: "$110,000–$175,000",
    retailNote: "3 units: booth + 2 halls",
    accent: true,
    description:
      "One brand owns three machines across the campus: their booth plus two hall placements. Every screen runs their creative and every lead feeds one live dashboard. Capped at one per hall pairing so it stays a statement buy.",
    marker: "takeover" as const,
  },
  {
    number: "Model 1",
    role: "The pilot",
    name: "Corridor activations",
    retail: "$25,000–$40,000",
    retailNote: "per unit, if retailed",
    accent: false,
    description:
      "Machines in the dead-traffic corridors between the three NRS buildings, footfall nobody monetises today. Placed inside the licensed show footprint (MPEA public space carries a 15% ad-revenue commission and a signage-exclusivity risk). Run as a stated pilot that proves the campus-wide story.",
    marker: "corridor" as const,
  },
];

/** Legend + map marker styles, shared so the legend always matches the map. */
function Marker({ kind }: { kind: "single" | "takeover" | "corridor" }) {
  if (kind === "takeover")
    return <span className="inline-block h-3 w-3 rounded-full bg-primary ring-2 ring-primary/30" />;
  if (kind === "corridor")
    return <span className="inline-block h-3 w-3 rounded-full border-2 border-primary bg-background" />;
  return <span className="inline-block h-3 w-3 rounded-full bg-foreground/50" />;
}

/**
 * Schematic of the McCormick campus: three halls, the connecting corridors,
 * and every placement type feeding one live dashboard. Geometry is
 * deliberately abstract — it communicates the system, not the floorplan.
 */
function CampusSchematic() {
  return (
    <svg
      viewBox="0 0 920 470"
      role="img"
      aria-label="Schematic of machine placements across the NRS campus: single units and a cross-hall takeover inside the halls, corridor activations between them, all feeding one live dashboard"
      className="w-full"
    >
      {/* Halls */}
      {[
        { x: 30, label: "South Hall" },
        { x: 340, label: "North Hall" },
        { x: 650, label: "Lakeside Center" },
      ].map((hall) => (
        <g key={hall.label}>
          <rect
            x={hall.x}
            y={130}
            width={240}
            height={170}
            rx={16}
            className="fill-muted stroke-muted-foreground/50"
            strokeWidth={1.5}
          />
          <text
            x={hall.x + 120}
            y={162}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={13}
            fontWeight={600}
          >
            {hall.label}
          </text>
        </g>
      ))}

      {/* Corridors between the halls */}
      {[270, 580].map((x) => (
        <g key={x}>
          <rect
            x={x}
            y={196}
            width={70}
            height={38}
            className="fill-muted/60 stroke-muted-foreground/50"
            strokeWidth={1.5}
          />
          <text
            x={x + 35}
            y={252}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={10}
          >
            corridor
          </text>
        </g>
      ))}

      {/* Dashboard node */}
      <rect
        x={360}
        y={396}
        width={200}
        height={48}
        rx={12}
        className="fill-primary"
      />
      <text
        x={460}
        y={425}
        textAnchor="middle"
        className="fill-primary-foreground"
        fontSize={13}
        fontWeight={600}
      >
        One live dashboard
      </text>

      {/* Feed lines from placements to the dashboard (drawn first, under pins) */}
      {[
        [95, 262],
        [205, 240],
        [150, 210],
        [305, 215],
        [615, 215],
        [415, 240],
        [520, 262],
        [470, 210],
        [725, 240],
        [770, 210],
        [845, 262],
      ].map(([x, y]) => (
        <line
          key={`${x}-${y}`}
          x1={x}
          y1={y + 8}
          x2={460}
          y2={398}
          className="stroke-primary"
          strokeOpacity={0.4}
          strokeWidth={1.4}
          strokeDasharray="3 4"
        />
      ))}

      {/* Cross-hall takeover trio — connected, one brand */}
      <polyline
        points="150,210 470,210 770,210"
        fill="none"
        className="stroke-primary"
        strokeOpacity={0.85}
        strokeWidth={2.5}
        strokeDasharray="6 5"
      />
      {[
        [150, 210],
        [470, 210],
        [770, 210],
      ].map(([x, y]) => (
        <g key={`t-${x}`}>
          <circle cx={x} cy={y} r={13} className="fill-primary" fillOpacity={0.18} />
          <circle cx={x} cy={y} r={8} className="fill-primary" />
        </g>
      ))}
      <text x={150} y={188} textAnchor="middle" className="fill-primary" fontSize={10} fontWeight={700}>
        BOOTH
      </text>

      {/* Single placements */}
      {[
        [95, 262],
        [205, 240],
        [415, 240],
        [520, 262],
        [725, 240],
        [845, 262],
      ].map(([x, y]) => (
        <circle key={`s-${x}-${y}`} cx={x} cy={y} r={7} className="fill-foreground" fillOpacity={0.5} />
      ))}

      {/* Corridor pilots */}
      {[
        [305, 215],
        [615, 215],
      ].map(([x, y]) => (
        <circle
          key={`c-${x}`}
          cx={x}
          cy={y}
          r={7}
          className="fill-background stroke-primary"
          strokeWidth={2.5}
        />
      ))}
    </svg>
  );
}

/** How a dollar moves: brand pays Informa retail, the split does the rest. */
function MoneyFlow() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="rounded-xl border bg-muted/40 px-5 py-4 text-center sm:flex-1">
          <p className="text-sm font-semibold">Sponsor brand</p>
          <p className="text-xs text-muted-foreground">buys a placement</p>
        </div>
        <div className="text-center text-sm font-medium text-muted-foreground sm:w-40">
          pays retail
          <span className="block text-xs">($45k–$175k, you set it)</span>
        </div>
        <div className="rounded-xl border bg-muted/40 px-5 py-4 text-center sm:flex-1">
          <p className="text-sm font-semibold">Informa prospectus</p>
          <p className="text-xs text-muted-foreground">your team makes the sale</p>
        </div>
      </div>
      <div>
        <div className="flex h-14 w-full overflow-hidden rounded-xl border">
          <div className="flex w-[70%] items-center justify-center bg-primary px-3 text-center">
            <p className="text-sm font-semibold text-primary-foreground">
              70% Bright.Blue
              <span className="block text-[0.68rem] font-normal opacity-85">
                machines · creative · crew · platform · reporting
              </span>
            </p>
          </div>
          <div className="flex w-[30%] items-center justify-center bg-muted px-3 text-center">
            <p className="text-sm font-semibold">
              30% Informa
              <span className="block text-[0.68rem] font-normal text-muted-foreground">
                the sale, nothing else to carry
              </span>
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          A per-unit floor protects the economics on both sides. Above it,
          package and discount however you like. Below it, a placement simply
          doesn&rsquo;t ship.
        </p>
      </div>
    </div>
  );
}

export function NrsModelsShowcase() {
  return (
    <div className="space-y-8">
      {/* The three models, in the deck's own numbering */}
      <div className="grid gap-4 lg:grid-cols-3">
        {MODELS.map((model) => (
          <Card
            key={model.number}
            className={cn(model.accent && "border-primary/40 shadow-sm")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-2">
                <Badge variant={model.accent ? "default" : "secondary"}>
                  {model.number}
                </Badge>
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {model.role}
                </span>
              </div>
              <h3 className="mt-3 flex items-center gap-2 text-base font-bold">
                <Marker kind={model.marker} />
                {model.name}
              </h3>
              <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
                Recommended retail
              </p>
              <p className="text-2xl font-bold tabular-nums">{model.retail}</p>
              {/* min-h-8 reserves two text-xs lines so a wrapping note doesn't
                  push this card's description out of line with its siblings. */}
              <p className="min-h-8 text-xs text-muted-foreground">{model.retailNote}</p>
              <p className="mt-3 text-sm text-muted-foreground">{model.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* The unified picture */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-heading text-lg font-bold">
              One programme across the whole campus
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Marker kind="takeover" /> Cross-Hall Takeover
              </span>
              <span className="flex items-center gap-1.5">
                <Marker kind="single" /> Single placements
              </span>
              <span className="flex items-center gap-1.5">
                <Marker kind="corridor" /> Corridor pilots
              </span>
            </div>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Every machine, whether booth, hall or corridor, feeds the same
            live dashboard: leads, plays and engagement in real time, for the
            sponsor and for your team. This is a schematic, not a floorplan.
          </p>
          <div className="mt-4">
            <CampusSchematic />
          </div>
        </CardContent>
      </Card>

      {/* The commercial rails */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-heading text-lg font-bold">How the money flows</h3>
          <p className="mb-5 mt-2 max-w-3xl text-sm text-muted-foreground">
            One commercial structure carries all three models. One split to
            agree, not three.
          </p>
          <MoneyFlow />
        </CardContent>
      </Card>
    </div>
  );
}
