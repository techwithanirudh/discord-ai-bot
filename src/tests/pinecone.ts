import { queryMemories } from '@/lib/pinecone/queries';

const query = 'who is gork known as';
const memories = await queryMemories(query, {
  ignoreRecent: false,
});

console.log(memories);
