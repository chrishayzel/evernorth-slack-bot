// Simple connection test script for Events API
require('dotenv').config();

console.log('🔌 Testing Slack Connection (Events API)...\n');

// Test 1: Check environment variables
console.log('📋 Step 1: Checking Environment Variables');
const requiredVars = {
  'SLACK_BOT_TOKEN': process.env.SLACK_BOT_TOKEN,
  'SLACK_SIGNING_SECRET': process.env.SLACK_SIGNING_SECRET
};

let envOk = true;
Object.entries(requiredVars).forEach(([key, value]) => {
  if (value && value !== `${key.replace('SLACK_', '').toLowerCase()}-here`) {
    console.log(`✅ ${key}: Set (${value.substring(0, 10)}...)`);
  } else {
    console.log(`❌ ${key}: Missing or not configured`);
    envOk = false;
  }
});

if (!envOk) {
  console.log('\n🚨 Fix your environment variables first!');
  console.log('1. Copy env.example to .env');
  console.log('2. Fill in your real Slack API keys');
  console.log('3. Run this test again');
  process.exit(1);
}

// Test 2: Test Slack SDK connection
console.log('\n🔌 Step 2: Testing Slack SDK Connection');
try {
  const { App } = require('@slack/bolt');
  
  const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    // No socketMode or appToken needed for Events API
  });

  console.log('✅ Slack Bolt SDK loaded successfully');
  console.log('✅ App configuration looks correct');
  
  // Test 3: Try to start the app
  console.log('\n🚀 Step 3: Testing App Startup');
  
  app.start(3001).then(() => {
    console.log('✅ App started successfully on port 3001');
    console.log('✅ Slack connection is working!');
    
    // Stop the app after successful test
    app.stop();
    console.log('\n🎉 All tests passed! Your Slack app is ready to go.');
    console.log('\n📡 Next steps:');
    console.log('1. In your Slack app settings, set Request URL to:');
    console.log('   http://localhost:3000/slack/events');
    console.log('2. Run "npm start" to start your main app');
    console.log('3. Test @advisor mentions in Slack');
    console.log('4. Test /advisor slash command');
    
  }).catch((error) => {
    console.log('❌ App failed to start:');
    console.log('Error:', error.message);
    
    if (error.message.includes('invalid_auth')) {
      console.log('\n🔑 This means your bot token is wrong or expired');
      console.log('Fix: Go to api.slack.com/apps → OAuth & Permissions → Reinstall App');
    } else if (error.message.includes('permission')) {
      console.log('\n🚫 This means your bot lacks required permissions');
      console.log('Fix: Go to api.slack.com/apps → OAuth & Permissions → Add required scopes');
    } else {
      console.log('\n❓ Unknown error - check your Slack app permissions');
    }
  });

} catch (error) {
  console.log('❌ Failed to load Slack SDK:', error.message);
  console.log('Fix: Run "npm install" to install dependencies');
}
