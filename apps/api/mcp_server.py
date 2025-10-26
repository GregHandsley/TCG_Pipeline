"""
MCP Server for TCG Pipeline
Exposes existing tools as MCP functions for AI Agent to use
"""
from __future__ import annotations
import asyncio
import json
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
# Load environment variables BEFORE importing services
from dotenv import load_dotenv
import os
load_dotenv("../../.env")

from services.ximilar import identify_card, edit_image, grade_card, enhance_image
from services.description import build_listing_description
from core.settings import settings
import base64
from PIL import Image
import io

# Environment variables loaded successfully

# MCP Server Configuration
MCP_SERVER_PORT = 8001

class MCPRequest(BaseModel):
    method: str
    params: Dict[str, Any]

class MCPResponse(BaseModel):
    result: Any = None
    error: Optional[str] = None

class TCGMCPTools:
    """
    MCP Tools for TCG Pipeline
    Exposes existing functionality as MCP functions
    """
    
    def __init__(self):
        self.tools = {
            "check_orientation": self.check_orientation,
            "rotate_image": self.rotate_image,
            "remove_background": self.remove_background,
            "identify_card": self.identify_card,
            "grade_card": self.grade_card,
            "enhance_image": self.enhance_image,
            "generate_description": self.generate_description,
            "batch_process": self.batch_process
        }
    
    async def check_orientation(self, image_bytes: str) -> Dict[str, Any]:
        """Check if card is in portrait orientation (detection only)"""
        try:
            # Decode base64 string back to bytes
            if isinstance(image_bytes, str):
                image_bytes = base64.b64decode(image_bytes)
            
            # Open image with PIL
            image = Image.open(io.BytesIO(image_bytes))
            width, height = image.size
            
            # Check if image is in landscape (width > height)
            is_landscape = width > height
            
            if is_landscape:
                return {
                    "success": True,
                    "needs_rotation": True,
                    "current_orientation": "landscape",
                    "target_orientation": "portrait",
                    "rotation_angle": -90,  # Clockwise rotation
                    "dimensions": {"width": width, "height": height},
                    "message": "Card is in landscape orientation and needs to be rotated to portrait"
                }
            else:
                # Already in portrait orientation
                return {
                    "success": True,
                    "needs_rotation": False,
                    "current_orientation": "portrait",
                    "target_orientation": "portrait",
                    "rotation_angle": 0,
                    "dimensions": {"width": width, "height": height},
                    "message": "Card is already in correct portrait orientation"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Orientation check failed"
            }
    
    async def rotate_image(self, image_bytes: str, angle: int = -90, expand: bool = True, fillcolor: str = "white") -> Dict[str, Any]:
        """Rotate image by specified angle using Pillow"""
        try:
            # Decode base64 string back to bytes
            if isinstance(image_bytes, str):
                image_bytes = base64.b64decode(image_bytes)
            
            # Open image with PIL
            image = Image.open(io.BytesIO(image_bytes))
            original_width, original_height = image.size
            
            # Rotate the image
            rotated_image = image.rotate(angle, expand=expand, fillcolor=fillcolor)
            new_width, new_height = rotated_image.size
            
            # Convert back to bytes
            img_buffer = io.BytesIO()
            # Preserve original format if possible
            if image.format:
                rotated_image.save(img_buffer, format=image.format)
            else:
                rotated_image.save(img_buffer, format='PNG')
            
            rotated_bytes = img_buffer.getvalue()
            
            return {
                "success": True,
                "rotated_image": base64.b64encode(rotated_bytes).decode('utf-8'),
                "original_dimensions": {"width": original_width, "height": original_height},
                "new_dimensions": {"width": new_width, "height": new_height},
                "rotation_angle": angle,
                "expanded": expand,
                "fillcolor": fillcolor,
                "message": f"Image rotated {angle} degrees successfully"
            }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Image rotation failed"
            }
    
    async def remove_background(self, image_bytes: str) -> Dict[str, Any]:
        """Remove background from card image"""
        try:
            import base64
            # Decode base64 string back to bytes
            if isinstance(image_bytes, str):
                image_bytes = base64.b64decode(image_bytes)
            
            cleaned_bytes = await edit_image(image_bytes)
            return {
                "success": True,
                "processed_image": base64.b64encode(cleaned_bytes).decode('utf-8'),
                "message": "Background removed successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Background removal failed"
            }
    
    async def identify_card(self, image_bytes: str) -> Dict[str, Any]:
        """Identify the trading card"""
        try:
            import base64
            # Decode base64 string back to bytes
            if isinstance(image_bytes, str):
                image_bytes = base64.b64decode(image_bytes)
            
            result = await identify_card(image_bytes)
            return {
                "success": True,
                "identification": result,
                "message": f"Card identified: {result.get('best', {}).get('name', 'Unknown')}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Card identification failed"
            }
    
    async def grade_card(self, image_bytes: str) -> Dict[str, Any]:
        """Grade the card condition"""
        try:
            import base64
            # Decode base64 string back to bytes
            if isinstance(image_bytes, str):
                image_bytes = base64.b64decode(image_bytes)
            
            grade_result = await grade_card(image_bytes)
            return {
                "success": True,
                "grade": grade_result,
                "message": "Card graded successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Card grading failed"
            }
    
    async def enhance_image(self, image_bytes: str) -> Dict[str, Any]:
        """Enhance image quality"""
        try:
            import base64
            # Decode base64 string back to bytes
            if isinstance(image_bytes, str):
                image_bytes = base64.b64decode(image_bytes)
            
            enhanced_bytes = await enhance_image(image_bytes)
            return {
                "success": True,
                "enhanced_image": base64.b64encode(enhanced_bytes).decode('utf-8'),
                "message": "Image enhanced successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Image enhancement failed"
            }
    
    async def generate_description(self, id_result: Dict, grade_result: Dict, confidence: float, needs_review: bool) -> Dict[str, Any]:
        """Generate eBay listing description"""
        try:
            description = build_listing_description(
                id_norm=id_result,
                grade_json=grade_result,
                confidence=confidence,
                needsManualReview=needs_review
            )
            return {
                "success": True,
                "description": description,
                "message": "Description generated successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Description generation failed"
            }
    
    async def batch_process(self, cards: List[Dict], options: Dict[str, bool]) -> Dict[str, Any]:
        """
        Process multiple cards with specified options
        options: {
            "remove_background": bool,
            "identify": bool,
            "grade": bool,
            "enhance": bool,
            "generate_description": bool
        }
        """
        results = []
        
        for i, card in enumerate(cards):
            card_result = {
                "card_index": i,
                "original_image": card.get("image_bytes"),
                "steps_completed": [],
                "results": {},
                "errors": []
            }
            
            try:
                # Step 1: Remove Background (if requested and available)
                if options.get("remove_background", True) and card.get("image_bytes"):
                    bg_result = await self.remove_background(card["image_bytes"])
                    if bg_result["success"]:
                        card_result["results"]["background_removed"] = bg_result["processed_image"]
                        card_result["steps_completed"].append("background_removed")
                    else:
                        card_result["errors"].append(f"Background removal: {bg_result['error']}")
                
                # Step 2: Identify Card (if requested)
                if options.get("identify", True):
                    image_to_use = card_result["results"].get("background_removed") or card.get("image_bytes")
                    if image_to_use:
                        id_result = await self.identify_card(image_to_use)
                        if id_result["success"]:
                            card_result["results"]["identification"] = id_result["identification"]
                            card_result["steps_completed"].append("identified")
                        else:
                            card_result["errors"].append(f"Identification: {id_result['error']}")
                
                # Step 3: Grade Card (if requested and identified)
                if options.get("grade", True) and "identification" in card_result["results"]:
                    image_to_use = card_result["results"].get("background_removed") or card.get("image_bytes")
                    if image_to_use:
                        grade_result = await self.grade_card(image_to_use)
                        if grade_result["success"]:
                            card_result["results"]["grade"] = grade_result["grade"]
                            card_result["steps_completed"].append("graded")
                        else:
                            card_result["errors"].append(f"Grading: {grade_result['error']}")
                
                # Step 4: Enhance Image (if requested)
                if options.get("enhance", False):
                    image_to_use = card_result["results"].get("background_removed") or card.get("image_bytes")
                    if image_to_use:
                        enhance_result = await self.enhance_image(image_to_use)
                        if enhance_result["success"]:
                            card_result["results"]["enhanced"] = enhance_result["enhanced_image"]
                            card_result["steps_completed"].append("enhanced")
                        else:
                            card_result["errors"].append(f"Enhancement: {enhance_result['error']}")
                
                # Step 5: Generate Description (if requested and identified)
                if options.get("generate_description", True) and "identification" in card_result["results"]:
                    id_data = card_result["results"]["identification"]
                    grade_data = card_result["results"].get("grade", {})
                    confidence = id_data.get("confidence", 0.0)
                    needs_review = id_data.get("needsManualReview", True)
                    
                    desc_result = await self.generate_description(id_data, grade_data, confidence, needs_review)
                    if desc_result["success"]:
                        card_result["results"]["description"] = desc_result["description"]
                        card_result["steps_completed"].append("description_generated")
                    else:
                        card_result["errors"].append(f"Description: {desc_result['error']}")
                
            except Exception as e:
                card_result["errors"].append(f"Processing error: {str(e)}")
            
            results.append(card_result)
        
        return {
            "success": True,
            "results": results,
            "summary": {
                "total_cards": len(cards),
                "successful": len([r for r in results if not r["errors"]]),
                "failed": len([r for r in results if r["errors"]])
            }
        }

