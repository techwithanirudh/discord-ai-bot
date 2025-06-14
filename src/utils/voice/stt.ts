// src/utils/voice/stt.ts
import { experimental_transcribe as transcribe } from "ai";
import { openai } from "@ai-sdk/openai";
import type { GuildMember } from "discord.js";
import { EventEmitter } from "events";

export const sttEvents = new EventEmitter();
// emits "recognized" with (member: GuildMember, text: string)

export class STTConnection {
  private chunks: Buffer[] = [];

  constructor(public member: GuildMember) {}

  // called on each PCM chunk from discord receiver
  write(buffer: Buffer) {
    this.chunks.push(buffer);
    console.log(`Received ${buffer.length} bytes of audio data from ${this.member.user.tag}`);
  }

  // call when you detect end-of-speech
  async finish() {
    const audioBuffer = Buffer.concat(this.chunks);
    this.chunks = [];

    try {
      const transcript = await transcribe({
        model: openai.transcription("whisper-1"),
        audio: audioBuffer,
        // optional settings:
        // providerOptions: { openai: { timestampGranularities: ["sentence"] } },
      });
      
      console.log(transcript)
      const text = transcript.text.trim();
      if (text) {
        sttEvents.emit("recognized", this.member, text);
      }
    } catch (err) {
      console.error("STT error:", err);
    }
  }
}

