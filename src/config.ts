import type { Activity } from './types';

export const keywords = ['gork', 'grok'];
export const country = 'United States';
export const city = 'New York';
export const timezone = 'America/New_York';

export const speed = {
  minDelay: 0,
  maxDelay: 0,
  speedMethod: 'divide',
  speedFactor: 180 * 180,
};

export const statuses = ['online', 'idle', 'dnd', 'offline'];

export const activities: Activity[] = [
  {
    type: 5,
    name: 'painting',
    image:
      'https://pbs.twimg.com/media/GrGH5PIaAAI7aLu?format=png&name=360x360',
  },
  {
    type: 2,
    name: 'music',
    image: 'https://pbs.twimg.com/media/GtTOrD7bMAEfahJ?format=png&name=medium',
  },
  {
    type: 3,
    name: 'tv',
    image: 'https://pbs.twimg.com/media/GuaO0GVbEAA3xHa?format=png&name=small',
  },
  {
    type: 0,
    name: 'in the gym',
    image:
      'https://pbs.twimg.com/media/GuvLw79XQAACrp3?format=png&name=900x900',
  },
];

export const messageThreshold = 10;

export const voice = {
  model: 'aura-arcas-en',
};
