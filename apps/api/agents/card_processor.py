"""
Card image processing orchestrator
"""
import base64
from typing import Any, Dict
from .step_processors import StepProcessor


class CardProcessor:
    """Orchestrates processing of a single card image"""
    
    def __init__(self, mcp_client, thought_logger, pair_index: int, card_type: str):
        self.mcp_client = mcp_client
        self.thought_logger = thought_logger
        self.pair_index = pair_index
        self.card_type = card_type
        self.step_processor = StepProcessor(mcp_client, thought_logger, pair_index, card_type)
    
    async def process_card_image(
        self, 
        image_bytes: bytes, 
        plan: Dict[str, Any], 
        should_identify: bool = True
    ) -> Dict[str, Any]:
        """Process a single card image (front or back) following the plan"""
        card_result = {
            "steps_completed": [],
            "results": {},
            "errors": []
        }
        
        current_image = image_bytes
        original_image = image_bytes  # Keep original for grading (Ximilar needs original image)
        
        print(f"🔍 DEBUG: Processing {self.card_type} card, should_identify={should_identify}")
        print(f"🔍 DEBUG: Plan steps: {[(s['name'], s['enabled']) for s in plan['steps']]}")
        
        for step in plan["steps"]:
            if not step["enabled"]:
                print(f"🔍 DEBUG: Skipping disabled step: {step['name']}")
                continue
            
            step_name = step["name"]
            print(f"🔍 DEBUG: Processing step: {step_name} for {self.card_type}")
            
            # Skip identification for back images
            if step_name == "identify_card" and not should_identify:
                print(f"🔍 DEBUG: Skipping identification for {self.card_type} (should_identify=False)")
                self.thought_logger.log_thought(
                    f"Card pair {self.pair_index+1} ({self.card_type}): Looking at the back of this card... All card backs look the same, so I don't need to identify it!", 
                    "step"
                )
                continue
            
            # More descriptive Professor Oak-style messages for each step
            if step_name == "check_orientation":
                self.thought_logger.log_thought(
                    f"Card pair {self.pair_index+1} ({self.card_type}): Looking at the {self.card_type} of this card... First, let me check if it's properly oriented!", 
                    "step"
                )
            elif step_name == "remove_background":
                self.thought_logger.log_thought(
                    f"Card pair {self.pair_index+1} ({self.card_type}): Still examining the {self.card_type}... Now I'll remove the background so I can see it more clearly!", 
                    "step"
                )
            elif step_name == "identify_card":
                self.thought_logger.log_thought(
                    f"Card pair {self.pair_index+1} ({self.card_type}): Looking closely at the {self.card_type}... This is the exciting part - let me identify which Pokémon this is!", 
                    "step"
                )
            elif step_name == "grade_card":
                self.thought_logger.log_thought(
                    f"Card pair {self.pair_index+1} ({self.card_type}): Examining the {self.card_type} carefully... Now I'll assess the condition - checking corners, edges, and surface quality!", 
                    "step"
                )
            elif step_name == "enhance_image":
                self.thought_logger.log_thought(
                    f"Card pair {self.pair_index+1} ({self.card_type}): Looking at the {self.card_type}... Let me enhance the image quality for better examination!", 
                    "step"
                )
            else:
                self.thought_logger.log_thought(
                    f"Card pair {self.pair_index+1} ({self.card_type}): Working on the {self.card_type}... {step['reason']}", 
                    "step"
                )
            
            try:
                if step_name == "check_orientation":
                    current_image, success = await self.step_processor.process_orientation(current_image, card_result)
                    if not success:
                        continue
                
                elif step_name == "remove_background":
                    current_image, success = await self.step_processor.process_background_removal(current_image, card_result)
                    if not success:
                        continue
                
                elif step_name == "identify_card":
                    success = await self.step_processor.process_identification(current_image, card_result, should_identify)
                    if not success:
                        continue
                
                elif step_name == "grade_card":
                    # Use original image for grading - Ximilar needs original image with context
                    success = await self.step_processor.process_grading(original_image, card_result)
                    if not success:
                        continue
                
                elif step_name == "enhance_image":
                    current_image, success = await self.step_processor.process_enhancement(current_image, card_result)
                    if not success:
                        continue
                
                elif step_name == "generate_description":
                    success = await self.step_processor.process_description(card_result)
                    if not success:
                        continue
            
            except Exception as e:
                error_msg = f"Step {step_name} failed: {str(e)}"
                card_result["errors"].append(error_msg)
                self.thought_logger.log_thought(
                    f"Card pair {self.pair_index+1} ({self.card_type}): {error_msg}", 
                    "error"
                )
        
        return card_result

