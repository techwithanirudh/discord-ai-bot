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
