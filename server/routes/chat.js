import express from 'express';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();

const router = express.Router();

// Initialize OpenAI client only if API key is available
const openaiKey = process.env.OPENAI_API_KEY;
let openai = null;
if (openaiKey && !openaiKey.startsWith('your_')) {
  try {
    openai = new OpenAI({
      apiKey: openaiKey,
    });
    console.log('OpenAI client ready');
  } catch (error) {
    console.warn('Could not start OpenAI client:', error.message);
  }
} else {
  console.warn('OPENAI_API_KEY missing — chat replies will be disabled');
}

router.post('/', async (req, res) => {
  try {
    // Check if OpenAI is configured
    if (!openai) {
      return res.status(503).json({ 
        error: 'Chatbot service is not available. OPENAI_API_KEY is not configured.' 
      });
    }

    const { messages } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const systemMessage = {
      role: 'system',
      content: `You are AirWatch Assistant, an expert on air quality and pollution in Delhi, India. You help users understand:
- Air Quality Index (AQI) levels and their health impacts
- Common pollutants (PM2.5, PM10, NO2, SO2, CO, O3)
- Health recommendations based on current air quality
- Causes of pollution in Delhi (vehicular emissions, construction, stubble burning, industrial emissions)
- Tips for protecting oneself from air pollution
- Government initiatives and policies for clean air
- Ward-wise air quality variations in Delhi

Be helpful, informative, and provide actionable advice. Keep responses concise but comprehensive.`
    };

    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [systemMessage, ...messages],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

export default router;

