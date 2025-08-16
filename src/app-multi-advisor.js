import { App } from '@slack/bolt';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import express from 'express';
import { MultiAdvisorMemoryService } from './services/multiAdvisorMemoryService.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize our services
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const memoryService = new MultiAdvisorMemoryService();

// Create Express app for Render's port binding requirement
const expressApp = express();
expressApp.use(express.json());

// Check if we have an app token for Socket Mode
const hasAppToken = process.env.SLACK_APP_TOKEN && process.env.SLACK_APP_TOKEN.startsWith('xapp-');

if (!hasAppToken) {
  console.error('❌ SLACK_APP_TOKEN is required for Socket Mode');
  console.error('Please add SLACK_APP_TOKEN to your environment variables');
  process.exit(1);
}

// Create the Slack app with Socket Mode
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

// Health check endpoint for Render
expressApp.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Multi-Advisor Slack App is running!',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
expressApp.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Multi-Advisor Slack App is running!',
    timestamp: new Date().toISOString(),
    socketMode: 'enabled'
  });
});

// Function to detect which advisor is being mentioned
function detectAdvisor(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('@strategist') || lowerMessage.includes('@strategy')) {
    return 'strategist';
  } else if (lowerMessage.includes('@ops') || lowerMessage.includes('@operations')) {
    return 'ops';
  } else if (lowerMessage.includes('@content') || lowerMessage.includes('@writing')) {
    return 'content';
  } else if (lowerMessage.includes('@north') || lowerMessage.includes('@advisor')) {
    return 'north';
  }
  
  // Default to north if no specific advisor mentioned
  return 'north';
}

// Function to extract advisor-specific question
function extractAdvisorQuestion(message, advisorId) {
  // Remove all advisor mentions
  let question = message
    .replace(/@\w+/g, '') // Remove all bot mentions
    .trim();
  
  // If no question content, provide a default
  if (!question) {
    return `Hi! I'm ${advisorId === 'north' ? 'North' : advisorId}. How can I help you today?`;
  }
  
  return question;
}

// Handle when someone mentions any advisor in a channel
app.event('app_mention', async ({ event, say }) => {
  try {
    console.log('Received mention:', event.text);
    
    // Detect which advisor is being mentioned
    const advisorId = detectAdvisor(event.text);
    console.log(`🎯 Detected advisor: ${advisorId}`);
    
    // Extract the question
    const question = extractAdvisorQuestion(event.text, advisorId);
    
    if (!question || question.includes('How can I help you today?')) {
      await say({
        text: `Hi! I'm ${advisorId === 'north' ? 'North' : advisorId}, your AI advisor. What would you like to know?`,
        thread_ts: event.ts
      });
      return;
    }

    const response = await processAdvisorMessage(advisorId, question, event.thread_ts || event.ts, 'mention');
    
    await say({
      text: response,
      thread_ts: event.ts
    });

  } catch (error) {
    console.error('Error handling mention:', error);
    await say({
      text: "Sorry, I'm having trouble processing your request right now. Please try again later.",
      thread_ts: event.ts
    });
  }
});

// Handle direct messages (default to North)
app.message(async ({ message, say }) => {
  if (message.channel_type === 'im' && !message.subtype) {
    try {
      console.log('Received DM:', message.text);
      
      const question = message.text.trim();
      
      if (!question) {
        await say("Hi! I'm North, your AI advisor. What would you like to know?");
        return;
      }

      const response = await processAdvisorMessage('north', question, message.thread_ts || message.ts, 'dm');
      
      await say(response);

    } catch (error) {
      console.error('Error handling DM:', error);
      await say("Sorry, I'm having trouble processing your request right now. Please try again later.");
    }
  }
});

// Handle slash commands for different advisors
app.command('/north', async ({ command, ack, respond }) => {
  await ack();
  await handleSlashCommand('north', command, respond);
});

app.command('/strategist', async ({ command, ack, respond }) => {
  await ack();
  await handleSlashCommand('strategist', command, respond);
});

app.command('/ops', async ({ command, ack, respond }) => {
  await ack();
  await handleSlashCommand('ops', command, respond);
});

app.command('/content', async ({ command, ack, respond }) => {
  await ack();
  await handleSlashCommand('content', command, respond);
});

// Generic slash command handler
async function handleSlashCommand(advisorId, command, respond) {
  try {
    const question = command.text.trim();
    
    if (!question) {
      await respond({
        text: `Hi! I'm ${advisorId === 'north' ? 'North' : advisorId}, your AI advisor. What would you like to know?`,
        response_type: 'ephemeral'
      });
      return;
    }

    const response = await processAdvisorMessage(advisorId, question, command.channel_id, 'slash');
    
    await respond({
      text: response,
      response_type: 'in_channel'
    });

  } catch (error) {
    console.error(`Error handling ${advisorId} slash command:`, error);
    await respond({
      text: "Sorry, I'm having trouble processing your request right now. Please try again later.",
      response_type: 'ephemeral'
    });
  }
}

