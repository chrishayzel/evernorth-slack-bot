# 🧠 Memory System Setup Guide

## 🚀 **Quick Start**

Your Slack advisor bot now has **Supabase-powered long-term memory**! Here's how to set it up:

## 📋 **Prerequisites**

Make sure you have these environment variables in your `.env` file:
```bash
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
OPENAI_API_KEY=your-openai-api-key
OPENAI_ASSISTANT_ID=your-assistant-id
```

## 🗄️ **Step 1: Set Up Database Tables**

1. **Go to your Supabase dashboard**
2. **Click "SQL Editor"** in the left sidebar
3. **Run the SQL from `setup-database.sql`**:
   ```sql
   -- Copy and paste the contents of setup-database.sql
   ```
4. **Run the SQL from `supabase-functions.sql`**:
   ```sql
   -- Copy and paste the contents of supabase-functions.sql
   ```

## 📚 **Step 2: Ingest Sample Data**

1. **Run the ingestion script**:
   ```bash
   npm run ingest
   ```
   
   This will:
   - Read `evernorth-values.txt`
   - Split into ~800 character chunks
   - Generate embeddings using OpenAI
   - Store in Supabase

## 🧪 **Step 3: Test the Memory System**

### **Test Knowledge Storage**
In Slack, try:
```
@North remember that Evernorth's mission is to transform health care by making it more accessible, affordable, and personalized
```

### **Test Knowledge Retrieval**
In Slack, try:
```
@North what's our mission?
@North what are our core values?
@North tell me about our services
```

## 🔧 **How It Works**

### **Memory Storage**
- **Keywords**: `remember that`, `store this`, `save this`, `note that`
- **Process**: Message → Embedding → Supabase storage
- **Response**: Confirmation of what was stored

### **Memory Retrieval**
- **Process**: Query → Embedding → Vector search → Context → OpenAI Assistant
- **Result**: Informed responses using stored knowledge

### **Conversation Memory**
- **Thread Mapping**: Slack threads → OpenAI threads
- **Context**: Previous messages included in responses
- **Persistence**: Conversations remembered across sessions

## 📊 **Database Schema**

### **`documents` Table**
- `id`: Unique identifier
- `content`: Text chunk content
- `embedding`: Vector representation (1536 dimensions)
- `metadata`: JSON with source, timestamp, etc.

### **`threads` Table**
- `id`: Unique identifier
- `slack_thread_id`: Slack conversation identifier
- `assistant_thread_id`: OpenAI thread identifier
- `mode`: Advisor mode (default: 'advisor')

## 🚨 **Troubleshooting**

### **Common Issues**

1. **"pgvector extension not found"**
   - Run the extension creation SQL first
   - Make sure your Supabase plan supports pgvector

2. **"match_documents function not found"**
   - Run the function creation SQL from `supabase-functions.sql`

3. **"Embedding generation failed"**
   - Check your OpenAI API key and quota
   - Verify the `text-embedding-3-small` model is available

4. **"Memory service not working"**
   - Check Supabase connection
   - Verify environment variables
   - Check Render logs for errors

### **Debug Commands**

```bash
# Test Supabase connection
npm run test

# Check environment variables
node -e "console.log(process.env.SUPABASE_URL)"

# Test ingestion locally
node ingest.js evernorth-values.txt
```

## 🔄 **Adding New Knowledge**

### **Method 1: Through Slack**
```
@North remember that [new information]
```

### **Method 2: Through Ingestion Script**
1. **Create a new text file** with your content
2. **Run ingestion**:
   ```bash
   node ingest.js your-new-file.txt
   ```

### **Method 3: Direct Database Insert**
Use Supabase dashboard to manually insert documents with embeddings.

## 📈 **Performance Tips**

- **Chunk Size**: 800 characters is optimal for most use cases
- **Similarity Threshold**: 0.7 provides good balance of relevance/recall
- **Max Results**: 3-5 documents usually sufficient for context
- **Rate Limiting**: Built-in delays prevent OpenAI API throttling

## 🎯 **Next Steps**

1. **Customize the sample data** in `evernorth-values.txt`
2. **Add your own knowledge base** through ingestion
3. **Test with real questions** in Slack
4. **Monitor performance** in Supabase dashboard
5. **Add more advisor modes** using the existing framework

## 🆘 **Need Help?**

- **Check Render logs** for runtime errors
- **Verify Supabase tables** exist and have data
- **Test individual components** using the test scripts
- **Review environment variables** are correctly set

Your bot now has **superhuman memory**! 🧠✨
