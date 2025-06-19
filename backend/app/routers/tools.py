from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import verify_token
from typing import List, Dict, Any

router = APIRouter()
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """获取当前用户"""
    payload = verify_token(credentials.credentials)
    return payload

# 模拟可用工具列表
AVAILABLE_TOOLS = [
    {
        "id": "transfer_sol",
        "name": "SOL转账",
        "description": "在Solana网络上转账SOL代币",
        "category": "blockchain",
        "parameters": {
            "type": "object",
            "properties": {
                "recipient": {"type": "string", "description": "接收方地址或联系人"},
                "amount": {"type": "number", "description": "转账金额"},
                "currency": {"type": "string", "enum": ["SOL", "USDC"], "default": "SOL"}
            },
            "required": ["recipient", "amount"]
        }
    },
    {
        "id": "query_balance",
        "name": "查询余额",
        "description": "查询钱包余额",
        "category": "blockchain",
        "parameters": {
            "type": "object",
            "properties": {
                "currency": {"type": "string", "enum": ["SOL", "USDC"], "description": "货币类型"}
            }
        }
    },
    {
        "id": "query_transactions",
        "name": "查询交易记录",
        "description": "查询交易历史记录",
        "category": "blockchain",
        "parameters": {
            "type": "object",
            "properties": {
                "limit": {"type": "number", "default": 10, "description": "返回记录数量"},
                "offset": {"type": "number", "default": 0, "description": "偏移量"}
            }
        }
    },
    {
        "id": "weather_query",
        "name": "天气查询",
        "description": "查询指定城市的天气信息",
        "category": "utility",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "城市名称"},
                "country": {"type": "string", "description": "国家代码", "default": "CN"}
            },
            "required": ["city"]
        }
    }
]

@router.get("/")
async def list_tools(
    category: str = None,
    current_user: dict = Depends(get_current_user)
):
    """获取可用工具列表"""
    tools = AVAILABLE_TOOLS
    
    if category:
        tools = [tool for tool in tools if tool["category"] == category]
    
    return {
        "tools": tools,
        "total": len(tools)
    }

@router.get("/{tool_id}")
async def get_tool_info(
    tool_id: str,
    current_user: dict = Depends(get_current_user)
):
    """获取特定工具的详细信息"""
    tool = next((t for t in AVAILABLE_TOOLS if t["id"] == tool_id), None)
    
    if not tool:
        raise HTTPException(status_code=404, detail="工具不存在")
    
    return tool

@router.get("/{tool_id}/schema")
async def get_tool_schema(
    tool_id: str,
    current_user: dict = Depends(get_current_user)
):
    """获取工具参数模式"""
    tool = next((t for t in AVAILABLE_TOOLS if t["id"] == tool_id), None)
    
    if not tool:
        raise HTTPException(status_code=404, detail="工具不存在")
    
    return {
        "tool_id": tool_id,
        "parameters": tool["parameters"]
    }

@router.post("/{tool_id}/validate")
async def validate_tool_parameters(
    tool_id: str,
    parameters: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """验证工具参数"""
    tool = next((t for t in AVAILABLE_TOOLS if t["id"] == tool_id), None)
    
    if not tool:
        raise HTTPException(status_code=404, detail="工具不存在")
    
    # 简单的参数验证
    required_params = tool["parameters"].get("required", [])
    missing_params = [param for param in required_params if param not in parameters]
    
    if missing_params:
        return {
            "valid": False,
            "errors": {
                "missing_parameters": missing_params
            }
        }
    
    return {
        "valid": True,
        "message": "参数验证通过"
    }
