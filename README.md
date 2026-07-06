# Zotero LaTeX Fix

[English](#english) | [中文](#中文)

---

## 中文

### 简介

**Zotero LaTeX Fix** 是一个 Zotero 插件，用于修复笔记编辑器中 LaTeX 数学公式的渲染问题。

当从学术 PDF、网页或其他工具复制 LaTeX 公式时，公式通常使用 `\( \)`（行内）和 `\[ \]`（行间）作为分隔符。然而 Zotero 内置的 KaTeX 数学渲染器仅识别 `$ ... $` 和 `$$ ... $$` 分隔符，导致粘贴的公式显示为原始 LaTeX 源码，而非渲染后的数学公式。

本插件会在粘贴时自动转换分隔符样式，并将未渲染的 `$...$` 模式转换为 ProseMirror 数学节点，实现公式自动渲染。

### 功能特性

- **粘贴时自动转换** — 拦截粘贴事件，将 `\(...\)` 转换为 `$...$`，`\[...\]` 转换为 `$$...$$`，同时还原 `\{`、`\}` 为 `{`、`}`
- **自动渲染公式** — 通过 ProseMirror `appendTransaction` 插件，将文本中的 `$...$` 和 `$$...$$` 模式转换为 `math_inline` / `math_display` 节点
- **自动注入编辑器** — 猴子补丁 `Zotero.Notes.registerEditorInstance`，自动为每个笔记编辑器注入修复逻辑
- **幂等安装** — 通过标记位防止重复注入
- **中英文本地化** — 支持简体中文和英文界面

### 安装

1. 从 [Releases](../../releases) 页面下载最新版本的 `.xpi` 文件
2. 打开 Zotero，进入 `工具` → `附加组件`
3. 点击齿轮图标，选择 `Install Add-on From File...`
4. 选择下载的 `.xpi` 文件，按提示完成安装

### 使用方法

安装后插件自动生效，无需额外配置。在 Zotero 笔记中粘贴包含 `\( \)` 或 `\[ \]` 分隔符的 LaTeX 公式时，分隔符会自动转换为 `$` / `$$` 并渲染为数学公式。

### 配置选项

在 Zotero 首选项中可配置以下选项：

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `extensions.zotero.zoterolatexfix.enabled` | `true` | 启用/禁用插件 |
| `extensions.zotero.zoterolatexfix.debug` | `false` | 调试模式 |

### 从源码构建

**环境要求：** Node.js、npm

```bash
# 克隆仓库
git clone https://github.com/<your-username>/Zotero-Latex-Fix.git
cd Zotero-Latex-Fix

# 安装依赖
npm install

# 构建（生成 .xpi 文件到 build/ 目录）
npm run build

# 开发模式（热重载）
npm start

# 代码检查与格式化
npm run lint
```

### 技术架构

```
src/
├── index.ts              # 入口，初始化 Addon 单例
├── addon.ts              # Addon 类定义
├── hooks.ts              # 生命周期钩子（启动、关闭、窗口加载/卸载）
├── modules/
│   └── katex-fix.ts      # 核心逻辑：编辑器钩子、脚本注入、粘贴拦截、ProseMirror 插件
└── utils/
    └── ztoolkit.ts       # ZoteroToolkit 工厂
```

**工作流程：**

1. Zotero 通过 `bootstrap.js` 加载插件
2. `hooks.ts` 等待 Zotero 初始化完成后，创建 `KatexFix` 实例
3. `KatexFix` 钩住 `registerEditorInstance`，为每个编辑器注入修复脚本
4. 注入脚本在编辑器 iframe 中执行：
   - 注册 `paste` 事件监听器，转换剪贴板中的分隔符
   - 添加 ProseMirror 插件，在文档变更后扫描并渲染 `$...$` 模式

### 技术栈

- **运行时依赖：** [zotero-plugin-toolkit](https://github.com/windingwind/zotero-plugin-toolkit)
- **开发依赖：** [zotero-plugin-scaffold](https://github.com/northword/zotero-plugin-scaffold)、TypeScript、ESLint、Prettier
- **构建目标：** Firefox 115（Zotero 基于 Gecko/Firefox 115 ESR）

### 许可证

MIT License

---

## English

### Introduction

**Zotero LaTeX Fix** is a Zotero plugin that fixes LaTeX math formula rendering in Zotero's note editor.

When copying LaTeX formulas from academic PDFs, websites, or other tools, formulas typically use `\(\)` (inline) and `\[\]` (display) as delimiters. However, Zotero's built-in KaTeX math renderer only recognizes `$...$` and `$$...$$` delimiters, causing pasted formulas to appear as raw LaTeX source instead of rendered math.

This plugin automatically converts delimiters on paste and transforms unrecognized `$...$` patterns into ProseMirror math nodes for automatic rendering.

### Features

- **Paste-time conversion** — Intercepts paste events, converting `\(...\)` to `$...$` and `\[...\]` to `$$...$$`, while unescaping `\{`, `\}` back to `{`, `}`
- **Auto-rendering** — Uses a ProseMirror `appendTransaction` plugin to convert `$...$` and `$$...$$` patterns in text into `math_inline` / `math_display` nodes
- **Auto-injection** — Monkey-patches `Zotero.Notes.registerEditorInstance` to inject the fix into every note editor automatically
- **Idempotent** — Uses a flag to prevent duplicate injection
- **Localized** — Supports English and Simplified Chinese

### Installation

1. Download the latest `.xpi` file from the [Releases](../../releases) page
2. Open Zotero, go to `Tools` → `Add-ons`
3. Click the gear icon and select `Install Add-on From File...`
4. Select the downloaded `.xpi` file and follow the prompts

### Usage

The plugin works automatically after installation. When you paste text containing `\(\)` or `\[\]` delimited LaTeX into a Zotero note, the delimiters are silently converted to `$` / `$$` and the formulas render as math.

### Configuration

The following options are available in Zotero's preferences:

| Option | Default | Description |
|--------|---------|-------------|
| `extensions.zotero.zoterolatexfix.enabled` | `true` | Enable/disable the plugin |
| `extensions.zotero.zoterolatexfix.debug` | `false` | Debug mode |

### Building from Source

**Requirements:** Node.js, npm

```bash
# Clone the repository
git clone https://github.com/<your-username>/Zotero-Latex-Fix.git
cd Zotero-Latex-Fix

# Install dependencies
npm install

# Build (outputs .xpi to build/)
npm run build

# Development mode (hot-reload)
npm start

# Lint and format
npm run lint
```

### Architecture

```
src/
├── index.ts              # Entry point, initializes the Addon singleton
├── addon.ts              # Addon class definition
├── hooks.ts              # Lifecycle hooks (startup, shutdown, window load/unload)
├── modules/
│   └── katex-fix.ts      # Core logic: editor hooking, script injection, paste interception, ProseMirror plugin
└── utils/
    └── ztoolkit.ts       # ZoteroToolkit factory
```

**Workflow:**

1. Zotero loads the plugin via `bootstrap.js`
2. `hooks.ts` waits for Zotero initialization, then creates a `KatexFix` instance
3. `KatexFix` hooks `registerEditorInstance` to inject the fix script into each editor
4. The injected script runs inside the editor iframe:
   - Registers a `paste` event listener to convert clipboard delimiters
   - Adds a ProseMirror plugin that scans for and renders `$...$` patterns after document changes

### Tech Stack

- **Runtime:** [zotero-plugin-toolkit](https://github.com/windingwind/zotero-plugin-toolkit)
- **Dev tools:** [zotero-plugin-scaffold](https://github.com/northword/zotero-plugin-scaffold), TypeScript, ESLint, Prettier
- **Build target:** Firefox 115 (Zotero is based on Gecko/Firefox 115 ESR)

### License

MIT License
