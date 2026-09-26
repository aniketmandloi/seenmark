export type CheckIn = {
  id: string;
  takenAt: string;
};

const DAY = 24 * 60 * 60 * 1000;

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const monthFormat = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

const relativeFormat = new Intl.RelativeTimeFormat("en-US", { numeric: "always" });

export function formatDate(value: string) {
  return dateFormat.format(new Date(value));
}

/** Tells apart check-ins taken on the same day. */
export function formatDateTime(value: string) {
  return dateTimeFormat.format(new Date(value));
}

/** A rough hint beside the absolute date: "today", "5 days ago", "3 weeks ago", and so on. */
export function relativeTime(value: string, now: number) {
  const days = Math.floor((now - new Date(value).getTime()) / DAY);
  if (days < 1) return "today";
  if (days < 7) return relativeFormat.format(-days, "day");
  if (days < 30) return relativeFormat.format(-Math.floor(days / 7), "week");
  if (days < 365) return relativeFormat.format(-Math.floor(days / 30), "month");
  return relativeFormat.format(-Math.floor(days / 365), "year");
}

/** Consecutive check-ins from the same local month, in the order given. */
export function groupByMonth<T extends CheckIn>(items: readonly T[]) {
  const groups: { key: string; label: string; items: T[] }[] = [];
  for (const item of items) {
    const date = new Date(item.takenAt);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const last = groups.at(-1);
    if (last?.key === key) {
      last.items.push(item);
    } else {
      groups.push({ key, label: monthFormat.format(date), items: [item] });
    }
  }
  return groups;
}
