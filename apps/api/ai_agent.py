"""
AI Agent for TCG Pipeline
Uses ChatGPT to orchestrate MCP tools with thought process logging
"""
from __future__ import annotations
import asyncio
import json
import httpx
from typing import Any, Dict, List, Optional
from fastapi import HTTPException
from core.settings import settings
from openai import OpenAI

# Global store for real-time thoughts
_realtime_thoughts: Dict[str, List[Dict[str, Any]]] = {}

def get_realtime_thoughts(session_id: str) -> List[Dict[str, Any]]:
    """Get real-time thoughts for a session"""
    return _realtime_thoughts.get(session_id, [])

def clear_realtime_thoughts(session_id: str):
    """Clear real-time thoughts for a session"""
    if session_id in _realtime_thoughts:
        del _realtime_thoughts[session_id]

class AIAgent:
    """
    AI Agent that orchestrates TCG processing workflow
    Uses ChatGPT to make intelligent decisions about tool usage
    """
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)
        # Use host.docker.internal to reach the host machine from Docker
        self.mcp_base_url = "http://localhost:8001"  # MCP Server URL
        self.thought_log = []
    
    def log_thought(self, thought: str, step: str = "processing"):
        """Log agent's thought process with user-friendly language"""
        # Convert technical language to user-friendly messages
        friendly_thought = self._make_thought_friendly(thought, step)
        
        thought_entry = {
            "step": step,
            "thought": friendly_thought,
            "timestamp": asyncio.get_event_loop().time()
        }
        
        self.thought_log.append(thought_entry)
        print(f"🤖 AI Agent ({step}): {friendly_thought}")
        
        # Store in global real-time thoughts if we have a session_id
        if hasattr(self, 'session_id') and self.session_id:
            if self.session_id not in _realtime_thoughts:
                _realtime_thoughts[self.session_id] = []
            _realtime_thoughts[self.session_id].append(thought_entry)
            print(f"📡 Stored thought for session {self.session_id}: {friendly_thought}")
        else:
            print(f"⚠️ No session_id available for thought: {friendly_thought}")
    
    def _make_thought_friendly(self, thought: str, step: str) -> str:
        """Convert technical AI thoughts to user-friendly language"""
        
        # Handle specific patterns and make them more conversational
        if "Starting batch processing" in thought:
            return f"Let me process your {thought.split('of ')[1].split(' cards')[0]} card(s)!"
        
        elif "AI created processing plan" in thought:
            return "I'm planning the best way to process your card..."
        
        elif "Processing plan:" in thought:
            return "Here's my plan: I'll remove the background, identify the card, grade its condition, and create an eBay listing."
        
        elif "Processing card" in thought:
            return f"Working on your card now..."
        
        elif "remove_background" in thought and "Clean up" in thought:
            return "✂️ Removing the background to focus on your card..."
        
        elif "identify_card" in thought and "Find out" in thought:
            return "🔍 Identifying what card this is..."
        
        elif "grade_card" in thought and "Check" in thought:
            return "📊 Grading the card's condition..."
        
        elif "generate_description" in thought and "Create" in thought:
            return "📝 Creating your eBay listing..."
        
        elif "Background removed successfully" in thought:
            return "✅ Background removed! Your card is now isolated."
        
        elif "Identified as" in thought and "confidence" in thought:
            card_name = thought.split("Identified as ")[1].split(" (")[0]
            confidence = thought.split("(")[1].split("%")[0]
            return f"✅ Found it! This is a {card_name} card ({confidence}% confidence)."
        
        elif "Graded successfully" in thought:
            return "✅ Card condition assessed! I've analyzed the corners, edges, and surface."
        
        elif "Description generated successfully" in thought:
            return "✅ Your eBay listing is ready! I've created a title and description."
        
        elif "Batch processing complete" in thought:
            return "🎉 All done! Your card has been fully processed and is ready for eBay."
        
        elif "success_rate" in thought:
            return "🎉 Processing complete! Everything went smoothly."
        
        # Default: return the original thought if no pattern matches
        return thought
    
    async def call_mcp_tool(self, method: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Call MCP tool and return result"""
        try:
            self.log_thought(f"Calling MCP tool: {method}", "step")
            print(f"🔧 Calling MCP tool: {method} with params: {list(params.keys())}")
            
            # Convert image_bytes to base64 if present
            if "image_bytes" in params and isinstance(params["image_bytes"], bytes):
                import base64
                params["image_bytes"] = base64.b64encode(params["image_bytes"]).decode('utf-8')
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.mcp_base_url}/mcp/call",
                    json={"method": method, "params": params},
                    timeout=120.0
                )
                result = response.json()
                
                if result.get("error"):
                    raise Exception(f"MCP Error: {result['error']}")
                
                print(f"✅ MCP tool {method} completed successfully")
                return result.get("result", {})
        
        except Exception as e:
            self.log_thought(f"Error calling MCP tool {method}: {str(e)}", "error")
            print(f"❌ MCP tool {method} failed: {str(e)}")
            raise
    
    async def process_batch(self, cards: List[Dict], user_options: Dict[str, bool], session_id: str = None) -> Dict[str, Any]:
        """
        Process a batch of cards using AI Agent orchestration
        """
        self.thought_log = []  # Reset thought log
        self.session_id = session_id  # Set session ID for real-time thoughts
        self.log_thought(f"Starting batch processing of {len(cards)} cards", "start")
        
        # Analyze user options and make intelligent decisions
        processing_plan = await self._create_processing_plan(cards, user_options)
        self.log_thought(f"Processing plan: {processing_plan}", "planning")
        
        # Execute the processing plan
        results = await self._execute_processing_plan(cards, processing_plan)
        
        # Generate final summary
        summary = await self._generate_summary(results)
        self.log_thought(f"Batch processing complete: {summary}", "complete")
        
        return {
            "results": results,
            "summary": summary,
            "thought_log": self.thought_log,
            "processing_plan": processing_plan
        }
    
    async def _create_processing_plan(self, cards: List[Dict], user_options: Dict[str, bool]) -> Dict[str, Any]:
        """Use AI to create an intelligent processing plan"""
        
        # Analyze the cards and user requirements
        analysis_prompt = f"""
        You are an AI agent processing trading cards. Create a simple, user-friendly processing plan.

        User Options: {user_options}
        Number of Cards: {len(cards)}
        
        Available Tools (ONLY use these):
        - remove_background: Clean up the card image
        - identify_card: Find out what card it is
        - grade_card: Check the card's condition
        - enhance_image: Make the image look better
        - generate_description: Create an eBay listing
        
        Create a simple plan that:
        1. ONLY uses the tools listed above
        2. Follows a logical order (clean → identify → grade → list)
        3. Uses friendly, conversational language
        4. Focuses on what the user will see
        5. Keeps it simple and clear
        
        IMPORTANT: Do NOT include any orientation or rotation steps. Only use the tools listed above.
        
        Return a JSON plan with steps and reasoning.
        """
        
        try:
            response = self.client.chat.completions.create(
                model=settings.llm_model,
                messages=[
                    {"role": "system", "content": "You are a friendly AI assistant that helps process trading cards. Use simple, conversational language that users can easily understand."},
                    {"role": "user", "content": analysis_prompt}
                ],
                temperature=0.3
            )
            
            plan_text = response.choices[0].message.content
            self.log_thought(f"AI created processing plan: {plan_text}", "planning")
            
            # Parse the plan (fallback to default if parsing fails)
            try:
                plan = json.loads(plan_text)
            except:
                plan = self._default_processing_plan(user_options)
            
            return plan
            
        except Exception as e:
            self.log_thought(f"Error creating processing plan: {str(e)}", "error")
            return self._default_processing_plan(user_options)
    
    def _default_processing_plan(self, user_options: Dict[str, bool]) -> Dict[str, Any]:
        """Default processing plan based on user options"""
        return {
            "steps": [
                {"name": "remove_background", "enabled": user_options.get("remove_background", True), "reason": "Clean up the card image"},
                {"name": "identify_card", "enabled": user_options.get("identify", True), "reason": "Find out what card it is"},
                {"name": "grade_card", "enabled": user_options.get("grade", True), "reason": "Check the card's condition"},
                {"name": "enhance_image", "enabled": user_options.get("enhance", False), "reason": "Make the image look better"},
                {"name": "generate_description", "enabled": user_options.get("generate_description", True), "reason": "Create an eBay listing"}
            ],
            "reasoning": "I'll process your card step by step to get the best results"
        }
    
    async def _execute_processing_plan(self, cards: List[Dict], plan: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Execute the processing plan on all cards"""
        results = []
        
        for i, card in enumerate(cards):
            self.log_thought(f"Processing card {i+1}/{len(cards)}", "processing")
            card_result = await self._process_single_card(card, plan, i)
            results.append(card_result)
        
        return results
    
    async def _process_single_card(self, card: Dict, plan: Dict[str, Any], card_index: int) -> Dict[str, Any]:
        """Process a single card following the plan"""
        card_result = {
            "card_index": card_index,
            "steps_completed": [],
            "results": {},
            "errors": [],
            "agent_thoughts": []
        }
        
        current_image = card.get("image_bytes")
        
        for step in plan["steps"]:
            if not step["enabled"]:
                continue
            
            step_name = step["name"]
            self.log_thought(f"Card {card_index+1}: {step_name} - {step['reason']}", "step")
            
            try:
                if step_name == "remove_background":
                    result = await self.call_mcp_tool("remove_background", {"image_bytes": current_image})
                    if result.get("success"):
                        current_image = result["processed_image"]
                        card_result["results"]["background_removed"] = result["processed_image"]
                        card_result["steps_completed"].append("background_removed")
                        self.log_thought(f"Card {card_index+1}: Background removed successfully", "success")
                    else:
                        card_result["errors"].append(f"Background removal failed: {result.get('error')}")
                        self.log_thought(f"Card {card_index+1}: Background removal failed", "error")
                
                elif step_name == "identify_card":
                    result = await self.call_mcp_tool("identify_card", {"image_bytes": current_image})
                    if result.get("success"):
                        card_result["results"]["identification"] = result["identification"]
                        card_result["steps_completed"].append("identified")
                        card_name = result["identification"].get("best", {}).get("name", "Unknown")
                        confidence = result["identification"].get("confidence", 0.0)
                        self.log_thought(f"Card {card_index+1}: Identified as {card_name} ({confidence:.1%} confidence)", "success")
                    else:
                        card_result["errors"].append(f"Identification failed: {result.get('error')}")
                        self.log_thought(f"Card {card_index+1}: Identification failed", "error")
                
                elif step_name == "grade_card":
                    result = await self.call_mcp_tool("grade_card", {"image_bytes": current_image})
                    if result.get("success"):
                        card_result["results"]["grade"] = result["grade"]
                        card_result["steps_completed"].append("graded")
                        self.log_thought(f"Card {card_index+1}: Graded successfully", "success")
                    else:
                        card_result["errors"].append(f"Grading failed: {result.get('error')}")
                        self.log_thought(f"Card {card_index+1}: Grading failed", "error")
                
                elif step_name == "enhance_image":
                    result = await self.call_mcp_tool("enhance_image", {"image_bytes": current_image})
                    if result.get("success"):
                        current_image = result["enhanced_image"]
                        card_result["results"]["enhanced"] = result["enhanced_image"]
                        card_result["steps_completed"].append("enhanced")
                        self.log_thought(f"Card {card_index+1}: Image enhanced successfully", "success")
                    else:
                        card_result["errors"].append(f"Enhancement failed: {result.get('error')}")
                        self.log_thought(f"Card {card_index+1}: Enhancement failed", "error")
                
                elif step_name == "generate_description":
                    id_data = card_result["results"].get("identification", {})
                    grade_data = card_result["results"].get("grade", {})
                    confidence = id_data.get("confidence", 0.0)
                    needs_review = id_data.get("needsManualReview", True)
                    
                    result = await self.call_mcp_tool("generate_description", {
                        "id_result": id_data,
                        "grade_result": grade_data,
                        "confidence": confidence,
                        "needs_review": needs_review
                    })
                    
                    if result.get("success"):
                        card_result["results"]["listing_description"] = result["description"]
                        card_result["steps_completed"].append("description_generated")
                        self.log_thought(f"Card {card_index+1}: Description generated successfully", "success")
                    else:
                        card_result["errors"].append(f"Description generation failed: {result.get('error')}")
                        self.log_thought(f"Card {card_index+1}: Description generation failed", "error")
            
            except Exception as e:
                error_msg = f"Step {step_name} failed: {str(e)}"
                card_result["errors"].append(error_msg)
                self.log_thought(f"Card {card_index+1}: {error_msg}", "error")
        
        return card_result
    
    async def _generate_summary(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate final summary of processing results"""
        total_cards = len(results)
        successful = len([r for r in results if not r["errors"]])
        failed = total_cards - successful
        
        # Count completed steps
        step_counts = {}
        for result in results:
            for step in result["steps_completed"]:
                step_counts[step] = step_counts.get(step, 0) + 1
        
        summary = {
            "total_cards": total_cards,
            "successful": successful,
            "failed": failed,
            "success_rate": f"{(successful/total_cards)*100:.1f}%" if total_cards > 0 else "0%",
            "steps_completed": step_counts,
            "ready_for_ebay": successful,
            "needs_manual_review": failed
        }
        
        return summary

# Global AI Agent instance
ai_agent = AIAgent()
