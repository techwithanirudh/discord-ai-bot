import { z } from 'zod';

const Jsonify = <T extends z.ZodTypeAny>(schema: T) =>
  z
    .union([
      schema,
      z.string().transform((s) => {
        try {
          return JSON.parse(s);
        } catch {
          throw new Error('Invalid JSON string');
        }
      }),
    ])
    .transform((obj) => JSON.stringify(obj));

const GuildSchema = Jsonify(
  z.object({
    id: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
  })
);

const ChannelSchema = Jsonify(
  z.object({
    id: z.string(),
    name: z.string(),
  })
);

const BaseMetadataSchema = z.object({
  guild: GuildSchema,
  channel: ChannelSchema,
  createdAt: z.number().optional(),
  lastRetrievalTime: z.number().optional(),
  type: z.enum(['tool', 'chat']),
});

const ChatMetadataSchema = BaseMetadataSchema.extend({
  type: z.literal('chat'),
  context: z.string(),
});

const ToolMetadataSchema = BaseMetadataSchema.extend({
  type: z.literal('tool'),
  name: z.string(),
  response: Jsonify(z.unknown()),
});

export const PineconeMetadataSchema = z.union([
  ChatMetadataSchema,
  ToolMetadataSchema,
]);

export type PineconeMetadataInput = z.input<typeof PineconeMetadataSchema>;
export type PineconeMetadataOutput = z.output<typeof PineconeMetadataSchema>;
