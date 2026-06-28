# SnowStep Doc

个人学习知识库网站：自己写的笔记 + 从工具官网剪藏的文档，全部以 Markdown 存放在 Git 仓库里，由 Astro 静态构建，部署到 Vercel。

## 特性

- 一个搜索框找全（标题 + 正文 + 标签 + 分类路径）
- 无限层级分类树 + 平级 tag
- `[[wiki link]]` 双向链接 + 反向引用面板
- 全局 ⌘K 命令面板
- 杂志感视觉，亮 / 暗主题
- 全静态，纯 Markdown，git 友好

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 下载自托管 web 字体（可选，首次需要联网）
#    见 apps/web/public/fonts/README.md 的 curl 命令
cd apps/web/public/fonts
# ... 跑 3 条 curl ...
cd ../../../..

# 3. 启动开发服务器
pnpm dev
# 打开 http://localhost:4321

# 4. 构建生产版本
pnpm build
# 输出在 apps/web/dist
# Pagefind 索引自动生成在 apps/web/dist/pagefind/
```

## 写笔记

把任意 `.md` 文件放到 `apps/web/src/content/notes/`，文件 frontmatter 形如：

```markdown
---
title: 我的第一篇笔记
type: note              # note 或 clipped
category: ["前端", "React", "Hooks"]   # 分类路径（无限层级）
tags: ["meta", "demo"]
created: 2026-06-28
updated: 2026-06-28
---

正文使用 Markdown。可以用 `[[welcome]]` 引用其它条目。
```

剪藏的文档（`type: clipped`）额外需要 `sourceUrl` 和 `siteName` 字段。

## 项目结构

```
apps/
  web/         Astro 站点（全部用户可见产物）
  extension/   Chrome / Edge MV3 剪藏扩展（v0.5 计划）
packages/
  shared/      共享 frontmatter schema (zod)
docs/
  superpowers/
    specs/     设计文档
    plans/     实现计划
vercel.json    Vercel 部署配置
```

## 设计文档与实现计划

- [设计 spec](docs/superpowers/specs/2026-06-28-snowstep-doc-design.md)
- [实现 plan](docs/superpowers/plans/2026-06-28-snowstep-doc.md)
- [实施报告](docs/superpowers/plans/2026-06-28-IMPLEMENTATION-REPORT.md)

## Roadmap

- v1 (已实现 M0-M3, M5-M7) — 笔记 + 分类 + 标签 + 搜索 + 杂志感首页
- v0.5 — Chrome / Edge MV3 一键剪藏扩展（plan 占位）
- v2 — AI 问答（需要向量索引，未计划）
