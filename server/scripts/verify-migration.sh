#!/bin/bash

echo "🔍 验证数据库迁移结果..."
echo ""

SUPABASE_URL="https://br-right-kea-1c046413.supabase2.aidap-global.cn-beijing.volces.com"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjMzNTUxOTc1MTEsInJvbGUiOiJhbm9uIn0.fhHIWFyG7cuJJhcbgJrnqhBgcUmVup-THZe_HhihcO8"

echo "1️⃣ 检查 users 表结构（是否有 role 列）..."
curl -s "$SUPABASE_URL/rest/v1/users?limit=1&select=id,role" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" | jq '.' || echo "需要安装 jq"

echo ""
echo "2️⃣ 检查 providers 表是否存在..."
curl -s "$SUPABASE_URL/rest/v1/providers?limit=1" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" | jq '.' || echo "需要安装 jq"

echo ""
echo "✅ 如果上面的查询返回数据而不是错误，说明迁移成功！"
