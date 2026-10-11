#!/bin/bash
# FlyFF后端服务启动脚本
# 使用方法：chmod +x start.sh && ./start.sh

echo "========================================"
echo "  FlyFF 后端服务启动脚本"
echo "========================================"
echo ""

# 检查Go是否安装
if ! command -v go &> /dev/null; then
    echo "[错误] 未检测到Go语言环境，请先安装Go 1.21+"
    echo "下载地址: https://go.dev/dl/"
    exit 1
fi

echo "[1/3] 下载依赖..."
go mod tidy
if [ $? -ne 0 ]; then
    echo "[错误] 下载依赖失败"
    exit 1
fi

echo "[2/3] 编译项目..."
go build -o flyff-server .
if [ $? -ne 0 ]; then
    echo "[错误] 编译失败"
    exit 1
fi

echo "[3/3] 启动服务..."
echo ""
echo "服务将在 http://localhost:8080 启动"
echo "按 Ctrl+C 停止服务"
echo ""

./flyff-server
