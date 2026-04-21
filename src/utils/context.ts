import type { ScoredPineconeRecord } from '@pinecone-database/pinecone';
import type { ModelMessage } from 'ai';
import type { Message } from 'discord.js';
import { city, country, memories as memoriesConfig, timezone } from '@/config';
import { queryMemories } from '@/lib/pinecone/operations';
import { getChannelName, getMessagesByChannel } from '@/lib/queries';
import type { PineconeMetadataOutput, RequestHints } from '@/types';
import { convertToModelMessages, formatDiscordMessage } from '@/utils/messages';
import { getTimeInCity } from '@/utils/time';
import { buildUserMap, type UserMapEntry } from './users';

export async function buildChatContext(
  msg: Message,
  opts?: {
    messages?: ModelMessage[];
    hints?: RequestHints;
    memories?: ScoredPineconeRecord<PineconeMetadataOutput>[];
  }
) {
  let messages = opts?.messages;
  let hints = opts?.hints;
  let memories = opts?.memories;
  const channel = msg.channel;

  let rawMessages: Message[] = [];
  let userMap: Map<string, UserMapEntry> = new Map();

  if (!messages) {
    const raw = await getMessagesByChannel({
      channel: msg.channel,
      limit: 50,
      before: msg.id,
    });
    rawMessages = Array.from(raw.values());
    messages = await convertToModelMessages(raw);
    userMap = buildUserMap(raw);
  }

  if (!hints) {
    const me = msg.guild?.members.me;

    hints = {
      channel: getChannelName(channel),
      time: getTimeInCity(timezone),
      city,
      country,
      server: msg.guild?.name ?? 'DM',
      joined: me?.joinedTimestamp ?? 0,
      status: me?.presence?.status ?? 'offline',
      activity: me?.presence?.activities[0]?.name ?? 'none',
    };
  }

  if (!memories) {
    const tinyHistory = rawMessages
      .slice(-3)
      .map((rM) => formatDiscordMessage(rM, null, {}, userMap))
      .join('\n');
    const onlyMessage = formatDiscordMessage(
      msg,
      null,
      {
        withAuthor: false,
        withContext: false,
        withReactions: false,
      },
      userMap
    );

    const [
      memories0,
      memories1,
      memories2,
      memories3,
      memories4,
      memories5,
      memories6,
    ] = await Promise.all([
      queryMemories(msg.content, {
        namespace: 'default',
        limit: memoriesConfig.eachLimit,
      }),
      queryMemories(tinyHistory, {
        namespace: 'default',
        limit: memoriesConfig.eachLimit,
      }),
      queryMemories(tinyHistory, {
        namespace: 'default',
        limit: memoriesConfig.eachLimit,
        ageLimit: 1000 * 60 * 60, // 1 hour in ms
      }),
      queryMemories(onlyMessage, {
        namespace: 'default',
        limit: memoriesConfig.eachLimit,
      }),
      queryMemories(onlyMessage, {
        namespace: 'default',
        limit: memoriesConfig.eachLimit,
        ageLimit: 1000 * 60 * 60,
      }),
      queryMemories(tinyHistory, {
        namespace: 'default',
        limit: memoriesConfig.eachLimit,
        ignoreRecent: false,
        onlyTools: true,
      }),
      queryMemories(tinyHistory, {
        namespace: 'default',
        limit: memoriesConfig.eachLimit,
        ignoreRecent: false,
        onlyTools: true,
        ageLimit: 1000 * 60 * 60,
      }),
    ]);

    const memoryLists = [
      memories6,
      memories1,
      memories4,
      memories3,
      memories5,
      memories0,
      memories2,
    ];

    const combined: ScoredPineconeRecord<PineconeMetadataOutput>[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < memoriesConfig.eachLimit; i++) {
      for (const list of memoryLists) {
        if (i < list.length && combined.length < memoriesConfig.maxMemories) {
          const mem = list[i];
          if (!mem) {
            continue;
          }
          const id = mem.id ?? '';
          if (!id) {
            continue;
          }
          if (!seen.has(id)) {
            seen.add(id);
            combined.push(mem);
            if (combined.length === memoriesConfig.maxMemories) {
              break;
            }
          }
        }
      }
      if (combined.length === memoriesConfig.maxMemories) {
        break;
      }
    }

    memories = combined;
  }

  return { messages, hints, memories };
}
