from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.schemas.schemas import VoiceInterpretRequest, VoiceInterpretResponse, ToolExecuteRequest, ToolExecuteResponse
from app.core.security import verify_token
import uuid
import re
from typing import Dict, Any, List

router = APIRouter()
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """获取当前用户"""
    payload = verify_token(credentials.credentials)
    return payload

def parse_voice_intent(query: str) -> Dict[str, Any]:
    """解析语音意图"""
    query = query.lower().strip()
    
    # 转账意图
    transfer_patterns = [
        r'(?:转账|发送|转给|给)\s*([a-zA-Z0-9\u4e00-\u9fa5]{2,20})\s*(\d+(?:\.\d+)?)\s*(?:个)?(?:sol|usdc)?',
        r'向\s*([a-zA-Z0-9\u4e00-\u9fa5]{2,20})\s*转账\s*(\d+(?:\.\d+)?)\s*(?:个)?(?:sol|usdc)?'
    ]
    
    for pattern in transfer_patterns:
        match = re.search(pattern, query)
        if match:
            recipient = match.group(1)
            amount = float(match.group(2))
            currency = "SOL"  # 默认为 SOL
            
            if "usdc" in query:
                currency = "USDC"
            
            return {
                "intent": "transfer",
                "requires_confirmation": True,
                "tool_calls": [{
                    "id": "transfer_sol",
                    "function": {
                        "name": "transfer_sol",
                        "arguments": {
                            "recipient": recipient,
                            "amount": amount,
                            "currency": currency
                        }
                    }
                }],
                "confirmation_message": f"您要向 {recipient} 转账 {amount} {currency}，是否确认？"
            }
    
    # 余额查询意图
    if any(word in query for word in ["余额", "账户", "钱包", "balance"]):
        currency = "SOL"
        if "usdc" in query:
            currency = "USDC"
        
        return {
            "intent": "query_balance",
            "requires_confirmation": False,
            "tool_calls": [{
                "id": "query_balance",
                "function": {
                    "name": "query_balance",
                    "arguments": {
                        "currency": currency
                    }
                }
            }],
            "confirmation_message": f"您要查询 {currency} 余额，是否确认？"
        }
    
    # 交易记录查询
    if any(word in query for word in ["交易记录", "历史记录", "交易历史"]):
        return {
            "intent": "query_transactions",
            "requires_confirmation": False,
            "tool_calls": [{
                "id": "query_transactions",
                "function": {
                    "name": "query_transactions",
                    "arguments": {
                        "limit": 10,
                        "offset": 0
                    }
                }
            }],
            "confirmation_message": "您要查看交易记录，是否确认？"
        }
    
    # 默认为直接响应
    return {
        "intent": "direct_response",
        "requires_confirmation": False,
        "message": "您好！我是您的语音助手，有什么可以帮助您的吗？",
        "tool_calls": None
    }

@router.post("/interpret", response_model=VoiceInterpretResponse)
async def interpret_voice(
    request: VoiceInterpretRequest,
    current_user: dict = Depends(get_current_user)
):
    """语音意图解析"""
    try:
        # 生成会话 ID
        session_id = request.session_id or str(uuid.uuid4())
        
        # 解析意图
        intent_data = parse_voice_intent(request.query)
        
        response = VoiceInterpretResponse(
            intent=intent_data["intent"],
            requires_confirmation=intent_data["requires_confirmation"],
            confirmation_message=intent_data.get("confirmation_message"),
            tool_calls=intent_data.get("tool_calls"),
            session_id=session_id,
            confidence=0.95
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"意图解析失败: {str(e)}"
        )

@router.post("/execute", response_model=ToolExecuteResponse)
async def execute_tool(
    request: ToolExecuteRequest,
    current_user: dict = Depends(get_current_user)
):
    """执行工具调用"""
    try:
        tool_id = request.tool_id
        params = request.parameters
        
        # 模拟工具执行
        if tool_id == "transfer_sol":
            # 模拟转账
            result = {
                "success": True,
                "message": f"成功向 {params['recipient']} 转账 {params['amount']} {params.get('currency', 'SOL')}",
                "data": {
                    "transaction_hash": f"mock_tx_{uuid.uuid4().hex[:16]}",
                    "recipient": params["recipient"],
                    "amount": params["amount"],
                    "currency": params.get("currency", "SOL"),
                    "timestamp": "2025-06-16T14:30:00Z"
                }
            }
        
        elif tool_id == "query_balance":
            # 模拟余额查询
            currency = params.get("currency", "SOL")
            balance = 42.5 if currency == "SOL" else 150.0
            usd_value = balance * 20.5 if currency == "SOL" else balance
            
            result = {
                "success": True,
                "message": f"您的 {currency} 余额为 {balance}",
                "data": {
                    "currency": currency,
                    "balance": balance,
                    "usd_value": usd_value,
                    "timestamp": "2025-06-16T14:30:00Z"
                }
            }
        
        elif tool_id == "query_transactions":
            # 模拟交易记录查询
            result = {
                "success": True,
                "message": "获取交易记录成功",
                "data": {
                    "transactions": [
                        {
                            "signature": "mock_tx_001",
                            "type": "transfer",
                            "amount": 10.0,
                            "currency": "SOL",
                            "recipient": "Alice",
                            "timestamp": "2025-06-15T10:30:00Z",
                            "status": "confirmed"
                        },
                        {
                            "signature": "mock_tx_002",
                            "type": "receive",
                            "amount": 25.0,
                            "currency": "SOL",
                            "sender": "Bob",
                            "timestamp": "2025-06-14T15:45:00Z",
                            "status": "confirmed"
                        }
                    ],
                    "total": 2
                }
            }
        
        else:
            result = {
                "success": False,
                "error": {
                    "code": "TOOL_NOT_FOUND",
                    "message": f"未找到工具: {tool_id}"
                }
            }
        
        return ToolExecuteResponse(
            success=result["success"],
            tool_id=tool_id,
            data=result.get("data"),
            error=result.get("error"),
            session_id=request.session_id
        )
        
    except Exception as e:
        return ToolExecuteResponse(
            success=False,
            tool_id=request.tool_id,
            data=None,
            error={"code": "EXECUTION_ERROR", "message": str(e)},
            session_id=request.session_id
        )