// Main message processing function with multi-advisor support
async function processAdvisorMessage(advisorId, message, threadId, source) {
  try {
    console.log(`🔄 Processing ${source} message for ${advisorId}:`, message);

    // Get advisor profile
    const advisorProfile = await memoryService.getAdvisorProfile(advisorId);
    if (!advisorProfile) {
      console.error(`❌ Advisor profile not found for: ${advisorId}`);
      return `Sorry, I couldn't find my profile. Please contact support.`;
    }

    // Check if this is a memory request
    if (memoryService.isMemoryRequest(message)) {
      console.log('🧠 Detected memory request');
      
      const knowledge = memoryService.extractKnowledgeFromRequest(message);
      
      if (knowledge) {
        // Store the knowledge in shared knowledge base
        await memoryService.storeSharedKnowledge(knowledge, {
          source: source,
          advisor_id: advisorId,
          thread_id: threadId,
          user_request: true
        });

        return `✅ I've stored that in our shared knowledge base: "${knowledge}"\n\nAll advisors will now have access to this information!`;
      } else {
        return "I'd be happy to remember something for you! Please tell me what you'd like me to remember.";
      }
    }

    // Get relevant knowledge from shared knowledge base
    const relevantDocs = await memoryService.retrieveSharedKnowledge(message);
    
    // Get or create advisor-specific thread mapping
    const assistantThreadId = await memoryService.getAdvisorThreadMapping(advisorId, threadId);
    
    // Create context from advisor profile and relevant documents
    let context = `${advisorProfile.system_prompt}\n\nYou are ${advisorProfile.display_name}, ${advisorProfile.description}`;
    
    if (relevantDocs.length > 0) {
      context += "\n\nRelevant information from our shared knowledge base:\n";
      relevantDocs.forEach((doc, i) => {
        context += `\n${i + 1}. ${doc.content}`;
      });
      context += "\n\nUse this information to provide accurate responses. If the user asks about something not covered in this context, use your general knowledge and expertise.";
    }

    // Get response from OpenAI Assistant with context
    const response = await getOpenAIResponseWithContext(message, context, assistantThreadId);
    
    // Store the conversation for memory
    await memoryService.storeConversation(assistantThreadId, message, response);
    
    // Store advisor-specific short-term memory (e.g., user preferences, context)
    await memoryService.storeAdvisorMemory(advisorId, 'last_topic', {
      topic: message.substring(0, 100),
      timestamp: new Date().toISOString()
    });
    
    return response;

  } catch (error) {
    console.error('Error processing advisor message:', error);
    throw new Error('Failed to process message');
  }
}

// Function to get response from OpenAI Assistant with context
async function getOpenAIResponseWithContext(question, context, assistantThreadId) {
  try {
    // Check if we have an assistant ID
    if (!process.env.OPENAI_ASSISTANT_ID) {
      console.error('❌ OPENAI_ASSISTANT_ID is required');
      throw new Error('Assistant ID not configured');
    }

    console.log('Using OpenAI Assistant ID:', process.env.OPENAI_ASSISTANT_ID);
    
    // Add the user's message to the thread
    await openai.beta.threads.messages.create(assistantThreadId, {
      role: 'user',
      content: `Context: ${context}\n\nUser Question: ${question}`
    });
    
    // Run the assistant
    const run = await openai.beta.threads.runs.create(assistantThreadId, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID
    });
    
    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(assistantThreadId, run.id);
    
    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(assistantThreadId, run.id);
    }
    
    if (runStatus.status === 'completed') {
      // Get the assistant's response
      const messages = await openai.beta.threads.messages.list(assistantThreadId);
      const lastMessage = messages.data[0];
      
      if (lastMessage.content && lastMessage.content[0] && lastMessage.content[0].text) {
        return lastMessage.content[0].text.value;
      } else {
        return "I received your message but couldn't generate a response.";
      }
    } else {
      throw new Error(`Assistant run failed with status: ${runStatus.status}`);
    }
    
  } catch (error) {
    console.error('Error getting OpenAI response:', error);
    throw new Error('Failed to get AI response');
  }
}

// Start the Express server for Render's port binding requirement
const port = process.env.PORT || 10000;
expressApp.listen(port, '0.0.0.0', () => {
  console.log(`🌐 Express server listening on port ${port} on 0.0.0.0 (Render requirement)`);
  console.log(`🏥 Health check available at: http://0.0.0.0:${port}/health`);
});

// Start the Slack app with Socket Mode
(async () => {
  try {
    await app.start();
    console.log('⚡️ Multi-Advisor Slack App is running!');
    console.log('📡 Connected via Socket Mode!');
    console.log('✅ Multiple advisors supported: @north, @strategist, @ops, @content');
    console.log('✅ Slash commands: /north, /strategist, /ops, /content');
    console.log('🌐 Your bot is now connected and ready to respond!');
    console.log('🤖 Using OpenAI Assistant ID:', process.env.OPENAI_ASSISTANT_ID || 'NOT SET');
    console.log('🧠 Multi-advisor memory service enabled with Supabase integration');
    console.log('🔗 Shared knowledge base accessible by all advisors');
  } catch (error) {
    console.error('Failed to start Slack app:', error);
    process.exit(1);
  }
})();
