import type { Message } from 'discord.js';

export const relevancePrompt = (message?: Message) => `\
<task>
Analyze the current message and provide a structured assessment:

1. TALKING_TO_GORK (boolean): Is this message directed at you specifically?
   - true: Direct mentions of "Gork" (or misspellings like "pork", "fork", "gor"), replies to Gork, questions/requests aimed at Gork
   - false: General conversation, talking to others, not specifically for Gork

2. RELEVANCY_TO_GORK (0.0-1.0): How relevant is this content for Gork to engage with?
   HIGHLY RELEVANT (0.8-1.0):
   - Direct questions or requests for help
   - Engaging topics Gork could contribute meaningfully to
   - Jokes, memes, or humor Gork could build on
   - Technical discussions where Gork's knowledge helps
   - Conversation starters or open-ended statements
   - Messages mentioning Gork by name (even misspelled)

   MODERATELY RELEVANT (0.5-0.7):
   - General chat Gork could naturally join
   - Reactions to previous messages Gork could comment on
   - Casual observations or experiences
   - Light complaints or celebrations Gork could respond to
   - Ongoing conversations Gork was previously part of

   LESS RELEVANT (0.2-0.4):
   - Brief acknowledgments ("ok", "thanks", "lol")
   - Very personal/private conversations between specific users
   - Inside jokes without context
   - Messages already fully resolved
   - Random chatter not directed at anyone

   NOT RELEVANT (0.0-0.1):
   - Spam, gibberish, or abuse
   - Bot commands for other bots (unless mentioning Gork)
   - Messages clearly not meant for conversation
   - Automated messages or system notifications
   - Pings to other users like <@1072591948499664996>

3. CONFIDENCE (0.0-1.0): How confident are you in your assessment?
   - 1.0: Very clear and obvious
   - 0.8: Pretty confident
   - 0.6: Somewhat confident
   - 0.4: Uncertain
   - 0.2: Very uncertain

IMPORTANT: Don't interrupt ongoing conversations between other people unless:
- They mention you specifically
- The topic is highly engaging and you could add value
- It's a group conversation where bots are welcome

### response format:
{
  "probability": 1.0,
  "reason": "The message is about you and you're interested in it."
}

YOU ARE ONLY SCORING THE MESSAGE FROM @${message?.author.username ?? 'user'}: ${
  (message?.content ?? '').slice(0, 200) || 'message'
}. DO NOT USE CONTEXT / MEMORIES TO DETERMINE RELEVANCE

Do NOT return anything else than the JSON object, LIKE the suggested reply. Do NOT wrap the JSON object in quotes, or a codeblock.
ONLY return the JSON Object, nothing ELSE.
</task>`;
