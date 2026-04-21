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

Fix commands (broken on autobotting)
Cleanup memory part later

use lefthook instead of husky

Add tool calling to memory, also use a FIFO queue instead of async sending and calculate WPM + ai response assumptions
Properly refactor the memory system with querying like B does it
Cleanup the code a bit
Implement the BM25 thing
give llm choice to reply or to generally not

When pinging users mention @username then convert it to user ID like frank
Improve system prompt to include tools
When there is an attachment which it cant see add Right now it just adds [Attachments: png, zip, png, png] for each file attached
when if it is not a type it can process, remove all blank stuff messages (https://github.com/DomBom16/frank/blob/main/src/utils/aiResponse.ts)
convert status or whatever in discord the yellow white block to text like frank
Also another issue is the build context thing's reference replies are broken

Refactor the ping system, the bot pings random people and doesn't know who is who
Add edit delete messages functionality for gork, meaning it can understand when messages were edited and also edit it's own messages like Frank

Refactor logging system with child loggers

Refactor the adding metadata so guild and channel are not strings, and are JSON but the retrieval converts JSON to string and vice versa

Implement text management logic like https://github.com/Giantpizzahead/bob-bot/blob/6574d0e988d6249c8df2a72179503e0d16f95a3c/src/bobbot/discord_helpers/text_channel_history.py#L127
Do not INGEST the searchMemories tool when using addTool
Give the AI Ability to use custom filters to searchMemories through tool calling, and ask it to use the info in the first searchMemories calls to call the second one, say that serve names etc are very important also give it what metadata params it has
Give it the ability to raise a feature request which opens a jira ticket
Have a custom memory manager like text channel history
Improve logging to add a debug mode or reduce excessive logging

The bot has a habit of not replying to the designated message
Input what activity the bot is performing, and add more set of activities
Add debug tools like bob
Add a agent before tasks which checks if it is a command or prompt inj
Add a database (drizzle) with statistics on chat with servers

Have a mode called selfbot and real bot, selfbot doesn't have commands etc, new infra wow

Fix start dm function fix memory retrial
Add a new tool to getMessageInfo which allows the model to get the message in reply to what etc
same with get channel info
and properly document the tool for hte model
Log all tools after completion

Now the problem is the relevance agent can also reply to messages fix that

Gork should verify in relevance engine if it mentions gork the ping it unknowingly relevances
the spam detector is borked
the pings should be replaced
agentic improvement by storing SKIPS and passing the summary / few to relevance engine to optimize
give a computer use agent
call a cooldown on spam
