import type { LanguageModelV2Middleware } from '@ai-sdk/provider';

export const imageFilterMiddleware: LanguageModelV2Middleware = {
  transformParams: ({ params }) => {
    const { prompt: messages } = params;

    for (const msg of messages) {
      if (Array.isArray(msg.content)) {
        msg.content = msg.content.filter((part) => part.type !== 'file');
      }
    }

    return Promise.resolve({ ...params, prompt: messages });
  },
};
