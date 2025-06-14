import { AudioPlayer, EndBehaviorType, VoiceConnection, type VoiceReceiver } from '@discordjs/voice';
import * as prism from 'prism-media';
import type { ChatInputCommandInteraction } from 'discord.js';
import logger from '@/lib/logger';
import { getAIResponse, playAudio, speak } from './helpers';
import { voice } from '@/config';
import { transcribeStream } from './helpers'; // <-- Use your helper!

export async function createListeningStream(
  connection: VoiceConnection,
  receiver: VoiceReceiver,
  player: AudioPlayer,
  interaction: ChatInputCommandInteraction<'cached'>,
) {
  const user = interaction.user;

  const opusStream = receiver.subscribe(user.id, {
    end: {
      behavior: EndBehaviorType.AfterSilence,
      duration: 1_000,
    },
  });

  const stream = opusStream.pipe(new prism.opus.Decoder({
    frameSize: 960,
    channels: 2,
    rate: 48000,
  }));

  try {
    logger.info('Listening for speech...');
    const transcript = await transcribeStream(stream);

    if (!transcript) {
      logger.info('No speech detected. Listening again...');
      return createListeningStream(connection, receiver, player, interaction); 
    }

    logger.info({ transcript }, 'Transcription result');

    const text = await getAIResponse(transcript);
    logger.info({ text }, 'AI response');

    const audio = await speak({
      text,
      voiceId: voice.id,
      model: voice.model,
    });

    if (audio) {
      playAudio(player, audio);
      // Optionally: Wait until playback ends before restarting listening
      player.once('idle', () => createListeningStream(connection, receiver, player, interaction));
    } else {
      logger.warn('TTS failed. Listening again...');
      createListeningStream(connection, receiver, player, interaction);
    }
  } catch (error) {
    logger.error({ error }, 'Error in listening stream');
    // Try again after a small delay (avoids infinite error loops)
    setTimeout(() => createListeningStream(connection, receiver, player, interaction), 1000);
  }
}
