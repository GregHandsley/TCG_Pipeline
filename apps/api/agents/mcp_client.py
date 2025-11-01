"""
MCP Client for calling MCP tools
"""
import asyncio
import base64
import httpx
from typing import Any, Dict
from core.settings import settings


class MCPClient:
    """Client for calling MCP tools"""
    
    def __init__(self, thought_logger):
        # Use host.docker.internal to reach the host machine from Docker
        self.mcp_base_url = "http://host.docker.internal:8001"  # MCP Server URL
        self.thought_logger = thought_logger
    
    async def call_tool(self, method: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Call MCP tool and return result"""
        try:
            self.thought_logger.log_thought(f"Calling MCP tool: {method}", "step")
            print(f"🔧 Calling MCP tool: {method} with params: {list(params.keys())}")
            
            # Add intermediate thoughts for long-running operations
            if method in ["remove_background", "identify_card"]:
                self.thought_logger.log_thought(f"Processing... This may take a moment. Please be patient!", "step")
            
            # Convert image_bytes to base64 if present
            if "image_bytes" in params and isinstance(params["image_bytes"], bytes):
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
            self.thought_logger.log_thought(f"Error calling MCP tool {method}: {str(e)}", "error")
            print(f"❌ MCP tool {method} failed: {str(e)}")
            raise
    
    async def _add_background_progress_thoughts(self):
        """Add intermediate thoughts during background removal"""
        await asyncio.sleep(2)
        if self.thought_logger.session_id:
            self.thought_logger.log_thought("Still working on removing that background... almost there!", "step")
        await asyncio.sleep(3)
        if self.thought_logger.session_id:
            self.thought_logger.log_thought("The background removal is taking a bit longer, but we're making progress!", "step")
    
    async def _add_identification_progress_thoughts(self):
        """Add intermediate thoughts during card identification"""
        await asyncio.sleep(2)
        if self.thought_logger.session_id:
            self.thought_logger.log_thought("Searching through my database... there are so many Pokémon to check!", "step")
        await asyncio.sleep(3)
        if self.thought_logger.session_id:
            self.thought_logger.log_thought("Still analyzing... I want to make sure I identify this correctly!", "step")

