// src/discord-tools/index.ts
import type { Client } from "discord.js";

/* ------- pull in every tool factory ------- */
import {
  getServers,
  getServerInfo,
  listMembers,
} from "./server";

import {
  getChannel,
  createTextChannel,
  deleteChannel,
} from "./channel";

import {
  sendMessage,
  readMessages,
  addReaction,
  addMultipleReactions,
  removeReaction,
  moderateMessage,
} from "./message";

import { addRole, removeRole } from "./roles";
import { createDM, sendDM } from "./dm";

/* ------- registry ------- */
export const constructors = {
  /* server */
  getServers,
  getServerInfo,
  listMembers,

  /* channel */
  getChannel,
  createTextChannel,
  deleteChannel,

  /* message */
  sendMessage,
  readMessages,
  addReaction,
  addMultipleReactions,
  removeReaction,
  moderateMessage,

  /* roles */
  addRole,
  removeRole,

  /* dm */
  createDM,
  sendDM,
} as const;

/* the plain list of names, handy if you want to validate JSON input */
export const names = Object.keys(constructors) as Array<keyof typeof constructors>;

/* ------- helper to get fully wired tool objects ------- */
export const tools = ({ client }: { client: Client }) =>
  names.map((name) => constructors[name]({ client }));
