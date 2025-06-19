# SolanaEarphone 项目 Fork 工作流程完整指南

## 当前配置状态
- **你的fork**: https://github.com/xuwei-Search/fronted.git
- **原项目**: https://github.com/SolanaEarphone/frontend.git
- **本地目录**: /home/nanchang/SolanaEarphone

## 重要说明
⚠️ **你不能直接在原项目上创建分支**，只有项目维护者才有这个权限。
✅ **正确的方式是**：在你的fork上创建分支，然后通过Pull Request贡献给原项目。

## 完整工作流程

### 1. 确保Git配置正确
```bash
cd /home/nanchang/SolanaEarphone
git remote -v
# 应该显示：
# origin    https://github.com/xuwei-Search/fronted.git (fetch)
# origin    https://github.com/xuwei-Search/fronted.git (push)
# upstream  https://github.com/SolanaEarphone/frontend.git (fetch)
# upstream  https://github.com/SolanaEarphone/frontend.git (push)
```

### 2. 同步fork与原项目（重要！）
```bash
# 获取原项目最新更改
git fetch upstream

# 切换到主分支
git checkout main

# 合并原项目的更改
git merge upstream/main

# 推送到你的fork
git push origin main
```

### 3. 创建新的特性分支
```bash
# 创建并切换到新分支（根据你要做的功能命名）
git checkout -b feature/你的功能名称

# 例如：
git checkout -b feature/improve-ui
git checkout -b feature/add-auth
git checkout -b fix/bug-login
```

### 4. 进行开发工作
```bash
# 编辑代码...
# 添加更改
git add .

# 提交更改
git commit -m "feat: 添加新功能的描述"

# 推送分支到你的fork
git push origin feature/你的功能名称
```

### 5. 创建Pull Request
1. 访问你的GitHub fork页面：https://github.com/xuwei-Search/fronted
2. 点击 "Compare & pull request" 按钮
3. 确保设置正确：
   - **base repository**: SolanaEarphone/frontend
   - **base**: main ← 你的分支名称
4. 填写PR标题和描述
5. 点击 "Create pull request"

### 6. PR标题和描述建议

#### 标题格式
```
类型: 简短描述

例如：
feat: 添加用户认证功能
fix: 修复登录页面响应式布局问题
docs: 更新README安装说明
style: 改进主页UI设计
```

#### 描述模板
```markdown
## 更改说明
简要描述这个PR做了什么

## 更改类型
- [ ] 新功能
- [ ] Bug修复
- [ ] 文档更新
- [ ] UI/样式改进
- [ ] 性能优化

## 测试
- [ ] 已在本地测试
- [ ] 所有现有测试通过
- [ ] 添加了新的测试用例

## 截图（如果有UI变化）
添加前后对比截图

## 相关Issue
如果修复了某个issue，写：Closes #issue号码
```

## 常用命令速查

### 查看状态
```bash
git status                  # 查看工作区状态
git branch -a              # 查看所有分支
git log --oneline --graph  # 查看提交历史
```

### 同步更新
```bash
git fetch upstream         # 获取原项目更新
git checkout main          # 切换到主分支
git merge upstream/main    # 合并更新
git push origin main       # 推送到fork
```

### 分支操作
```bash
git checkout -b 新分支名     # 创建并切换分支
git checkout 分支名         # 切换分支
git branch -d 分支名        # 删除分支
git push origin 分支名      # 推送分支
```

### 提交操作
```bash
git add .                  # 添加所有更改
git add 文件名              # 添加特定文件
git commit -m "提交信息"    # 提交更改
git push origin 分支名     # 推送到远程
```

## 解决冲突
如果PR出现冲突：
```bash
# 1. 获取最新更改
git fetch upstream

# 2. 切换到你的分支
git checkout feature/你的分支名

# 3. 变基到最新主分支
git rebase upstream/main

# 4. 解决冲突后
git add .
git rebase --continue

# 5. 强制推送（注意：只在你的分支上这样做）
git push --force-with-lease origin feature/你的分支名
```

## 提交信息规范
- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式化、UI样式
- `refactor:` 代码重构
- `test:` 添加测试
- `chore:` 构建过程或辅助工具的变动

## 注意事项
1. ⚠️ 永远不要直接在main分支上开发
2. ✅ 每个功能/修复都要创建新分支
3. ✅ 定期同步upstream的更改
4. ✅ 保持提交信息清晰有意义
5. ✅ PR描述要详细说明做了什么
6. ✅ 及时响应代码审查反馈

## 当前可执行的操作
基于你的当前状态，你可以：

1. **创建新功能分支**：
```bash
cd /home/nanchang/SolanaEarphone
git checkout main
git checkout -b feature/你的功能名称
```

2. **进行开发并提交**：
```bash
# 进行代码更改...
git add .
git commit -m "feat: 描述你的更改"
```

3. **推送到你的fork**：
```bash
git push origin feature/你的功能名称
```

4. **在GitHub上创建PR**：
访问 https://github.com/xuwei-Search/fronted 创建Pull Request

这样你的更改就会通过PR的方式提交给原项目维护者审查和合并！
