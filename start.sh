#!/bin/bash

# Solana Earphone 项目快速启动脚本 (使用 Conda)
# 使用方法: chmod +x start.sh && ./start.sh

set -e

echo "🚀 Solana Earphone 项目启动脚本 (Conda版本)"
echo "============================================"

# 检查依赖
echo "📋 检查系统依赖..."

if ! command -v node &> /dev/null; then
    echo "❌ 错误: Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

if ! command -v conda &> /dev/null; then
    echo "❌ 错误: Conda 未安装，请先安装 Anaconda 或 Miniconda"
    exit 1
fi

echo "✅ 系统依赖检查通过"

# 启动后端
echo ""
echo "🔧 启动后端服务..."
cd backend

# 检查conda环境
echo "📦 检查 Conda 环境..."
if ! conda env list | grep -q "solana-earphone-backend"; then
    echo "📦 创建 Conda 环境..."
    conda env create -f environment.yml
else
    echo "✅ Conda 环境已存在"
fi

# 激活conda环境
echo "🔄 激活 Conda 环境..."
source $(conda info --base)/etc/profile.d/conda.sh
conda activate solana-earphone-backend

# 检查是否需要更新依赖
echo "📦 检查依赖..."
if [ ! -f ".dependencies_installed" ] || [ "environment.yml" -nt ".dependencies_installed" ]; then
    echo "📦 更新 Python 依赖..."
    conda env update -f environment.yml
    touch .dependencies_installed
fi

# 启动后端服务
echo "🌐 启动后端服务 (端口: 8001)..."
uvicorn main:app --reload --host 0.0.0.0 --port 8001 &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 检查后端是否启动成功
if ! curl -s http://localhost:8001/health > /dev/null; then
    echo "⚠️  后端可能未完全启动，请检查..."
fi

# 回到项目根目录
cd ..

# 启动前端
echo ""
echo "🎨 启动前端服务..."

# 安装前端依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

# 启动前端服务
echo "🌐 启动前端服务 (端口: 3000)..."
npm run dev &
FRONTEND_PID=$!

# 等待前端启动
sleep 5

echo ""
echo "🎉 项目启动完成！"
echo "=================================="
echo "📱 前端应用: http://localhost:3000"
echo "🔧 后端 API: http://localhost:8001"
echo "📚 API 文档: http://localhost:8001/docs"
echo ""
echo "当前环境信息:"
echo "  Python 环境: solana-earphone-backend (Conda)"
echo "  Python 版本: $(python --version 2>&1 | cut -d' ' -f2)"
echo ""
echo "测试账户:"
echo "  用户名: testuser"
echo "  密码: password123"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo ''; echo '🛑 正在停止服务...'; conda deactivate 2>/dev/null; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

# 保持脚本运行
wait
