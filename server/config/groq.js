const Groq = require('groq-sdk');

// We initialize Groq only if the API key is present.
// If it's missing, the AI service will handle the absence gracefully.
let groq = null;

if (process.env.GROQ_API_KEY) {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
} else {
  console.warn('⚠️ GROQ_API_KEY is not set in environment variables. AI features will be disabled.');
}

module.exports = groq;
