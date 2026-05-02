import { z } from 'zod';

const GuildObjectSchema = z.object({
  id: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
});

const ChannelObjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['dm', 'text', 'voice', 'thread', 'unknown']).default('unknown'),
});

const ParticipantObjectSchema = z.object({
  id: z.string(),
  kind: z.enum(['user', 'bot', 'guild', 'channel']),
  handle: z.string().optional(),
  display: z.string().optional(),
  platform: z.literal('discord'),
});

export type Guild = z.infer<typeof GuildObjectSchema>;
export type Channel = z.infer<typeof ChannelObjectSchema>;
export type Participant = z.infer<typeof ParticipantObjectSchema>;

// --- Structured (in-app) schemas — nested objects ---

const StructuredBaseSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]).default(1),
  type: z.enum(['chat', 'tool', 'summary', 'entity']),
  createdAt: z.number().int(),
  lastRetrievalTime: z.number().optional(),
  sessionId: z.string().default('legacy'),
  sessionType: z.enum(['dm', 'guild']).optional(),
  guild: GuildObjectSchema.nullable().optional(),
  channel: ChannelObjectSchema.nullable().optional(),
  participants: z.array(ParticipantObjectSchema).default([]),
});

const StructuredChatSchema = StructuredBaseSchema.extend({
  type: z.literal('chat'),
  context: z.string(),
});

const StructuredToolSchema = StructuredBaseSchema.extend({
  type: z.literal('tool'),
  name: z.string(),
  response: z.unknown(),
});

const StructuredSummarySchema = StructuredBaseSchema.extend({
  type: z.literal('summary'),
  summary: z.string(),
});

const StructuredEntitySchema = StructuredBaseSchema.extend({
  type: z.literal('entity'),
  summary: z.string(),
  entities: z.array(ParticipantObjectSchema).default([]),
});

export const StructuredMetadataSchema = z.union([
  StructuredChatSchema,
  StructuredToolSchema,
  StructuredSummarySchema,
  StructuredEntitySchema,
]);

export type PineconeMetadataInput = z.infer<typeof StructuredMetadataSchema>;

// --- Storage schemas — flat strings/primitives for Pinecone ---

const StorageBaseSchema = z.object({
  hash: z.string().optional(),
  version: z.union([z.literal(1), z.literal(2)]).default(1),
  type: z.enum(['chat', 'tool', 'summary', 'entity']),
  createdAt: z.number().int(),
  lastRetrievalTime: z.number().optional(),
  sessionId: z.string().default('legacy'),
  sessionType: z.enum(['dm', 'guild']).optional(),
  guild: z.string().optional(),
  channel: z.string().optional(),
  participants: z.string().optional(),
  entities: z.string().optional(),
  guildId: z.string().optional(),
  guildName: z.string().optional(),
  channelId: z.string().optional(),
  channelName: z.string().optional(),
  channelType: z.string().optional(),
  participantIds: z.array(z.string()).default([]),
  entityIds: z.array(z.string()).default([]),
});

const StorageChatSchema = StorageBaseSchema.extend({
  type: z.literal('chat'),
  context: z.string(),
});

const StorageToolSchema = StorageBaseSchema.extend({
  type: z.literal('tool'),
  name: z.string(),
  response: z.string(),
});

const StorageSummarySchema = StorageBaseSchema.extend({
  type: z.literal('summary'),
  summary: z.string(),
});

const StorageEntitySchema = StorageBaseSchema.extend({
  type: z.literal('entity'),
  summary: z.string(),
});

export const PineconeMetadataSchema = z.union([
  StorageChatSchema,
  StorageToolSchema,
  StorageSummarySchema,
  StorageEntitySchema,
]);

export type PineconeMetadataOutput = z.infer<typeof PineconeMetadataSchema>;

export function flattenMetadata(
  metadata: PineconeMetadataInput
): Omit<PineconeMetadataOutput, 'hash'> {
  const structured = StructuredMetadataSchema.parse(metadata);
  const guild = structured.guild ?? null;
  const channel = structured.channel ?? null;
  const participants = structured.participants ?? [];
  const entities =
    structured.type === 'entity'
      ? ((structured as z.infer<typeof StructuredEntitySchema>).entities ?? [])
      : [];

  const flattened: Record<string, unknown> = {
    ...structured,
    guild: guild ? JSON.stringify(guild) : undefined,
    channel: channel ? JSON.stringify(channel) : undefined,
    participants: participants.length
      ? JSON.stringify(participants)
      : undefined,
    entities: entities.length ? JSON.stringify(entities) : undefined,
    guildId: guild?.id ?? undefined,
    guildName: guild?.name ?? undefined,
    channelId: channel?.id ?? undefined,
    channelName: channel?.name ?? undefined,
    channelType: channel?.type ?? undefined,
    participantIds: participants
      .map((p) => p.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0),
    entityIds: entities
      .map((p) => p.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0),
  };

  if (structured.type === 'tool') {
    flattened.response = serializeValue(structured.response);
  }

  return PineconeMetadataSchema.parse(flattened);
}

export function expandMetadata(
  metadata: PineconeMetadataOutput
): PineconeMetadataInput {
  const guild = safeParseJson<Guild | null>(metadata.guild);
  const channel = safeParseJson<Channel | null>(metadata.channel);
  const participants =
    safeParseJson<Participant[]>(metadata.participants) ?? [];
  const entities = safeParseJson<Participant[]>(metadata.entities) ?? [];

  const base = { ...metadata, guild, channel, participants };

  switch (metadata.type) {
    case 'chat':
      return StructuredChatSchema.parse(base);
    case 'tool':
      return StructuredToolSchema.parse({
        ...base,
        response:
          safeParseJson<unknown>(metadata.response) ?? metadata.response,
      });
    case 'summary':
      return StructuredSummarySchema.parse(base);
    case 'entity':
      return StructuredEntitySchema.parse({ ...base, entities });
    default:
      return StructuredMetadataSchema.parse(base);
  }
}

function safeParseJson<T>(value: unknown): T | null {
  if (typeof value !== 'string') {
    return (value as T) ?? null;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function serializeValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export const ALLOWED_MEMORY_FILTERS = [
  'version',
  'type',
  'sessionId',
  'sessionType',
  'guildId',
  'guildName',
  'channelId',
  'channelName',
  'channelType',
  'participantIds',
  'entityIds',
  'createdAt',
  'lastRetrievalTime',
] as const;
