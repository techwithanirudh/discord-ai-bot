import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  TextChannel,
  MessageFlags,
} from 'discord.js';
import { redis, redisKeys } from '@/lib/kv';

export const data = new SlashCommandBuilder()
  .setName('channels')
  .setDescription('Manage allowed channels for the bot')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addSubcommand((sc) =>
    sc
      .setName('add')
      .setDescription('Add a channel to the allowed list')
      .addChannelOption((opt) =>
        opt
          .setName('channel')
          .setDescription('The text channel to add')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true),
      ),
  )
  .addSubcommand((sc) =>
    sc
      .setName('remove')
      .setDescription('Remove a channel from the allowed list')
      .addChannelOption((opt) =>
        opt
          .setName('channel')
          .setDescription('The text channel to remove')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true),
      ),
  )
  .addSubcommand((sc) =>
    sc.setName('list').setDescription('List all allowed channels'),
  )
  .addSubcommand((sc) =>
    sc.setName('clear').setDescription('Clear all allowed channels'),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    return interaction.reply({
      content: 'This can only be used inside a server.',
      flags: MessageFlags.Ephemeral,
    });
  }

  const sub = interaction.options.getSubcommand();
  const guildKey = redisKeys.allowedChannels(interaction.guild.id);

  const getChannel = () =>
    interaction.options.getChannel('channel', true) as TextChannel;

  if (sub === 'add' || sub === 'remove') {
    const channel = getChannel();

    if (channel.type !== ChannelType.GuildText) {
      return interaction.reply({
        content: 'Please pick a text channel.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === 'add') {
      const isMember = await redis.sismember(guildKey, channel.id);
      if (isMember) {
        return interaction.reply({
          content: `${channel} is already allowed.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      await redis.sadd(guildKey, channel.id);
      return interaction.reply({
        content: `done! thanks for letting me talk in ${channel}!`,
        flags: MessageFlags.Ephemeral,
      });
    } else {
      const removedCount = await redis.srem(guildKey, channel.id);
      if (!removedCount) {
        return interaction.reply({
          content: `there's nothing to remove! ${channel} wasn't even on the list.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      return interaction.reply({
        content: `aw... ${channel} has been removed from the allowed list. i won't talk there anymore...`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  if (sub === 'list') {
    const ids = await redis.smembers(guildKey);
    if (!ids.length) {
      return interaction.reply({
        content: 'no channels are locked down, i can talk anywhere.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const mentions = ids.map((id) => `<#${id}>`).join(' • ');
    return interaction.reply({
      content: `**allowed channels:** ${mentions}`,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (sub === 'clear') {
    await redis.del(guildKey);
    return interaction.reply({
      content: 'yay, thanks! i can talk anywhere now.',
      flags: MessageFlags.Ephemeral,
    });
  }

  return interaction.reply({
    content: 'Unknown subcommand. ',
    flags: MessageFlags.Ephemeral,
  });
}
