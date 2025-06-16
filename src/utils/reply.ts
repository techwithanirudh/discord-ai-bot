import { DMChannel, Message, PartialGroupDMChannel, TextChannel, ThreadChannel } from 'discord.js'
import { getChannelState } from './state'
import { computeDelay } from './delay'
import { normalize, sentences } from './tokenize-messages'
import { speed as speedConfig } from '@/config'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function reply(message: Message, fullText: string): Promise<void> {
  const channel = message.channel
  if (!(channel instanceof TextChannel || channel instanceof ThreadChannel || channel instanceof DMChannel)) return
  const state = getChannelState(channel.id)
  const segments = normalize(sentences(fullText))
  let isFirst = true

  async function sendSegment(segment: string, first: boolean) {
    state.sending.lastMessageId = channel.lastMessageId ?? null;
    state.sending.isTyping = true
    const pause = Math.random() * (speedConfig.maxPause - speedConfig.minPause) + speedConfig.minPause
    await sleep(pause * 1000)
    channel.sendTyping()
    const speedMul = state.typing.users.size > 0 ? 0.5 : 1
    const delay = computeDelay(segment, speedMul)
    await sleep(delay)

    if (channel.lastMessageId !== state.sending.lastMessageId) {
      state.sending.isTyping = false
      return
    }

    if (first && Math.random() < speedConfig.firstReplyChance) {
      await message.reply(segment)
    } else {
      await channel.send(segment)
    }

    state.typing.isTyping = false
    const next = state.sending.queue.shift()
    if (next) await sendSegment(next, false)
  }

  for (const segment of segments) {
    if (state.sending.isTyping) {
      state.sending.queue.push(segment)
    } else {
      await sendSegment(segment, isFirst)
    }
    isFirst = false
  }
}
