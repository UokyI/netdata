---
name: release
description: >
  自动执行 NetData 项目的发布流程：
  1. 更新 CHANGELOG.md
  2. 升级版本号 (package.json)
  3. 提交并推送 Git Tag
  4. GitHub Actions 自动编译并发布 GitHub Release
applyTo: "**/*"
---

# NetData Release Skill

## 项目信息
- **仓库**: https://github.com/UokyI/netdata
- **主分支**: main
- **后端**: Go (main.go) — 编译后 ~6MB，零依赖
- **自动化**: GitHub Actions (`.github/workflows/release.yml`)
- **发布产物**: Windows / macOS / Linux 三平台二进制 + public/ 目录

---

## 发布流程（手动 + 自动）

### 步骤 1: 确保代码就绪
```bash
git checkout main
git pull origin main
git status   # 确保工作区干净
```

### 步骤 2: 更新 CHANGELOG.md

在 `# Changelog` 下方插入新版本条目：

```markdown
## [1.1.0] - 2026-06-15

### Added
- 新增 xxx 功能

### Fixed
- 修复移动端文件上传兼容性问题
```

版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

### 步骤 3: 升级版本号

```bash
# 编辑 package.json 中的 version 字段，例如 "1.0.0" → "1.1.0"
```

### 步骤 4: 提交并推送 Tag

```bash
git add CHANGELOG.md package.json
git commit -m "chore: release v1.1.0"
git tag -a "v1.1.0" -m "Release v1.1.0"
git push origin main
git push origin "v1.1.0"
```

### 步骤 5: GitHub Actions 自动构建

推送 tag 后，`.github/workflows/release.yml` 自动：

1. 检出代码
2. 编译 Windows / macOS (Intel + Apple Silicon) / Linux 四个平台
3. 将 `public/` + 二进制打包为 `.zip` / `.tar.gz`
4. 创建 GitHub Release 并上传所有资产
5. 源码压缩包由 GitHub 自动生成

**无需手动上传任何文件。**

### 产物清单

| 文件 | 平台 |
|------|------|
| `netdata-server-windows-amd64.zip` | Windows 64位 |
| `netdata-server-darwin-amd64.tar.gz` | macOS Intel |
| `netdata-server-darwin-arm64.tar.gz` | macOS Apple Silicon |
| `netdata-server-linux-amd64.tar.gz` | Linux 64位 |
| `Source code (zip)` | GitHub 自动生成 |
| `Source code (tar.gz)` | GitHub 自动生成 |

---

## 本地构建（可选）

```bash
# Windows 一键编译
scripts\build-go.bat

# macOS/Linux 一键编译
bash scripts/build-go.sh
```

---

## 回滚流程

```bash
# 删除远程 tag
git push --delete origin "v1.1.0"
# 删除本地 tag
git tag -d "v1.1.0"
# 回退提交
git reset --hard HEAD~1
git push --force origin main
# 在 GitHub Release 页面手动删除 Release
```

---

## 注意事项

- 版本标签必须以 `v` 开头（如 `v1.0.0`）
- CHANGELOG.md 使用 UTF-8 编码
- GitHub Actions 需要仓库 `Actions` 权限为 `Read and write`
- 发布前建议本地 `go build` 验证编译通过
