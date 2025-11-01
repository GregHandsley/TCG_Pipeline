"""
AI Agent for TCG Pipeline
Uses ChatGPT to orchestrate MCP tools with thought process logging
"""
from __future__ import annotations
import asyncio
import base64
import json
import httpx
import time
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
        self.mcp_base_url = "http://host.docker.internal:8001"  # MCP Server URL
        self.thought_log = []
    
    def log_thought(self, thought: str, step: str = "processing", metadata: Dict[str, Any] = None):
        """Log agent's thought process with user-friendly language
        
        Args:
            thought: The raw thought message
            step: The processing step type
            metadata: Optional metadata dict that can include:
                - image_update: dict with image data for real-time preview
                - pair_index: the card pair index being processed
                - card_name: the identified card name
        """
        # Convert technical language to user-friendly messages
        friendly_thought = self._make_thought_friendly(thought, step)
        
        thought_entry = {
            "step": step,
            "thought": friendly_thought,
            "timestamp": time.time() * 1000  # Unix timestamp in milliseconds
        }
        
        # Add metadata if provided
        if metadata:
            # Handle image_update for backward compatibility
            if "image_update" in metadata:
                thought_entry["image_update"] = metadata["image_update"]
                print(f"📸 Image update included: pair_index={metadata['image_update'].get('pair_index')}, card_type={metadata['image_update'].get('card_type')}, image_type={metadata['image_update'].get('image_type')}")
            elif metadata.get("pair_index") is not None or metadata.get("card_name"):
                # This is identification metadata - include it directly in the thought entry
                if "pair_index" in metadata:
                    thought_entry["pair_index"] = metadata["pair_index"]
                if "card_name" in metadata:
                    thought_entry["card_name"] = metadata["card_name"]
                print(f"🔍 Including identification metadata: pair_index={metadata.get('pair_index')}, card_name={metadata.get('card_name')}")
        
        # Check if this is an identification message (contains card name)
        if "I believe this is a" in friendly_thought or "What an interesting find" in friendly_thought:
            print(f"🔍 IDENTIFICATION MESSAGE DETECTED: {friendly_thought}")
        
        self.thought_log.append(thought_entry)
        print(f"🤖 AI Agent ({step}): {friendly_thought}")
        
        # Store in global real-time thoughts if we have a session_id
        if hasattr(self, 'session_id') and self.session_id:
            if self.session_id not in _realtime_thoughts:
                _realtime_thoughts[self.session_id] = []
            _realtime_thoughts[self.session_id].append(thought_entry)
            print(f"📡 Stored thought for session {self.session_id}: {friendly_thought}")
            if metadata and "image_update" in metadata:
                print(f"📸 Stored image_update in real-time thoughts for session {self.session_id}")
            # Extra logging for identification messages
            if "I believe this is a" in friendly_thought or "What an interesting find" in friendly_thought:
                print(f"🔍 IDENTIFICATION MESSAGE STORED IN REAL-TIME QUEUE for session {self.session_id} with metadata: {metadata}")
        else:
            print(f"⚠️ No session_id available for thought: {friendly_thought}")
    
    def _make_thought_friendly(self, thought: str, step: str) -> str:
        """Convert technical AI thoughts to Professor Oak-style language"""
        
        # Professor Oak greetings and planning
        if "Starting batch processing" in thought:
            # Check if it's pairs or individual cards
            if "pair" in thought.lower():
                pair_count = thought.split('of ')[1].split(' card pair')[0] if 'of ' in thought else "your"
                return f"Hello there! I'm Professor Oak, and I'm excited to examine {pair_count} card pair(s) (front and back) you've brought me!"
            else:
                card_count = thought.split('of ')[1].split(' cards')[0] if 'of ' in thought else "your"
                return f"Hello there! I'm Professor Oak, and I'm excited to examine {card_count} card(s) you've brought me!"
        
        elif "AI created processing plan" in thought:
            return "Excellent! Let me study these cards and create a research plan..."
        
        elif "Processing plan:" in thought:
            return "Ah yes! Here's what I'll do: First, I'll check the orientation, then remove the background to better examine the card. Next, I'll identify which Pokémon this is, assess its condition, and create a detailed listing for you!"
        
        elif "Processing card" in thought:
            card_num = thought.split("Processing card")[1].split("/")[0].strip() if "/" in thought else ""
            if card_num:
                return f"Now let me examine card {card_num} carefully..."
            return "Let me examine this card closely..."
        
        # Orientation checks
        elif "check_orientation" in thought and "Check if card needs rotation" in thought:
            return "First, let me see if your card is properly oriented..."
        
        elif "Card needs rotation to portrait" in thought:
            return "Hmm, this card needs to be rotated. Let me fix that for you!"
        
        elif "Calling MCP tool: check_orientation" in thought:
            return "Checking the orientation of your card..."
        
        elif "Calling MCP tool: rotate_image" in thought:
            return "Rotating your card to the correct position..."
        
        elif "Card rotated to portrait successfully" in thought:
            return "Perfect! Your card is now properly oriented. Much better for examination!"
        
        elif "Card is already in correct portrait orientation" in thought:
            return "Excellent! This card is already in the perfect position for analysis!"
        
        elif "Orientation corrected - proceeding with processing" in thought:
            card_num = thought.split("Card ")[1].split(":")[0] if "Card " in thought else ""
            if card_num:
                return f"Card {card_num} is ready! Moving on with my research..."
            return "Orientation confirmed! Now I can examine your card properly..."
        
        # Background removal
        elif "remove_background" in thought and "Clean up" in thought:
            return "Now I'll remove the background to get a clearer view of your card..."
        
        elif "Calling MCP tool: remove_background" in thought:
            return "Processing the background removal - this will help me see the card more clearly!"
        
        elif "Background removed successfully" in thought:
            return "Wonderful! The background has been removed. Now I can see your card much more clearly!"
        
        # Card identification
        elif "identify_card" in thought and "Find out" in thought:
            return "Now for the exciting part - let me identify which Pokémon this is!"
        
        elif "Calling MCP tool: identify_card" in thought:
            return "Searching through my research database to identify this Pokémon..."
        
        elif "Identified as" in thought and "confidence" in thought:
            try:
                card_name = thought.split("Identified as ")[1].split(" (")[0]
                confidence = thought.split("(")[1].split("%")[0]
                confidence_num = float(confidence) if confidence.replace('.', '').isdigit() else 0.0
                if confidence_num > 0:
                    if confidence_num >= 80:
                        return f"Aha! This is a {card_name}! I'm quite confident about this - {confidence}% certain, in fact!"
                    elif confidence_num >= 50:
                        return f"I believe this is a {card_name}, though I'm {confidence}% certain. Let me continue analyzing..."
                    else:
                        return f"Hmm, this might be a {card_name}, but I'm only {confidence}% certain. This may need closer examination..."
                else:
                    return f"I believe this is a {card_name}!"
            except:
                return "I've identified the card! Let me check my notes..."
        
        # Grading
        elif "grade_card" in thought and "Check" in thought:
            return "Now I'll assess the condition of this card - checking corners, edges, and surface quality..."
        
        elif "Calling MCP tool: grade_card" in thought:
            return "Examining the card's condition carefully..."
        
        elif "Graded successfully" in thought:
            return "Excellent! I've completed my condition assessment. The corners, edges, and surface have all been examined!"
        
        # Description generation
        elif "generate_description" in thought and "Create" in thought:
            return "Now I'll create a detailed listing description for your card!"
        
        elif "Calling MCP tool: generate_description" in thought:
            return "Writing up a comprehensive description for your eBay listing..."
        
        elif "Description generated successfully" in thought:
            return "Perfect! I've created a title and description for your eBay listing. It's ready to go!"
        
        # Completion
        elif "Batch processing complete" in thought:
            return "Wonderful! My research is complete! Your card has been fully processed and is ready for eBay!"
        
        elif "success_rate" in thought:
            return "Excellent! All processing completed successfully. Everything is ready!"
        
        # Generic tool calling
        elif "Calling MCP tool:" in thought:
            tool_name = thought.split("Calling MCP tool: ")[1] if "Calling MCP tool: " in thought else "processing"
            return f"Using my research equipment to {tool_name.replace('_', ' ')}..."
        
        # Default: make it sound like Professor Oak with front/back context
        if "Card" in thought and ("front" in thought.lower() or "back" in thought.lower()):
            # Check if it mentions front or back
            if "front" in thought.lower():
                card_side = "front"
                side_context = "Looking at the front of this card"
            elif "back" in thought.lower():
                card_side = "back"
                side_context = "Now examining the back of this card"
            else:
                card_side = None
                side_context = None
            
            # Extract the message part after "Card X (front/back):"
            parts = thought.split(":", 1)
            if len(parts) > 1:
                message = parts[1].strip()
                if side_context:
                    # Add Professor Oak flair with side context
                    if message.lower().startswith(("error", "failed", "no")):
                        return f"Oh my! {side_context}, {message.lower()}"
                    elif message.lower().startswith(("success", "completed", "ready")):
                        return f"Excellent! {side_context}, {message}"
                    else:
                        return f"{side_context}... {message}"
                else:
                    # No side context, use regular Professor Oak style
                    if message.lower().startswith(("error", "failed", "no")):
                        return f"Oh my! {message}"
                    elif message.lower().startswith(("success", "completed", "ready")):
                        return f"Excellent! {message}"
                    else:
                        return f"Let me see... {message}"
        
        # Default: make it sound like Professor Oak
        if "Card" in thought and ":" in thought:
            # Extract the message part after "Card X:"
            parts = thought.split(":", 1)
            if len(parts) > 1:
                message = parts[1].strip()
                # Add Professor Oak flair
                if message.lower().startswith(("error", "failed", "no")):
                    return f"Oh my! {message}"
                elif message.lower().startswith(("success", "completed", "ready")):
                    return f"Excellent! {message}"
                else:
                    return f"Let me see... {message}"
        
        # Fallback: add Professor Oak style to any remaining messages
        return f"Let me check... {thought}"
    
    async def call_mcp_tool(self, method: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Call MCP tool and return result"""
        try:
            self.log_thought(f"Calling MCP tool: {method}", "step")
            print(f"🔧 Calling MCP tool: {method} with params: {list(params.keys())}")
            
            # Add intermediate thoughts for long-running operations
            if method in ["remove_background", "identify_card"]:
                self.log_thought(f"Processing... This may take a moment. Please be patient!", "step")
            
            # Convert image_bytes to base64 if present
            if "image_bytes" in params and isinstance(params["image_bytes"], bytes):
                import base64
                params["image_bytes"] = base64.b64encode(params["image_bytes"]).decode('utf-8')
                print(f"🔧 DEBUG: Converted image_bytes to base64, length: {len(params['image_bytes'])}")
            
            print(f"🔧 DEBUG: About to call MCP server at {self.mcp_base_url}/mcp/call")
            
            # Add progress thoughts for long operations
            if method == "remove_background":
                asyncio.create_task(self._add_background_progress_thoughts())
            elif method == "identify_card":
                asyncio.create_task(self._add_identification_progress_thoughts())
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.mcp_base_url}/mcp/call",
                    json={"method": method, "params": params},
                    timeout=120.0
                )
                print(f"🔧 DEBUG: MCP response status: {response.status_code}")
                result = response.json()
                print(f"🔧 DEBUG: MCP response: {result}")
                
                if result.get("error"):
                    raise Exception(f"MCP Error: {result['error']}")
                
                print(f"✅ MCP tool {method} completed successfully")
                return result.get("result", {})
        
        except Exception as e:
            self.log_thought(f"Error calling MCP tool {method}: {str(e)}", "error")
            print(f"❌ MCP tool {method} failed: {str(e)}")
            raise
    
    async def _add_background_progress_thoughts(self):
        """Add intermediate thoughts during background removal"""
        await asyncio.sleep(2)
        if hasattr(self, 'session_id') and self.session_id:
            self.log_thought("Still working on removing that background... almost there!", "step")
        await asyncio.sleep(3)
        if hasattr(self, 'session_id') and self.session_id:
            self.log_thought("The background removal is taking a bit longer, but we're making progress!", "step")
    
    async def _add_identification_progress_thoughts(self):
        """Add intermediate thoughts during card identification"""
        await asyncio.sleep(2)
        if hasattr(self, 'session_id') and self.session_id:
            self.log_thought("Searching through my database... there are so many Pokémon to check!", "step")
        await asyncio.sleep(3)
        if hasattr(self, 'session_id') and self.session_id:
            self.log_thought("Still analyzing... I want to make sure I identify this correctly!", "step")
    
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
    
    async def process_batch_pairs(self, card_pairs: List[Dict], user_options: Dict[str, bool], session_id: str = None) -> Dict[str, Any]:
        """
        Process a batch of card pairs (front + back) using AI Agent orchestration
        Front and back are bound together - only front is identified, back is skipped for identification
        """
        self.thought_log = []  # Reset thought log
        self.session_id = session_id  # Set session ID for real-time thoughts
        pair_count = len(card_pairs)
        self.log_thought(f"Starting batch processing of {pair_count} card pair(s)", "start")
        
        # Analyze user options and create processing plan
        processing_plan = await self._create_processing_plan([], user_options)
        self.log_thought(f"Processing plan: {processing_plan}", "planning")
        
        # Execute the processing plan on pairs
        results = await self._execute_processing_plan_pairs(card_pairs, processing_plan)
        
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
                {"name": "check_orientation", "enabled": True, "reason": "Check if card needs rotation to portrait"},
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
            if i > 0:
                self.log_thought(f"Moving on to card {i+1} of {len(cards)}...", "processing")
            card_result = await self._process_single_card(card, plan, i)
            results.append(card_result)
            if i < len(cards) - 1:
                self.log_thought(f"Card {i+1} is done! Let me examine the next one...", "success")
        
        return results
    
    async def _execute_processing_plan_pairs(self, card_pairs: List[Dict], plan: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Execute the processing plan on all card pairs - front and back are bound together"""
        results = []
        
        for i, pair in enumerate(card_pairs):
            self.log_thought(f"Processing card pair {i+1}/{len(card_pairs)}", "processing")
            if i > 0:
                self.log_thought(f"Moving on to card pair {i+1} of {len(card_pairs)}...", "processing")
            pair_result = await self._process_single_pair(pair, plan, i)
            results.append(pair_result)
            if i < len(card_pairs) - 1:
                self.log_thought(f"Card pair {i+1} is done! Let me examine the next one...", "success")
        
        return results
    
    async def _process_single_pair(self, pair: Dict, plan: Dict[str, Any], pair_index: int) -> Dict[str, Any]:
        """Process a single card pair (front + back) following the plan"""
        pair_result = {
            "card_index": pair_index,  # Keep for compatibility
            "pair_index": pair_index,
            "steps_completed": [],
            "results": {
                "front": {},
                "back": {}
            },
            "errors": [],
            "agent_thoughts": []
        }
        
        front_data = pair.get("front", {})
        back_data = pair.get("back", {})
        
        front_image = front_data.get("image_bytes")
        back_image = back_data.get("image_bytes")
        
        # Validate initial image data
        if not front_image:
            pair_result["errors"].append("No front image data provided")
            self.log_thought(f"Card pair {pair_index+1}: No front image data provided", "error")
            return pair_result
        
        if not back_image:
            pair_result["errors"].append("No back image data provided")
            self.log_thought(f"Card pair {pair_index+1}: No back image data provided", "error")
            return pair_result
        
        # Process front image (full processing including identification)
        self.log_thought(f"Card pair {pair_index+1}: Ah yes! Let me begin by carefully examining the front of this card...", "step")
        self.log_thought(f"Card pair {pair_index+1} (front): Looking at the front of the card first - this is where I'll identify the Pokémon!", "step")
        front_result = await self._process_single_card_image(
            front_image, 
            plan, 
            pair_index, 
            "front",
            should_identify=True
        )
        pair_result["results"]["front"] = front_result["results"]
        pair_result["steps_completed"].extend([f"front_{s}" for s in front_result["steps_completed"]])
        pair_result["errors"].extend([f"front_{e}" for e in front_result["errors"]])
        
        # Process back image (skip identification - all backs look the same)
        self.log_thought(f"Card pair {pair_index+1}: Excellent! Now let me flip this card over and examine the back side...", "step")
        self.log_thought(f"Card pair {pair_index+1} (back): Turning the card over... Looking at the back of the card now - all card backs look the same, so I won't need to identify this one!", "step")
        back_result = await self._process_single_card_image(
            back_image,
            plan,
            pair_index,
            "back",
            should_identify=False  # Skip identification for back
        )
        pair_result["results"]["back"] = back_result["results"]
        pair_result["steps_completed"].extend([f"back_{s}" for s in back_result["steps_completed"]])
        pair_result["errors"].extend([f"back_{e}" for e in back_result["errors"]])
        
        # Use front identification for the pair (since we only identify the front)
        if "identification" in front_result["results"]:
            pair_result["results"]["identification"] = front_result["results"]["identification"]
        
        # Combine front and back grades for the pair
        # Average the numeric grades from both sides for a comprehensive assessment
        front_grade = front_result["results"].get("grade")
        back_grade = back_result["results"].get("grade")
        
        if front_grade and back_grade:
            # Combine grades by averaging numeric values
            combined_grade = self._combine_grades(front_grade, back_grade)
            pair_result["results"]["grade"] = combined_grade
            self.log_thought(f"Card pair {pair_index+1}: Combined condition assessment from both front and back - averaging the grades for a complete evaluation!", "success")
        elif front_grade:
            # If only front grade is available, use it
            pair_result["results"]["grade"] = front_grade
            self.log_thought(f"Card pair {pair_index+1}: Using front card's condition grade for the pair.", "step")
        elif back_grade:
            # If only back grade is available, use it
            pair_result["results"]["grade"] = back_grade
            self.log_thought(f"Card pair {pair_index+1}: Using back card's condition grade for the pair.", "step")
        
        # Use front description for the pair
        if "listing_description" in front_result["results"]:
            pair_result["results"]["listing_description"] = front_result["results"]["listing_description"]
        
        return pair_result
    
    def _combine_grades(self, front_grade: Dict[str, Any], back_grade: Dict[str, Any]) -> Dict[str, Any]:
        """
        Combine front and back grades by averaging numeric values.
        Returns a combined grade result with averaged scores.
        """
        front_records = front_grade.get("records", [])
        back_records = back_grade.get("records", [])
        
        if not front_records or not back_records:
            # If either is missing, return the one that exists, or front as fallback
            return front_grade if front_records else (back_grade if back_records else front_grade)
        
        front_grades = front_records[0].get("grades", {})
        back_grades = back_records[0].get("grades", {})
        
        # Average numeric grade components
        combined_grades = {}
        numeric_fields = ["corners", "edges", "surface", "centering", "final"]
        
        for field in numeric_fields:
            front_val = front_grades.get(field)
            back_val = back_grades.get(field)
            
            if front_val is not None and back_val is not None:
                combined_grades[field] = (front_val + back_val) / 2.0
            elif front_val is not None:
                combined_grades[field] = front_val
            elif back_val is not None:
                combined_grades[field] = back_val
        
        # For condition string, use the one from the final grade (or front as fallback)
        # The condition is typically derived from the final numeric grade
        combined_grades["condition"] = front_grades.get("condition") or back_grades.get("condition")
        
        # Combine records - use front record as base but update grades
        combined_record = front_records[0].copy()
        combined_record["grades"] = combined_grades
        
        # Prefer front grading images, but include back if front doesn't have them
        if not combined_record.get("_full_url_card") and back_records[0].get("_full_url_card"):
            combined_record["_full_url_card"] = back_records[0].get("_full_url_card")
        if not combined_record.get("_exact_url_card") and back_records[0].get("_exact_url_card"):
            combined_record["_exact_url_card"] = back_records[0].get("_exact_url_card")
        
        return {
            "records": [combined_record],
            "statistics": front_grade.get("statistics", {})  # Use front statistics
        }
    
    async def _process_single_card_image(self, image_bytes: bytes, plan: Dict[str, Any], pair_index: int, card_type: str, should_identify: bool = True) -> Dict[str, Any]:
        """Process a single card image (front or back) following the plan"""
        card_result = {
            "steps_completed": [],
            "results": {},
            "errors": []
        }
        
        current_image = image_bytes
        original_image = image_bytes  # Keep original for grading (Ximilar needs original image)
        
        print(f"🔍 DEBUG: Processing {card_type} card, should_identify={should_identify}")
        print(f"🔍 DEBUG: Plan steps: {[(s['name'], s['enabled']) for s in plan['steps']]}")
        
        for step in plan["steps"]:
            if not step["enabled"]:
                print(f"🔍 DEBUG: Skipping disabled step: {step['name']}")
                continue
            
            step_name = step["name"]
            print(f"🔍 DEBUG: Processing step: {step_name} for {card_type}")
            
            # Skip identification for back images
            if step_name == "identify_card" and not should_identify:
                print(f"🔍 DEBUG: Skipping identification for {card_type} (should_identify=False)")
                self.log_thought(f"Card pair {pair_index+1} ({card_type}): Looking at the back of this card... All card backs look the same, so I don't need to identify it!", "step")
                continue
            
            # More descriptive Professor Oak-style messages for each step
            if step_name == "check_orientation":
                self.log_thought(f"Card pair {pair_index+1} ({card_type}): Looking at the {card_type} of this card... First, let me check if it's properly oriented!", "step")
            elif step_name == "remove_background":
                self.log_thought(f"Card pair {pair_index+1} ({card_type}): Still examining the {card_type}... Now I'll remove the background so I can see it more clearly!", "step")
            elif step_name == "identify_card":
                self.log_thought(f"Card pair {pair_index+1} ({card_type}): Looking closely at the {card_type}... This is the exciting part - let me identify which Pokémon this is!", "step")
            elif step_name == "grade_card":
                self.log_thought(f"Card pair {pair_index+1} ({card_type}): Examining the {card_type} carefully... Now I'll assess the condition - checking corners, edges, and surface quality!", "step")
            elif step_name == "enhance_image":
                self.log_thought(f"Card pair {pair_index+1} ({card_type}): Looking at the {card_type}... Let me enhance the image quality for better examination!", "step")
            else:
                self.log_thought(f"Card pair {pair_index+1} ({card_type}): Working on the {card_type}... {step['reason']}", "step")
            
            try:
                if step_name == "check_orientation":
                    result = await self.call_mcp_tool("check_orientation", {"image_bytes": current_image})
                    if result.get("success"):
                        if result.get("needs_rotation"):
                            self.log_thought(f"Card pair {pair_index+1} ({card_type}): Looking at the {card_type}... Hmm, this needs to be rotated! Let me fix that for you!", "step")
                            
                            try:
                                import asyncio
                                rotation_result = await asyncio.wait_for(
                                    self.call_mcp_tool("rotate_image", {
                                        "image_bytes": current_image,
                                        "angle": result.get("rotation_angle", -90),
                                        "expand": True,
                                        "fillcolor": "white"
                                    }),
                                    timeout=30.0
                                )
                                
                                if rotation_result.get("success"):
                                    # MCP returns rotated_image as base64 string - decode to bytes for processing
                                    rotated_base64_str = rotation_result["rotated_image"]
                                    current_image = base64.b64decode(rotated_base64_str)  # Convert to bytes for next step
                                    card_result["results"]["orientation_corrected"] = rotated_base64_str  # Store base64
                                    card_result["steps_completed"].append("orientation_corrected")
                                    self.log_thought(f"Card pair {pair_index+1} ({card_type}): Looking at the {card_type}... Perfect! It's now properly oriented. Much better for examination!", "success")
                                    # Send image update for real-time preview (MCP already returns base64)
                                    self.log_thought(
                                        f"Card pair {pair_index+1} ({card_type}): Examining the {card_type}... Orientation is perfect - ready to continue!", 
                                        "success",
                                        {
                                            "image_update": {
                                                "pair_index": pair_index,
                                                "card_type": card_type,
                                                "image_type": "orientation_corrected",
                                                "image_base64": rotated_base64_str,  # Already base64 from MCP
                                                "step": "orientation"
                                            }
                                        }
                                    )
                                    continue
                                else:
                                    card_result["errors"].append(f"Rotation failed: {rotation_result.get('error')}")
                                    self.log_thought(f"Card pair {pair_index+1} ({card_type}): Rotation failed", "error")
                                    continue
                                    
                            except asyncio.TimeoutError:
                                self.log_thought(f"Card pair {pair_index+1} ({card_type}): Rotation timed out - skipping", "error")
                                card_result["errors"].append("Rotation timed out - skipping orientation correction")
                                continue
                                
                        else:
                            card_result["steps_completed"].append("orientation_verified")
                            self.log_thought(f"Card pair {pair_index+1} ({card_type}): Looking at the {card_type}... Excellent! It's already in the perfect position for analysis!", "success")
                            continue
                    else:
                        card_result["errors"].append(f"Orientation check failed: {result.get('error')}")
                        self.log_thought(f"Card pair {pair_index+1} ({card_type}): Orientation check failed", "error")
                        continue
                
                elif step_name == "remove_background":
                    if not current_image:
                        card_result["errors"].append("No image data for background removal")
                        self.log_thought(f"Card pair {pair_index+1} ({card_type}): No image data for background removal", "error")
                        continue
                    
                    self.log_thought(f"Card pair {pair_index+1} ({card_type}): Still examining the {card_type}... Now I'll carefully remove the background so I can see your card more clearly!", "step")
                    result = await self.call_mcp_tool("remove_background", {"image_bytes": current_image})
                    if result.get("success"):
                        # MCP returns processed_image as base64 string - decode to bytes for processing
                        bg_removed_base64_str = result["processed_image"]
                        current_image = base64.b64decode(bg_removed_base64_str)  # Convert to bytes for next step
                        card_result["results"]["background_removed"] = bg_removed_base64_str  # Store base64
                        card_result["steps_completed"].append("background_removed")
                        self.log_thought(f"Card pair {pair_index+1} ({card_type}): Looking at the {card_type}... Wonderful! The background has been removed. Much clearer now!", "success")
                        # Send image update for real-time preview (MCP already returns base64)
                        self.log_thought(
                            f"Card pair {pair_index+1} ({card_type}): Examining the {card_type}... Much better! Now I can see your card without any distractions!", 
                            "step",
                            {
                                "image_update": {
                                    "pair_index": pair_index,
                                    "card_type": card_type,
                                    "image_type": "background_removed",
                                    "image_base64": bg_removed_base64_str,  # Already base64 from MCP
                                    "step": "background_removal"
                                }
                            }
                        )
                    else:
                        card_result["errors"].append(f"Background removal failed: {result.get('error')}")
                        self.log_thought(f"Card pair {pair_index+1} ({card_type}): Background removal failed", "error")
                
                elif step_name == "identify_card":
                    print(f"🔍 DEBUG: identify_card step reached for {card_type}, should_identify={should_identify}")
                    if not should_identify:
                        print(f"🔍 DEBUG: Skipping identification for {card_type}")
                        continue  # Already logged skip message above
                    
                    print(f"🔍 DEBUG: Starting identification for {card_type}")
                    if not current_image:
                        card_result["errors"].append("No image data for card identification")
                        self.log_thought(f"Card pair {pair_index+1} ({card_type}): No image data for card identification", "error")
                        continue
                    
                    self.log_thought(f"Card pair {pair_index+1} ({card_type}): Looking closely at the {card_type}... This is fascinating! Let me identify which Pokémon this is!", "step")
                    print(f"🔍 DEBUG: About to call identify_card MCP tool for {card_type}")
                    result = await self.call_mcp_tool("identify_card", {"image_bytes": current_image})
                    print(f"🔍 DEBUG: identify_card result: {result.get('success')}")
                    if result.get("success"):
                        card_result["results"]["identification"] = result["identification"]
                        card_result["steps_completed"].append("identified")
                        card_name = result["identification"].get("best", {}).get("name", "Unknown")
                        confidence = result["identification"].get("confidence", 0.0)
                        print(f"🔍 DEBUG: Card identified as: {card_name} (confidence: {confidence})")
                        # Use simpler format for identification so regex can extract it easily
                        # Include pair_index metadata in the thought
                        self.log_thought(
                            f"Card pair {pair_index+1} ({card_type}): Aha! I believe this is a {card_name}!", 
                            "success",
                            {"pair_index": pair_index, "card_name": card_name}  # Include metadata
                        )
                        if confidence > 0:
                            self.log_thought(
                                f"Card pair {pair_index+1} ({card_type}): What an interesting find! This {card_name} looks great!", 
                                "step",
                                {"pair_index": pair_index, "card_name": card_name}  # Include metadata
                            )
                        print(f"🔍 DEBUG: Logged identification thoughts for {card_name}")
                    else:
                        card_result["errors"].append(f"Identification failed: {result.get('error')}")
                        self.log_thought(f"Card pair {pair_index+1} ({card_type}): Identification failed", "error")
                        print(f"🔍 DEBUG: Identification failed: {result.get('error')}")
                
                elif step_name == "grade_card":
                    # Grade both front and back - backs don't need identifying but they need grading
                    # Use original image for grading - Ximilar grading needs the original image with context
                    # Background-removed images may not have enough context for card detection
                    grading_image = original_image
                    if not grading_image:
                        card_result["errors"].append("No image data for card grading")
                        self.log_thought(f"Card pair {pair_index+1} ({card_type}): No image data for card grading", "error")
                        continue
                    
                    self.log_thought(f"Card pair {pair_index+1} ({card_type}): Examining the {card_type} carefully... Now I'll assess the condition - checking corners, edges, and surface quality!", "step")
                    self.log_thought(f"Card pair {pair_index+1} ({card_type}): Looking at the {card_type}... Using the original image for grading to ensure I can see all the details clearly!", "step")
                    
                    # Add progress thoughts for grading (especially important for back cards which may take longer)
                    async def _add_grading_progress_thoughts():
                        await asyncio.sleep(3)
                        if hasattr(self, 'session_id') and self.session_id:
                            self.log_thought(f"Card pair {pair_index+1} ({card_type}): Still examining the {card_type}... This takes a moment to be thorough! I want to check every corner and edge carefully.", "step")
                        await asyncio.sleep(5)
                        if hasattr(self, 'session_id') and self.session_id:
                            self.log_thought(f"Card pair {pair_index+1} ({card_type}): Looking at the {card_type}... Almost done with the condition assessment! Just checking all the fine details now!", "step")
                    
                    # Start progress thoughts as a background task
                    if card_type == "back":
                        asyncio.create_task(_add_grading_progress_thoughts())
                    
                    try:
                        # Wrap in asyncio.wait_for to ensure we don't hang forever
                        result = await asyncio.wait_for(
                            self.call_mcp_tool("grade_card", {"image_bytes": grading_image}),
                            timeout=180.0  # 3 minute timeout for grading
                        )
                        
                        if result.get("success"):
                            # Store the full grade result including any grading image URLs
                            card_result["results"]["grade"] = result["grade"]
                            card_result["steps_completed"].append("graded")
                            self.log_thought(f"Card pair {pair_index+1} ({card_type}): Examining the {card_type}... Excellent! I've completed my condition assessment of the {card_type}!", "success")
                            self.log_thought(f"Card pair {pair_index+1} ({card_type}): Looking at the {card_type}... The condition assessment is complete! This card looks good!", "step")
                            # Log about grading images if available
                            grade_data = result.get("grade", {})
                            if grade_data.get("records") and grade_data["records"][0].get("_full_url_card"):
                                self.log_thought(f"Card pair {pair_index+1} ({card_type}): Examining the {card_type}... I've created a detailed grading analysis image showing the condition assessment!", "success")
                        else:
                            error_msg = result.get('error', 'Unknown error')
                            card_result["errors"].append(f"Grading failed: {error_msg}")
                            self.log_thought(f"Card pair {pair_index+1} ({card_type}): Grading failed: {error_msg}", "error")
                            
                    except asyncio.TimeoutError:
                        error_msg = "Grading timed out after 3 minutes"
                        card_result["errors"].append(f"Grading failed: {error_msg}")
                        self.log_thought(f"Card pair {pair_index+1} ({card_type}): Grading timed out - the analysis is taking too long. This might happen with back cards.", "error")
                    except Exception as e:
                        error_msg = str(e)
                        card_result["errors"].append(f"Grading failed: {error_msg}")
                        self.log_thought(f"Card pair {pair_index+1} ({card_type}): Grading error: {error_msg}", "error")
                        print(f"❌ Error grading {card_type} card: {error_msg}")
                        import traceback
                        traceback.print_exc()
                
                elif step_name == "enhance_image":
                    # Skip enhancement for back cards - not needed for back images
                    if card_type == "back":
                        self.log_thought(f"Card pair {pair_index+1} ({card_type}): Skipping enhancement for back image", "step")
                        continue
                    
                    result = await self.call_mcp_tool("enhance_image", {"image_bytes": current_image})
                    if result.get("success"):
                        # MCP returns enhanced_image as base64 string - decode to bytes for processing
                        enhanced_base64_str = result["enhanced_image"]
                        current_image = base64.b64decode(enhanced_base64_str)  # Convert to bytes for next step
                        card_result["results"]["enhanced"] = enhanced_base64_str  # Store base64
                        card_result["steps_completed"].append("enhanced")
                        self.log_thought(f"Card pair {pair_index+1} ({card_type}): Image enhanced successfully", "success")
                    else:
                        card_result["errors"].append(f"Enhancement failed: {result.get('error')}")
                        self.log_thought(f"Card pair {pair_index+1} ({card_type}): Enhancement failed", "error")
                
                elif step_name == "generate_description":
                    # Only generate description for front (it uses front's identification and grade)
                    if card_type != "front":
                        self.log_thought(f"Card pair {pair_index+1} ({card_type}): Skipping description generation - will use front side data", "step")
                        continue
                    
                    id_data = card_result["results"].get("identification", {})
                    grade_data = card_result["results"].get("grade", {})
                    confidence = id_data.get("confidence", 0.0)
                    needs_review = id_data.get("needsManualReview", True)
                    
                    self.log_thought(f"Card pair {pair_index+1} ({card_type}): Perfect! Now I'll write a detailed listing description for you!", "step")
                    result = await self.call_mcp_tool("generate_description", {
                        "id_result": id_data,
                        "grade_result": grade_data,
                        "confidence": confidence,
                        "needs_review": needs_review
                    })
                    
                    if result.get("success"):
                        card_result["results"]["listing_description"] = result["description"]
                        card_result["steps_completed"].append("description_generated")
                        self.log_thought(f"Card pair {pair_index+1} ({card_type}): Description generated successfully", "success")
                        self.log_thought(f"Card pair {pair_index+1} ({card_type}): Excellent! Your listing description is ready!", "step")
                    else:
                        card_result["errors"].append(f"Description generation failed: {result.get('error')}")
                        self.log_thought(f"Card pair {pair_index+1} ({card_type}): Description generation failed", "error")
            
            except Exception as e:
                error_msg = f"Step {step_name} failed: {str(e)}"
                card_result["errors"].append(error_msg)
                self.log_thought(f"Card pair {pair_index+1} ({card_type}): {error_msg}", "error")
        
        return card_result
    
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
        
        # Validate initial image data
        if not current_image:
            card_result["errors"].append("No image data provided for card")
            self.log_thought(f"Card {card_index+1}: No image data provided", "error")
            return card_result
        
        for step in plan["steps"]:
            if not step["enabled"]:
                continue
            
            step_name = step["name"]
            self.log_thought(f"Card {card_index+1}: {step_name} - {step['reason']}", "step")
            
            try:
                if step_name == "check_orientation":
                    # Prevent infinite rotation loops
                    rotation_attempts = card_result.get("rotation_attempts", 0)
                    if rotation_attempts >= 2:  # Reduced from 3 to 2
                        self.log_thought(f"Card {card_index+1}: Skipping rotation - too many attempts", "error")
                        card_result["errors"].append("Rotation loop detected - skipping orientation correction")
                        continue
                    
                    result = await self.call_mcp_tool("check_orientation", {"image_bytes": current_image})
                    if result.get("success"):
                        if result.get("needs_rotation"):
                            # Card needs rotation - call rotate_image tool with timeout
                            self.log_thought(f"Card {card_index+1}: Card needs rotation to portrait", "step")
                            
                            try:
                                import asyncio
                                rotation_result = await asyncio.wait_for(
                                    self.call_mcp_tool("rotate_image", {
                                        "image_bytes": current_image,
                                        "angle": result.get("rotation_angle", -90),
                                        "expand": True,
                                        "fillcolor": "white"
                                    }),
                                    timeout=30.0  # 30 second timeout
                                )
                                
                                if rotation_result.get("success"):
                                    print(f"🔄 DEBUG: Rotation successful, updating current_image")
                                    # MCP returns rotated_image as base64 string - decode to bytes for processing
                                    rotated_base64_str = rotation_result["rotated_image"]
                                    current_image = base64.b64decode(rotated_base64_str)  # Convert to bytes for next step
                                    card_result["results"]["orientation_corrected"] = rotated_base64_str  # Store base64
                                    card_result["steps_completed"].append("orientation_corrected")
                                    card_result["rotation_attempts"] = rotation_attempts + 1
                                    self.log_thought(f"Card {card_index+1}: Card rotated to portrait successfully", "success")
                                    
                                    # Skip verification to prevent loops - assume rotation worked
                                    self.log_thought(f"Card {card_index+1}: Orientation corrected - proceeding with processing", "success")
                                    print(f"🔄 DEBUG: About to continue to next step")
                                    continue  # Move to next step
                                else:
                                    card_result["errors"].append(f"Rotation failed: {rotation_result.get('error')}")
                                    self.log_thought(f"Card {card_index+1}: Rotation failed", "error")
                                    continue  # Move to next step even if rotation failed
                                    
                            except asyncio.TimeoutError:
                                self.log_thought(f"Card {card_index+1}: Rotation timed out - skipping", "error")
                                card_result["errors"].append("Rotation timed out - skipping orientation correction")
                                card_result["rotation_attempts"] = rotation_attempts + 1
                                continue  # Move to next step
                                
                        else:
                            # Card is already in correct orientation
                            card_result["steps_completed"].append("orientation_verified")
                            self.log_thought(f"Card {card_index+1}: Card is already in correct portrait orientation", "success")
                            continue  # Move to next step
                    else:
                        card_result["errors"].append(f"Orientation check failed: {result.get('error')}")
                        self.log_thought(f"Card {card_index+1}: Orientation check failed", "error")
                        continue  # Move to next step even if orientation check failed
                
                elif step_name == "remove_background":
                    if not current_image:
                        card_result["errors"].append("No image data for background removal")
                        self.log_thought(f"Card {card_index+1}: No image data for background removal", "error")
                        continue
                    
                    self.log_thought(f"Card {card_index+1}: Now I'll carefully remove the background so we can see your card clearly!", "step")
                    result = await self.call_mcp_tool("remove_background", {"image_bytes": current_image})
                    if result.get("success"):
                        # MCP returns processed_image as base64 string - decode to bytes for processing
                        bg_removed_base64_str = result["processed_image"]
                        current_image = base64.b64decode(bg_removed_base64_str)  # Convert to bytes for next step
                        card_result["results"]["background_removed"] = bg_removed_base64_str  # Store base64
                        card_result["steps_completed"].append("background_removed")
                        self.log_thought(f"Card {card_index+1}: Background removed successfully", "success")
                        self.log_thought(f"Card {card_index+1}: Much better! Now I can examine the card without distractions.", "step")
                    else:
                        card_result["errors"].append(f"Background removal failed: {result.get('error')}")
                        self.log_thought(f"Card {card_index+1}: Background removal failed", "error")
                
                elif step_name == "identify_card":
                    if not current_image:
                        card_result["errors"].append("No image data for card identification")
                        self.log_thought(f"Card {card_index+1}: No image data for card identification", "error")
                        continue
                    
                    self.log_thought(f"Card {card_index+1}: This is fascinating! Let me identify which Pokémon this is!", "step")
                    result = await self.call_mcp_tool("identify_card", {"image_bytes": current_image})
                    if result.get("success"):
                        card_result["results"]["identification"] = result["identification"]
                        card_result["steps_completed"].append("identified")
                        card_name = result["identification"].get("best", {}).get("name", "Unknown")
                        confidence = result["identification"].get("confidence", 0.0)
                        self.log_thought(f"Card {card_index+1}: Identified as {card_name} ({confidence:.1%} confidence)", "success")
                        if confidence > 0:
                            self.log_thought(f"Card {card_index+1}: What an interesting find! This {card_name} looks great!", "step")
                    else:
                        card_result["errors"].append(f"Identification failed: {result.get('error')}")
                        self.log_thought(f"Card {card_index+1}: Identification failed", "error")
                
                elif step_name == "grade_card":
                    if not current_image:
                        card_result["errors"].append("No image data for card grading")
                        self.log_thought(f"Card {card_index+1}: No image data for card grading", "error")
                        continue
                    
                    self.log_thought(f"Card {card_index+1}: Now I'll examine the condition carefully - checking corners, edges, and surface...", "step")
                    result = await self.call_mcp_tool("grade_card", {"image_bytes": current_image})
                    if result.get("success"):
                        card_result["results"]["grade"] = result["grade"]
                        card_result["steps_completed"].append("graded")
                        self.log_thought(f"Card {card_index+1}: Graded successfully", "success")
                        self.log_thought(f"Card {card_index+1}: The condition assessment is complete! This card looks good!", "step")
                    else:
                        card_result["errors"].append(f"Grading failed: {result.get('error')}")
                        self.log_thought(f"Card {card_index+1}: Grading failed", "error")
                
                elif step_name == "enhance_image":
                    result = await self.call_mcp_tool("enhance_image", {"image_bytes": current_image})
                    if result.get("success"):
                        # MCP returns enhanced_image as base64 string - decode to bytes for processing
                        enhanced_base64_str = result["enhanced_image"]
                        current_image = base64.b64decode(enhanced_base64_str)  # Convert to bytes for next step
                        card_result["results"]["enhanced"] = enhanced_base64_str  # Store base64
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
                    
                    self.log_thought(f"Card {card_index+1}: Perfect! Now I'll write a detailed listing description for you!", "step")
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
                        self.log_thought(f"Card {card_index+1}: Excellent! Your listing description is ready!", "step")
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
