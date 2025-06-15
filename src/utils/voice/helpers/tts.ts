import { Client, User } from "discord.js";
import { joinVoiceChannel, getVoiceConnection, VoiceReceiver, EndBehaviorType } from "@discordjs/voice";
import * as prism from "prism-media";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";

const deepgram = createClient(process.env.DEEPGRAM_KEY);

export async function transcribeStream(receiver: VoiceReceiver, user: User, onTranscript: (text: string) => void) {
  // Start Deepgram live connection
  const sttConn = deepgram.listen.live({
    smart_format: true,
    filler_words: true,
    interim_results: true,
    model: "nova-2",
    language: "en-US",
  });

  sttConn.on(LiveTranscriptionEvents.Transcript, (data) => {
    const text = data.channel.alternatives[0].transcript;
    if (data.speech_final && text.trim().length) {
      onTranscript(text);
    }
  });

  // Pipe Discord Opus audio to Deepgram
  const opusStream = receiver.subscribe(user.id, {
    end: { behavior: EndBehaviorType.AfterSilence, duration: 200 },
  });
  const oggStream = new prism.opus.OggLogicalBitstream({
    opusHead: new prism.opus.OpusHead({ channelCount: 1, sampleRate: 48000 }),
    pageSizeControl: { maxPackets: 10 },
  });

  oggStream.on("readable", () => {
    let chunk;
    while (null !== (chunk = oggStream.read())) sttConn.send(chunk);
  });

  opusStream.pipe(oggStream);

  // Return the connection to manage lifecycle if needed
  return sttConn;
}
