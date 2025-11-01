"""
AI Agent for TCG Pipeline
Main orchestrator that coordinates all processing components
"""
from __future__ import annotations
from typing import Any, Dict, List
from openai import OpenAI
from core.settings import settings
from .thought_logging import ThoughtLogger, get_realtime_thoughts, clear_realtime_thoughts
from .mcp_client import MCPClient
from .processing_planner import ProcessingPlanner
from .card_processor import CardProcessor
from .pair_processor import PairProcessor


class AIAgent:
    """
    AI Agent that orchestrates TCG processing workflow
    Uses ChatGPT to make intelligent decisions about tool usage
    """
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.thought_logger = ThoughtLogger()
        self.mcp_client = MCPClient(self.thought_logger)
        self.planner = ProcessingPlanner(self.client, self.thought_logger)
        self.pair_processor = PairProcessor(self.thought_logger)
    
    def log_thought(self, thought: str, step: str = "processing", metadata: Dict[str, Any] = None):
        """Log agent's thought process (delegates to thought_logger)"""
        self.thought_logger.log_thought(thought, step, metadata)
    
    async def process_batch(self, cards: List[Dict], user_options: Dict[str, bool], session_id: str = None) -> Dict[str, Any]:
        """
        Process a batch of cards using AI Agent orchestration
        """
        self.thought_logger.thought_log = []  # Reset thought log
        self.thought_logger.session_id = session_id  # Set session ID for real-time thoughts
        self.log_thought(f"Starting batch processing of {len(cards)} cards", "start")
        
        # Analyze user options and make intelligent decisions
        processing_plan = await self.planner.create_plan(cards, user_options)
        self.log_thought(f"Processing plan: {processing_plan}", "planning")
        
        # Execute the processing plan
        results = await self._execute_processing_plan(cards, processing_plan)
        
        # Generate final summary
        summary = await self._generate_summary(results)
        self.log_thought(f"Batch processing complete: {summary}", "complete")
        
        return {
            "results": results,
            "summary": summary,
            "thought_log": self.thought_logger.thought_log,
            "processing_plan": processing_plan
        }
    
    async def process_batch_pairs(self, card_pairs: List[Dict], user_options: Dict[str, bool], session_id: str = None) -> Dict[str, Any]:
        """
        Process a batch of card pairs (front + back) using AI Agent orchestration
        Front and back are bound together - only front is identified, back is skipped for identification
        """
        self.thought_logger.thought_log = []  # Reset thought log
        self.thought_logger.session_id = session_id  # Set session ID for real-time thoughts
        pair_count = len(card_pairs)
        self.log_thought(f"Starting batch processing of {pair_count} card pair(s)", "start")
        
        # Analyze user options and create processing plan
        processing_plan = await self.planner.create_plan([], user_options)
        self.log_thought(f"Processing plan: {processing_plan}", "planning")
        
        # Execute the processing plan on pairs
        results = await self._execute_processing_plan_pairs(card_pairs, processing_plan)
        
        # Generate final summary
        summary = await self._generate_summary(results)
        self.log_thought(f"Batch processing complete: {summary}", "complete")
        
        return {
            "results": results,
            "summary": summary,
            "thought_log": self.thought_logger.thought_log,
            "processing_plan": processing_plan
        }
    
    async def _execute_processing_plan(self, cards: List[Dict], plan: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Execute the processing plan on all cards"""
        results = []
        
        for i, card in enumerate(cards):
            self.log_thought(f"Processing card {i+1}/{len(cards)}", "processing")
            if i > 0:
                self.log_thought(f"Moving on to card {i+1} of {len(cards)}...", "processing")
            # For single cards, use legacy processing (not implemented in refactor yet)
            # This is a placeholder - you may want to implement single card processing
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
        front_data = pair.get("front", {})
        back_data = pair.get("back", {})
        
        front_image = front_data.get("image_bytes")
        back_image = back_data.get("image_bytes")
        
        # Validate initial image data
        if not front_image:
            self.log_thought(f"Card pair {pair_index+1}: No front image data provided", "error")
            return {
                "card_index": pair_index,
                "pair_index": pair_index,
                "steps_completed": [],
                "results": {},
                "errors": ["No front image data provided"],
                "agent_thoughts": []
            }
        
        if not back_image:
            self.log_thought(f"Card pair {pair_index+1}: No back image data provided", "error")
            return {
                "card_index": pair_index,
                "pair_index": pair_index,
                "steps_completed": [],
                "results": {},
                "errors": ["No back image data provided"],
                "agent_thoughts": []
            }
        
        # Process front image (full processing including identification)
        self.log_thought(f"Card pair {pair_index+1}: Ah yes! Let me begin by carefully examining the front of this card...", "step")
        self.log_thought(f"Card pair {pair_index+1} (front): Looking at the front of the card first - this is where I'll identify the Pokémon!", "step")
        
        front_processor = CardProcessor(self.mcp_client, self.thought_logger, pair_index, "front")
        front_result = await front_processor.process_card_image(front_image, plan, should_identify=True)
        
        # Process back image (skip identification - all backs look the same)
        self.log_thought(f"Card pair {pair_index+1}: Excellent! Now let me flip this card over and examine the back side...", "step")
        self.log_thought(f"Card pair {pair_index+1} (back): Turning the card over... Looking at the back of the card now - all card backs look the same, so I won't need to identify this one!", "step")
        
        back_processor = CardProcessor(self.mcp_client, self.thought_logger, pair_index, "back")
        back_result = await back_processor.process_card_image(back_image, plan, should_identify=False)
        
        # Merge results using pair processor
        pair_result = self.pair_processor.merge_pair_results(front_result, back_result, pair_index)
        
        return pair_result
    
    async def _process_single_card(self, card: Dict, plan: Dict[str, Any], card_index: int) -> Dict[str, Any]:
        """Process a single card following the plan (legacy method)"""
        # Legacy single card processing - simplified for now
        # You may want to fully implement this if single card processing is still needed
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
        
        # For now, return empty result - implement if needed
        self.log_thought(f"Card {card_index+1}: Single card processing not fully implemented in refactor", "error")
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

