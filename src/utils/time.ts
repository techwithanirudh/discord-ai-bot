import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';

export function getTimeInCity(
  timezone: string,
  formatStr = 'yyyy-MM-dd HH:mm:ssXXX'
): string {
  const now = new Date();
  const zonedDate = new TZDate(now, timezone);
  return format(zonedDate, formatStr);
}
