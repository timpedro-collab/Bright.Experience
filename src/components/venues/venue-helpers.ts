/** Shared utility functions for venue pages. */

interface PlacementLike {
  start_date: string;
  end_date: string | null;
  [key: string]: unknown;
}

interface WeekBucket<T> {
  weekStart: Date;
  placements: T[];
}

/** Build a 12-week runway grouping placements by the week they overlap. */
export function buildWeeklyRunway<T extends PlacementLike>(
  placements: T[],
  weekCount = 12
): WeekBucket<T>[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weeks: WeekBucket<T>[] = [];
  for (let w = 0; w < weekCount; w++) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + w * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const hits = placements.filter((p) => {
      const start = new Date(p.start_date);
      const end = p.end_date
        ? new Date(p.end_date)
        : new Date(start.getTime() + 7 * 86400000);
      return start < weekEnd && end >= weekStart;
    });
    weeks.push({ weekStart, placements: hits });
  }
  return weeks;
}
