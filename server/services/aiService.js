const groq = require('../config/groq');

/**
 * Validates the parsed JSON from Groq to ensure it matches our expected schema.
 * @param {Object} data - The parsed JSON data from Groq
 * @returns {Object|null} Validated data or null if invalid
 */
const validateAIAnalysis = (data) => {
  if (!data || typeof data !== 'object') return null;

  const validCategories = [
    'Pothole', 'Damaged Road', 'Streetlight', 'Garbage', 
    'Blocked Drain', 'Water Leakage', 'Damaged Facility', 
    'Other', 'Unknown/Unclear'
  ];
  
  const validSeverities = ['Low', 'Medium', 'High'];

  // Basic structure check
  if (
    typeof data.issueType !== 'string' ||
    typeof data.problemDetected !== 'boolean' ||
    typeof data.confidence !== 'number' ||
    typeof data.severity !== 'string' ||
    typeof data.explanation !== 'string'
  ) {
    return null;
  }

  // Value bounds check
  if (data.confidence < 0 || data.confidence > 100) return null;
  
  // Categorical check
  if (!validSeverities.includes(data.severity)) return null;
  
  // If the AI spits out a weird category, we normalize it to 'Unknown/Unclear'
  const issueType = validCategories.includes(data.issueType) ? data.issueType : 'Unknown/Unclear';

  return {
    issueType,
    problemDetected: data.problemDetected,
    confidence: data.confidence,
    severity: data.severity,
    explanation: data.explanation,
    analyzedAt: new Date()
  };
};

/**
 * Calls the Groq Vision model to analyze an image URL.
 * @param {String} imageUrl - The secure Cloudinary URL of the image
 * @param {String} userCategory - The category selected by the user
 * @param {String} userDescription - The description provided by the user
 * @returns {Object|null} The validated AI analysis object, or null if failed
 */
const analyzeIssueImage = async (imageUrl, userCategory, userDescription) => {
  if (!groq) {
    console.warn('Groq client not initialized. Skipping AI analysis.');
    return null;
  }

  // Use the model from .env or default to the Qwen Vision model
  const model = process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b';

  const systemPrompt = `
You are an AI assistant for a civic issue reporting platform.
Your task is to inspect the provided image of a reported civic issue and return a structured JSON response.

The user selected category: "${userCategory || 'Not provided'}"
The user description: "${userDescription || 'Not provided'}"

Instructions:
1. Inspect the image carefully.
2. Identify whether a civic issue appears visible (problemDetected). Be conservative. If it's just a normal street or not clearly a problem, return false.
3. Identify the most likely issueType. Choose ONLY from: Pothole, Damaged Road, Streetlight, Garbage, Blocked Drain, Water Leakage, Damaged Facility, Other, Unknown/Unclear.
4. Estimate confidence from 0 to 100 as an integer.
5. Suggest severity. Choose ONLY from: Low, Medium, High.
6. Provide a brief explanation of the visual evidence.

CRITICAL: Keep your internal reasoning (<think> block) extremely short (under 20 words).
Output a valid JSON object matching this exact structure, with NO markdown formatting or backticks:
{
  "issueType": "Pothole",
  "problemDetected": true,
  "confidence": 94,
  "severity": "High",
  "explanation": "Brief explanation here"
}
`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Please analyze this image and return the JSON object matching the required structure exactly.' },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      model: model,
      temperature: 0.1, // Low temperature for more predictable output
      max_tokens: 800, // Limit output to avoid Groq free tier limit errors
    });

    let responseContent = chatCompletion.choices[0]?.message?.content;
    if (!responseContent) return null;

    // Extract JSON block using regex to handle <think> blocks from Qwen
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON object found in response:', responseContent);
      return null;
    }
    
    const jsonString = jsonMatch[0];

    try {
      const parsedData = JSON.parse(jsonString);
      return validateAIAnalysis(parsedData);
    } catch (parseError) {
      console.error('Failed to parse Groq response as JSON:', responseContent);
      return null;
    }

  } catch (error) {
    console.error('Groq AI API Error:', error.message);
    return null;
  }
};

module.exports = {
  analyzeIssueImage,
  validateAIAnalysis
};
