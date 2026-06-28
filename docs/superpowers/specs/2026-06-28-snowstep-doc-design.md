# SnowStep Doc — 个人学习知识库 · 设计文档

- 日期：2026-06-28
- 作者：Codex（brainstorming 协作）
- 状态：草案 v1，待用户审阅
- 工作目录：`F:\MyProjectOnline\snowstep_doc`

---

## 1. 背景与目标

搭建一个**半公开**的个人学习知识库网站。内容以两类为主：

1. **自己写的笔记**（note）
2. **从工具官网剪藏的 doc**（clipped）

核心诉求：

- 一个搜索框找全（标题 + 正文 + 标签 + 分类路径）
- 分类层次分明（无限层级树）
- 视觉风格：**杂志感**（冷色主调 + 单一亮色强调、衬线大字、微妙动效）
- 轻量级、纯静态、可 git 版本管理

---

## 2. 范围

### In Scope

- 笔记与剪藏两类内容
- 无限层级分类树 + 平级 tag
- 全文搜索（⌘K 命令面板 + 搜索页）
- 双向链接 `[[wiki link]]` 与反向引用面板
- Chrome / Edge MV3 扩展一键剪藏 + 站内手动粘贴
- Vercel 静态部署（可替换为 Cloudflare Pages / GitHub Pages）
- 亮 / 暗主题

### Out of Scope（非目标）

- 多用户、权限、协作光标
- 评论 / 点赞 / 订阅
- 自动抓取 / 爬虫
- AI 问答、AI 自动续写
- PDF 抓取、整站镜像
- 图谱可视化（先文字反向链接列表）
- 富文本块编辑器（坚持 Markdown）

---

## 3. 信息架构

### 3.1 内容类型

| 类型 | 标识 | frontmatter 必填 | frontmatter 选填 |
| --- | --- | --- | --- |
| 笔记 | `type: note` | `title` / `category` / `tags` / `created` / `updated` | `private` |
| 剪藏 | `type: clipped` | `title` / `category` / `tags` / `created` / `updated` / `sourceUrl` / `siteName` | `private` |

### 3.2 分类树（无限层级）

```
前端
├─ React
│  ├─ Hooks
│  │  ├─ useState 详解          (note)
│  │  └─ React 官方 - Hooks     (clipped)
│  └─ React 思维模型            (note)
└─ Vue
后端
├─ Node
工具
├─ Git
└─ Docker
杂学
└─ 一些想法                     (note)
```

### 3.3 页面

| 路径 | 名称 | 说明 |
| --- | --- | --- |
| `/` | 首页 | Hero + 最近更新 6 卡片 + 全部分类入口 |
| `/tree` | 分类浏览 | 完整树视图 |
| `/tags` | 标签索引 | 所有 tag 列表 |
| `/tags/<name>` | 标签聚合 | 包含该 tag 的全部条目 |
| `/search?q=...` | 搜索结果 | 全文搜索结果页 |
| `/<category-path>/<slug>` | 条目详情 | 笔记 / 剪藏正文页 |
| `/about` | 关于 | 自我介绍、联系方式 |

### 3.4 单页组件

- 顶部导航：分类下拉 + ⌘K 搜索 + 主题切换
- 全局命令面板（⌘K / Ctrl+K）
- 单页布局：单列正文（max-width 720px） + 右侧浮动 ToC + 反向链接面板
- 上一篇 / 下一篇

---

## 4. 功能模块

### M1. 笔记 Note

- **做**：写 Markdown、左右实时预览、代码高亮、表格、LaTeX、mermaid、`[[wiki link]]`
- **不做**：富文本块编辑、协作者光标、AI 续写
- **验收**：写一篇 1000 字笔记，含 3 代码块 + 2 `[[wiki link]]`，保存后刷新可见

### M2. 剪藏 Clipped Doc

- **做**：保存网页正文 + 元信息（标题、原 URL、剪藏时间、来源站名）
- **入口 1**：Chrome MV3 扩展一键剪藏（带可编辑正文/选区）
- **入口 2**：站内粘贴 URL / Markdown 手动保存
- **不做**：自动抓取、PDF 抓取、整站镜像
- **验收**：在 React 官方 docs 上点扩展 → 选分类 → 保存后仓库多一篇 clipped，网站可访问

### M3. 分类层次

- **做**：无限层级树，节点可为「目录」或「条目」；支持拖拽重排、合并、重命名
- **不做**：跨树移动、批量导入分类
- **验收**：拖一个目录到另一个目录下，结构更新，所有链接不失效

### M4. 标签 Tag

- **做**：每篇可挂多个 tag；`/tags/<name>` 聚合
- **不做**：嵌套 tag
- **验收**：3 篇文章同 tag，`/tags/<name>` 聚合页可见

### M5. 全文搜索

- **做**：⌘K 全局命令面板 + `/search` 页面；搜标题/正文/标签/分类；中文分词；命中高亮
- **不做**：拼写纠错、自然语言问答
- **验收**：搜「useState」< 100ms 找到 3+ 篇，命中关键词高亮

### M6. 双向链接 / 反向引用

- **做**：`[[条目名]]` 解析为站内链接；每页底部「被 N 处引用」列表
- **不做**：图谱可视化
- **验收**：A 笔记含 `[[B]]`，B 底部出现 A；点 A 链接跳 B

### M7. 视觉与体验

- **做**：杂志感首页、冷色主调 + 单一亮色、衬线大字、微妙 hover/transition、亮/暗主题、响应式三档
- **不做**：3D 效果、视频背景、自定义 CSS 注入
- **验收**：Lighthouse 性能 ≥ 95，桌面/平板/手机三档不破版

