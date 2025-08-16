const { App } = require('@slack/bolt');
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
const express = require('express');
require('dotenv').config();

// Initialize our services
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

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
    message: 'Slack Advisor App is running!',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
expressApp.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Slack Advisor App is running!',
    timestamp: new Date().toISOString(),
    socketMode: 'enabled'
  });
});

// Handle when someone mentions your bot (any mention will work)
app.event('app_mention', async ({ event, say }) => {
  try {
    console.log('Received mention:', event.text);
    
    // Extract the question (remove the bot mention)
    const question = event.text.replace(/<@[^>]+>/, '').trim();
    
    if (!question) {
      await say({
        text: "Hi! I'm your AI advisor. What would you like to know?",
        thread_ts: event.ts
      });
      return;
    }

    const response = await getOpenAIResponse(question);
    
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

// Handle direct messages
app.message(async ({ message, say }) => {
  if (message.channel_type === 'im' && !message.subtype) {
    try {
      console.log('Received DM:', message.text);
      
      const question = message.text.trim();
      
      if (!question) {
        await say("Hi! I'm your AI advisor. What would you like to know?");
        return;
      }

      const response = await getOpenAIResponse(question);
      
      await say(response);

    } catch (error) {
      console.error('Error handling DM:', error);
      await say("Sorry, I'm having trouble processing your request right now. Please try again later.");
    }
  }
});

// Handle slash command - update this to match your bot's name
app.command('/north', async ({ command, ack, respond }) => {
  await ack();
  
  try {
    const question = command.text.trim();
    
    if (!question) {
      await respond({
        text: "Hi! I'm your AI advisor. What would you like to know?",
        response_type: 'ephemeral'
      });
      return;
    }

    const response = await getOpenAIResponse(question);
    
    await respond({
      text: response,
      response_type: 'in_channel'
    });

  } catch (error) {
    console.error('Error handling slash command:', error);
    await respond({
      text: "Sorry, I'm having trouble processing your request right now. Please try again later.",
      response_type: 'ephemeral'
    });
  }
});

// Function to get response from your custom OpenAI Assistant
async function getOpenAIResponse(question) {
  try {
    // Check if we have an assistant ID
    if (!process.env.OPENAI_ASSISTANT_ID) {
      console.error('❌ OPENAI_ASSISTANT_ID is required');
      throw new Error('Assistant ID not configured');
    }

    console.log('Using OpenAI Assistant ID:', process.env.OPENAI_ASSISTANT_ID);
    
    // Create a thread and run the assistant
    const thread = await openai.beta.threads.create();
    
    // Add the user's message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: question
    });
    
    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID
    });
    
    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    
    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }
    
    if (runStatus.status === 'completed') {
      // Get the assistant's response
      const messages = await openai.beta.threads.messages.list(thread.id);
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
// According to Render docs: must bind to 0.0.0.0 and use PORT env var
const port = process.env.PORT || 10000;
expressApp.listen(port, '0.0.0.0', () => {
  console.log(`🌐 Express server listening on port ${port} on 0.0.0.0 (Render requirement)`);
  console.log(`🏥 Health check available at: http://0.0.0.0:${port}/health`);
});

// Start the Slack app with Socket Mode
(async () => {
  try {
    await app.start();
    console.log('⚡️ Slack Advisor App is running!');
    console.log('📡 Connected via Socket Mode!');
    console.log('✅ @north mentions, DMs, and /north commands will work');
    console.log('🌐 Your bot is now connected and ready to respond!');
    console.log('🤖 Using OpenAI Assistant ID:', process.env.OPENAI_ASSISTANT_ID || 'NOT SET');
  } catch (error) {
    console.error('Failed to start Slack app:', error);
    process.exit(1);
  }
})();
