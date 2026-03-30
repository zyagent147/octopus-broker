#!/bin/bash

# ===========================================
# 微信云托管部署检查脚本
# ===========================================

echo "🔍 正在检查部署配置..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Docker
echo "📦 检查 Docker..."
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker 已安装${NC}"
else
    echo -e "${RED}✗ Docker 未安装，请先安装 Docker${NC}"
fi

# 检查必需文件
echo ""
echo "📁 检查必需文件..."
files=("server/Dockerfile" "server/container.json" "server/.env.production.example")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}✗ $file 缺失${NC}"
    fi
done

# 检查环境变量配置
echo ""
echo "🔐 检查环境变量..."
if [ -f "server/.env" ]; then
    echo -e "${GREEN}✓ server/.env 存在${NC}"
    
    # 检查必需的环境变量
    env_vars=("WX_APP_ID" "WX_APP_SECRET" "JWT_SECRET" "COS_SECRET_ID" "COS_SECRET_KEY")
    for var in "${env_vars[@]}"; do
        if grep -q "^${var}=" server/.env; then
            echo -e "${GREEN}  ✓ ${var} 已配置${NC}"
        else
            echo -e "${YELLOW}  ⚠ ${var} 未配置${NC}"
        fi
    done
else
    echo -e "${YELLOW}⚠ server/.env 不存在${NC}"
fi

# 检查代码构建
echo ""
echo "🔨 检查构建..."
if [ -d "server/dist" ]; then
    echo -e "${GREEN}✓ 后端已构建 (server/dist)${NC}"
else
    echo -e "${YELLOW}⚠ 后端未构建，运行: cd server && pnpm build${NC}"
fi

if [ -d "dist-weapp" ]; then
    echo -e "${GREEN}✓ 小程序已构建 (dist-weapp)${NC}"
else
    echo -e "${YELLOW}⚠ 小程序未构建，运行: pnpm build:weapp${NC}"
fi

# 输出部署清单
echo ""
echo "📋 部署清单"
echo "=========================================="
echo ""
echo "1️⃣  获取 Supabase 配置"
echo "   - 登录 Coze 平台 或 Supabase 控制台"
echo "   - 获取 COZE_SUPABASE_URL"
echo "   - 获取 COZE_SUPABASE_ANON_KEY"
echo ""
echo "2️⃣  创建微信云托管服务"
echo "   - 登录微信公众平台 → 云托管"
echo "   - 创建新服务"
echo "   - 配置环境变量（见上方）"
echo ""
echo "3️⃣  部署后端服务"
echo "   - cd server && docker build -t octopus-broker ."
echo "   - 推送到容器镜像仓库"
echo "   - 在云托管控制台选择镜像部署"
echo ""
echo "4️⃣  更新小程序配置"
echo "   - 修改 src/config/cloud.ts 中的环境ID"
echo "   - pnpm build:weapp"
echo "   - 上传小程序审核"
echo ""
echo "=========================================="
echo ""
echo "📖 详细文档: docs/wechat-cloud-deploy-guide.md"
