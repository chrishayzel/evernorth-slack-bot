const { App } = require('@slack/bolt');
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize our services
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Create the Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Handle when someone mentions @advisor in a channel
app.event('app_mention', async ({ event, say }) => {
  try {
    console.log('Received mention:', event.text);
    
    const question = event.text.replace(/<@[^>]+>/, '').trim();
    
    if (!question) {
      await say({
        text: "Hi! I'm your AI advisor. What would you like to know?",
        thread_ts: event.ts
      });
      return;
    }

    const context = await getRelevantContext(question);
    const response = await getOpenAIResponse(question, context);
    
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

      const context = await getRelevantContext(question);
      const response = await getOpenAIResponse(question, context);
      
      await say(response);

    } catch (error) {
      console.error('Error handling DM:', error);
      await say("Sorry, I'm having trouble processing your request right now. Please try again later.");
    }
  }
});

// Handle slash command /advisor
app.command('/advisor', async ({ command, ack, respond }) => {
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

    const context = await getRelevantContext(question);
    const response = await getOpenAIResponse(question, context);
    
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

// Function to get relevant context
async function getRelevantContext(question) {
  try {
    return "You are a helpful AI advisor. Use your knowledge to provide accurate and helpful responses.";
  } catch (error) {
    console.error('Error getting context:', error);
    return "You are a helpful AI advisor.";
  }
}

// Function to get response from OpenAI
async function getOpenAIResponse(question, context) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: context
        },
        {
          role: "user",
          content: question
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error getting OpenAI response:', error);
    throw new Error('Failed to get AI response');
  }
}

// Start the app
const port = process.env.PORT || 3000;
(async () => {
  try {
    await app.start(port);
    console.log('⚡️ Slack Advisor App is running!');
    console.log(`🌐 Port: ${port}`);
    console.log(`🔗 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('📡 Ready to receive Slack events!');
    console.log('📋 Slack Configuration:');
    console.log(`Set your Request URL in Slack to: https://your-app-url.com/slack/events`);
  } catch (error) {
    console.error('Failed to start app:', error);
    process.exit(1);
  }
})();
