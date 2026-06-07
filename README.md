# 实政评论类小红书选题助手

一个轻量级前端实习项目 Demo，用 Vite + React + TypeScript 实现。

## 项目说明

本项目用于演示“主流媒体政治热点选题辅助”流程：

打开网页 → 模拟抓取近24小时主流媒体政治热点20条 → 自动推荐3条最有上升潜力的选题 → 点击查看详情进入独立详情页 → 一键生成3个版本的小红书标题和正文。

项目严格保持轻量：

- 不使用数据库
- 不使用后端
- 不使用登录系统
- 不调用外部 API
- 不引入复杂 UI 框架

## 功能

- 顶部展示项目标题和说明
- 推荐选题3条，按上升潜力分排序
- 近24小时政治热点20条列表
- 点击热点后进入独立详情页
- 本地模板生成3个版本的小红书标题和正文
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
  utils/
    scorer.ts
    generator.ts
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
