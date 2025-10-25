# 🤖 AI Agent Architecture for TCG Pipeline

## Overview

The TCG Pipeline now features an **AI Agent** that intelligently orchestrates the entire card processing workflow. Instead of manual API calls, you can now:

1. **Upload multiple cards** at once
2. **Select processing options** (background removal, identification, grading, etc.)
3. **Watch the AI Agent work** with real-time thought process
4. **Get intelligent results** with automatic error handling

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend     │    │   AI Agent      │    │   MCP Server   │
│   (React UI)   │───▶│   (ChatGPT)     │───▶│   (Tools)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Ximilar API  │
                       │   OpenAI API   │
                       └─────────────────┘
```

## Components

### 1. **MCP Server** (`apps/api/mcp_server.py`)
- Exposes existing tools as MCP functions
- Handles background removal, identification, grading, enhancement
- Provides batch processing capabilities
- Runs on port 8001

### 2. **AI Agent** (`apps/api/ai_agent.py`)
- Uses ChatGPT to orchestrate workflow
- Makes intelligent decisions about tool usage
- Logs thought process for transparency
- Handles errors gracefully

### 3. **Batch API** (`apps/api/routes/ai_batch.py`)
- Provides endpoints for batch processing
- Supports both sync and async processing
- Returns real-time status and results

### 4. **Frontend UI** (`apps/web/src/features/ai-agent/AIAgentProcessor.tsx`)
- Real-time thought process display
- Processing options selection
- Results visualization
- Error handling and status updates

## How to Use

### 1. Start the Services

```bash
# Terminal 1: Start main API
cd infra/docker
docker compose up --build api

# Terminal 2: Start MCP Server
cd apps/api
python start_mcp_server.py

# Terminal 3: Start Frontend
cd apps/web
npm run dev
```

### 2. Access the AI Agent

Visit: `http://localhost:5173`

### 3. Process Cards

1. **Upload multiple card images**
2. **Select processing options:**
   - ✅ Remove Background (Required)
   - ✅ Identify Card
   - ✅ Grade Card
   - ⚪ Enhance Image (Optional)
   - ✅ Generate Description
3. **Click "Start AI Processing"**
4. **Watch the AI Agent work:**
   ```
   🤖 AI Agent (start): Starting batch processing of 3 cards
   🤖 AI Agent (planning): Processing plan: Sequential workflow
   🤖 AI Agent (processing): Processing card 1/3
   🤖 AI Agent (step): Card 1: remove_background - Isolate card from background
   ✅ AI Agent (success): Card 1: Background removed successfully
   🔍 AI Agent (step): Card 1: identify_card - Determine card identity
   ✅ AI Agent (success): Card 1: Identified as Charizard Base Set #4 (94% confidence)
   📊 AI Agent (step): Card 1: grade_card - Assess card condition
   ✅ AI Agent (success): Card 1: Graded successfully
   📝 AI Agent (step): Card 1: generate_description - Create eBay listing
   ✅ AI Agent (success): Card 1: Description generated successfully
   ```

## API Endpoints

### Batch Processing
- `POST /ai/batch/process-sync` - Synchronous batch processing
- `POST /ai/batch/process` - Asynchronous batch processing
- `GET /ai/batch/status/{task_id}` - Get processing status
- `GET /ai/batch/results/{task_id}` - Get processing results
- `GET /ai/agent/thoughts/{task_id}` - Get AI Agent thought process

### MCP Tools
- `GET /mcp/tools` - List available tools
- `POST /mcp/call` - Call MCP tool

## Processing Options

| Option | Description | Required |
|--------|-------------|----------|
| `remove_background` | Crop/isolate the card | ✅ Yes |
| `identify` | Identify what card it is | ✅ Yes |
| `grade` | Assess card condition | ✅ Yes |
| `enhance` | Improve image quality | ⚪ Optional |
| `generate_description` | Create eBay listing | ✅ Yes |

## AI Agent Features

### 🧠 **Intelligent Decision Making**
- Analyzes user requirements
- Creates optimal processing plans
- Handles errors gracefully
- Makes smart retry decisions

### 📝 **Transparent Thought Process**
- Real-time logging of decisions
- Step-by-step reasoning
- Error explanations
- Progress tracking

### 🔄 **Flexible Workflows**
- User can select which steps to run
- Agent adapts to requirements
- Handles partial failures
- Optimizes for efficiency

### 📊 **Comprehensive Results**
- Individual card results
- Batch processing summary
- Success/failure rates
- Detailed error reporting

## Example Workflow

```typescript
// User uploads 3 cards and selects:
// ✅ Remove Background
// ✅ Identify Card  
// ✅ Grade Card
// ⚪ Enhance Image (skipped)
// ✅ Generate Description

// AI Agent processes:
// 1. Remove backgrounds from all 3 cards
// 2. Identify each card
// 3. Grade each card
// 4. Generate eBay descriptions
// 5. Return comprehensive results
```

## Error Handling

The AI Agent handles errors intelligently:

- **Background removal fails** → Continue with original image
- **Identification fails** → Skip grading and description
- **Grading fails** → Continue with description
- **Description fails** → Mark for manual review

## Benefits

✅ **User-Friendly** - Simple button interface  
✅ **Intelligent** - AI makes smart decisions  
✅ **Transparent** - See exactly what's happening  
✅ **Flexible** - Choose your processing options  
✅ **Robust** - Handles errors gracefully  
✅ **Scalable** - Process multiple cards efficiently  

## Next Steps

1. **Test the workflow** with real card images
2. **Customize processing options** for your needs
3. **Add new tools** to the MCP server
4. **Enhance the AI Agent** with more intelligence
5. **Integrate with your existing workflow**

The AI Agent transforms your TCG pipeline from a collection of tools into an intelligent, automated system that thinks and adapts to your needs! 🚀
