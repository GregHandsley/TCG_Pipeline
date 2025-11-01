"""
AI Batch Processing Routes
Handles batch processing with AI Agent orchestration
"""
from __future__ import annotations
import asyncio
import json
from typing import List, Dict, Any
from fastapi import APIRouter, UploadFile, HTTPException, Form, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import base64
from agents import ai_agent, get_realtime_thoughts, clear_realtime_thoughts

router = APIRouter()

class ProcessingOptions(BaseModel):
    remove_background: bool = True
    identify: bool = True
    grade: bool = True
    enhance: bool = False
    generate_description: bool = True

class BatchProcessRequest(BaseModel):
    cards: List[Dict[str, Any]]
    options: ProcessingOptions

class BatchProcessResponse(BaseModel):
    task_id: str
    status: str
    message: str

# Store for background tasks
background_tasks = {}

@router.post("/batch/process")
async def start_batch_processing(
    files: List[UploadFile],
    remove_background: bool = Form(True),
    identify: bool = Form(True),
    grade: bool = Form(True),
    enhance: bool = Form(False),
    generate_description: bool = Form(True)
):
    """
    Start AI Agent batch processing of multiple cards
    """
    try:
        # Convert uploaded files to card data
        cards = []
        for i, file in enumerate(files):
            if not file.filename:
                continue
            
            # Check for HEIC format
            if file.filename.lower().endswith(('.heic', '.heif')):
                raise HTTPException(400, f"HEIC format not supported for file: {file.filename}")
            
            image_bytes = await file.read()
            cards.append({
                "filename": file.filename,
                "image_bytes": image_bytes,
                "card_index": i
            })
        
        if not cards:
            raise HTTPException(400, "No valid image files provided")
        
        # Create processing options
        options = ProcessingOptions(
            remove_background=remove_background,
            identify=identify,
            grade=grade,
            enhance=enhance,
            generate_description=generate_description
        )
        
        # Generate task ID
        import uuid
        task_id = str(uuid.uuid4())
        
        # Start background processing
        background_tasks[task_id] = {
            "status": "processing",
            "progress": 0,
            "results": None,
            "error": None
        }
        
        # Process in background
        asyncio.create_task(_process_batch_background(task_id, cards, options))
        
        return BatchProcessResponse(
            task_id=task_id,
            status="started",
            message=f"Started processing {len(cards)} cards with AI Agent"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to start batch processing: {str(e)}")

@router.get("/batch/status/{task_id}")
async def get_batch_status(task_id: str):
    """
    Get status of batch processing task
    """
    if task_id not in background_tasks:
        raise HTTPException(404, "Task not found")
    
    task = background_tasks[task_id]
    return {
        "task_id": task_id,
        "status": task["status"],
        "progress": task["progress"],
        "results": task["results"],
        "error": task["error"]
    }

@router.get("/batch/results/{task_id}")
async def get_batch_results(task_id: str):
    """
    Get results of completed batch processing
    """
    if task_id not in background_tasks:
        raise HTTPException(404, "Task not found")
    
    task = background_tasks[task_id]
    if task["status"] != "completed":
        raise HTTPException(400, f"Task not completed yet. Status: {task['status']}")
    
    return {
        "task_id": task_id,
        "results": task["results"]
    }

@router.post("/batch/process-sync")
async def process_batch_sync(
    files: List[UploadFile],
    remove_background: bool = Form(True),
    identify: bool = Form(True),
    grade: bool = Form(True),
    enhance: bool = Form(False),
    generate_description: bool = Form(True)
):
    """
    Synchronous batch processing (for smaller batches)
    """
    try:
        # Convert uploaded files to card data
        cards = []
        for i, file in enumerate(files):
            if not file.filename:
                continue
            
            # Check for HEIC format
            if file.filename.lower().endswith(('.heic', '.heif')):
                raise HTTPException(400, f"HEIC format not supported for file: {file.filename}")
            
            image_bytes = await file.read()
            cards.append({
                "filename": file.filename,
                "image_bytes": image_bytes,
                "card_index": i
            })
        
        if not cards:
            raise HTTPException(400, "No valid image files provided")
        
        # Create processing options
        options_dict = {
            "remove_background": remove_background,
            "identify": identify,
            "grade": grade,
            "enhance": enhance,
            "generate_description": generate_description
        }
        
        # Generate session ID for real-time thoughts
        import uuid
        session_id = str(uuid.uuid4())
        
        # Process with AI Agent
        results = await ai_agent.process_batch(cards, options_dict, session_id)
        
        return {
            "success": True,
            "results": results,
            "message": f"Processed {len(cards)} cards successfully",
            "session_id": session_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Batch processing failed: {str(e)}")

@router.post("/batch/process-async")
async def process_batch_async(
    files: List[UploadFile],
    remove_background: bool = Form(True),
    identify: bool = Form(True),
    grade: bool = Form(True),
    enhance: bool = Form(False),
    generate_description: bool = Form(True)
):
    """
    Asynchronous batch processing that starts immediately and returns session ID
    """
    try:
        # Group files into pairs (front, back, front, back, ...)
        # Files are expected to come in pairs: even index = front, odd index = back
        card_pairs = []
        for i in range(0, len(files), 2):
            if i + 1 < len(files):
                # We have both front and back
                front_file = files[i]
                back_file = files[i + 1]
                
                if not front_file.filename or not back_file.filename:
                    continue
                
                # Check for HEIC format
                if front_file.filename.lower().endswith(('.heic', '.heif')):
                    raise HTTPException(400, f"HEIC format not supported for file: {front_file.filename}")
                if back_file.filename.lower().endswith(('.heic', '.heif')):
                    raise HTTPException(400, f"HEIC format not supported for file: {back_file.filename}")
                
                front_bytes = await front_file.read()
                back_bytes = await back_file.read()
                
                # Store as a pair
                card_pairs.append({
                    "pair_index": len(card_pairs),
                    "front": {
                        "filename": front_file.filename,
                        "image_bytes": front_bytes,
                        "card_type": "front"
                    },
                    "back": {
                        "filename": back_file.filename,
                        "image_bytes": back_bytes,
                        "card_type": "back"
                    }
                })
        
        if not card_pairs:
            raise HTTPException(400, "No valid card pairs provided (need front and back for each card)")
        
        # Create processing options
        options_dict = {
            "remove_background": remove_background,
            "identify": identify,
            "grade": grade,
            "enhance": enhance,
            "generate_description": generate_description
        }
        
        # Generate session ID for real-time thoughts
        import uuid
        session_id = str(uuid.uuid4())
        
        # Start processing in background
        async def background_processing():
            try:
                # Create a new AI Agent instance for this session
                from agents import AIAgent
                agent = AIAgent()
                results = await agent.process_batch_pairs(card_pairs, options_dict, session_id)
                # Store results for later retrieval
                background_tasks[session_id] = {
                    "status": "completed",
                    "results": results,
                    "progress": 100
                }
            except Exception as e:
                background_tasks[session_id] = {
                    "status": "failed",
                    "error": str(e),
                    "progress": 0
                }
        
        # Start background task
        asyncio.create_task(background_processing())
        
        # Initialize task status
        background_tasks[session_id] = {
            "status": "pending",
            "progress": 0
        }
        
        return {
            "success": True,
            "session_id": session_id,
            "message": f"Started processing {len(card_pairs)} card pair(s)"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to start batch processing: {str(e)}")

async def _process_batch_background(task_id: str, cards: List[Dict], options: ProcessingOptions):
    """
    Background task for batch processing
    """
    try:
        # Update task status
        background_tasks[task_id]["status"] = "processing"
        background_tasks[task_id]["progress"] = 0
        
        # Convert options to dict
        options_dict = {
            "remove_background": options.remove_background,
            "identify": options.identify,
            "grade": options.grade,
            "enhance": options.enhance,
            "generate_description": options.generate_description
        }
        
        # Process with AI Agent
        results = await ai_agent.process_batch(cards, options_dict)
        
        # Update task with results
        background_tasks[task_id]["status"] = "completed"
        background_tasks[task_id]["progress"] = 100
        background_tasks[task_id]["results"] = results
        
    except Exception as e:
        # Update task with error
        background_tasks[task_id]["status"] = "failed"
        background_tasks[task_id]["error"] = str(e)
        background_tasks[task_id]["progress"] = 0

@router.get("/agent/thoughts/{task_id}")
async def get_agent_thoughts(task_id: str):
    """
    Get AI Agent's thought process for a task
    """
    if task_id not in background_tasks:
        raise HTTPException(404, "Task not found")
    
    task = background_tasks[task_id]
    if task["status"] != "completed":
        raise HTTPException(400, f"Task not completed yet. Status: {task['status']}")
    
    results = task.get("results", {})
    thought_log = results.get("thought_log", [])
    
    return {
        "task_id": task_id,
        "thought_log": thought_log,
        "processing_plan": results.get("processing_plan", {}),
        "summary": results.get("summary", {})
    }

@router.get("/agent/thoughts-realtime/{session_id}")
async def get_realtime_thoughts_endpoint(session_id: str):
    """
    Get real-time AI Agent thoughts for a session
    """
    thoughts = get_realtime_thoughts(session_id)
    return {"session_id": session_id, "thoughts": thoughts}

@router.get("/agent/stream/{session_id}")
async def stream_agent_thoughts(session_id: str):
    """
    Stream AI Agent thoughts in real-time using Server-Sent Events
    """
    async def event_generator():
        # Send initial connection message to keep EventSource open
        yield f": connected\n\n"
        
        last_count = 0
        timeout_count = 0
        max_timeout = 120  # 120 seconds timeout (increased for longer processing)
        check_interval = 0.5  # Check every 500ms
        
        while timeout_count < max_timeout:
            thoughts = get_realtime_thoughts(session_id)
            if len(thoughts) > last_count:
                # Send new thoughts
                for thought in thoughts[last_count:]:
                    yield f"data: {json.dumps(thought)}\n\n"
                last_count = len(thoughts)
                timeout_count = 0  # Reset timeout when we get new thoughts
            
            # Check if processing is complete
            if session_id in background_tasks:
                task_status = background_tasks[session_id]["status"]
                if task_status == "completed":
                    yield f"data: {json.dumps({'type': 'complete', 'message': 'Processing complete'})}\n\n"
                    break
                elif task_status == "failed":
                    error_msg = background_tasks[session_id].get("error", "Unknown error")
                    yield f"data: {json.dumps({'type': 'error', 'message': f'Processing failed: {error_msg}'})}\n\n"
                    break
            
            # If no new thoughts and no background task yet, wait a bit before timing out
            if len(thoughts) == last_count and session_id not in background_tasks:
                # Still waiting for processing to start, don't timeout yet
                timeout_count = 0
            
            # Only increment timeout if we've had thoughts but no new ones for a while
            if len(thoughts) == last_count and session_id in background_tasks:
                timeout_count += 1
            
            await asyncio.sleep(check_interval)
        
        # Timeout reached
        yield f"data: {json.dumps({'type': 'timeout', 'message': 'Processing timeout'})}\n\n"
    
    response = StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
    )
    
    # Add required headers for SSE
    response.headers["Cache-Control"] = "no-cache"
    response.headers["Connection"] = "keep-alive"
    response.headers["X-Accel-Buffering"] = "no"  # Disable nginx buffering
    
    return response
