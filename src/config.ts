import dotenv from "dotenv";
import { env } from "./env";

dotenv.config();

const { DISCORD_TOKEN, DISCORD_CLIENT_ID } = env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  throw new Error("Missing environment variables");
}

export const config = {
  DISCORD_TOKEN,
  DISCORD_CLIENT_ID,
};
