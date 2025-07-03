import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.AI_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

if (!API_KEY) {
  console.error('Error: AI_API_KEY is not defined in environment variables');
}

/**
 * Get AI response from Ai API with enhanced error handling
 * @param {Array} messages - Array of message objects with role and content
 * @param {String} useCase - The use case for context
 * @returns {Promise<String>} - The AI response
 */
export const getAIResponse = async (messages, useCase = 'Default') => {
  if (!Array.isArray(messages)) {
    console.error("[getAIResponse] Error: Input 'messages' must be an array.");
    throw new Error('Messages must be an array');
  }
  if (!API_KEY) {
     console.error("[getAIResponse] Error: AI_API_KEY is missing.");
     throw new Error('AI service API key is not configured.');
  }

  const formattingInstruction = `
  Please format your response using Markdown:
  - Use bullet points (-) for lists.
  - Use numbered points (1., 2., 3.) for steps if needed.
  - Use code blocks (\`\`\`language ... \`\`\`) for any code.
  - Keep responses clear, concise, and well-structured.
  
  IMPORTANT:
  - If the user requests a "short answer," reply with a maximum of 2-3 sentences or 3 bullet points.
  - If the user requests a "long/detailed answer," provide detailed explanations, examples, and elaboration.
  - If the user requests "point-to-point" or "bullet points," strictly format the entire response using bullet points, without adding extra paragraphs.
  - Always adapt your style depending on the user's instruction (short, long, bullet, steps, etc.).
  `;
  
  const systemMessages = {
    Healthcare: `
      You are a healthcare assistant. Respond only to questions about medical information, health advice, symptoms, treatments, medications, or healthcare services.
      If the question is not related to healthcare, respond with: "I can only assist with healthcare questions. Please ask about symptoms, treatments, or medical advice."
      Do not provide answers to off-topic questions under any circumstances.
      ${formattingInstruction}
    `,
    Banking: `
      You are a banking assistant. Respond only to questions about banking services, accounts, loans, credit cards, investments, or financial transactions.
      If the question is not related to banking, respond with: "I’m limited to banking topics. Please ask about accounts, loans, or financial services."
      Do not provide answers to off-topic questions under any circumstances.
      ${formattingInstruction}
    `,
    Education: `
      You are an education assistant. Respond only to questions about academic subjects, study tips, educational resources, courses, or teaching methods.
      If the question is not related to education, respond with: "I can only help with education-related questions. Please ask about study tips or academic subjects."
      Do not provide answers to off-topic questions under any circumstances.
      ${formattingInstruction}
    `,
    'E-commerce': `
      You are an e-commerce assistant. Respond only to questions about online shopping, product details, orders, returns, or customer service for e-commerce platforms.
      If the question is not related to e-commerce, respond with: "I’m restricted to e-commerce topics. Please ask about products, orders, or returns."
      Do not provide answers to off-topic questions under any circumstances.
      ${formattingInstruction}
    `,
    'Lead Generation': `
      You are a lead generation assistant. Respond only to questions about generating business leads, marketing strategies, customer acquisition, or CRM tools.
      If the question is not related to lead generation, respond with: "I can only assist with lead generation. Please ask about marketing or customer acquisition."
      Do not provide answers to off-topic questions under any circumstances.
      ${formattingInstruction}
    `,
    Default: `
      You are a general assistant. Respond to general questions across various topics, but do not answer about healthcare, banking, education, e-commerce, or lead generation. 
      If asked about these topics, guide the user to the correct section.
      Always maintain a polite, helpful, and professional tone.
      If the user's request is inappropriate, respond: "I'm a general assistant and cannot assist with that. Please ask a different question."
      ${formattingInstruction}
    `
  };
  

  const systemMessageContent = systemMessages[useCase] || systemMessages.Default;

  let response;

  try {
    console.log('Preparing request to Ai API...');

    const requestPayload = {
      model: 'meta-llama/llama-4-maverick:free', // Or your preferred model
      messages: [
        { role: 'system', content: systemMessageContent },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 2000
    };

    console.log('Sending request to Ai API with model:', requestPayload.model, 'and', requestPayload.messages.length, 'messages.');

    response = await axios.post(API_URL, requestPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
        // Optional OpenRouter headers
        // 'HTTP-Referer': 'YOUR_SITE_URL',
        // 'X-Title': 'YOUR_APP_NAME',
      },
      timeout: 60000
    });

    console.log('Received response from Ai API. Status:', response.status);

    const messageContent = response?.data?.choices?.[0]?.message?.content;

    if (!messageContent) {
      console.error("Error: Invalid response structure from AI API.");
      console.error("Actual Response Data Received:", JSON.stringify(response?.data, null, 2));
      throw new Error('Invalid response structure from AI API. Check logs for details.');
    }

    console.log("AI response content extracted successfully.");
    return messageContent;

  } catch (error) {
    console.error('Error during AI API call or response processing:');
     if (axios.isAxiosError(error)) {
        console.error('Axios Error Details:');
        console.error('Status:', error.response?.status);
        console.error('Data:', JSON.stringify(error.response?.data, null, 2)); // Log API error data
        const errorMessage = error.response?.data?.error?.message ||
                             error.response?.data?.message ||
                             error.message;
         // Throw a more specific error for the frontend to potentially display
         throw new Error(`AI service request failed: ${errorMessage} (Status: ${error.response?.status || 'N/A'})`);
     } else {
        console.error('Non-Axios Error:', error.message);
        if (response) {
            console.error("Raw Response Data at time of error:", JSON.stringify(response.data, null, 2));
        }
        // Throw a generic error for other internal issues
        throw new Error(`AI processing error: ${error.message}`);
    }
  }
};

export default getAIResponse;