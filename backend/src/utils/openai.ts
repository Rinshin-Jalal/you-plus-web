/**
 * OpenAI Client for AWS Bedrock
 * 
 * Uses the OpenAI SDK with AWS Bedrock's OpenAI-compatible endpoint.
 * This allows using the same OpenAI npm package with Bedrock models.
 * 
 * Reference: https://docs.aws.amazon.com/bedrock/latest/userguide/inference-chat-completions.html
 */

import OpenAI from "openai";
import { Env } from "@/types/environment";

/**
 * Get the Bedrock OpenAI-compatible endpoint URL
 */
export function getBedrockEndpoint(region: string): string {
  return `https://bedrock-runtime.${region}.amazonaws.com/openai/v1`;
}

/**
 * Create an OpenAI client configured for AWS Bedrock
 * 
 * @param env - Environment variables containing BEDROCK_API_KEY and BEDROCK_REGION
 * @returns Configured OpenAI client instance
 */
export function createBedrockOpenAIClient(env: Env): OpenAI {
  const endpoint = getBedrockEndpoint(env.BEDROCK_REGION);
  
  return new OpenAI({
    baseURL: endpoint,
    apiKey: env.BEDROCK_API_KEY,
  });
}

/**
 * Get the default model ID for Bedrock
 * You can override this by passing a different model in your API calls
 * 
 * Common Bedrock models:
 * - openai.gpt-oss-20b-1:0 (default)
 * - anthropic.claude-3-5-sonnet-20241022-v2:0
 * - meta.llama3-70b-instruct-v1:0
 */
export const DEFAULT_BEDROCK_MODEL = "openai.gpt-oss-20b-1:0";

/**
 * Example usage:
 * 
 * ```typescript
 * import { createBedrockOpenAIClient, DEFAULT_BEDROCK_MODEL } from "@/utils/openai";
 * 
 * const client = createBedrockOpenAIClient(env);
 * 
 * // Chat completions
 * const response = await client.chat.completions.create({
 *   model: DEFAULT_BEDROCK_MODEL,
 *   messages: [
 *     { role: "user", content: "Hello!" }
 *   ],
 * });
 * 
 * // Embeddings (if supported by your model)
 * const embedding = await client.embeddings.create({
 *   model: DEFAULT_BEDROCK_MODEL,
 *   input: "text to embed",
 * });
 * ```
 */

