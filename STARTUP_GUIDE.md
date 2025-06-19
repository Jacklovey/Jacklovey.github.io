# Solana Earphone 完整项目启动指南

## 项目架构

这个项目包含两个主要部分：
- **前端**: React + Vite 应用 (端口 3002)
- **后端**: FastAPI Python 服务 (端口 8001)

## 完整启动步骤

### 1. 启动后端服务

```bash
# 进入后端目录
cd backend

# 激活虚拟环境
source venv/bin/activate

# 启动后端服务
python main.py
```

后端服务将在 http://localhost:8001 启动

### 2. 启动前端服务

```bash
# 进入前端目录
cd /home/nanchang/frontend

# 启动前端开发服务器
npm run dev
```

前端服务将在 http://localhost:3002 启动

### 3. 验证服务状态

- **前端应用**: http://localhost:3002
- **后端 API 文档**: http://localhost:8001/docs
- **后端健康检查**: http://localhost:8001/health

## 测试账户

| 用户名 | 密码 | 角色 |
|--------|------|------|
| testuser | password123 | user |
| developer | dev123456 | developer |
| adminuser | adminpass123 | admin |

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

### 用户管理 API
- `GET /v1/api/user/profile` - 获取用户资料
- `GET /v1/api/user/config` - 获取用户配置
- `GET /v1/api/user/contacts` - 获取联系人列表

## 功能测试

1. **登录测试**: 使用测试账户登录
2. **语音意图测试**: 输入 "向Alice转账10个SOL"
3. **余额查询测试**: 输入 "查询我的余额"
4. **交易记录测试**: 输入 "查看交易记录"

## 开发工具

- **VS Code**: 推荐的代码编辑器
- **Python 扩展**: 后端开发支持
- **ES6+ 语法**: 前端开发支持
- **API 调试**: 使用 Swagger UI (http://localhost:8001/docs)

## 故障排除

### 端口冲突
如果端口被占用，可以修改：
- 前端: `vite.config.js` 中的 `server.port`
- 后端: `main.py` 中的端口号

### 跨域问题
后端已配置 CORS 支持前端域名。如需修改，请编辑 `app/core/config.py` 中的 `CORS_ORIGINS`

### 依赖问题
```bash
# 重新安装前端依赖
cd /home/nanchang/SolanaEarphone && npm install

# 重新安装后端依赖
cd /home/nanchang/SolanaEarphone/backend && pip install -r requirements.txt
```
