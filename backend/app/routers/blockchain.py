from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.schemas.schemas import TransferRequest, BalanceResponse, TransactionResponse
from app.core.security import verify_token
from typing import List
import uuid

router = APIRouter()
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """获取当前用户"""
    payload = verify_token(credentials.credentials)
    return payload

@router.get("/balance", response_model=BalanceResponse)
async def get_balance(
    currency: str = "SOL",
    current_user: dict = Depends(get_current_user)
):
    """获取钱包余额"""
    try:
        # 模拟钱包地址
        mock_address = "So11111111111111111111111111111111111111112"
        
        # 模拟余额数据
        if currency.upper() == "SOL":
            balance = 42.5
            usd_value = balance * 20.5  # 假设 SOL 价格为 $20.5
        elif currency.upper() == "USDC":
            balance = 150.0
            usd_value = balance * 1.0  # USDC 价格为 $1
        else:
            raise HTTPException(status_code=400, detail="不支持的货币类型")
        
        return BalanceResponse(
            address=mock_address,
            balance=balance,
            currency=currency.upper(),
            usd_value=usd_value
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取余额失败: {str(e)}")

@router.post("/transfer")
async def transfer_tokens(
    request: TransferRequest,
    current_user: dict = Depends(get_current_user)
):
    """转账代币"""
    try:
        # 在实际应用中，这里会调用 Solana API 进行转账
        # 现在我们模拟转账过程
        
        if request.amount <= 0:
            raise HTTPException(status_code=400, detail="转账金额必须大于0")
        
        if request.amount > 1000:
            raise HTTPException(status_code=400, detail="转账金额过大")
        
        # 模拟交易签名
        transaction_signature = f"mock_tx_{uuid.uuid4().hex[:16]}"
        
        return {
            "success": True,
            "message": f"成功向 {request.recipient} 转账 {request.amount} {request.currency}",
            "transaction": {
                "signature": transaction_signature,
                "status": "confirmed",
                "amount": request.amount,
                "currency": request.currency,
                "recipient": request.recipient,
                "memo": request.memo,
                "timestamp": "2025-06-16T14:30:00Z"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"转账失败: {str(e)}")

@router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    limit: int = 10,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """获取交易历史"""
    try:
        # 模拟交易数据
        mock_transactions = [
            {
                "signature": "mock_tx_001",
                "status": "confirmed",
                "amount": 10.0,
                "currency": "SOL",
                "recipient": "Alice",
                "timestamp": "2025-06-15T10:30:00Z"
            },
            {
                "signature": "mock_tx_002",
                "status": "confirmed",
                "amount": 25.0,
                "currency": "SOL",
                "recipient": "Bob",
                "timestamp": "2025-06-14T15:45:00Z"
            },
            {
                "signature": "mock_tx_003",
                "status": "confirmed",
                "amount": 5.5,
                "currency": "SOL",
                "recipient": "Charlie",
                "timestamp": "2025-06-13T09:15:00Z"
            }
        ]
        
        # 应用分页
        start = offset
        end = offset + limit
        paginated_transactions = mock_transactions[start:end]
        
        return [
            TransactionResponse(**tx) for tx in paginated_transactions
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取交易历史失败: {str(e)}")

@router.get("/address")
async def get_wallet_address(current_user: dict = Depends(get_current_user)):
    """获取钱包地址"""
    return {
        "address": "So11111111111111111111111111111111111111112",
        "network": "devnet",
        "user_id": current_user.get("user_id")
    }
