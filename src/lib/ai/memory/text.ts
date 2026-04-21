import type { ScoredPineconeRecord } from '@pinecone-database/pinecone';
import {
  type Channel,
  expandMetadata,
  type Guild,
  type Participant,
  type PineconeMetadataOutput,
} from '@/types';

export function formatMemories(
  memories: ScoredPineconeRecord<PineconeMetadataOutput>[]
): string {
  if (memories.length === 0) {
    return '';
  }

  const sections = memories
    .map((memory) => {
      const { metadata } = memory;
      if (!metadata) {
        return null;
      }

      const structured = expandMetadata(metadata);
      const guild = structured.guild ?? null;
      const channel = structured.channel ?? null;
      const participants = structured.participants ?? [];
      const createdAt = structured.createdAt
        ? new Date(structured.createdAt).toISOString()
        : 'unknown';
      const sessionId = structured.sessionId ?? 'legacy';

      switch (structured.type) {
        case 'chat':
          return formatChatMemory({
            createdAt,
            sessionId,
            guild,
            channel,
            participants,
            context: structured.context,
          });
        case 'tool':
          return formatToolMemory({
            createdAt,
            sessionId,
            guild,
            channel,
            participants,
            name: structured.name,
            response: structured.response,
          });
        case 'summary':
          return formatSummaryMemory({
            createdAt,
            sessionId,
            summary: structured.summary,
          });
        case 'entity': {
          const entities =
            (structured as { entities?: Participant[] }).entities ??
            participants;
          return formatEntityMemory({
            createdAt,
            summary: structured.summary,
            entities,
          });
        }
        default:
          return null;
      }
    })
    .filter(Boolean) as string[];

  if (!sections.length) {
    return '';
  }

  return ['[memory]', ...sections, '[/memory]'].join('\n');
}

function formatChatMemory({
  createdAt,
  sessionId,
  guild,
  channel,
  participants,
  context,
}: {
  createdAt: string;
  sessionId: string;
  guild: Guild | null;
  channel: Channel | null;
  participants: Participant[];
  context: string;
}) {
  return [
    '- entry:',
    '    type: chat',
    `    when: ${createdAt}`,
    `    session: ${sessionId}`,
    `    where: ${formatLocation(guild, channel)}`,
    `    participants: ${formatParticipants(participants)}`,
    '    transcript: |',
    ...sanitizeMultiline(context).map((l) => `      ${l}`),
  ].join('\n');
}

function formatToolMemory({
  createdAt,
  sessionId,
  guild,
  channel,
  participants,
  name,
  response,
}: {
  createdAt: string;
  sessionId: string;
  guild: Guild | null;
  channel: Channel | null;
  participants: Participant[];
  name: string;
  response: unknown;
}) {
  const payload =
    typeof response === 'string'
      ? sanitizeMultiline(response)
      : sanitizeMultiline(JSON.stringify(response, null, 2));

  return [
    '- entry:',
    '    type: tool',
    `    when: ${createdAt}`,
    `    session: ${sessionId}`,
    `    where: ${formatLocation(guild, channel)}`,
    `    participants: ${formatParticipants(participants)}`,
    `    tool: ${name ?? 'unknown'}`,
    '    output: |',
    ...payload.map((l) => `      ${l}`),
  ].join('\n');
}

function formatSummaryMemory({
  createdAt,
  sessionId,
  summary,
}: {
  createdAt: string;
  sessionId: string;
  summary: string;
}) {
  return [
    '- entry:',
    '    type: summary',
    `    when: ${createdAt}`,
    `    session: ${sessionId}`,
    '    recap: |',
    ...sanitizeMultiline(summary).map((l) => `      ${l}`),
  ].join('\n');
}

function formatEntityMemory({
  createdAt,
  summary,
  entities,
}: {
  createdAt: string;
  summary: string;
  entities: Participant[];
}) {
  return [
    '- entry:',
    '    type: entity',
    `    when: ${createdAt}`,
    `    subjects: ${formatParticipants(entities)}`,
    '    card: |',
    ...sanitizeMultiline(summary).map((l) => `      ${l}`),
  ].join('\n');
}

function formatParticipants(participants?: Participant[]) {
  if (!participants?.length) {
    return 'unknown';
  }
  return participants
    .map((p) => p.display || p.handle || p.id)
    .filter(Boolean)
    .join(', ');
}

function formatLocation(guild: Guild | null, channel: Channel | null) {
  const guildName = guild?.name ?? 'DM';
  const channelName = channel?.name ?? 'private';
  const channelType = channel?.type ? ` (${channel.type})` : '';
  return `${guildName} > ${channelName}${channelType}`;
}

function sanitizeMultiline(value: string) {
  return value
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line, index, arr) => !(line === '' && arr[index - 1] === ''))
    .slice(0, 40);
}
