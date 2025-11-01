"""
Step processors for individual card processing steps
"""
import asyncio
import base64
from typing import Any, Dict, List, Optional, Tuple


class StepProcessor:
    """Handles processing of individual steps for card images"""
    
    def __init__(self, mcp_client, thought_logger, pair_index: int, card_type: str):
        self.mcp_client = mcp_client
        self.thought_logger = thought_logger
        self.pair_index = pair_index
        self.card_type = card_type
    
    async def process_orientation(
        self, 
        current_image: bytes, 
        card_result: Dict[str, Any]
    ) -> Tuple[bytes, bool]:
        """Process orientation check and rotation"""
        self.thought_logger.log_thought(
            f"Card pair {self.pair_index+1} ({self.card_type}): Looking at the {self.card_type} of this card... First, let me check if it's properly oriented!", 
            "step"
        )
        
        result = await self.mcp_client.call_tool("check_orientation", {"image_bytes": current_image})
        if not result.get("success"):
            card_result["errors"].append(f"Orientation check failed: {result.get('error')}")
            self.thought_logger.log_thought(
                f"Card pair {self.pair_index+1} ({self.card_type}): Orientation check failed", 
                "error"
            )
            return current_image, False
        
        if result.get("needs_rotation"):
            self.thought_logger.log_thought(
                f"Card pair {self.pair_index+1} ({self.card_type}): Looking at the {self.card_type}... Hmm, this needs to be rotated! Let me fix that for you!", 
                "step"
            )
            
            try:
                rotation_result = await asyncio.wait_for(
                    self.mcp_client.call_tool("rotate_image", {
                        "image_bytes": current_image,
                        "angle": result.get("rotation_angle", -90),
                        "expand": True,
                        "fillcolor": "white"
                    }),
                    timeout=30.0
                )
                
                if rotation_result.get("success"):
                    rotated_base64_str = rotation_result["rotated_image"]
                    rotated_image = base64.b64decode(rotated_base64_str)
                    card_result["results"]["orientation_corrected"] = rotated_base64_str
                    card_result["steps_completed"].append("orientation_corrected")
                    self.thought_logger.log_thought(
                        f"Card pair {self.pair_index+1} ({self.card_type}): Looking at the {self.card_type}... Perfect! It's now properly oriented. Much better for examination!", 
                        "success"
                    )
                    self.thought_logger.log_thought(
                        f"Card pair {self.pair_index+1} ({self.card_type}): Examining the {self.card_type}... Orientation is perfect - ready to continue!", 
                        "success",
                        {
                            "image_update": {
                                "pair_index": self.pair_index,
                                "card_type": self.card_type,
                                "image_type": "orientation_corrected",
                                "image_base64": rotated_base64_str,
                                "step": "orientation"
                            }
                        }
                    )
                    return rotated_image, True
                else:
                    card_result["errors"].append(f"Rotation failed: {rotation_result.get('error')}")
                    self.thought_logger.log_thought(
                        f"Card pair {self.pair_index+1} ({self.card_type}): Rotation failed", 
                        "error"
                    )
                    return current_image, False
                    
            except asyncio.TimeoutError:
                self.thought_logger.log_thought(
                    f"Card pair {self.pair_index+1} ({self.card_type}): Rotation timed out - skipping", 
                    "error"
                )
                card_result["errors"].append("Rotation timed out - skipping orientation correction")
                return current_image, False
        else:
            card_result["steps_completed"].append("orientation_verified")
            self.thought_logger.log_thought(
                f"Card pair {self.pair_index+1} ({self.card_type}): Looking at the {self.card_type}... Excellent! It's already in the perfect position for analysis!", 
                "success"
            )
            return current_image, True
    
    async def process_background_removal(
        self, 
        current_image: bytes, 
        card_result: Dict[str, Any]
    ) -> Tuple[bytes, bool]:
        """Process background removal"""
        if not current_image:
            card_result["errors"].append("No image data for background removal")
            self.thought_logger.log_thought(
                f"Card pair {self.pair_index+1} ({self.card_type}): No image data for background removal", 
                "error"
            )
            return current_image, False
        
        self.thought_logger.log_thought(
            f"Card pair {self.pair_index+1} ({self.card_type}): Still examining the {self.card_type}... Now I'll carefully remove the background so I can see your card more clearly!", 
            "step"
        )
        result = await self.mcp_client.call_tool("remove_background", {"image_bytes": current_image})
        
        if result.get("success"):
            bg_removed_base64_str = result["processed_image"]
            bg_removed_image = base64.b64decode(bg_removed_base64_str)
            card_result["results"]["background_removed"] = bg_removed_base64_str
            card_result["steps_completed"].append("background_removed")
            self.thought_logger.log_thought(
                f"Card pair {self.pair_index+1} ({self.card_type}): Looking at the {self.card_type}... Wonderful! The background has been removed. Much clearer now!", 
                "success"
            )
            self.thought_logger.log_thought(
                f"Card pair {self.pair_index+1} ({self.card_type}): Examining the {self.card_type}... Much better! Now I can see your card without any distractions!", 
                "step",
                {
                    "image_update": {
                        "pair_index": self.pair_index,
                        "card_type": self.card_type,
                        "image_type": "background_removed",
                        "image_base64": bg_removed_base64_str,
                        "step": "background_removal"
                    }
                }
            )
            return bg_removed_image, True
        else:
            card_result["errors"].append(f"Background removal failed: {result.get('error')}")
            self.thought_logger.log_thought(
                f"Card pair {self.pair_index+1} ({self.card_type}): Background removal failed", 
                "error"
            )
            return current_image, False
    
    async def process_identification(
        self, 
        current_image: bytes, 
        card_result: Dict[str, Any],
        should_identify: bool = True
    ) -> bool:
        """Process card identification"""
        if not should_identify:
            self.thought_logger.log_thought(
                f"Card pair {self.pair_index+1} ({self.card_type}): Looking at the back of this card... All card backs look the same, so I don't need to identify it!", 
                "step"
            )
            return False
        
        print(f"🔍 DEBUG: Starting identification for {self.card_type}")
        if not current_image:
            card_result["errors"].append("No image data for card identification")
            self.thought_logger.log_thought(
                f"Card pair {self.pair_index+1} ({self.card_type}): No image data for card identification", 
                "error"
            )
            return False
        
        self.thought_logger.log_thought(
            f"Card pair {self.pair_index+1} ({self.card_type}): Looking closely at the {self.card_type}... This is fascinating! Let me identify which Pokémon this is!", 
            "step"
        )
        print(f"🔍 DEBUG: About to call identify_card MCP tool for {self.card_type}")
        result = await self.mcp_client.call_tool("identify_card", {"image_bytes": current_image})
        print(f"🔍 DEBUG: identify_card result: {result.get('success')}")
        
        if result.get("success"):
            card_result["results"]["identification"] = result["identification"]
            card_result["steps_completed"].append("identified")
            card_name = result["identification"].get("best", {}).get("name", "Unknown")
            confidence = result["identification"].get("confidence", 0.0)
            print(f"🔍 DEBUG: Card identified as: {card_name} (confidence: {confidence})")
            
            self.thought_logger.log_thought(
                f"Card pair {self.pair_index+1} ({self.card_type}): Aha! I believe this is a {card_name}!", 
                "success",
                {"pair_index": self.pair_index, "card_name": card_name}
            )
            if confidence > 0:
                self.thought_logger.log_thought(
                    f"Card pair {self.pair_index+1} ({self.card_type}): What an interesting find! This {card_name} looks great!", 
                    "step",
                    {"pair_index": self.pair_index, "card_name": card_name}
                )
            print(f"🔍 DEBUG: Logged identification thoughts for {card_name}")
            return True
        else:
            card_result["errors"].append(f"Identification failed: {result.get('error')}")
            self.thought_logger.log_thought(
                f"Card pair {self.pair_index+1} ({self.card_type}): Identification failed", 
                "error"
            )
            print(f"🔍 DEBUG: Identification failed: {result.get('error')}")
            return False
    
    async def process_grading(
        self, 
        original_image: bytes, 
        card_result: Dict[str, Any]
    ) -> bool:
        """Process card grading"""
        if not original_image:
            card_result["errors"].append("No image data for card grading")
            self.thought_logger.log_thought(
                f"Card pair {self.pair_index+1} ({self.card_type}): No image data for card grading", 
                "error"
            )
            return False
        
        self.thought_logger.log_thought(
            f"Card pair {self.pair_index+1} ({self.card_type}): Examining the {self.card_type} carefully... Now I'll assess the condition - checking corners, edges, and surface quality!", 
            "step"
        )
        self.thought_logger.log_thought(
            f"Card pair {self.pair_index+1} ({self.card_type}): Looking at the {self.card_type}... Using the original image for grading to ensure I can see all the details clearly!", 
            "step"
        )
        
        # Add progress thoughts for grading (especially important for back cards)
        async def _add_grading_progress_thoughts():
            await asyncio.sleep(3)
            if self.thought_logger.session_id:
                self.thought_logger.log_thought(
                    f"Card pair {self.pair_index+1} ({self.card_type}): Still examining the {self.card_type}... This takes a moment to be thorough! I want to check every corner and edge carefully.", 
                    "step"
                )
            await asyncio.sleep(5)
            if self.thought_logger.session_id:
                self.thought_logger.log_thought(
                    f"Card pair {self.pair_index+1} ({self.card_type}): Looking at the {self.card_type}... Almost done with the condition assessment! Just checking all the fine details now!", 
                    "step"
                )
        
        # Start progress thoughts as a background task
        if self.card_type == "back":
            asyncio.create_task(_add_grading_progress_thoughts())
        
        try:
            result = await asyncio.wait_for(
                self.mcp_client.call_tool("grade_card", {"image_bytes": original_image}),
                timeout=180.0  # 3 minute timeout
            )
            
            if result.get("success"):
                card_result["results"]["grade"] = result["grade"]
                card_result["steps_completed"].append("graded")
                self.thought_logger.log_thought(
                    f"Card pair {self.pair_index+1} ({self.card_type}): Examining the {self.card_type}... Excellent! I've completed my condition assessment of the {self.card_type}!", 
                    "success"
                )
                self.thought_logger.log_thought(
                    f"Card pair {self.pair_index+1} ({self.card_type}): Looking at the {self.card_type}... The condition assessment is complete! This card looks good!", 
                    "step"
                )
                grade_data = result.get("grade", {})
                if grade_data.get("records") and grade_data["records"][0].get("_full_url_card"):
                    self.thought_logger.log_thought(
                        f"Card pair {self.pair_index+1} ({self.card_type}): Examining the {self.card_type}... I've created a detailed grading analysis image showing the condition assessment!", 
                        "success"
                    )
                return True
            else:
                error_msg = result.get('error', 'Unknown error')
                card_result["errors"].append(f"Grading failed: {error_msg}")
                self.thought_logger.log_thought(
                    f"Card pair {self.pair_index+1} ({self.card_type}): Grading failed: {error_msg}", 
                    "error"
                )
                return False
                
        except asyncio.TimeoutError:
            error_msg = "Grading timed out after 3 minutes"
            card_result["errors"].append(f"Grading failed: {error_msg}")
            self.thought_logger.log_thought(
                f"Card pair {self.pair_index+1} ({self.card_type}): Grading timed out - the analysis is taking too long. This might happen with back cards.", 
                "error"
            )
            return False
        except Exception as e:
            error_msg = str(e)
            card_result["errors"].append(f"Grading failed: {error_msg}")
            self.thought_logger.log_thought(
                f"Card pair {self.pair_index+1} ({self.card_type}): Grading error: {error_msg}", 
                "error"
            )
            print(f"❌ Error grading {self.card_type} card: {error_msg}")
            import traceback
            traceback.print_exc()
            return False
    
    async def process_enhancement(
        self, 
        current_image: bytes, 
        card_result: Dict[str, Any]
    ) -> Tuple[bytes, bool]:
        """Process image enhancement"""
        if self.card_type == "back":
            self.thought_logger.log_thought(
                f"Card pair {self.pair_index+1} ({self.card_type}): Skipping enhancement for back image", 
                "step"
            )
            return current_image, False
        
        result = await self.mcp_client.call_tool("enhance_image", {"image_bytes": current_image})
        if result.get("success"):
            enhanced_base64_str = result["enhanced_image"]
            enhanced_image = base64.b64decode(enhanced_base64_str)
            card_result["results"]["enhanced"] = enhanced_base64_str
            card_result["steps_completed"].append("enhanced")
            self.thought_logger.log_thought(
                f"Card pair {self.pair_index+1} ({self.card_type}): Image enhanced successfully", 
                "success"
            )
            return enhanced_image, True
        else:
            card_result["errors"].append(f"Enhancement failed: {result.get('error')}")
            self.thought_logger.log_thought(
                f"Card pair {self.pair_index+1} ({self.card_type}): Enhancement failed", 
                "error"
            )
            return current_image, False
    
    async def process_description(
        self, 
        card_result: Dict[str, Any]
    ) -> bool:
        """Process description generation"""
        if self.card_type != "front":
            self.thought_logger.log_thought(
                f"Card pair {self.pair_index+1} ({self.card_type}): Skipping description generation - will use front side data", 
                "step"
            )
            return False
        
        id_data = card_result["results"].get("identification", {})
        grade_data = card_result["results"].get("grade", {})
        confidence = id_data.get("confidence", 0.0)
        needs_review = id_data.get("needsManualReview", True)
        
        self.thought_logger.log_thought(
            f"Card pair {self.pair_index+1} ({self.card_type}): Perfect! Now I'll write a detailed listing description for you!", 
            "step"
        )
        result = await self.mcp_client.call_tool("generate_description", {
            "id_result": id_data,
            "grade_result": grade_data,
            "confidence": confidence,
            "needs_review": needs_review
        })
        
        if result.get("success"):
            card_result["results"]["listing_description"] = result["description"]
            card_result["steps_completed"].append("description_generated")
            self.thought_logger.log_thought(
                f"Card pair {self.pair_index+1} ({self.card_type}): Description generated successfully", 
                "success"
            )
            self.thought_logger.log_thought(
                f"Card pair {self.pair_index+1} ({self.card_type}): Excellent! Your listing description is ready!", 
                "step"
            )
            return True
        else:
            card_result["errors"].append(f"Description generation failed: {result.get('error')}")
            self.thought_logger.log_thought(
                f"Card pair {self.pair_index+1} ({self.card_type}): Description generation failed", 
                "error"
            )
            return False

