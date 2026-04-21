import type { Collection, Attachment as DiscordAttachment } from 'discord.js';
import { createLogger } from '@/lib/logger';

const logger = createLogger('utils:images');

const SUPPORTED_IMAGE_TYPES = new Set([
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export async function fetchDiscordImageAsBuffer(
  attachment: DiscordAttachment
): Promise<Buffer | null> {
  const url = attachment.url;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      logger.warn(
        { status: response.status, url },
        'Failed to fetch Discord attachment'
      );
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    logger.warn({ error, url }, 'Error fetching Discord attachment');
    return null;
  }
}

export async function getSourceImages(
  attachments: Collection<string, DiscordAttachment>
): Promise<Buffer[]> {
  const imageAttachments = Array.from(attachments.values()).filter(
    (a) =>
      a.contentType &&
      SUPPORTED_IMAGE_TYPES.has(a.contentType) &&
      typeof a.url === 'string'
  );

  const results = await Promise.all(
    imageAttachments.map((a) => fetchDiscordImageAsBuffer(a))
  );
  return results.filter((r): r is Buffer => r !== null);
}
