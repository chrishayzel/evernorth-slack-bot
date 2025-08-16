# Slack Advisor App

A real-time Slack advisor bot powered by OpenAI Assistants API with vector database support for intelligent responses.

## What This App Does

- **Real-time responses**: Listens to Slack events instantly (no polling)
- **Smart conversations**: Uses OpenAI to provide intelligent, contextual responses
- **Memory**: Remembers past conversations and relevant knowledge
- **Multiple modes**: Easy to add different advisor types (Strategist, Ops, Content)
- **Flexible interaction**: Responds to mentions, DMs, and slash commands

## Features

✅ **@advisor mentions** - Get help in any channel  
✅ **Direct messages** - Private conversations with the bot  
✅ **/advisor command** - Quick access from anywhere  
✅ **Conversation memory** - Remembers your chat history  
✅ **Knowledge base** - Stores and retrieves relevant information  
✅ **Extensible modes** - Easy to add new advisor types  

## Prerequisites

Before you start, you'll need:

1. **Node.js** (version 16 or higher)
2. **A Slack workspace** where you can install apps
3. **An OpenAI API key** (get one at [openai.com](https://openai.com))
4. **A Supabase account** (free tier works great)

## Setup Instructions

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Your Environment

1. Copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and add your real API keys (see sections below)

### Step 3: Set Up Slack

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Give it a name (e.g., "Advisor Bot") and select your workspace
4. In the left sidebar, go to "OAuth & Permissions"
5. Add these bot token scopes:
   - `app_mentions:read`
   - `channels:history`
   - `chat:write`
   - `commands`
   - `im:history`
   - `im:read`
   - `im:write`
6. Install the app to your workspace
7. Copy the "Bot User OAuth Token" (starts with `xoxb-`)
8. Go to "Basic Information" and copy the "Signing Secret"
9. Go to "App-Level Tokens" and create a new token with `connections:write` scope
10. Copy the app-level token (starts with `xapp-`)

### Step 4: Set Up OpenAI

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Copy the key to your `.env` file

### Step 5: Set Up Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to "Settings" → "API"
4. Copy the "Project URL" and "anon public" key
5. Go to "Settings" → "Database" → "Roles"
6. Copy the "service_role" key

### Step 6: Create Database Tables

Run these SQL commands in your Supabase SQL editor:

```sql
-- Knowledge base table
CREATE TABLE knowledge_base (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation history table
CREATE TABLE conversation_history (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_knowledge_base_content ON knowledge_base USING gin(to_tsvector('english', content));
CREATE INDEX idx_conversation_history_user_channel ON conversation_history(user_id, channel_id);
CREATE INDEX idx_conversation_history_created_at ON conversation_history(created_at DESC);
```

### Step 7: Update Your .env File

Make sure your `.env` file has all the required values:

```bash
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-actual-bot-token
SLACK_SIGNING_SECRET=your-actual-signing-secret
SLACK_APP_TOKEN=xapp-your-actual-app-token

# OpenAI Configuration
OPENAI_API_KEY=your-actual-openai-api-key

# Supabase Configuration
SUPABASE_URL=your-actual-supabase-url
SUPABASE_ANON_KEY=your-actual-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key

# App Configuration
PORT=3000
NODE_ENV=development
```

## Running the App

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The app will start on port 3000 (or whatever port you specify in your .env file).

## Testing Your Bot

1. **Test the slash command**: Type `/advisor` in any channel
2. **Test mentions**: Type `@advisor` followed by a question
3. **Test DMs**: Send a direct message to your bot

## Adding New Advisor Modes

The app is designed to easily add new advisor types. Here's how:

```javascript
// In your code, you can add new modes like this:
const advisorModeService = new AdvisorModeService();

advisorModeService.addMode('finance', {
  name: 'Financial Advisor',
  systemPrompt: 'You are a financial advisor specializing in budgeting, investments, and financial planning.',
  maxTokens: 600,
  temperature: 0.4
});
```

## Deployment

### Option 1: Render (Recommended for beginners)

1. Go to [render.com](https://render.com)
2. Create a new "Web Service"
3. Connect your GitHub repository
4. Set the build command: `npm install`
5. Set the start command: `npm start`
6. Add your environment variables
7. Deploy!

### Option 2: Railway

1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Connect your GitHub repository
4. Add your environment variables
5. Deploy!

### Option 3: Fly.io

1. Install the Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Run `fly launch`
3. Follow the prompts
4. Add your environment variables
5. Deploy with `fly deploy`

## Troubleshooting

### Common Issues

**"Bot is not responding"**
- Check your Slack app permissions
- Verify your bot token is correct
- Make sure the app is installed to your workspace

**"OpenAI API error"**
- Verify your OpenAI API key is correct
- Check your OpenAI account has credits
- Ensure you're using the right model name

**"Supabase connection error"**
- Verify your Supabase URL and keys
- Check your database tables exist
- Ensure your IP is not blocked

### Getting Help

1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Test each service individually (Slack, OpenAI, Supabase)

## Project Structure

```
slack-advisor-app/
├── src/
│   ├── app.js              # Main application file
│   └── services/
│       ├── vectorService.js        # Database operations
│       └── advisorModeService.js   # Advisor mode management
├── package.json            # Dependencies and scripts
├── env.example            # Environment variables template
└── README.md              # This file
```

## Contributing

Feel free to:
- Add new advisor modes
- Improve the vector search functionality
- Add new features
- Fix bugs

## License

MIT License - feel free to use this for your own projects!

## Support

If you run into issues:
1. Check this README first
2. Look at the console logs
3. Verify your API keys and permissions
4. Test each component step by step

Good luck building your Slack advisor! 🚀
