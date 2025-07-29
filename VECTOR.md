# Vector

Let's use Pinecone for the following:

1. As we use the AI SDK, we will use OpenAI compatible models for embedding, like embedding large (use models, embedding in models.ts), same with searching for data.
2. We use a dense index in Pinecone for semantic search, matching the output of modern embedding models and the bot's use case. (https://docs.pinecone.io/guides/index-data/create-an-index#bring-your-own-vectors), include metadata like timestamp, user, server, channel, etc. So when searching we can limit the search to a specific server, channel, etc. (https://docs.pinecone.io/guides/search/filter-by-metadata#search-with-a-metadata-filter)
3. We do NOT need to chunk the data as discord messages are already short and concise.
4. When a message is deleted or edited, we should remove the embedding from the index, or update it. (https://docs.pinecone.io/guides/index-data/data-modeling#delete-chunks, https://docs.pinecone.io/guides/index-data/data-modeling#update-chunks). Have a way to easily connect message and embedding id.
5. After all this we can upsert the embeddings to the index. (https://docs.pinecone.io/guides/index-data/upsert-data#upsert-dense-vectors) (https://docs.pinecone.io/guides/index-data/indexing-overview#bring-your-own-vectors)
6. Setup a hybrid search index (https://docs.pinecone.io/guides/search/hybrid-search#use-a-single-hybrid-index)

# Searches

- When searching have a sophisticated algo (bob), check through server, recent messages, and a lot of context as well so we get the data. w/metadata timeframes, users etc. (https://docs.pinecone.io/guides/get-started/quickstart#5-semantic-search)

# TODO

Learn about namespaces
Learn about rerankinig (https://docs.pinecone.io/guides/get-started/quickstart#6-rerank-results)
Look at bob code (https://docs.pinecone.io/guides/get-started/quickstart#7-improve-results)
Look at AI SDK pinecone example so we can implement it

3-large-textembbeding
