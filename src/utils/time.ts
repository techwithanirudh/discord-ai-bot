import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";

export const country = "Greece";
export const city = "Athens";
export const timezone = "Europe/Athens";

export function getTimeInCity(
  timezone: string,
  formatStr = "yyyy-MM-dd HH:mm:ssXXX"
): string {
  const now = new Date();
  const zonedDate = new TZDate(now, timezone);
  return format(zonedDate, formatStr);
}
