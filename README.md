# Solana Earphone - 智能语音助手

🎤 一个基于 React + FastAPI 的智能语音助手项目，支持语音识别、意图解析和工具调用。

## 🌐 在线访问

**GitHub Pages**: [https://jacklovey.github.io](https://jacklovey.github.io)

## ✨ 主要功能

- 🎤 **语音识别**: 基于 Web Speech API 的实时语音识别
- 🧠 **意图理解**: 智能解析用户语音意图
- 🔧 **工具调用**: 支持天气查询、地图导航等多种工具
- 💬 **语音反馈**: TTS 语音播报结果
- 🌙 **主题切换**: 支持明暗主题模式
- 📱 **响应式设计**: 适配各种设备尺寸

## 🚀 快速开始

### 本地开发

```bash
# 克隆项目
git clone https://github.com/Jacklovey/Jacklovey.github.io.git
cd Jacklovey.github.io

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 启动后端服务

```bash
# 进入后端目录
cd backend

# 创建并激活虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/macOS
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 启动后端服务
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

## 🔐 测试账户

| 用户名 | 密码 | 角色 |
|--------|------|------|
| testuser | password123 | 普通用户 |
| developer | dev123456 | 开发者 |
| adminuser | adminpass123 | 管理员 |

## 📖 项目文档

- [前端技术规范](docs/1.前端技术规范文档.md)
- [API接口文档](docs/2.API接口对接文档.md)
- [UI/UX设计规范](docs/3.UI_UX设计规范.md)
- [核心业务流程](docs/4.核心业务流程文档.md)
- [测试要求与验收标准](docs/5.测试要求与验收标准.md)
- [开发环境搭建指南](docs/6.开发环境搭建指南.md)

## 🛠️ 技术栈

### 前端
- **React 18** - 用户界面框架
- **Vite** - 构建工具
- **Antd Mobile** - UI 组件库
- **CSS Modules** - 样式管理
- **Jest + Cypress** - 测试框架

### 后端
- **FastAPI** - Python Web 框架
- **JWT** - 身份认证
- **Pydantic** - 数据验证
- **Uvicorn** - ASGI 服务器

## 📝 使用说明

1. **登录系统**: 使用测试账户登录
2. **语音交互**: 点击麦克风按钮开始语音输入
3. **意图确认**: 系统会确认理解的意图
4. **执行操作**: 确认后系统执行相应操作
5. **查看结果**: 通过语音和界面获取结果

## 🔄 自动部署

项目使用 GitHub Actions 自动部署到 GitHub Pages：

- 推送到 `main` 分支时自动触发构建
- 自动安装依赖、构建项目并部署
- 部署后可通过 [https://jacklovey.github.io](https://jacklovey.github.io) 访问

## 📄 许可证

MIT License

---

**开发团队**: Solana Earphone Team  
**最后更新**: 2025年6月19日