# Solana Earphone 项目运行指南

## ✅ 当前状态

🟢 **前端**: 运行在 http://localhost:3000 (正常)  
🟢 **后端**: 运行在 http://localhost:8001 (正常)  
🟢 **API 文档**: http://localhost:8001/docs (可访问)

## 🚀 快速启动（推荐）

### 方法一：使用一键启动脚本
```bash
cd /home/nanchang/SolanaEarphone
./start.sh
```

### 方法二：分步启动

#### 1. 启动后端服务 (使用 Conda 环境)
```bash
cd /home/nanchang/xw/frontend/backend

# 方法一：使用环境管理脚本（推荐）
./conda-env.sh create  # 首次运行创建环境
./conda-env.sh activate # 激活环境并启动子shell
uvicorn main:app --reload --host 0.0.0.0 --port 8001

# 方法二：手动管理环境
conda env create -f environment.yml  # 首次运行
conda activate solana-earphone-backend
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

#### 2. 启动前端服务（新终端）
```bash
cd /home/nanchang/xw/frontend
npm run dev
```

### 使用 Conda 一键启动脚本

```bash
cd /home/nanchang/xw/frontend
./start.sh  # 现在支持 Conda 环境管理
```

## 📱 访问地址

- **前端应用**: http://localhost:3000
- **后端 API**: http://localhost:8001
- **API 文档**: http://localhost:8001/docs

## 🔐 测试账户

| 用户名 | 密码 | 角色 |
|--------|------|------|
| testuser | password123 | 普通用户 |
| developer | dev123456 | 开发者 |
| adminuser | adminpass123 | 管理员 |

## 🛠️ 常用命令

### 前端开发
```bash
npm run dev        # 开发模式
npm run build      # 构建生产版本
npm run preview    # 预览构建结果
```

### 后端开发
```bash
cd test_backend
source venv/bin/activate
python main.py     # 启动服务
```

## 📋 检查服务状态

```bash
# 检查端口使用情况
netstat -tlnp | grep -E "(3000|8001)"

# 检查进程
ps aux | grep -E "(node|uvicorn)" | grep -v grep
```

## 🔧 故障排除

### 前端问题
- 端口被占用：修改 `vite.config.js` 中的端口
- 依赖问题：删除 `node_modules`，重新 `npm install`

### 后端问题
- Python 环境：确保激活虚拟环境 `source venv/bin/activate`
- 依赖问题：重新安装 `pip install -r requirements.txt`
- 端口被占用：修改 `main.py` 中的端口配置

---

**详细文档**: 请查看 `PROJECT_SETUP_GUIDE.md`
