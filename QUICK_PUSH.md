# 🚀 一键推送命令（复制粘贴即可）

## 方法一：在你的电脑终端执行（最简单）

打开你的终端（Terminal / PowerShell），复制粘贴以下命令：

```bash
cd /path/to/your/octopus-broker
git push -u origin main
```

**提示输入时：**
- Username: `zyagent147`
- Password: **粘贴你的 Token**（不是密码）

---

## 方法二：如果没有 Token，先生成

1. 访问：https://github.com/settings/tokens/new
2. 填写：
   - Note: `octopus-broker-push`
   - Expiration: `90 days`
   - 勾选：✅ `repo`
3. 点击 `Generate token`
4. **立即复制** Token

---

## 方法三：使用 SSH（推荐长期使用）

如果你想避免每次输入 Token，配置 SSH：

```bash
# 1. 生成 SSH 密钥
ssh-keygen -t ed25519 -C "your_email@example.com"

# 2. 查看公钥
cat ~/.ssh/id_ed25519.pub

# 3. 添加到 GitHub
# 访问 https://github.com/settings/keys
# 点击 "New SSH key"，粘贴公钥

# 4. 修改仓库地址为 SSH
git remote set-url origin git@github.com:zyagent147/octopus-broker.git

# 5. 推送（无需密码）
git push -u origin main
```

---

## ✅ 推送成功后

访问你的仓库：https://github.com/zyagent147/octopus-broker

确认代码已上传，然后进行微信云托管部署！

---

## 🔧 当前配置状态

✅ **远程仓库已配置**
```
origin  https://github.com/zyagent147/octopus-broker.git
```

✅ **代码已提交**
- 分支: `main`
- 最新提交: `docs: 添加 GitHub 推送快速指南和脚本`

✅ **准备推送**
- 只需执行：`git push -u origin main`

---

## 📞 需要帮助？

如果推送失败，告诉我具体的错误信息，我会帮你解决！
