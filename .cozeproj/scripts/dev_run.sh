#!/bin/bash
cd /workspace/projects

# 安装依赖
pnpm install

# 启动后端
pnpm --filter server dev &

# 启动前端
pnpm dev:web &

# 等待进程
wait
