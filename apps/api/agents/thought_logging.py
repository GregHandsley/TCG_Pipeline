"""
Thought logging and transformation for AI Agent
Handles Professor Oak-style message transformation
"""
import time
from typing import Any, Dict, List

# Global store for real-time thoughts
_realtime_thoughts: Dict[str, List[Dict[str, Any]]] = {}

def get_realtime_thoughts(session_id: str) -> List[Dict[str, Any]]:
    """Get real-time thoughts for a session"""
    return _realtime_thoughts.get(session_id, [])

def clear_realtime_thoughts(session_id: str):
    """Clear real-time thoughts for a session"""
    if session_id in _realtime_thoughts:
        del _realtime_thoughts[session_id]

class ThoughtLogger:
    """Handles logging and transformation of AI agent thoughts"""
    
    def __init__(self, session_id: str = None):
        self.session_id = session_id
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
        if self.session_id:
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

