import type { PineconeMetadataOutput } from '@/types';

export interface MemoryRecord {
  id: string;
  metadata: PineconeMetadataOutput;
  score?: number;
}
