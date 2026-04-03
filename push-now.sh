#!/bin/bash
# ========================================
# 🚀 GitHub 推送完整命令
# ========================================
# 
# 仓库地址: https://github.com/zyagent147/octopus-broker.git
# 
# 执行步骤：
# 1. 复制下面的所有命令
# 2. 粘贴到你的终端（Terminal / PowerShell / CMD）
# 3. 提示输入密码时，粘贴你的 GitHub Personal Access Token
#
# ========================================

cd /workspace/projects

echo "📊 当前状态："
echo "分支: $(git branch --show-current)"
echo "最新提交: $(git log --oneline -1)"
echo ""
echo "远程仓库："
git remote -v
echo ""
echo "🚀 开始推送..."
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 推送成功！"
    echo "📎 仓库地址: https://github.com/zyagent147/octopus-broker"
    echo ""
    echo "📖 下一步："
    echo "1. 访问微信云托管: https://cloud.weixin.qq.com/"
    echo "2. 新建服务 → 代码库 → 授权 GitHub"
    echo "3. 选择 octopus-broker 仓库并部署"
else
    echo ""
    echo "❌ 推送失败"
    echo "请确保你使用了 Personal Access Token 而不是密码"
    echo "生成 Token: https://github.com/settings/tokens/new"
fi
