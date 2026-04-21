import { generateImage, tool } from 'ai';
import { AttachmentBuilder, type Message } from 'discord.js';
import { z } from 'zod';
import { provider } from '@/lib/ai/providers';
import { createLogger } from '@/lib/logger';
import { getSourceImages } from '@/utils/images';

const logger = createLogger('tools:generate-image');

const MIME_TYPE_TO_EXTENSION: Record<string, string> = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const SIZE_PATTERN = /^\d+x\d+$/;
const ASPECT_RATIO_PATTERN = /^\d+:\d+$/;

function getFileExtension(mediaType: string): string {
  return MIME_TYPE_TO_EXTENSION[mediaType] ?? 'png';
}

export const generateImageTool = ({ message }: { message: Message }) =>
  tool({
    description:
      'Generate one or more AI images and upload them to Discord. If the current message includes image attachments, use them as source images for editing or transformation.',
    inputSchema: z
      .object({
        prompt: z
          .string()
          .min(1)
          .max(1500)
          .describe('Image prompt with the visual details to generate'),
        status: z
          .string()
          .min(1)
          .max(160)
          .describe(
            'Short temporary message to post while the image is generating'
          ),
        n: z
          .number()
          .int()
          .min(1)
          .max(4)
          .default(1)
          .describe('Number of images to generate'),
        size: z
          .string()
          .regex(SIZE_PATTERN)
          .optional()
          .describe('Optional image size in {width}x{height} format'),
        aspectRatio: z
          .string()
          .regex(ASPECT_RATIO_PATTERN)
          .optional()
          .describe('Optional aspect ratio in {width}:{height} format'),
        seed: z
          .number()
          .int()
          .optional()
          .describe('Optional seed for reproducible generations'),
      })
      .refine((input) => !(input.size && input.aspectRatio), {
        message: 'Provide either size or aspectRatio, not both',
        path: ['size'],
      }),
    execute: async ({ prompt, status, n, size, aspectRatio, seed }) => {
      const channel = message.channel;
      if (!('send' in channel) || typeof channel.send !== 'function') {
        return { success: false, error: 'Channel is not text-based' };
      }

      let statusMessage: Message | null = null;

      try {
        statusMessage = await channel.send(status);

        const sourceImages = await getSourceImages(message.attachments);
        const imagePrompt =
          sourceImages.length > 0
            ? { text: prompt, images: sourceImages }
            : prompt;

        const result = await generateImage({
          model: provider.imageModel('image-model'),
          prompt: imagePrompt,
          n,
          ...(size ? { size: size as `${number}x${number}` } : {}),
          ...(aspectRatio
            ? { aspectRatio: aspectRatio as `${number}:${number}` }
            : {}),
          ...(seed === undefined ? {} : { seed }),
        });

        const files = result.images.map(
          (image, index) =>
            new AttachmentBuilder(Buffer.from(image.uint8Array), {
              name: `gork-image-${index + 1}.${getFileExtension(image.mediaType)}`,
            })
        );

        await message.reply({
          content: `generated ${result.images.length} image(s)${sourceImages.length > 0 ? ' from your attachment(s)' : ''}`,
          files,
          allowedMentions: { repliedUser: false },
        });

        if (result.warnings.length > 0) {
          logger.warn(
            { warnings: result.warnings },
            'Image generation returned warnings'
          );
        }

        return {
          success: true,
          content: `Generated ${result.images.length} image(s)`,
        };
      } catch (error) {
        logger.error({ error, prompt }, 'Failed to generate image');
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      } finally {
        if (statusMessage) {
          await statusMessage.delete().catch((error: unknown) => {
            logger.warn(
              { error },
              'Failed to delete temporary image status message'
            );
          });
        }
      }
    },
  });
