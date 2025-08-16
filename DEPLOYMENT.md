# 🚀 Deployment Guide - Host Your Slack App Online

This guide shows you how to deploy your Slack Advisor App to the cloud so it runs 24/7 without needing your computer to be on.

## 🎯 **Choose Your Hosting Platform**

### **Option 1: Render (Recommended for Beginners)**
- **Cost**: Free tier available
- **Setup Time**: 5 minutes
- **Difficulty**: ⭐ (Easiest)

### **Option 2: Railway**
- **Cost**: Free tier available
- **Setup Time**: 3 minutes
- **Difficulty**: ⭐ (Easiest)

### **Option 3: Fly.io**
- **Cost**: Free tier available
- **Setup Time**: 10 minutes
- **Difficulty**: ⭐⭐ (Medium)

---

## 🎯 **Option 1: Deploy to Render (Easiest)**

### **Step 1: Prepare Your Code**
1. **Push your code to GitHub** (if you haven't already)
2. **Make sure you have these files**:
   - `package.json`
   - `src/app.js`
   - `render.yaml` (already created)

### **Step 2: Deploy to Render**
1. Go to [render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. **Connect your GitHub repository**
4. **Configure your service**:
   - **Name**: `slack-advisor-app`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Click **"Create Web Service"**

### **Step 3: Add Environment Variables**
1. In your Render dashboard, go to **"Environment"**
2. Add these variables:
   ```
   NODE_ENV=production
   SLACK_BOT_TOKEN=xoxb-your-bot-token
   SLACK_SIGNING_SECRET=your-signing-secret
   OPENAI_API_KEY=your-openai-key
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key
   ```

### **Step 4: Get Your App URL**
1. Wait for deployment to complete (green status)
2. Copy your app URL (looks like `https://your-app-name.onrender.com`)

### **Step 5: Update Slack Request URL**
1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click your app → **"Event Subscriptions"**
3. **Request URL**: Set to `https://your-app-name.onrender.com/slack/events`
4. **Save Changes**

---

## 🎯 **Option 2: Deploy to Railway**

### **Step 1: Deploy to Railway**
1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. **"Deploy from GitHub repo"**
4. Select your repository

### **Step 2: Configure Environment**
1. Railway will auto-detect it's a Node.js app
2. Go to **"Variables"** tab
3. Add your environment variables (same as Render)

### **Step 3: Get Your App URL**
1. Wait for deployment
2. Copy your app URL from the **"Deployments"** tab

### **Step 4: Update Slack Request URL**
Same as Render - set to `https://your-railway-url/slack/events`

---

## 🎯 **Option 3: Deploy to Fly.io**

### **Step 1: Install Fly CLI**
```bash
curl -L https://fly.io/install.sh | sh
```

### **Step 2: Login to Fly**
```bash
fly auth login
```

### **Step 3: Deploy**
```bash
fly launch
```
Follow the prompts to create your app.

### **Step 4: Set Environment Variables**
```bash
fly secrets set SLACK_BOT_TOKEN=xoxb-your-token
fly secrets set SLACK_SIGNING_SECRET=your-secret
fly secrets set OPENAI_API_KEY=your-key
fly secrets set SUPABASE_URL=your-url
fly secrets set SUPABASE_ANON_KEY=your-key
fly secrets set SUPABASE_SERVICE_ROLE_KEY=your-key
fly secrets set NODE_ENV=production
```

### **Step 5: Deploy**
```bash
fly deploy
```

---

## 🔧 **After Deployment - Update Slack**

### **Important: Update Your Request URL**
1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click your app
3. **"Event Subscriptions"**
4. **Request URL**: Change from `http://localhost:3000/slack/events` to:
   - **Render**: `https://your-app-name.onrender.com/slack/events`
   - **Railway**: `https://your-railway-url/slack/events`
   - **Fly.io**: `https://your-app-name.fly.dev/slack/events`

### **Test Your Bot**
1. **Slash command**: Type `/advisor` in any channel
2. **Mentions**: Type `@advisor hello` in any channel
3. **DMs**: Send a message to your bot

---

## 🧪 **Testing Your Deployment**

### **Health Check**
Visit your app URL + `/health`:
- **Render**: `https://your-app-name.onrender.com/health`
- **Railway**: `https://your-railway-url/health`
- **Fly.io**: `https://your-app-name.fly.dev/health`

You should see:
```json
{"status":"OK","timestamp":"2024-01-01T00:00:00.000Z"}
```

### **Check Logs**
- **Render**: Go to your service → **"Logs"**
- **Railway**: Go to your project → **"Deployments"** → **"View Logs"**
- **Fly.io**: Run `fly logs` in terminal

---

## 🆘 **Common Deployment Issues**

### **"Build failed"**
- Check your `package.json` has all dependencies
- Make sure `src/app.js` exists
- Verify your code has no syntax errors

### **"App not responding"**
- Check your environment variables are set
- Verify your Slack Request URL is correct
- Check the logs for error messages

### **"Invalid token"**
- Make sure you copied the entire token
- Check your bot token hasn't expired
- Verify the app is installed to your workspace

---

## 💰 **Costs**

### **Free Tiers**
- **Render**: 750 hours/month free
- **Railway**: $5/month free credit
- **Fly.io**: 3 shared-cpu-1x apps free

### **Paid Plans**
- **Render**: $7/month for always-on
- **Railway**: Pay per usage
- **Fly.io**: Pay per usage

---

## 🎉 **You're Done!**

After deployment:
1. ✅ Your app runs 24/7
2. ✅ No need to keep your computer on
3. ✅ Slack can reach your app anytime
4. ✅ Your bot responds instantly

**Next steps:**
- Test all bot features
- Add more advisor modes
- Customize responses
- Monitor usage and costs

Happy hosting! 🚀
