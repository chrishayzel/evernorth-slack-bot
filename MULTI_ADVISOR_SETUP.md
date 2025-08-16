# 🎯 Multi-Advisor System Setup Guide

## 🚀 **Overview**

Your Slack app now supports **multiple specialized advisors** with:
- **Individual databases** for each advisor's short-term memory
- **Shared knowledge base** accessible by all advisors
- **Advisor-specific personalities** and expertise areas
- **Seamless conversation memory** across sessions

## 🎭 **Available Advisors**

### **1. North** (General Advisor)
- **Slash Command**: `/north`
- **Mention**: `@north`
- **Expertise**: General questions, company info, process help
- **Personality**: Helpful, knowledgeable, approachable

### **2. Strategist** (Strategic Planning)
- **Slash Command**: `/strategist`
- **Mention**: `@strategist`
- **Expertise**: Business strategy, planning, strategic thinking
- **Personality**: Analytical, forward-thinking, strategic

### **3. Ops** (Operations)
- **Slash Command**: `/ops`
- **Mention**: `@ops`
- **Expertise**: Operations, process optimization, efficiency
- **Personality**: Practical, process-oriented, improvement-focused

### **4. Content** (Content & Communication)
- **Slash Command**: `/content`
- **Mention**: `@content`
- **Expertise**: Content creation, communication strategies, messaging
- **Personality**: Creative, communicative, brand-aware

## 🗄️ **Database Architecture**

### **Shared Knowledge Base** (`shared_knowledge`)
- **Purpose**: Long-term knowledge accessible by ALL advisors
- **Content**: Company values, policies, procedures, general information
- **Access**: Read-only for all advisors, write access for knowledge storage

### **Advisor Threads** (`advisor_threads`)
- **Purpose**: Maps Slack conversations to OpenAI threads for each advisor
- **Isolation**: Each advisor maintains separate conversation contexts
- **Persistence**: Conversations remembered across sessions

### **Advisor Memory** (`advisor_memory`)
- **Purpose**: Short-term, advisor-specific memory
- **Examples**: User preferences, current context, recent topics
- **Expiration**: Can be set to expire (temporary) or permanent

### **Advisor Profiles** (`advisor_profiles`)
- **Purpose**: Defines each advisor's personality and capabilities
- **Customization**: System prompts, descriptions, specializations
- **Activation**: Enable/disable specific advisors

## 🔧 **Setup Instructions**

### **Step 1: Database Setup**
1. **Run the updated SQL** from `setup-database.sql`
2. **Run the functions** from `supabase-functions.sql`
3. **Verify tables** are created successfully

### **Step 2: Choose Your Mode**

#### **Option A: Single Advisor (Current)**
```bash
npm start
# Uses src/app.js - North only
```

#### **Option B: Multi-Advisor (New)**
```bash
npm run start:multi
# Uses src/app-multi-advisor.js - All advisors
```

### **Step 3: Ingest Shared Knowledge**
```bash
npm run ingest
# Stores knowledge in shared_knowledge table
```

## 🧪 **Testing the Multi-Advisor System**

### **Test Knowledge Sharing**
1. **Store knowledge with North**:
   ```
   @north remember that Evernorth's mission is to transform health care
   ```

2. **Ask other advisors**:
   ```
   @strategist what's our mission?
   @ops tell me about our company mission
   @content what should I know about Evernorth's mission?
   ```

3. **Verify shared access** - All advisors should have the same information!

### **Test Individual Personalities**
1. **Ask strategic questions**:
   ```
   @strategist how should we approach this business challenge?
   ```

2. **Ask operational questions**:
   ```
   @ops how can we improve this process?
   ```

3. **Ask content questions**:
   ```
   @content how should we communicate this message?
   ```

## 🔄 **How It Works**

### **Message Flow**
1. **User mentions** `@strategist` or uses `/strategist`
2. **System detects** advisor type from mention/command
3. **Retrieves advisor profile** (personality, expertise, system prompt)
4. **Searches shared knowledge** for relevant information
5. **Creates context** combining advisor profile + shared knowledge
6. **Generates response** using OpenAI Assistant with context
7. **Stores conversation** in advisor-specific thread
8. **Updates short-term memory** for the specific advisor

### **Memory Isolation**
- **North's conversations** → Stored in `advisor_threads` with `advisor_id = 'north'`
- **Strategist's conversations** → Stored in `advisor_threads` with `advisor_id = 'strategist'`
- **Shared knowledge** → Stored in `shared_knowledge` accessible by all

## 🎨 **Customizing Advisors**

### **Add New Advisor**
1. **Insert into `advisor_profiles`**:
   ```sql
   INSERT INTO advisor_profiles (advisor_id, display_name, description, system_prompt, capabilities) 
   VALUES ('analyst', 'Analyst', 'Data analysis and insights advisor', 'You are the Analyst, focused on data interpretation and insights...', '{"data_analysis": true, "insights": true}');
   ```

2. **Add slash command handler** in `app-multi-advisor.js`
3. **Add mention detection** in `detectAdvisor()` function

### **Modify Existing Advisor**
1. **Update profile** in `advisor_profiles` table
2. **Change system prompt** for different personality
3. **Adjust capabilities** for new expertise areas

## 🚨 **Troubleshooting**

### **Common Issues**

1. **"Advisor profile not found"**
   - Check `advisor_profiles` table exists
   - Verify advisor_id matches exactly

2. **"Shared knowledge not accessible"**
   - Run `setup-database.sql` first
   - Check `shared_knowledge` table exists

3. **"Conversation memory not working"**
   - Verify `advisor_threads` table exists
   - Check thread mapping is working

### **Debug Commands**

```bash
# Test single advisor mode
npm start

# Test multi-advisor mode
npm run start:multi

# Test knowledge ingestion
npm run ingest

# Check database connection
node -e "import('./src/services/multiAdvisorMemoryService.js').then(m => console.log('Memory service loaded'))"
```

## 📈 **Performance Considerations**

- **Shared knowledge search** uses vector similarity (fast)
- **Advisor-specific memory** uses indexed lookups (fast)
- **Conversation storage** uses OpenAI threads (persistent)
- **Memory cleanup** can be scheduled for expired items

## 🎯 **Next Steps**

1. **Test the multi-advisor system** with different questions
2. **Customize advisor personalities** in the database
3. **Add more specialized advisors** as needed
4. **Monitor performance** and adjust thresholds
5. **Implement memory cleanup** for expired items

## 🆘 **Need Help?**

- **Check Render logs** for runtime errors
- **Verify database tables** exist and have data
- **Test individual components** using the test scripts
- **Review advisor profiles** in Supabase dashboard

Your bot is now a **team of specialized advisors** with **perfect memory** and **shared knowledge**! 🎭🧠✨
