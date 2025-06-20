import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioResource,
  entersState,
} from '@discordjs/voice';
import type { Readable } from 'node:stream';

export async function playAudio(player: AudioPlayer, audio: string | Readable) {
  /**
   * Here we are creating an audio resource using a sample song freely available online
   * (see https://www.soundhelix.com/audio-examples)
   *
   * We specify an arbitrary inputType. This means that we aren't too sure what the format of
   * the input is, and that we'd like to have this converted into a format we can use. If we
   * were using an Ogg or WebM source, then we could change this value. However, for now we
   * will leave this as arbitrary.
   */
  const resource = createAudioResource(audio, {
    // inputType: StreamType.Arbitrary,
    inlineVolume: false,
  });

  /**
   * We will now play this to the audio player. By default, the audio player will not play until
   * at least one voice connection is subscribed to it, so it is fine to attach our resource to the
   * audio player this early.
   */
  player.play(resource);

  /**
   * Here we are using a helper function. It will resolve if the player enters the Playing
   * state within 5 seconds, otherwise it will reject with an error.
   */
  return entersState(player, AudioPlayerStatus.Playing, 5_000);
}
