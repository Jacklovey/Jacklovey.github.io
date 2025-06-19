# GitHub Pages 部署指南

本文档说明如何将 Solana Earphone 项目部署到 GitHub Pages。

## 🚀 快速部署步骤

### 1. 准备 GitHub 仓库

```bash
# 如果还没有推送到 GitHub
git add .
git commit -m "feat: 配置 GitHub Pages 部署"
git push origin main
```

### 2. 配置 GitHub Pages

1. 进入你的 GitHub 仓库页面
2. 点击 **Settings** 标签
3. 在左侧菜单找到 **Pages** 
4. 在 **Source** 部分选择 **GitHub Actions**
5. 保存设置

### 3. 更新配置

在部署前，需要更新以下配置：

1. **更新 package.json 中的 homepage 字段**：
   ```json
   "homepage": "https://yourusername.github.io/your-repo-name"
   ```

2. **更新 vite.config.js 中的 base 路径**：
   ```javascript
   base: process.env.NODE_ENV === 'production' ? '/your-repo-name/' : '/',
   ```

3. **配置后端 API 地址**（在 `.env.production` 中）：
   ```bash
   VITE_API_URL=https://your-backend-api.herokuapp.com
   ```

### 4. 触发部署

推送代码到 main 分支将自动触发 GitHub Actions 部署：

```bash
git push origin main
```

## 📦 本地构建测试

在部署前，建议先在本地测试构建：

```bash
# 安装依赖
npm install

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 使用 gh-pages 手动部署（可选）
npm run deploy
```

## 🔧 故障排除

### 常见问题

1. **页面显示 404**
   - 检查 `base` 路径是否正确
   - 确保仓库名与配置一致

2. **样式文件加载失败**
   - 检查 `vite.config.js` 中的 `assetsDir` 配置
   - 确保 `.nojekyll` 文件存在

3. **API 请求失败**
   - 在 GitHub Pages 上使用 Mock API
   - 或配置 CORS 允许的外部 API

4. **路由不工作**
   - GitHub Pages 不支持客户端路由
   - 考虑使用 Hash 路由或配置重定向

### 环境变量配置

GitHub Pages 环境下的关键环境变量：

```bash
VITE_ENABLE_MOCK=true          # 启用 Mock API
VITE_API_URL=your-api-url      # 外部 API 地址
VITE_ENVIRONMENT=production    # 环境标识
```

## 🌐 访问地址

部署成功后，应用将在以下地址可访问：

```
https://yourusername.github.io/your-repo-name/
```

## 📊 监控和优化

### 性能监控

使用以下工具监控 GitHub Pages 上的应用性能：

```bash
# 运行 Lighthouse 审计
npm run lighthouse

# 分析构建包大小
npm run bundle-analyzer
```

### SEO 优化

为 GitHub Pages 部署添加 SEO 支持：

1. 更新 `index.html` 中的 meta 标签
2. 添加 `robots.txt` 文件
3. 配置 Open Graph 标签

## 🔄 CI/CD 工作流

GitHub Actions 工作流会自动执行以下步骤：

1. **构建阶段**
   - 安装依赖
   - 运行测试
   - 构建生产版本
   - 上传构建产物

2. **部署阶段**
   - 部署到 GitHub Pages
   - 更新部署状态

查看部署状态：在仓库的 **Actions** 标签页查看详细日志。

---

**注意**: GitHub Pages 有一些限制，如不支持服务端渲染和动态 API。本项目使用 Mock Service Worker 来在客户端模拟 API 响应。