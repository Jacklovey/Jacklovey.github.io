# Solana Earphone Backend

语音智能助手后端服务，基于 FastAPI 构建，为 Solana Earphone 前端应用提供 API 支持。

## 功能特性

- 🔐 **用户认证系统** - JWT 令牌认证，用户注册/登录
- 🎤 **语音意图解析** - 自然语言处理，语音指令识别
- ⛓️ **区块链集成** - Solana 网络集成，转账和余额查询
- 🛠️ **工具管理** - 可扩展的工具框架，支持多种操作
- 👤 **用户管理** - 用户配置、联系人管理
- 📊 **API 文档** - 自动生成的 OpenAPI 文档

## 技术栈

- **FastAPI** - 现代、高性能的 Python Web 框架
- **Pydantic** - 数据验证和序列化
- **Python-JOSE** - JWT 令牌处理
- **Passlib** - 密码哈希
- **Solana Python SDK** - Solana 区块链集成
- **SQLAlchemy** - ORM（可选，用于数据库集成）
- **Uvicorn** - ASGI 服务器

## 环境要求

- **Python**: 3.12+
- **Conda**: Anaconda 或 Miniconda
- **操作系统**: Linux/macOS/Windows

## 快速开始

### 方法一：使用 Conda 环境（推荐）

#### 1. 创建并激活 Conda 环境

```bash
# 使用环境管理脚本（推荐）
chmod +x conda-env.sh
./conda-env.sh create
./conda-env.sh activate

# 或者手动创建
conda env create -f environment.yml
conda activate solana-earphone-backend
```

#### 2. 启动服务

```bash
# 开发模式启动
uvicorn main:app --reload --host 0.0.0.0 --port 8001

# 或者直接运行 main.py
python main.py
```

### 方法二：使用传统 pip 环境

#### 1. 环境准备

```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Linux/Mac:
source venv/bin/activate
# Windows:
venv\\Scripts\\activate

# 安装依赖
pip install -r requirements.txt
```

#### 2. 启动服务

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

服务将在 http://localhost:8001 启动

## Conda 环境管理

项目提供了专门的 Conda 环境管理脚本 `conda-env.sh`：

```bash
# 给脚本添加执行权限
chmod +x conda-env.sh

# 创建环境
./conda-env.sh create

# 激活环境
./conda-env.sh activate

# 更新环境
./conda-env.sh update

# 查看环境信息
./conda-env.sh info

# 删除环境
./conda-env.sh remove

# 查看帮助
./conda-env.sh help
```

## 配置文件

### environment.yml
Conda 环境配置文件，包含所有 Python 依赖和版本信息。

### requirements.txt
传统 pip 依赖文件，与 environment.yml 保持同步。

## API 端点

### 认证 API
- `POST /v1/api/auth/token` - 用户登录
- `POST /v1/api/auth/refresh` - 刷新令牌
- `POST /v1/api/auth/register` - 用户注册

### 语音处理 API
- `POST /v1/api/interpret` - 语音意图解析
- `POST /v1/api/execute` - 执行工具调用

### 区块链 API
- `GET /v1/api/blockchain/balance` - 查询余额
- `POST /v1/api/blockchain/transfer` - 转账代币
- `GET /v1/api/blockchain/transactions` - 获取交易历史
- `GET /v1/api/blockchain/address` - 获取钱包地址

### 工具管理 API
- `GET /v1/api/tools/` - 获取工具列表
- `GET /v1/api/tools/{tool_id}` - 获取工具详情
- `GET /v1/api/tools/{tool_id}/schema` - 获取工具参数模式
- `POST /v1/api/tools/{tool_id}/validate` - 验证工具参数

### 用户管理 API
- `GET /v1/api/user/profile` - 获取用户资料
- `GET /v1/api/user/config` - 获取用户配置
- `PUT /v1/api/user/config` - 更新用户配置
- `GET /v1/api/user/contacts` - 获取联系人
- `POST /v1/api/user/contacts` - 添加联系人
- `PUT /v1/api/user/contacts/{contact_id}` - 更新联系人
- `DELETE /v1/api/user/contacts/{contact_id}` - 删除联系人

## 测试账户

开发环境提供以下测试账户：

| 用户名 | 密码 | 角色 |
|--------|------|------|
| testuser | password123 | user |
| developer | dev123456 | developer |
| adminuser | adminpass123 | admin |

## 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DATABASE_URL` | 数据库连接字符串 | - |
| `REDIS_URL` | Redis 连接字符串 | - |
| `SECRET_KEY` | JWT 签名密钥 | - |
| `ALGORITHM` | JWT 算法 | HS256 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 令牌过期时间（分钟） | 30 |
| `OPENAI_API_KEY` | OpenAI API 密钥 | - |
| `ANTHROPIC_API_KEY` | Anthropic API 密钥 | - |
| `SOLANA_RPC_URL` | Solana RPC 地址 | https://api.devnet.solana.com |
| `SOLANA_PRIVATE_KEY` | Solana 私钥 | - |
| `DEBUG` | 调试模式 | True |
| `CORS_ORIGINS` | 允许的跨域来源 | localhost:3000-3002 |

## 开发指南

### 添加新的 API 路由

1. 在 `app/routers/` 目录下创建新的路由文件
2. 定义 Pydantic 模型在 `app/schemas/`
3. 在 `main.py` 中注册新路由

### 添加新的工具

1. 在 `app/routers/tools.py` 的 `AVAILABLE_TOOLS` 列表中添加工具定义
2. 在 `app/routers/voice.py` 的 `execute_tool` 函数中添加执行逻辑

### 数据库集成

项目预留了数据库集成的结构。要启用数据库：

1. 配置 `DATABASE_URL` 环境变量
2. 创建数据库模型在 `app/models/`
3. 使用 Alembic 管理数据库迁移

## 部署

### Docker 部署

```bash
# 构建镜像
docker build -t solana-earphone-backend .

# 运行容器
docker run -p 8000:8000 --env-file .env solana-earphone-backend
```

### 生产环境配置

1. 设置安全的 `SECRET_KEY`
2. 配置生产数据库
3. 设置适当的 CORS 域名
4. 配置 HTTPS
5. 设置日志记录
6. 配置监控和健康检查

## 贡献

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License
