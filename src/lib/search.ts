import { env } from '@/env';
import { Exa } from 'exa-js';

/**
 * Exa is a powerful search engine that allows you to search the web, images, and more.
 * It provides a simple API to perform searches and retrieve results.
 *
 * @see https://exa.com/docs
 */
export const exa = new Exa(env.EXA_API_KEY);
