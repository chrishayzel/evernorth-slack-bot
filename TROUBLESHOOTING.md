# 🔧 Troubleshooting Connection Issues

If your Slack Advisor App is having connection problems, follow this guide step by step.

## 🚨 Common Connection Issues

### 1. "App is not responding" or "Connection failed"

**Most likely causes:**
- Slack app permissions are incorrect
- Environment variables are missing or wrong
- The app isn't properly installed to your workspace
- Socket Mode isn't enabled

### 2. "Invalid token" errors

**Most likely causes:**
- Bot token is copied incorrectly
- App-level token is missing
- Tokens have expired

## 🔍 Step-by-Step Fix

### Step 1: Verify Your Slack App Setup

1. **Go to [api.slack.com/apps](https://api.slack.com/apps)**
2. **Click on your app**
3. **Check these settings:**

#### Basic Information
- ✅ App name is set
- ✅ Signing Secret is visible (copy this!)

#### OAuth & Permissions
- ✅ Bot Token Scopes include ALL of these:
  - `app_mentions:read`
  - `channels:history`
  - `chat:write`
  - `commands`
  - `im:history`
  - `im:read`
  - `im:write`
- ✅ Bot User OAuth Token starts with `xoxb-` (copy this!)

#### App-Level Tokens
- ✅ You have a token with `connections:write` scope
- ✅ Token starts with `xapp-` (copy this!)

#### Event Subscriptions
- ✅ Enable Events is turned ON
- ✅ Request URL can be empty (we're using Socket Mode)
- ✅ Subscribe to bot events:
  - `app_mention`
  - `message.im`

#### Slash Commands
- ✅ You have a `/advisor` command created
- ✅ Command description is set
- ✅ Usage hint is set

### Step 2: Check Your Environment File

1. **Copy the example file:**
   ```bash
   cp env.example .env
   ```

2. **Edit `.env` and make sure you have:**
   ```bash
   SLACK_BOT_TOKEN=xoxb-your-actual-bot-token
   SLACK_SIGNING_SECRET=your-actual-signing-secret
   SLACK_APP_TOKEN=xapp-your-actual-app-token
   OPENAI_API_KEY=your-actual-openai-key
   SUPABASE_URL=your-actual-supabase-url
   SUPABASE_ANON_KEY=your-actual-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-actual-supabase-service-key
   ```

3. **Important:** Make sure there are NO spaces around the `=` sign!

### Step 3: Test Your Setup

1. **Run the test script:**
   ```bash
   node test.js
   ```

2. **Look for any ❌ errors and fix them**

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Test Locally

1. **Start the app:**
   ```bash
   npm start
   ```

2. **Look for this message:**
   ```
   ⚡️ Slack Advisor App is running on port 3000
   ```

3. **If you see errors, check the console output**

## 🚨 Specific Error Messages

### "Invalid token"
- Check your bot token starts with `xoxb-`
- Check your app-level token starts with `xapp-`
- Make sure you copied the entire token

### "Socket connection failed"
- Verify your app-level token has `connections:write` scope
- Check your app-level token is correct
- Make sure Socket Mode is enabled in your Slack app

### "App not responding"
- Verify your bot is installed to your workspace
- Check all required permissions are granted
- Make sure the app is running locally

### "Permission denied"
- Check your bot token scopes include all required permissions
- Reinstall the app to your workspace after adding permissions

## 🔧 Quick Fixes

### Fix 1: Reinstall the App
1. Go to your Slack app settings
2. Click "OAuth & Permissions"
3. Click "Reinstall App"
4. Copy the new bot token

### Fix 2: Regenerate App-Level Token
1. Go to "App-Level Tokens"
2. Delete the existing token
3. Create a new one with `connections:write` scope
4. Update your `.env` file

### Fix 3: Check Workspace Installation
1. In Slack, go to "Apps" in the left sidebar
2. Find your app and click on it
3. Make sure it shows as "Installed"
4. If not, click "Add to Slack"

## 🧪 Testing Your Bot

### Test 1: Slash Command
1. In any Slack channel, type `/advisor`
2. You should see a response

### Test 2: Mention
1. In any channel, type `@advisor hello`
2. The bot should respond in a thread

### Test 3: Direct Message
1. Send a direct message to your bot
2. It should respond directly

## 📱 Debug Mode

To see more detailed logs, add this to your `.env` file:

```bash
DEBUG=slack:*
```

Then restart your app and check the console for detailed Slack connection logs.

## 🆘 Still Having Issues?

1. **Check the console logs** - Look for specific error messages
2. **Verify each step** - Don't skip any part of the setup
3. **Test one thing at a time** - Don't try to fix everything at once
4. **Check Slack status** - Sometimes Slack has service issues

## 📞 Getting Help

If you're still stuck:
1. Copy the exact error message from your console
2. Check which step you're stuck on
3. Verify your Slack app settings match the guide above

Remember: Most connection issues are caused by missing permissions or incorrect tokens. Take it step by step! 🚀
