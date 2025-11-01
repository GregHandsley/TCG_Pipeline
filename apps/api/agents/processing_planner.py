"""
Processing plan creation for AI Agent
"""
import json
from typing import Any, Dict
from core.settings import settings
from openai import OpenAI


class ProcessingPlanner:
    """Handles creation of processing plans"""
    
    def __init__(self, client: OpenAI, thought_logger):
        self.client = client
        self.thought_logger = thought_logger
    
    async def create_plan(self, cards: list, user_options: Dict[str, bool]) -> Dict[str, Any]:
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
            self.thought_logger.log_thought(f"AI created processing plan: {plan_text}", "planning")
            
            # Parse the plan (fallback to default if parsing fails)
            try:
                plan = json.loads(plan_text)
            except:
                plan = self.default_plan(user_options)
            
            return plan
            
        except Exception as e:
            self.thought_logger.log_thought(f"Error creating processing plan: {str(e)}", "error")
            return self.default_plan(user_options)
    
    def default_plan(self, user_options: Dict[str, bool]) -> Dict[str, Any]:
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

