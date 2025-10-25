#!/usr/bin/env python3
"""
Start MCP Server for TCG Pipeline
Run this alongside the main API server
"""
import uvicorn
from mcp_server import mcp_app, MCP_SERVER_PORT
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv("../../.env")

# Environment variables loaded

if __name__ == "__main__":
    print(f"🚀 Starting MCP Server on port {MCP_SERVER_PORT}")
    print(f"📡 MCP Server will be available at: http://localhost:{MCP_SERVER_PORT}")
    print(f"🔧 Available tools: http://localhost:{MCP_SERVER_PORT}/mcp/tools")
    
    uvicorn.run(
        mcp_app,
        host="0.0.0.0",
        port=MCP_SERVER_PORT,
        log_level="info"
    )
