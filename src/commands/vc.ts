// src/commands/vc.ts
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  GuildMember,
} from "discord.js";
import {
  joinVoiceChannel,
  getVoiceConnection,
  EndBehaviorType,
  VoiceConnection,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { STTConnection, sttEvents } from "@/utils/voice/stt";
import { speakTts } from "@/utils/voice/tts";
import { generateResponse } from "@/events/message-create/utils/respond";
import { generateText } from "ai";
import { myProvider } from "@/lib/ai/providers";

type HistoryEntry = { speaker: string; text: string };
const sessions = new Map<string, HistoryEntry[]>();

export const data = new SlashCommandBuilder()
  .setName("vc")
  .setDescription("Voice channel commands")
  .addSubcommand((s) =>
    s.setName("join").setDescription("Make the bot join your VC")
  )
  .addSubcommand((s) =>
    s.setName("leave").setDescription("Make the bot leave VC")
  )
  .addSubcommand((s) =>
    s.setName("log").setDescription("Show VC conversation history")
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  const member = interaction.member as GuildMember;
  const guildId = interaction.guildId!;

  if (!member.voice.channel) {
    return interaction.reply("! but ur not in vc?");
  }

  let conn = getVoiceConnection(guildId);

  if (sub === "join") {
    if (conn) return interaction.reply("! im already in vc?");

    conn = joinVoiceChannel({
      channelId: member.voice.channel.id,
      guildId,
      adapterCreator: member.voice.channel.guild.voiceAdapterCreator,
    });

    // history store
    sessions.set(member.voice.channel.id, []);

    // on each speaker start
    conn.receiver.speaking.on(VoiceConnectionStatus., (userId) => {
      if (userId === interaction.client.user.id) return;
      const user = member.voice.channel!.guild.members.cache.get(userId);
      if (!user) return;

      const stt = new STTConnection(user);
      const stream = conn!
        .receiver.subscribe(userId, {
          end: { behavior: EndBehaviorType.AfterSilence, duration: 250 },
          mode: "pcm",
        });

      // collect buffers
      stream.on("data", (chunk) => stt.write(chunk as Buffer));

      // when user stops talking, finish and transcribe
      stream.on("end", () => void stt.finish());
    });

    return interaction.reply(
      "joining"
    );
  }

  // LEAVE
  if (sub === "leave") {
    if (!conn) return interaction.reply("! im not in vc?");
    sessions.delete(conn.joinConfig.channelId);
    conn.destroy();
    return interaction.reply("! ok bye D:");
  }

  // LOG
  if (sub === "log") {
    if (!conn) return interaction.reply("! im not in vc?");
    const history = sessions.get(conn.joinConfig.channelId);
    if (!history) return interaction.reply("! no log for this vc");
    const log = history.map((m) => `${m.speaker}: ${m.text}`).join("\n");
    return interaction.reply(`! \`\`\`VC history:\n${log}\`\`\``);
  }
}

// when transcription finishes
sttEvents.on(
  "recognized",
  async (member: GuildMember, text: string) => {
    const conn = getVoiceConnection(member.guild.id) as VoiceConnection;
    if (!conn) return;
    const hist = sessions.get(member.voice.channel!.id);
    if (!hist) return;

    hist.push({ speaker: member.displayName, text });
    if (hist.length > 10) hist.shift();


    const { text: response } = await generateText({
      model: myProvider.languageModel("chat-model"),
      messages: [
        ...hist.map((m) => ({
          role: m.speaker === member.displayName ? "user" : "assistant",
          content: m.text,
        }))
      ]
    });

    hist.push({ speaker: "bob", text: response });
    await speakTts(conn, response);
  }
);
