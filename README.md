# 时政评论选题策划助手

一个轻量级前端实习项目 Demo，用 Vite + React + TypeScript 实现。

## 项目说明

本项目用于演示“编辑策划链 + 主流媒体政治热点选题辅助”流程：

打开网页进入策划页 → 完成账号定位与发布目标 → 设置选题策略与栏目方向 → 进入热点选题 → 从主流媒体来源尝试获取最新政治热点20条 → 按上升潜力和策划匹配度推荐3条选题 → 点击查看详情进入独立详情页 → 一键生成3个版本的小红书标题、正文和首页图。

项目严格保持轻量：

- 不使用数据库
- 不使用后端
- 不使用登录系统
- 不接入第三方 API
- 不引入复杂 UI 框架

## 功能

- 默认打开策划页，策划完成后再进入热点选题
- 热点选题阶段独立展示数据状态、抓取控制、推荐选题和热点池
- 前置“策划简报”：选择账号定位、目标读者、内容目标和表达边界
- 前置“选题策略”：选择栏目方向、内容角度、优先题材和风险敏感度
- 支持从官方新闻源尝试获取最新信息
- 支持保存最后一次抓取结果作为离线示例数据
- 推荐选题3条，按上升潜力分和策划匹配度综合排序
- 详情页展示策划匹配说明、承接建议和表达边界
- 近24小时政治热点20条列表
- 点击热点后进入独立详情页
- 本地模板根据策划简报生成3个版本的小红书标题和正文
- 三种文案风格：主流媒体风格、硬核知识风格、叙述讨论风格
- 基于 guizang-social-card-skill 的 3:4 小红书首页图规范，同步生成3张不同风格首页图
- 标签区分热度趋势和观众情绪

## 项目结构

```txt
src/
  main.tsx
  App.tsx
  index.css
  data/
    mockHotspots.ts
    lastFetchedHotspots.ts
  utils/
    scorer.ts
    generator.ts
    liveFetcher.ts
  types/
    workflow.ts
scripts/
  fetchLatestNews.mjs
```

## 实时信息获取

项目不使用数据库。实时信息获取分三种方式：

1. Cloudflare Pages 部署版：页面点击“获取最新信息”后，通过 `functions/news-proxy/[[path]].js` 访问限定的官方来源。
2. `npm run dev` 本地预览：Vite 通过 `/news-proxy/*` 转发官方页面，保持相同的前端调用方式。
3. 运行本地脚本：

```bash
npm run fetch:news
```

脚本会从官方来源抓取标题、链接、摘要等信息，清洗后写入：

```txt
src/data/lastFetchedHotspots.ts
```

页面加载顺序为：浏览器缓存的最后一次成功获取数据 → 打包内的 `lastFetchedHotspots.ts` 离线快照 → 原始 `mockHotspots.ts` 示例数据。

每次页面成功获取的数据都会写入当前浏览器缓存。生产构建还会注册 `public/sw.js`，缓存页面和静态资源。首次在线访问完成后，即使断网重新打开页面，也会继续使用浏览器内最后一次成功数据；首次使用时由打包内的离线快照兜底。

Cloudflare 构建部署命令：

```bash
npm run build -- --base /
npx wrangler pages deploy dist --project-name=redbook-policy-topic-assistant
```

## 评分规则

热度分：

```txt
hotScore = likes + comments * 3 + reposts * 5
```

上升潜力分：

```txt
potentialScore = likes * 0.2 + comments * 0.5 + reposts * 0.8
```

趋势加分：

- 快速上升：额外加 1000 分
- 上升：额外加 500 分

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开终端中显示的本地地址即可查看 Demo。
