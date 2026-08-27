/**
 * Internal 2027–2029 channel forecast for the confidential Bright.Blue
 * commercial-plan deck. Values are working planning assumptions in whole USD,
 * not booked revenue or an accounting forecast.
 */

export type ForecastScenario = "conservative" | "base" | "upside";
export type SalesChannelKey = "direct" | "organizer" | "agency" | "venue";

export interface SalesChannelAssumption {
  key: SalesChannelKey;
  label: string;
  route: string;
  averageSaleUsd: number;
  channelShare: number;
  brightBlueShare: number;
  basis: string;
}

/**
 * Working channel economics. Organizer uses the current modeled 70/30
 * model; agency and venue use the midpoint of the documented planning ranges.
 * These remain owner-sign-off assumptions and are labelled as such in-deck.
 */
export const SALES_CHANNELS: readonly SalesChannelAssumption[] = [
  {
    key: "direct",
    label: "Brand direct",
    route: "Bright.Blue sales and inbound",
    averageSaleUsd: 40_000,
    channelShare: 0,
    brightBlueShare: 1,
    basis: "Lead Engine midpoint; no channel deduction",
  },
  {
    key: "organizer",
    label: "Organizer",
    route: "Rate-card resale and show portfolios",
    averageSaleUsd: 50_000,
    channelShare: 0.3,
    brightBlueShare: 0.7,
    basis: "Current Informa/NRS working split",
  },
  {
    key: "agency",
    label: "Agency",
    route: "Planner and experiential agency referrals",
    averageSaleUsd: 40_000,
    channelShare: 0.125,
    brightBlueShare: 0.875,
    basis: "12.5% midpoint of 10–15% agency terms",
  },
  {
    key: "venue",
    label: "Venue",
    route: "Convention-center sponsorship inventory",
    averageSaleUsd: 40_000,
    channelShare: 0.25,
    brightBlueShare: 0.75,
    basis: "25% working point inside the 15–40% venue range",
  },
] as const;

export interface AnnualChannelVolumes {
  year: 2027 | 2028 | 2029;
  volumes: Record<SalesChannelKey, number>;
}

/**
 * Placement-sales assumptions by scenario. The base case starts with 62
 * placements in 2027 and scales through repeat organizer portfolios rather
 * than assuming every sale comes from Bright.Blue's own team.
 */
export const FORECAST_VOLUMES: Record<
  ForecastScenario,
  readonly AnnualChannelVolumes[]
> = {
  conservative: [
    { year: 2027, volumes: { direct: 12, organizer: 12, agency: 6, venue: 4 } },
    { year: 2028, volumes: { direct: 24, organizer: 36, agency: 18, venue: 12 } },
    { year: 2029, volumes: { direct: 40, organizer: 72, agency: 36, venue: 24 } },
  ],
  base: [
    { year: 2027, volumes: { direct: 18, organizer: 24, agency: 12, venue: 8 } },
    { year: 2028, volumes: { direct: 36, organizer: 60, agency: 30, venue: 20 } },
    { year: 2029, volumes: { direct: 60, organizer: 120, agency: 60, venue: 40 } },
  ],
  upside: [
    { year: 2027, volumes: { direct: 24, organizer: 36, agency: 18, venue: 12 } },
    { year: 2028, volumes: { direct: 48, organizer: 96, agency: 48, venue: 32 } },
    { year: 2029, volumes: { direct: 84, organizer: 192, agency: 96, venue: 64 } },
  ],
};

export interface AnnualForecast {
  year: AnnualChannelVolumes["year"];
  placements: number;
  customerBillingsUsd: number;
  channelEarningsUsd: number;
  brightBlueRevenueUsd: number;
  byChannel: Record<
    SalesChannelKey,
    {
      placements: number;
      customerBillingsUsd: number;
      channelEarningsUsd: number;
      brightBlueRevenueUsd: number;
    }
  >;
}

/** Calculate annual billings, channel earnings, and Bright.Blue revenue. */
export function forecastFor(scenario: ForecastScenario): AnnualForecast[] {
  return FORECAST_VOLUMES[scenario].map(({ year, volumes }) => {
    const byChannel = Object.fromEntries(
      SALES_CHANNELS.map((channel) => {
        const placements = volumes[channel.key];
        const customerBillingsUsd = placements * channel.averageSaleUsd;
        return [
          channel.key,
          {
            placements,
            customerBillingsUsd,
            channelEarningsUsd: Math.round(
              customerBillingsUsd * channel.channelShare
            ),
            brightBlueRevenueUsd: Math.round(
              customerBillingsUsd * channel.brightBlueShare
            ),
          },
        ];
      })
    ) as AnnualForecast["byChannel"];

    const lines = Object.values(byChannel);
    return {
      year,
      placements: lines.reduce((sum, line) => sum + line.placements, 0),
      customerBillingsUsd: lines.reduce(
        (sum, line) => sum + line.customerBillingsUsd,
        0
      ),
      channelEarningsUsd: lines.reduce(
        (sum, line) => sum + line.channelEarningsUsd,
        0
      ),
      brightBlueRevenueUsd: lines.reduce(
        (sum, line) => sum + line.brightBlueRevenueUsd,
        0
      ),
      byChannel,
    };
  });
}

export interface SplitExample {
  channelGetsUsd: number;
  brightBlueGetsUsd: number;
}

/** Split a standardized sale for the channel-comparison slide. */
export function splitExample(
  channel: SalesChannelAssumption,
  grossSaleUsd = 50_000
): SplitExample {
  return {
    channelGetsUsd: Math.round(grossSaleUsd * channel.channelShare),
    brightBlueGetsUsd: Math.round(grossSaleUsd * channel.brightBlueShare),
  };
}

/** "$2.2m" / "$420k" — compact USD for forecast headlines. */
export function formatCompactUsd(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    const millions = value / 1_000_000;
    return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}m`;
  }
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${Math.round(value)}`;
}

/** "$6,250" — exact whole-dollar formatting for channel split comparisons. */
export function formatExactUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
