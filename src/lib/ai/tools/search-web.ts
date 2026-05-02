import { webSearch } from '@exalabs/ai-sdk';

export const searchWeb = webSearch({
  numResults: 10,
  type: 'auto',
});
