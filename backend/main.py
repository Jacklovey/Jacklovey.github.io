from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 导入路由模块
from app.routers import auth, voice, blockchain, tools, user
from app.core.config import settings
from app.core.security import verify_token

# 创建 FastAPI 应用
app = FastAPI(
    title="Solana Earphone API",
    description="语音智能助手后端服务",
    version="1.0.0",
    openapi_url=f"/{settings.API_VERSION}/openapi.json"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 安全认证
security = HTTPBearer()

# 根路径
@app.get("/")
async def root():
    return {
        "message": "Solana Earphone API",
        "version": "1.0.0",
        "status": "running"
    }

# 健康检查
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2025-06-16T14:30:00Z"}

# 包含路由
app.include_router(auth.router, prefix=f"/{settings.API_VERSION}/api/auth", tags=["authentication"])
app.include_router(voice.router, prefix=f"/{settings.API_VERSION}/api", tags=["voice"])
app.include_router(blockchain.router, prefix=f"/{settings.API_VERSION}/api/blockchain", tags=["blockchain"])
app.include_router(tools.router, prefix=f"/{settings.API_VERSION}/api/tools", tags=["tools"])
app.include_router(user.router, prefix=f"/{settings.API_VERSION}/api/user", tags=["user"])

# 全局异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if settings.DEBUG else False
    )
