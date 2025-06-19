from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # 数据库配置
    DATABASE_URL: str = "postgresql://username:password@localhost:5432/solana_earphone"
    REDIS_URL: str = "redis://localhost:6379"
    
    # JWT 配置
    SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # API Keys
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    
    # Solana 配置
    SOLANA_RPC_URL: str = "https://api.devnet.solana.com"
    SOLANA_PRIVATE_KEY: str = ""
    
    # 应用配置
    DEBUG: bool = True
    API_VERSION: str = "v1"
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000", # 标准前端开发端口
        "http://127.0.0.1:3000",
        "http://localhost:3001", # 备用端口
        "http://127.0.0.1:3001",
        "http://localhost:3002", # 备用端口
        "http://127.0.0.1:3002",
        "http://localhost:3003", # 备用端口
        "http://127.0.0.1:3003",
        "https://jacklovey.github.io", # GitHub Pages
        "https://*.ngrok.io", # ngrok 隧道
        "https://*.ngrok-free.app", # 新版 ngrok
    ]
    
    class Config:
        env_file = ".env"

settings = Settings()