---

## 5. 技术选型

| 维度 | 选择 | 理由 |
| --- | --- | --- |
| 站点框架 | **Astro 3.x** | 默认静态输出，岛屿架构只在需要处挂 React；Markdown 一等公民 |
| Markdown | Astro Content Collections + frontmatter | 强类型；git diff 友好 |
| 编辑器 | **CodeMirror 6**（嵌在 React 岛屿） | 比 Monaco 轻，移动端可用 |
| 预览 | `markdown-it` + `shiki`（构建时） | 代码高亮构建期完成，运行时零成本 |
| 搜索 | **Pagefind** | 静态站点最佳搭档，浏览器端纯静态查询 |
| 样式 | **Tailwind CSS** + 少量自定义 | 主色 `#0B1220`，强调 `#FF6A3D`，衬线 Fraunces，正文 Inter |
| 扩展 | **Plasmo** + Chrome MV3 | 模板化 MV3；可移植 Edge |
| 部署 | **Vercel**（默认） | 配置文件可一键换 Cloudflare Pages / GitHub Pages |

### 显式不引入

数据库 / 后端 / CMS / UI 组件库 / 分析埋点

---

## 6. 仓库结构

```
snowstep_doc/
├── apps/
│   ├── web/                  # Astro 站点
│   │   ├── src/
│   │   │   ├── content/      # 全部 Markdown（git 仓库内容）
│   │   │   │   ├── config.ts
│   │   │   │   ├── notes/
│   │   │   │   └── clipped/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── islands/      # React 岛屿：搜索面板、编辑器
│   │   ├── astro.config.mjs
│   │   ├── tailwind.config.cjs
│   │   └── package.json
│   └── extension/            # Plasmo Chrome 扩展
│       ├── popup.tsx
│       ├── contents/
│       └── package.json
├── packages/
│   └── shared/               # 共享类型 / frontmatter schema
├── docs/superpowers/specs/   # 设计文档
├── README.md
├── pnpm-workspace.yaml
└── vercel.json
```

### 6.1 数据模型（frontmatter schema）

```ts
// packages/shared/schema.ts
import { z } from 'zod'

export const Article = z.object({
  title: z.string(),
  type: z.enum(['note', 'clipped']),
  category: z.array(z.string()).min(1),  // 分类路径
  tags: z.array(z.string()).default([]),
  created: z.string(),                    // ISO 日期
  updated: z.string(),
  sourceUrl: z.string().url().optional(),
  siteName: z.string().optional(),
  private: z.boolean().default(false),
})
```

### 6.2 路由生成

- 分类路径直接生成 URL：`['前端','React','Hooks']` → `/前端/React/Hooks/<slug>`
- slug 来源：文件名 `useState-详解.md` → `useState-详解`

---

## 7. 视觉规范

| 角色 | 值 |
| --- | --- |
| 主色 | `#0B1220`（近黑冷蓝） |
| 强调色 | `#FF6A3D`（橙红） |
| 标题字体 | Fraunces（衬线） |
| 正文字体 | Inter |
| 等宽字体 | JetBrains Mono |
| 暗色主色 | `#F5F2EC`（米白） |
| 暗色背景 | `#0B0F1A` |
| 间距 | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 72 |
| 圆角 | 4 / 8 / 12 |
| 阴影 | 极轻：`0 1px 2px rgba(0,0,0,.04)` |
| 动效 | hover 200ms ease-out；页面切换 150ms fade |

### 7.1 断点

- 手机：< 640px
- 平板：640–1024px
- 桌面：> 1024px

---

## 8. 验收标准

| 类别 | 指标 |
| --- | --- |
| 性能 | Lighthouse Performance ≥ 95（桌面/移动） |
| 性能 | 首屏 LCP < 1.2s |
| 性能 | 全文搜索响应 < 100ms |
| 功能 | M1–M7 全部验收用例通过 |
| 兼容 | Chrome / Edge 最新版；iOS Safari 16+；Android Chrome |
| 内容 | 剪藏 < 30s/条；写笔记 < 5s/篇（编辑器加载） |

---

## 9. 风险与缓解

| 风险 | 缓解 |
| --- | --- |
| 工具官网有反爬 / 复杂 DOM | Readability 提取 + 手动微调；不抓取敏感站 |
| 无限层级分类导致维护困难 | UI 上默认折叠深层节点；提供「最近访问」快速入口 |
| 剪藏大量内容导致仓库膨胀 | 资源（图片）放对象存储，仓库只存 URL；定期归档已读 |
| 静态搜索索引过大 | Pagefind 分片懒加载；单页索引 < 200KB |
| 扩展审核被拒 | MV3 合规；不滥用权限；提供「无扩展使用」方案 |

---

## 10. 里程碑

1. **M0** 仓库初始化、Astro 骨架、首页 Hero、空内容集合（1 周）
2. **M1** 笔记模块（编辑器 + 实时预览 + wiki link）（1 周）
3. **M2** 分类树 + 标签 + 条目详情页（1 周）
4. **M3** 全文搜索（Pagefind + ⌘K 面板）（0.5 周）
5. **M4** 剪藏扩展（Plasmo + Readability）（1 周）
6. **M5** 视觉打磨（杂志感首页 / 主题 / 动效）（1 周）
7. **M6** 部署 + 验收 + 上线（0.5 周）

---

## 11. 开放问题

1. 域名准备用哪个？建议 `snowstep.cn` 或 `snowstep-doc.vercel.app` 起步。
2. 是否需要 RSS 订阅？（不在范围内，可作为 v1.1 备选）
3. 未来是否要加 AI 问答？（v2.0 备选，需要向量索引）
