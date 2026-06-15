const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseDate(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split("T")[0].split("-");
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10) - 1,
    day: parseInt(parts[2], 10),
  };
}

export function formatDateShort(dateStr: string): string {
  const { day, month } = parseDate(dateStr);
  return `${day} ${MONTHS_SHORT[month]}`;
}

export function formatDateMedium(dateStr: string): string {
  const { year, month, day } = parseDate(dateStr);
  return `${day} ${MONTHS_SHORT[month]} ${year}`;
}

export function formatDateLong(dateStr: string): string {
  const { year, month, day } = parseDate(dateStr);
  const d = new Date(year, month, day);
  return `${DAYS[d.getDay()]}, ${day} ${MONTHS_LONG[month]} ${year}`;
}

export function daysUntilDate(dateStr: string): number {
  const { year, month, day } = parseDate(dateStr);
  const target = new Date(year, month, day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function isOverdue(dateStr?: string): boolean {
  if (!dateStr) return false;
  return daysUntilDate(dateStr) < 0;
}

export function timeSince(dateStr: string): string {
  const { year, month, day } = parseDate(dateStr);
  const target = new Date(year, month, day);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - target.getTime()) / 1000);
  const days = Math.floor(seconds / 86400);
  if (days > 0) return `${days}d ago`;
  const hours = Math.floor(seconds / 3600);
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

/** Human-friendly proximity label for a due date, e.g. "due in 5 days". */
export function formatDueProximity(dueDate: string): string {
  const diffDays = daysUntilDate(dueDate);
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "due today";
  if (diffDays === 1) return "due tomorrow";
  return `due in ${diffDays} days`;
}
