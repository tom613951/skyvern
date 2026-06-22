<h1 align="center">
 <a href="https://www.skyvern.com">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="fern/images/skyvern_logo.png"/>
    <img height="120" src="fern/images/skyvern_logo_blackbg.png"/>
  </picture>
 </a>
 <br />
</h1>
<p align="center">
🐉 使用大语言模型（LLM）和计算机视觉（CV）实现浏览器自动化工作流 🐉
</p>
<p align="center">
  <a href="https://www.skyvern.com/"><img src="https://img.shields.io/badge/Website-blue?logo=googlechrome&logoColor=black"/></a>
  <a href="https://www.skyvern.com/docs/"><img src="https://img.shields.io/badge/Docs-yellow?logo=gitbook&logoColor=black"/></a>
  <a href="https://discord.gg/fG2XXEuQX3"><img src="https://img.shields.io/discord/1212486326352617534?logo=discord&label=discord"/></a>
  <a href="https://github.com/skyvern-ai/skyvern"><img src="https://img.shields.io/github/stars/skyvern-ai/skyvern" /></a>
  <a href="https://github.com/Skyvern-AI/skyvern/blob/main/LICENSE"><img src="https://img.shields.io/github/license/skyvern-ai/skyvern"/></a>
</p>

[Skyvern](https://www.skyvern.com) 使用 LLM 和计算机视觉技术，实现网页浏览器的自动化操作。它提供了一个与 Playwright 兼容的 SDK（可在 Playwright 之上增加 AI 功能），以及一个无代码工作流编辑器（Workflow Builder），帮助技术人员和非技术人员快速在任何网站上实现自动化，用智能方案替代脆弱且易断的传统爬虫/自动化程序。

<p align="center">
  <img src="fern/images/geico_shu_recording_cropped.gif"/>
</p>

传统的浏览器自动化（RPA）通常需要为不同网站编写大量定制脚本，依赖脆弱的 DOM 结构解析和 XPath 定位，只要网站布局稍有变化，自动化程序就会报错中断。

而 Skyvern 不再依赖写死的 XPath 元素交互，而是**完全依靠多模态视觉大模型（Vision LLM）**来理解网页并进行智能交互。

---

# 工作原理

Skyvern 的设计灵感来源于 [BabyAGI](https://github.com/yoheinakajima/babyagi) 和 [AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) 等任务驱动型自主智能体（Task-Driven Agents）—— 并且做出了一个重大升级：我们让 Skyvern 拥有了通过 [Playwright](https://playwright.dev/) 与真实网页交互的能力。

Skyvern 依靠多智能体集群（Swarm of Agents）来阅读、规划并执行网页动作：

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="fern/images/skyvern_2_0_system_diagram.png" />
  <img src="fern/images/skyvern_2_0_system_diagram.png" />
</picture>

这种方法具有以下核心优势：
1. **零代码适应未知网站**：Skyvern 能够直接将屏幕上的视觉元素映射为完成任务所需的交互操作，无需为你没见过的网站写任何定制代码。
2. **免受网站改版影响**：由于系统不使用硬编码的 XPath 或 CSS 选择器，因此即使网页布局或样式发生改变，自动化流程依然能够稳定运行。
3. **单一工作流多网站复用**：AI 能够推理并理解流程的业务逻辑，只需配置一次，即可在逻辑相似但界面不同的数十个网站上通用。

更详细的技术报告请参阅[此处](https://www.skyvern.com/blog/skyvern-2-0-state-of-the-art-web-navigation-with-85-8-on-webvoyager-eval/)。

---

# 本地快速启动 (UI + Server)

根据你的需求，选择以下两种安装方式之一：

> **💡 数据库说明**：通过 `skyvern quickstart` 启动时，默认会在本地 `~/.skyvern/data.db` 路径下创建一个 SQLite 数据库，以便你无需配置 Postgres 或 Docker 即可运行。如需使用 Postgres，可附加 `--postgres` 参数。如果使用 **Docker Compose**，则会自动启动并配置配套的 Postgres 服务。

### 方式 A：Docker Compose 部署（最简便，推荐 ⭐️）
如果你希望一键运行完整环境（包含 Postgres 数据库、API 接口及可视化 UI），并且不想在本地电脑配置 Python 和 Node.js 环境，推荐使用此方法。

1. 安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/)。
2. 克隆仓库并进入文件夹：
   ```bash
   git clone https://github.com/skyvern-ai/skyvern.git && cd skyvern
   ```
3. 配置环境变量：将 `.env.example` 复制并重命名为 `.env`，并在其中填入你的大模型 API 密钥（如 OpenAI Key 或 Gemini Key）：
   ```bash
   cp .env.example .env
   ```
4. 启动所有服务：
   ```bash
   docker compose up -d
   ```
5. 打开浏览器访问：[http://localhost:8080](http://localhost:8080)

---

### 方式 B：Pip 安装（适合 Python 开发环境）
**系统依赖：**
- 需安装 [Python 3.11, 3.12, 或 3.13](https://www.python.org/downloads/)。

对于 **Windows 平台**，另外需要：
- 安装 [Rust 编译链](https://rustup.rs/)。
- 安装 VS Code 并勾选“使用 C++ 的桌面开发”以及 Windows SDK。

1. **安装 Skyvern 包**：
   ```bash
   pip install "skyvern[all]"
   ```
2. **启动服务**：
   ```bash
   skyvern quickstart
   ```

---

# 开发者 SDK (AI-Powered Playwright)

Skyvern 也是一个 **Playwright 的 AI 增强扩展**。它为你提供了完整的 Playwright 原生操作能力，并在此基础上提供了多模态 AI 交互函数：支持使用自然语言提示词来点击元素、提取结构化数据以及完成多步复杂流程。

**SDK 安装：**
* 仅安装客户端/云端 API 调用：`pip install skyvern`
* 本地运行完整服务（含本地 UI）：`pip install "skyvern[all]"`

### 1. AI 网页操作指令 (Page Commands)

Skyvern 在原生的 `page` 对象上增加了 4 个核心的 AI 方法：

| 动作 (Method) | 描述 | 示例 |
| :--- | :--- | :--- |
| `page.act(prompt)` | 使用自然语言指令来操作网页 | `await page.act("点击登录按钮")` |
| `page.extract(prompt, schema)` | 配合 JSON Schema 从网页中提取结构化数据 | `await page.extract("提取表格里的商品名和价格", schema)` |
| `page.validate(prompt)` | 验证当前的网页状态是否符合预期，返回布尔值 | `await page.validate("检查用户是否已经成功登录")` |
| `page.prompt(prompt, schema)` | 给 LLM 发送任意提示词和页面截图，获取结构化回复 | `await page.prompt("分析此页面是否包含报错信息")` |

此外，可以通过 `page.agent` 执行更高级 of 业务流指令：
* `await page.agent.run_task("帮我下载最新的发票PDF文件")`：执行复杂的多步任务。
* `await page.agent.run_workflow(workflow_id)`：调用云端或本地预配置的工作流。

---

### 2. 混合式 Playwright 原生函数

你依然可以使用 Playwright 的常规定位函数，也可以为其传入额外的 `prompt` 参数来启用 AI 兜底：

```python
# 1. 传统 Playwright 定位（速度快，但遇到改版容易失效）
await page.click("#submit-button")

# 2. 纯 AI 定位（无需定位符，抗改版能力强）
await page.click(prompt="点击页面右下角的绿色提交按钮")

# 3. 混合模式（优先尝试选择器，如果页面改版失效，自动启用 AI 寻找并执行点击）
await page.click("#submit-btn", prompt="点击提交按钮")
```

---

# 常见问题排查 (Troubleshooting)

**1. 提示 `(sqlite3.OperationalError) table organizations already exists`**
这是 `skyvern==1.0.31` 版本已知的数据库迁移 Bug。请运行以下命令清理缓存并升级版本：
```bash
rm ~/.skyvern/data.db
pip install --upgrade skyvern
skyvern quickstart
```
如果你只能使用 1.0.31 版本，请尝试使用 `uv` 来重新进行安装依赖：
```bash
uv pip install skyvern
```
