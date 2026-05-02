import type { Geo } from '@vercel/functions';

export interface RequestHints {
  activity: string;
  channel: string;
  city: Geo['city'];
  country: Geo['country'];
  joined: number;
  server: string;
  status: string;
  time: string;
}
