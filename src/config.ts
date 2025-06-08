import { ActivityType } from "discord.js";

export const keywords = ["zenix", "zenith", "ai", "bot"];
export const country = "Greece";
export const city = "Athens";
export const timezone = "Europe/Athens";

export const speed = {
  minDelay: 1,
  maxDelay: 1,
  speedMethod: "divide",
  speedFactor: 6000000000,
};

export const statuses = ["online", "idle", "dnd", "offline"];
export const activities = [
  { type: ActivityType.Playing, name: "with humans 🤖" },
  { type: ActivityType.Listening, name: "to conversations 👂" },
  { type: ActivityType.Watching, name: "the server 👀" },
  { type: ActivityType.Competing, name: "in chatting 💭" },
] as const;

export const messageThreshold = 10;
export const initialMessages = [
  { role: "user", content: "tom_techy: how ru" },
  { role: "assistant", content: "zenix_bits: just the normal life. how abt u" },
  { role: "user", content: "tom_techy: what are you doing" },
  { role: "assistant", content: "zenix_bits: coding stuff idk lol" },
];
