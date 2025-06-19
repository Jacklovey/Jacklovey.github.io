from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import verify_token
from typing import Dict, Any

router = APIRouter()
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """获取当前用户"""
    payload = verify_token(credentials.credentials)
    return payload

# 模拟联系人数据
MOCK_CONTACTS = [
    {
        "id": "1",
        "name": "Alice",
        "address": "So11111111111111111111111111111111111111112",
        "note": "朋友"
    },
    {
        "id": "2",
        "name": "Bob",
        "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        "note": "同事"
    },
    {
        "id": "3",
        "name": "Charlie",
        "address": "11111111111111111111111111111111",
        "note": "家人"
    }
]

# 模拟用户设置
MOCK_SETTINGS = {
    "theme": "dark",
    "language": "zh-CN",
    "voice_settings": {
        "rate": 1.0,
        "pitch": 1.0,
        "volume": 1.0
    },
    "notifications": {
        "transaction_notifications": True,
        "price_alerts": True,
        "security_alerts": True
    }
}

@router.get("/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """获取用户资料"""
    user_id = current_user.get("user_id")
    username = current_user.get("sub")
    role = current_user.get("role")
    
    return {
        "id": user_id,
        "username": username,
        "email": f"{username}@example.com",
        "full_name": "测试用户" if username == "testuser" else username,
        "role": role,
        "is_active": True,
        "created_at": "2025-01-01T00:00:00Z",
        "last_login": "2025-06-16T14:30:00Z"
    }

@router.get("/config")
async def get_user_config(current_user: dict = Depends(get_current_user)):
    """获取用户配置"""
    return {
        "contacts": MOCK_CONTACTS,
        "settings": MOCK_SETTINGS
    }

@router.put("/config")
async def update_user_config(
    config: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """更新用户配置"""
    # 在实际应用中，这里会保存到数据库
    # 现在我们只是模拟更新成功
    
    return {
        "success": True,
        "message": "配置更新成功",
        "updated_at": "2025-06-16T14:30:00Z"
    }

@router.get("/contacts")
async def get_contacts(current_user: dict = Depends(get_current_user)):
    """获取联系人列表"""
    return {
        "contacts": MOCK_CONTACTS,
        "total": len(MOCK_CONTACTS)
    }

@router.post("/contacts")
async def add_contact(
    contact: Dict[str, str],
    current_user: dict = Depends(get_current_user)
):
    """添加联系人"""
    required_fields = ["name", "address"]
    for field in required_fields:
        if field not in contact:
            raise HTTPException(status_code=400, detail=f"缺少必需字段: {field}")
    
    new_contact = {
        "id": str(len(MOCK_CONTACTS) + 1),
        "name": contact["name"],
        "address": contact["address"],
        "note": contact.get("note", "")
    }
    
    # 在实际应用中，这里会保存到数据库
    MOCK_CONTACTS.append(new_contact)
    
    return {
        "success": True,
        "message": "联系人添加成功",
        "contact": new_contact
    }

@router.put("/contacts/{contact_id}")
async def update_contact(
    contact_id: str,
    contact: Dict[str, str],
    current_user: dict = Depends(get_current_user)
):
    """更新联系人"""
    # 查找联系人
    existing_contact = next((c for c in MOCK_CONTACTS if c["id"] == contact_id), None)
    if not existing_contact:
        raise HTTPException(status_code=404, detail="联系人不存在")
    
    # 更新联系人信息
    if "name" in contact:
        existing_contact["name"] = contact["name"]
    if "address" in contact:
        existing_contact["address"] = contact["address"]
    if "note" in contact:
        existing_contact["note"] = contact["note"]
    
    return {
        "success": True,
        "message": "联系人更新成功",
        "contact": existing_contact
    }

@router.delete("/contacts/{contact_id}")
async def delete_contact(
    contact_id: str,
    current_user: dict = Depends(get_current_user)
):
    """删除联系人"""
    # 查找联系人
    contact_index = next((i for i, c in enumerate(MOCK_CONTACTS) if c["id"] == contact_id), None)
    if contact_index is None:
        raise HTTPException(status_code=404, detail="联系人不存在")
    
    # 删除联系人
    deleted_contact = MOCK_CONTACTS.pop(contact_index)
    
    return {
        "success": True,
        "message": "联系人删除成功",
        "deleted_contact": deleted_contact
    }

@router.get("/settings")
async def get_user_settings(current_user: dict = Depends(get_current_user)):
    """获取用户设置"""
    return MOCK_SETTINGS

@router.put("/settings")
async def update_user_settings(
    settings: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """更新用户设置"""
    # 在实际应用中，这里会保存到数据库
    # 现在我们只是模拟更新成功
    
    # 合并设置
    MOCK_SETTINGS.update(settings)
    
    return {
        "success": True,
        "message": "设置更新成功",
        "settings": MOCK_SETTINGS
    }
