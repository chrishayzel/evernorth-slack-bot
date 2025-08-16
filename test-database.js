import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection and content...');
    
    // Test 1: Check if shared_knowledge table has data
    console.log('\n📊 Checking shared_knowledge table...');
    const { data: knowledgeData, error: knowledgeError } = await supabase
      .from('shared_knowledge')
      .select('*')
      .limit(5);
    
    if (knowledgeError) {
      console.error('❌ Error reading shared_knowledge:', knowledgeError);
    } else {
      console.log(`✅ Found ${knowledgeData.length} documents in shared_knowledge`);
      if (knowledgeData.length > 0) {
        console.log('First document preview:', knowledgeData[0].content.substring(0, 100) + '...');
      }
    }
    
    // Test 2: Check if the function exists by trying to call it
    console.log('\n🔍 Testing match_shared_knowledge function...');
    const { data: functionData, error: functionError } = await supabase.rpc('match_shared_knowledge', {
      query_embedding: [0.1, 0.2, 0.3, ...Array(1533).fill(0.1)], // Dummy embedding
      match_threshold: 0.1,
      match_count: 1
    });
    
    if (functionError) {
      console.error('❌ Error calling match_shared_knowledge function:', functionError);
      console.log('This suggests the function might not exist or has an issue');
    } else {
      console.log('✅ Function exists and can be called');
    }
    
    // Test 3: Check advisor_profiles
    console.log('\n👥 Checking advisor profiles...');
    const { data: profileData, error: profileError } = await supabase
      .from('advisor_profiles')
      .select('*');
    
    if (profileError) {
      console.error('❌ Error reading advisor_profiles:', profileError);
    } else {
      console.log(`✅ Found ${profileData.length} advisor profiles`);
      profileData.forEach(profile => {
        console.log(`- ${profile.advisor_id}: ${profile.display_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDatabase();
