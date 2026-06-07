import type { ScoredHotspot } from '../data/mockHotspots';

export interface GeneratedPost {
  id: string;
  styleName: string;
  description: string;
  cover: GeneratedCover;
  title: string;
  body: string;
}

export interface GeneratedCover {
  mode: 'editorial' | 'swiss' | 'discussion';
  label: string;
  headline: string;
  subhead: string;
  meta: string;
  points: string[];
}

function trimTitle(title: string): string {
  const cleanTitle = title
    .replace(/[，。；：、“”《》]/g, '')
    .replace(/有关|部署|会议|发布|推进/g, '')
    .trim();

  return cleanTitle.length > 20 ? `${cleanTitle.slice(0, 19)}…` : cleanTitle;
}

function shortCoverTitle(title: string): string {
  return trimTitle(title)
    .replace(/服务|建设|工作|进展/g, '')
    .slice(0, 18);
}

function buildMediaStylePost(hotspot: ScoredHotspot): GeneratedPost {
  return {
    id: 'media',
    styleName: '主流媒体风格',
    description: '偏通俗叙述，配合简洁分析',
    cover: {
      mode: 'editorial',
      label: '热点速读',
      headline: shortCoverTitle(hotspot.title),
      subhead: '把主流媒体信息讲清楚',
      meta: `${hotspot.source} / ${hotspot.trend}`,
      points: ['发生了什么', '为何值得看', '后续看哪里']
    },
    title: trimTitle(hotspot.title),
    body: `【发生了什么】
${hotspot.summary}

【为什么值得关注】
这条信息来自${hotspot.source}，当前热度分为${hotspot.hotScore}，上升潜力分为${hotspot.potentialScore}。从“${hotspot.trend}”的趋势看，公众对相关议题的关注还在延续。

【可以从哪些角度理解】
第一，看它回应了什么现实问题。第二，看后续有没有更具体的执行安排。第三，看普通人能否从中感受到公共服务、治理效率或政策稳定性的变化。

【后续还可以观察什么】
后续可以继续关注地方落实、部门解读和主流媒体跟进。对实政评论账号来说，把信息讲清楚、把背景补完整，比快速下判断更重要。

你觉得这类议题最值得关注的是政策本身，还是具体落地效果？`
  };
}

function buildKnowledgeStylePost(hotspot: ScoredHotspot): GeneratedPost {
  return {
    id: 'knowledge',
    styleName: '硬核知识风格',
    description: '科普前因后果、政策背景和可能影响',
    cover: {
      mode: 'swiss',
      label: 'POLICY NOTE',
      headline: shortCoverTitle(`${hotspot.title}怎么理解`),
      subhead: '前因后果 / 影响路径 / 观察点',
      meta: `HOT ${hotspot.hotScore} · POTENTIAL ${hotspot.potentialScore}`,
      points: ['背景', '影响', '落地']
    },
    title: trimTitle(`${hotspot.title}怎么理解`),
    body: `【发生了什么】
${hotspot.summary}

【前因后果】
这类议题通常不是孤立出现的。它往往和现实治理需求、政策执行压力、公共服务改进或经济社会发展节奏有关。${hotspot.source}选择报道这一议题，说明它具有一定公共讨论价值。

【为什么值得关注】
当前热度分为${hotspot.hotScore}，上升潜力分为${hotspot.potentialScore}，趋势为“${hotspot.trend}”。这意味着它不仅有信息价值，也可能成为后续评论、解释和追踪的选题入口。

【可能带来哪些影响】
第一，政策层面可能会推动更明确的执行安排。
第二，地方层面可能会出现配套细则或实践案例。
第三，公众层面会更关注政策和日常生活之间的关系。目前观众情绪为“${hotspot.sentiment}”，说明大家更希望看到清晰解释和实际效果。

【后续观察点】
可以观察有没有权威解读、地方落实进度、相关数据披露，以及是否出现新的配套措施。做这类内容时，建议少用判断式表达，多用背景、逻辑和事实链条帮助读者理解。`
  };
}

function buildDiscussionStylePost(hotspot: ScoredHotspot): GeneratedPost {
  return {
    id: 'discussion',
    styleName: '叙述讨论风格',
    description: '先讲清事件，再给出温和讨论问题',
    cover: {
      mode: 'discussion',
      label: '今日议题',
      headline: shortCoverTitle(`${hotspot.title}值得看`),
      subhead: '这件事可以怎样理解？',
      meta: `${hotspot.sentiment} / 温和讨论`,
      points: ['政策初衷', '执行细节', '公众反馈']
    },
    title: trimTitle(`${hotspot.title}值得看`),
    body: `【发生了什么】
${hotspot.content}

【这件事为什么会被关注】
它来自${hotspot.source}，不是单纯的社会话题，而是和公共治理、政策执行或民生服务有关。当前趋势是“${hotspot.trend}”，观众情绪为“${hotspot.sentiment}”，说明不少人已经开始关心它后面会怎样落地。

【我觉得可以这样看】
不急着给结论，先看三个问题：这项安排想解决什么问题？执行过程中谁来负责？普通人能从哪些具体变化中感受到它？

【还可以继续观察】
接下来可以看相关部门是否继续解释，地方是否跟进执行，以及主流媒体是否持续报道同一议题。

你会更关心这件事的政策初衷，还是它最终能不能真正落到日常生活里？`
  };
}

export function generateXiaohongshuPosts(hotspot: ScoredHotspot): GeneratedPost[] {
  return [buildMediaStylePost(hotspot), buildKnowledgeStylePost(hotspot), buildDiscussionStylePost(hotspot)];
}
