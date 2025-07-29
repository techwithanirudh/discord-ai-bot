- Handle Message Interruptions
- Add Web Search using Exa (Done)
- Attachments Support (Done)
- (final goal) - @grok (gork) / @zenix is it true?

The Discord Agent Isolation for each server, full RBAC
Switch to ElevenLabs instead of deepgram voice as it's more realistic.

Separate Deepgram code into it's files
Implement Conversation history for Voice Chat, previous message memory + chat history.
Add Commit Lint to enforce strict commit messages, and add lint pipelines.
Allow People to Customize Zenix's Speed, and other settings in a /config command (per-server).
Refactor the channels command to be more easy to use, with deny and allow lists.

Detect when the user sent an unfinished sentence as a request and wait until they complete the response before replying fully, wait 1-2 seconds (for one user). This adds deduping

If a user interrupts it's replying, it will pause the current reply and reply to the other one with context.

Have a small dashboard UI to modify the bots settings
Add a slash chat command to chat with the AI on servers.
Figure out the issue if you join and close stream multiple DeepGram things are kept

When the user is typing increase the response speed by 0.5x. Also, use a different method for responding like a set WPM.

Add CI/CD testing so pushing things to production don't break stuff.

Add context to when the bot is triggered—for example, whether it’s due to a ping, a message, or some other interaction.

Switch from Mem0 (free, limited plan) to a more efficient memory system like Pinecone or another vector store. Implement a better memory workflow with both long-term and short-term memory. This way, the bot can retain conversation history, summarize previous messages, and maintain context over time.

Look into CrewAI or build your own custom memory system (a custom approach is likely more flexible). The goal is for Zenix to be more tightly integrated with both voice chat and text messages.

Zenix should have unified memory per user across all servers—not separate memories per server. That way, the bot always remembers the same person no matter where they interact with it.
Fix commands (broken on autobotting)
Cleanup memory part later

use lefthook instead of husky

Add tool calling to memory, also use a FIFO queue instead of async sending and calculate WPM + ai response assumptions
Properly refactor the memory system with querying like B does it
Cleanup the code a bit
Properly type the thing, we're currently JSON.string the memories I/O, stringify in the queries.ts
Implement the BM25 thing
give llm choice to reply or to generally not
Fix attachment processing

When pinging users mention @username then convert it to user ID like frank
Improve system prompt to include tools
When there is an attachment add Right now it just adds [Attachments: png, zip, png, png] for each file attached
when if it is not a type it can process, remove all blank stuff messages (https://github.com/DomBom16/frank/blob/main/src/utils/aiResponse.ts)
convert status or whatever in discord the yellow white block to text like frank
Also another issue is the build context thing's reference replies are broken

Refactor the ping system, the bot pings random people and doesn't know who is who
Add edit delete messages functionality for gork, meaning it can understand when messages were edited and also edit it's own messages liek Frank

Refactor logging system with child loggers

Refactor the adding metadata so guild and channel are not strings, and are JSON but the retrieval converts JSON to string and vice versa