# Initialize MCP Tools
mcp_tools = TCGMCPTools()

# FastAPI app for MCP Server
mcp_app = FastAPI(title="TCG MCP Server", version="1.0.0")

@mcp_app.post("/mcp/call")
async def mcp_call(request: MCPRequest) -> MCPResponse:
    """Handle MCP function calls"""
    try:
        method = request.method
        params = request.params
        
        if method not in mcp_tools.tools:
            return MCPResponse(error=f"Unknown method: {method}")
        
        # Call the appropriate tool
        if method == "batch_process":
            result = await mcp_tools.tools[method](params.get("cards", []), params.get("options", {}))
        elif method == "generate_description":
            result = await mcp_tools.tools[method](
                params.get("id_result", {}),
                params.get("grade_result", {}),
                params.get("confidence", 0.0),
                params.get("needs_review", True)
            )
        else:
            # For image processing methods
            image_bytes = params.get("image_bytes")
            if not image_bytes:
                return MCPResponse(error="image_bytes parameter required")
            result = await mcp_tools.tools[method](image_bytes)
        
        return MCPResponse(result=result)
    
    except Exception as e:
        return MCPResponse(error=str(e))

@mcp_app.get("/mcp/tools")
async def list_tools():
    """List available MCP tools"""
    return {
        "tools": list(mcp_tools.tools.keys()),
        "descriptions": {
            "check_orientation": "Check if card is in portrait orientation (detection only)",
            "rotate_image": "Rotate image by specified angle using Pillow",
            "remove_background": "Remove background from card image",
            "identify_card": "Identify the trading card",
            "grade_card": "Grade the card condition",
            "enhance_image": "Enhance image quality",
            "generate_description": "Generate eBay listing description",
            "batch_process": "Process multiple cards with specified options"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(mcp_app, host="0.0.0.0", port=MCP_SERVER_PORT)
