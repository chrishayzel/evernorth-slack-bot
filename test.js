// Simple test script to verify your setup
require('dotenv').config();

console.log('🧪 Testing Slack Advisor App Setup...\n');

// Check environment variables
const requiredEnvVars = [
  'SLACK_BOT_TOKEN',
  'SLACK_SIGNING_SECRET', 
  'SLACK_APP_TOKEN',
  'OPENAI_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('📋 Checking Environment Variables:');
let allEnvVarsPresent = true;

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value && value !== `${varName}-here`) {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`❌ ${varName}: Missing or not configured`);
    allEnvVarsPresent = false;
  }
});

console.log('\n🔧 Testing Dependencies:');
try {
  require('@slack/bolt');
  console.log('✅ Slack Bolt SDK: Installed');
} catch (error) {
  console.log('❌ Slack Bolt SDK: Not installed - run "npm install"');
}

try {
  require('openai');
  console.log('✅ OpenAI SDK: Installed');
} catch (error) {
  console.log('❌ OpenAI SDK: Not installed - run "npm install"');
}

try {
  require('@supabase/supabase-js');
  console.log('✅ Supabase SDK: Installed');
} catch (error) {
  console.log('❌ Supabase SDK: Not installed - run "npm install"');
}

console.log('\n📁 Checking Project Structure:');
const fs = require('fs');

const requiredFiles = [
  'src/app.js',
  'src/services/vectorService.js',
  'src/services/advisorModeService.js',
  'package.json',
  'README.md'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}: Exists`);
  } else {
    console.log(`❌ ${file}: Missing`);
  }
});

console.log('\n🎯 Summary:');
if (allEnvVarsPresent) {
  console.log('✅ All environment variables are configured!');
  console.log('✅ You can now run "npm start" to start your app');
} else {
  console.log('❌ Some environment variables are missing');
  console.log('📝 Copy env.example to .env and fill in your API keys');
}

console.log('\n🚀 Next Steps:');
console.log('1. Run "npm install" to install dependencies');
console.log('2. Set up your Slack app at api.slack.com/apps');
console.log('3. Get your OpenAI API key at platform.openai.com');
console.log('4. Create a Supabase project at supabase.com');
console.log('5. Update your .env file with real API keys');
console.log('6. Run "npm start" to test locally');
console.log('7. Deploy to Render/Railway/Fly.io for production');
