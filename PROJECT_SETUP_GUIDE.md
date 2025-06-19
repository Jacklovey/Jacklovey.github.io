# Solana Earphone 项目运行指南

这是一个完整的 Solana 语音智能助手项目，包含 React 前端和 FastAPI 后端。

## 项目架构

```
frontend/  
├── src/                    # React 前端源码
├── backend/                # FastAPI 后端 
├── docs/                   # 项目文档
│   ├── 1.前端技术规范文档.md      # 前端开发规范
│   ├── 2.API接口对接文档.md      # API 接口文档
│   ├── 3.UI_UX设计规范.md       # UI/UX 设计规范
│   ├── 4.核心业务流程文档.md      # 核心业务流程
│   ├── 5.测试要求与验收标准.md    # 测试标准
│   └── 6.开发环境搭建指南.md      # 环境搭建指南
├── package.json           # 前端依赖配置
├── vite.config.js         # Vite 构建配置
└── PROJECT_SETUP_GUIDE.md # 本文件
```

## 功能特性

### 前端 (React + Vite)
- 🎨 **现代 UI** - 基于 Antd Mobile 的响应式界面
- 🎤 **语音识别** - 原生 Web Speech API 集成
- 🔐 **用户认证** - JWT 令牌认证系统
- 📱 **移动优先** - 适配移动设备的用户体验
- 🌙 **主题切换** - 支持明暗主题模式

### 后端 (FastAPI)
- 🔐 **JWT 认证** - 安全的用户认证系统
- 🎤 **语音处理** - 自然语言意图识别
- ⛓️ **区块链集成** - Solana 网络操作模拟
- 🛠️ **工具框架** - 可扩展的功能工具
- 📊 **API 文档** - 自动生成的接口文档

## 环境要求

- **Node.js**: 18+ 
- **Python**: 3.8+
- **包管理器**: npm 或 yarn
- **操作系统**: Linux/macOS/Windows

## 完整启动流程

### 第一步：克隆并进入项目

```bash
# 如果还没有克隆项目
git clone <repository-url>
cd SolanaEarphone
```

### 第二步：启动后端服务

```bash
# 进入后端目录
cd backend

# 创建 Python 虚拟环境（首次运行）
python -m venv venv

# 激活虚拟环境
source venv/bin/activate  # Linux/macOS
# 或 venv\Scripts\activate  # Windows

# 安装 Python 依赖（首次运行）
pip install -r requirements.txt

# 启动后端服务
uvicorn main:app --reload --host 0.0.0.0 --port 8001

# 或者使用 Python 直接运行
python main.py
```

后端服务将在 http://localhost:8001 启动

### 第三步：启动前端服务

```bash
# 回到项目根目录
cd ..

# 安装前端依赖（首次运行）
npm install

# 启动前端开发服务器
npm run dev
```

前端应用将在 http://localhost:3000 启动

### 第四步：访问应用

1. **前端应用**: http://localhost:3000
2. **后端 API 文档**: http://localhost:8000/docs
3. **API Schema**: http://localhost:8000/redoc

## 测试账户

后端提供了以下测试账户：

| 用户名 | 密码 | 角色 |
|--------|------|------|
| testuser | password123 | 普通用户 |
| developer | dev123456 | 开发者 |
| adminuser | adminpass123 | 管理员 |

## 开发工作流

### 前端开发

```bash
# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 运行测试
npm run test
```

### 后端开发

```bash
cd backend

# 激活虚拟环境
source venv/bin/activate

# 启动开发服务器（自动重载）
uvicorn main:app --reload --host 0.0.0.0 --port 8001

# 查看 API 文档
open http://localhost:8001/docs
```

## 项目配置

### 前端配置

- **端口**: 3000 (可在 `vite.config.js` 修改)
- **后端 API**: http://localhost:8001 (在 `src/services/apiClient.js` 配置)
- **主题**: 支持亮色/暗色主题切换

### 后端配置

- **端口**: 8001 (可在 `main.py` 或环境变量修改)
- **CORS**: 已配置允许前端跨域访问
- **JWT**: 自动生成密钥，生产环境需要配置环境变量

## API 接口概览

### 认证接口
- `POST /v1/api/auth/token` - 用户登录
- `GET /v1/api/auth/me` - 获取当前用户信息

### 语音处理
- `POST /v1/api/voice/interpret` - 语音意图识别
- `GET /v1/api/voice/capabilities` - 获取支持的语音功能

### 区块链操作
- `POST /v1/api/blockchain/transfer` - 发起转账
- `GET /v1/api/blockchain/balance/{address}` - 查询余额
- `GET /v1/api/blockchain/transaction/{signature}` - 查询交易

### 工具管理
- `GET /v1/api/tools/available` - 获取可用工具
- `POST /v1/api/tools/execute` - 执行工具操作

### 用户管理
- `GET /v1/api/user/profile` - 获取用户配置
- `PUT /v1/api/user/profile` - 更新用户配置
- `GET /v1/api/user/contacts` - 获取联系人列表

## 常见问题

### 前端问题

**Q: 前端无法连接到后端？**
A: 检查后端是否在 8001 端口运行，确认 `src/services/apiClient.js` 中的 API 地址正确。

**Q: 语音识别不工作？**
A: 确保浏览器支持 Web Speech API，并且允许了麦克风权限。建议使用 Chrome 浏览器。

### 后端问题

**Q: 后端启动失败？**
A: 检查 Python 版本是否为 3.8+，确保虚拟环境已激活，重新安装依赖：`pip install -r requirements.txt`

**Q: JWT 认证失败？**
A: 检查系统时间是否正确，JWT 令牌有时间限制。

## 部署建议

### 开发环境
- 前端：使用 `npm run dev` 进行热重载开发
- 后端：使用 `uvicorn --reload` 进行自动重载

### 生产环境
- 前端：构建静态文件 `npm run build`，部署到 CDN 或静态服务器
- 后端：使用 Gunicorn + Uvicorn workers，配置环境变量和数据库

## 技术支持

如遇到问题，请检查：
1. Node.js 和 Python 版本是否符合要求
2. 依赖是否正确安装
3. 端口是否被占用
4. 防火墙和网络配置

---

**开发团队**: Solana Earphone Team  
**最后更新**: 2025年6月16日
