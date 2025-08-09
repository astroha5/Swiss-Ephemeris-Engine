const OpenAI = require('openai');

function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  // The OpenAI SDK reads apiKey from constructor options or env
  return new OpenAI({ apiKey });
}

module.exports = { createOpenAIClient };


