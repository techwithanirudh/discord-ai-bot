import { createLogger } from './lib/logger';

const logger = createLogger('commands');

interface DeployCommandsProps {
  guildId: string;
}

export async function deployCommands({ guildId }: DeployCommandsProps) {
  logger.warn(
    { guildId },
    'Slash command deployment is not supported in selfbot mode'
  );
}

if (import.meta.main) {
  logger.warn('Command deployment is disabled in selfbot mode');
}
