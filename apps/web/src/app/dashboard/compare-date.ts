import { type CheckIn, formatDate, formatDateTime } from "@seenmark/api/check-in-dates";

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/**
 * A compared check-in's date, short enough for a phone-width picker. The time is added only when
 * the other compared check-in shares the date, since the two would otherwise read the same.
 */
export function compareDate(item: CheckIn, other: CheckIn) {
  if (formatDate(item.takenAt) === formatDate(other.takenAt)) return formatDateTime(item.takenAt);
  return shortDate.format(new Date(item.takenAt));
}
