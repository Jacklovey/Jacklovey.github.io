#!/bin/bash

# Conda 环境管理脚本
# 用于管理 Solana Earphone 后端的 Conda 环境

set -e

CONDA_ENV_NAME="solana-earphone-backend"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查conda是否已安装
check_conda() {
    if ! command -v conda &> /dev/null; then
        print_error "Conda 未安装，请先安装 Anaconda 或 Miniconda"
        exit 1
    fi
    print_success "Conda 已安装"
}

# 创建conda环境
create_env() {
    print_info "创建 Conda 环境: $CONDA_ENV_NAME"
    
    if conda env list | grep -q "$CONDA_ENV_NAME"; then
        print_warning "环境 '$CONDA_ENV_NAME' 已存在"
        read -p "是否要重新创建环境？(y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "删除现有环境..."
            conda env remove -n "$CONDA_ENV_NAME" -y
        else
            print_info "跳过环境创建"
            return 0
        fi
    fi
    
    print_info "从 environment.yml 创建环境..."
    conda env create -f environment.yml
    print_success "环境创建完成"
}

# 更新conda环境
update_env() {
    print_info "更新 Conda 环境: $CONDA_ENV_NAME"
    
    if ! conda env list | grep -q "$CONDA_ENV_NAME"; then
        print_error "环境 '$CONDA_ENV_NAME' 不存在，请先创建环境"
        exit 1
    fi
    
    conda env update -f environment.yml
    print_success "环境更新完成"
}

# 删除conda环境
remove_env() {
    print_info "删除 Conda 环境: $CONDA_ENV_NAME"
    
    if ! conda env list | grep -q "$CONDA_ENV_NAME"; then
        print_warning "环境 '$CONDA_ENV_NAME' 不存在"
        return 0
    fi
    
    read -p "确定要删除环境 '$CONDA_ENV_NAME'？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        conda env remove -n "$CONDA_ENV_NAME" -y
        print_success "环境删除完成"
    else
        print_info "取消删除操作"
    fi
}

# 激活conda环境
activate_env() {
    print_info "激活 Conda 环境: $CONDA_ENV_NAME"
    
    if ! conda env list | grep -q "$CONDA_ENV_NAME"; then
        print_error "环境 '$CONDA_ENV_NAME' 不存在，请先创建环境"
        exit 1
    fi
    
    # 初始化conda for bash
    eval "$(conda shell.bash hook)"
    conda activate "$CONDA_ENV_NAME"
    print_success "环境已激活"
    
    # 启动子shell以保持环境激活状态
    print_info "启动激活环境的子shell，输入 'exit' 退出"
    bash
}

# 显示环境信息
show_info() {
    print_info "环境信息:"
    echo "----------------------------------------"
    echo "环境名称: $CONDA_ENV_NAME"
    echo "配置文件: environment.yml"
    echo "当前目录: $SCRIPT_DIR"
    echo
    
    if conda env list | grep -q "$CONDA_ENV_NAME"; then
        print_success "环境状态: 已创建"
        echo
        print_info "环境包列表:"
        conda list -n "$CONDA_ENV_NAME" | head -20
        echo "... (使用 'conda list -n $CONDA_ENV_NAME' 查看完整列表)"
    else
        print_warning "环境状态: 未创建"
    fi
}

# 显示帮助信息
show_help() {
    echo "Conda 环境管理脚本"
    echo "用法: $0 [选项]"
    echo
    echo "选项:"
    echo "  create     创建conda环境"
    echo "  update     更新conda环境"
    echo "  remove     删除conda环境"
    echo "  activate   激活conda环境"
    echo "  info       显示环境信息"
    echo "  help       显示此帮助信息"
    echo
    echo "示例:"
    echo "  $0 create    # 创建环境"
    echo "  $0 activate  # 激活环境"
    echo "  $0 update    # 更新环境"
}

# 主函数
main() {
    check_conda
    
    case "${1:-help}" in
        create)
            create_env
            ;;
        update)
            update_env
            ;;
        remove)
            remove_env
            ;;
        activate)
            activate_env
            ;;
        info)
            show_info
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 如果脚本被直接执行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi