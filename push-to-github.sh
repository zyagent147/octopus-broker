#!/bin/bash
# GitHub 推送脚本
# 使用方法：bash push-to-github.sh

set -e

echo "========================================="
echo "🚀 开始推送代码到 GitHub"
echo "========================================="
echo ""

# 进入项目目录
cd "$(dirname "$0")"

# 检查远程仓库
echo "📡 检查远程仓库..."
if git remote | grep -q "origin"; then
    echo "✅ 远程仓库已配置"
    git remote -v
else
    echo "❌ 远程仓库未配置"
    echo "正在添加远程仓库..."
    git remote add origin https://github.com/zyagent147/octopus-broker.git
    echo "✅ 远程仓库已添加"
fi

echo ""
echo "📊 当前状态："
echo "分支: $(git branch --show-current)"
echo "最新提交: $(git log --oneline -1)"
echo ""

# 推送代码
echo "🚀 推送代码到 GitHub..."
echo "⚠️  如果提示输入密码，请使用 Personal Access Token"
echo ""

git push -u origin main

echo ""
echo "========================================="
echo "✅ 推送完成！"
echo "========================================="
echo ""
echo "📎 仓库地址：https://github.com/zyagent147/octopus-broker"
echo ""
echo "📖 下一步："
echo "1. 访问微信云托管控制台：https://cloud.weixin.qq.com/"
echo "2. 新建服务 → 代码库 → 授权 GitHub"
echo "3. 选择 octopus-broker 仓库"
echo "4. 配置环境变量和构建设置"
echo "5. 开始构建部署"
