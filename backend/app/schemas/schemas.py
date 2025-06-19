from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# 用户相关模式
class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    role: str
    created_at: datetime

# 认证相关模式
class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user_id: int
    username: str
    role: str

class TokenData(BaseModel):
    username: Optional[str] = None

# 语音相关模式
class VoiceInterpretRequest(BaseModel):
    query: str
    user_id: int
    session_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class VoiceInterpretResponse(BaseModel):
    intent: str
    requires_confirmation: bool
    confirmation_message: Optional[str] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None
    session_id: str
    confidence: Optional[float] = None

# 工具执行相关模式
class ToolExecuteRequest(BaseModel):
    tool_id: str
    parameters: Dict[str, Any]
    user_id: int
    session_id: str

class ToolExecuteResponse(BaseModel):
    success: bool
    tool_id: str
    data: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None
    session_id: str

# 区块链相关模式
class TransferRequest(BaseModel):
    recipient: str
    amount: float
    currency: str = "SOL"
    memo: Optional[str] = None

class BalanceResponse(BaseModel):
    address: str
    balance: float
    currency: str
    usd_value: Optional[float] = None

class TransactionResponse(BaseModel):
    signature: str
    status: str
    amount: float
    currency: str
    recipient: str
    timestamp: datetime
