from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from app.schemas.schemas import Token, UserCreate, UserResponse
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings

router = APIRouter()
security = HTTPBearer()

# 模拟用户数据库
fake_users_db = {
    "testuser": {
        "id": 1,
        "username": "testuser",
        "email": "testuser@example.com",
        "hashed_password": get_password_hash("password123"),
        "full_name": "测试用户",
        "role": "user",
        "is_active": True
    },
    "developer": {
        "id": 2,
        "username": "developer",
        "email": "dev@example.com",
        "hashed_password": get_password_hash("dev123456"),
        "full_name": "开发者",
        "role": "developer",
        "is_active": True
    },
    "adminuser": {
        "id": 3,
        "username": "adminuser",
        "email": "admin@example.com",
        "hashed_password": get_password_hash("adminpass123"),
        "full_name": "管理员",
        "role": "admin",
        "is_active": True
    }
}

def authenticate_user(username: str, password: str):
    """验证用户凭据"""
    user = fake_users_db.get(username)
    if not user:
        return False
    if not verify_password(password, user["hashed_password"]):
        return False
    return user

@router.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """用户登录"""
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "user_id": user["id"], "role": user["role"]},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user_id": user["id"],
        "username": user["username"],
        "role": user["role"]
    }

@router.post("/refresh")
async def refresh_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """刷新令牌"""
    from app.core.security import verify_token
    
    try:
        payload = verify_token(credentials.credentials)
        username = payload.get("sub")
        user = fake_users_db.get(username)
        
        if not user:
            raise HTTPException(status_code=401, detail="用户不存在")
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["username"], "user_id": user["id"], "role": user["role"]},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="无效的令牌")

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    """用户注册"""
    if user.username in fake_users_db:
        raise HTTPException(
            status_code=400,
            detail="用户名已存在"
        )
    
    # 在实际应用中，这里应该保存到数据库
    hashed_password = get_password_hash(user.password)
    new_user = {
        "id": len(fake_users_db) + 1,
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password,
        "full_name": user.full_name,
        "role": "user",
        "is_active": True
    }
    
    fake_users_db[user.username] = new_user
    
    return UserResponse(
        id=new_user["id"],
        username=new_user["username"],
        email=new_user["email"],
        full_name=new_user["full_name"],
        is_active=new_user["is_active"],
        role=new_user["role"],
        created_at="2025-06-16T14:30:00Z"
    )
