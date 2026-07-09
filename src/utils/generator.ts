import type { ScoredHotspot } from '../data/mockHotspots';
import { DEFAULT_EDITORIAL_BRIEF, DEFAULT_TOPIC_STRATEGY, type EditorialBrief, type TopicStrategy } from '../types/workflow';

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

const COVER_MODE_BY_POST = {
  media: 'editorial',
  knowledge: 'swiss',
  discussion: 'discussion'
} as const satisfies Record<GeneratedPost['id'], GeneratedCover['mode']>;

function trimTitle(title: string): string {
  const cleanTitle = title
    .replace(/[，。；：、“”《》]/g, '')
    .replace(/有关|部署|会议|发布|推进/g, '')
    .trim();

  return cleanTitle.length > 20 ? cleanTitle.slice(0, 20) : cleanTitle;
}

function cleanCoverTitle(title: string): string {
  return title
    .replace(/[，。；：、“”《》]/g, '')
    .replace(/有关|部署|会议|发布|推进/g, '')
    .trim();
}

function shortCoverTitle(title: string): string {
  const coverMaxLength = 32;
  const normalizedTitle = cleanCoverTitle(title);
  const semanticTitle = buildSemanticCoverTitle(normalizedTitle);

  if (semanticTitle && normalizedTitle.length > 18) {
    return semanticTitle;
  }

  if (normalizedTitle.length <= coverMaxLength) {
    return normalizedTitle;
  }

  if (semanticTitle) {
    return semanticTitle;
  }

  const shortTitle = normalizedTitle
    .replace(/服务|建设|工作|进展/g, '')
    .replace(/以习近平同志为核心的/g, '')
    .replace(/党中央领航中国/g, '中央领航')
    .replace(/实现第一个百年奋斗目标/g, '百年目标')
    .replace(/而奋勇拼搏纪实/g, '奋斗纪实')
    .replace(/国务院日前印发了/g, '国务院印发')
    .replace(/中央广播电视总台/g, '总台')
    .trim();

  if (shortTitle.length <= coverMaxLength) {
    return shortTitle;
  }

  return compressByKeywords(shortTitle, coverMaxLength);
}

function coverSubhead(title: string, fallback: string): string {
  const normalizedTitle = cleanCoverTitle(title);
  const rules: Array<[RegExp, string]> = [
    [/三峡水运新通道.*6月8日.*湖北宜昌/, '6月8日 · 湖北宜昌正式开工'],
    [/镜观·足迹.*呵护千山万水.*永续发展/, '呵护千山万水 · 擘画永续发展'],
    [/风卷红旗过大关.*百年奋斗目标/, '以奋斗纪实回看百年目标'],
    [/城市更新.*十五五/, '建设好房子、好小区、好社区、好城区'],
    [/农业普查/, '第四次全国农业普查启动安排'],
    [/军事设施建设条例/, '聚焦服务备战打仗的制度规范'],
    [/高校.*产业发展/, '教育教学改革与产业能力提升']
  ];

  return rules.find(([pattern]) => pattern.test(normalizedTitle))?.[1] ?? fallback;
}

function buildSemanticCoverTitle(title: string): string {
  const rules: Array<[RegExp, string]> = [
    [/镜观·足迹.*呵护千山万水.*永续发展/, '呵护山水 永续发展'],
    [/风卷红旗过大关.*百年奋斗目标/, '中央领航百年奋斗目标纪实'],
    [/城市更新.*十五五/, '城市更新十五五规划发布'],
    [/三峡水运新通道.*湖北宜昌.*开工/, '三峡水运新通道工程湖北宜昌开工'],
    [/农业普查/, '第四次全国农业普查启动'],
    [/军事设施建设条例/, '军事设施建设条例发布'],
    [/党组讨论和决定党员处分/, '党员处分程序'],
    [/节约能源法执法检查/, '节能执法检查'],
    [/高校.*产业发展/, '高校提升引领产业发展能力'],
    [/环境就是民生/, '环境就是民生'],
    [/中朝友谊塔/, '参谒友谊塔'],
    [/干部学校/, '参访干部学校']
  ];

  return rules.find(([pattern]) => pattern.test(title))?.[1] ?? '';
}

function compressByKeywords(title: string, maxLength: number): string {
  const phrases = title
    .split(/[｜|—\-：:，,。、“”《》\s]+/)
    .map((word) =>
      word
        .trim()
        .replace(/呵护千山万水/g, '呵护山水')
        .replace(/擘画永续发展/g, '永续发展')
        .replace(/高水平开放提速加力/g, '高水平开放')
        .replace(/与世界共享发展机遇/g, '共享发展机遇')
    )
    .filter((word) => word.length >= 2 && !/镜观|足迹|注意|日前|有关负责人|怎么理解|值得看/.test(word));

  const compressed = phrases.slice(0, 3).join(' ');
  if (compressed.length >= 4 && compressed.length <= maxLength) {
    return compressed;
  }

  const shorterCompressed = phrases.slice(0, 2).join(' ');
  if (shorterCompressed.length >= 4 && shorterCompressed.length <= maxLength) {
    return shorterCompressed;
  }

  return phrases.find((phrase) => phrase.length <= maxLength) || title.slice(0, maxLength);
}

function buildBriefContext(brief: EditorialBrief, strategy: TopicStrategy) {
  const voice = brief.accountPosition === '民生观察型账号'
    ? '少一点口号，多一点普通人的具体感受'
    : brief.accountPosition === '青年知识型账号'
      ? '把概念讲得更像一条清楚的知识笔记'
      : '保持稳健、清楚、可追溯的解释口吻';
  const ending = brief.contentGoal === '引发温和讨论'
    ? '你会更关心它的政策初衷，还是最终落地后的实际变化？'
    : brief.contentGoal === '解释影响'
      ? '如果继续追踪，你最想看到哪一类具体影响被讲清楚？'
      : '你觉得这类议题最需要补充的是背景，还是执行细节？';
  const boundary = strategy.riskSensitivity === '敏感'
    ? '这类内容建议只引用已公开信息，避免未经证实的延伸判断。'
    : brief.expressionBoundary === '只做事实梳理'
      ? '这版内容以事实梳理为主，不急着下结论。'
      : '可以保留温和评论，但结论要回到权威来源和后续观察。';
  const titlePrefix = strategy.titleTone === '问题切入'
    ? '怎么看'
    : strategy.titleTone === '结论前置'
      ? '一图讲清'
      : '';
  const formatLine = `发布节奏按“${brief.publishCadence}”，笔记形态用“${brief.noteFormat}”，证据要求为“${brief.evidenceRequirement}”。`;

  return { voice, ending, boundary, titlePrefix, formatLine };
}

function applyTitleTone(title: string, prefix: string): string {
  if (!prefix) {
    return title;
  }

  return `${prefix}：${trimTitle(title)}`;
}

function buildMediaStylePost(hotspot: ScoredHotspot, brief: EditorialBrief, strategy: TopicStrategy): GeneratedPost {
  const context = buildBriefContext(brief, strategy);
  return {
    id: 'media',
    styleName: '主流媒体风格',
    description: `${brief.accountPosition} · ${brief.noteFormat}`,
    cover: {
      mode: COVER_MODE_BY_POST.media,
      label: '热点速读',
      headline: shortCoverTitle(hotspot.title),
      subhead: coverSubhead(hotspot.title, '把主流媒体信息讲清楚'),
      meta: `${hotspot.source} / ${hotspot.trend} / ${strategy.sourcePreference}`,
      points: ['发生了什么', '为何值得看', '后续看哪里']
    },
    title: applyTitleTone(hotspot.title, context.titlePrefix),
    body: `【发生了什么】
${hotspot.summary}

【为什么值得关注】
这条信息来自${hotspot.source}，当前热度分为${hotspot.hotScore}，上升潜力分为${hotspot.potentialScore}，策划匹配度为${hotspot.editorialFitScore}。从“${hotspot.trend}”的趋势看，公众对相关议题的关注还在延续。

【可以从哪些角度理解】
这次账号定位是“${brief.accountPosition}”，面向“${brief.targetReader}”，适合用“${strategy.contentAngle}”切入。表达上建议${context.voice}。

【后续还可以观察什么】
后续可以继续关注地方落实、部门解读和主流媒体跟进。${context.formatLine} ${context.boundary}

${context.ending}`
  };
}

function buildKnowledgeStylePost(hotspot: ScoredHotspot, brief: EditorialBrief, strategy: TopicStrategy): GeneratedPost {
  const context = buildBriefContext(brief, strategy);
  return {
    id: 'knowledge',
    styleName: '硬核知识风格',
    description: `${strategy.preferredSubject} · ${strategy.titleTone}`,
    cover: {
      mode: COVER_MODE_BY_POST.knowledge,
      label: '硬核拆解',
      headline: shortCoverTitle(hotspot.title),
      subhead: coverSubhead(hotspot.title, '前因后果 · 影响路径 · 观察点'),
      meta: `${brief.evidenceRequirement} · HOT ${hotspot.hotScore}`,
      points: ['01 背景', '02 影响', '03 落地']
    },
    title: applyTitleTone(hotspot.title, context.titlePrefix),
    body: `【发生了什么】
${hotspot.summary}

【前因后果】
这类议题通常不是孤立出现的。它往往和现实治理需求、政策执行压力、公共服务改进或经济社会发展节奏有关。${hotspot.source}选择报道这一议题，说明它具有一定公共讨论价值。

【为什么值得关注】
当前热度分为${hotspot.hotScore}，上升潜力分为${hotspot.potentialScore}，策划匹配度为${hotspot.editorialFitScore}，趋势为“${hotspot.trend}”。这意味着它不仅有信息价值，也适合放进“${strategy.preferredSubject}”栏目继续解释。

【可能带来哪些影响】
第一，政策层面可能会推动更明确的执行安排。
第二，地方层面可能会出现配套细则或实践案例。
第三，公众层面会更关注政策和日常生活之间的关系。目前观众情绪为“${hotspot.sentiment}”，说明大家更希望看到清晰解释和实际效果。

【后续观察点】
可以观察有没有权威解读、地方落实进度、相关数据披露，以及是否出现新的配套措施。做这类内容时，建议少用判断式表达，多用背景、逻辑和事实链条帮助读者理解。

【表达边界】
${context.formatLine} ${context.boundary}`
  };
}

function buildDiscussionStylePost(hotspot: ScoredHotspot, brief: EditorialBrief, strategy: TopicStrategy): GeneratedPost {
  const context = buildBriefContext(brief, strategy);
  return {
    id: 'discussion',
    styleName: '叙述讨论风格',
    description: `${brief.targetReader} · ${brief.publishCadence}`,
    cover: {
      mode: COVER_MODE_BY_POST.discussion,
      label: '一起讨论',
      headline: shortCoverTitle(hotspot.title),
      subhead: coverSubhead(hotspot.title, '这件事可以怎样理解？'),
      meta: `${hotspot.sentiment} / ${brief.noteFormat}`,
      points: ['政策初衷', '执行细节', '公众反馈']
    },
    title: applyTitleTone(hotspot.title, context.titlePrefix),
    body: `【发生了什么】
${hotspot.content}

【这件事为什么会被关注】
它来自${hotspot.source}，不是单纯的社会话题，而是和公共治理、政策执行或民生服务有关。当前趋势是“${hotspot.trend}”，观众情绪为“${hotspot.sentiment}”，说明不少人已经开始关心它后面会怎样落地。

【我觉得可以这样看】
不急着给结论，先看三个问题：这项安排想解决什么问题？执行过程中谁来负责？普通人能从哪些具体变化中感受到它？这条内容更适合采用“${strategy.contentAngle}”，${context.voice}。

【还可以继续观察】
接下来可以看相关部门是否继续解释，地方是否跟进执行，以及主流媒体是否持续报道同一议题。${context.formatLine}

${context.ending}`
  };
}

export function generateXiaohongshuPosts(
  hotspot: ScoredHotspot,
  brief: EditorialBrief = DEFAULT_EDITORIAL_BRIEF,
  strategy: TopicStrategy = DEFAULT_TOPIC_STRATEGY
): GeneratedPost[] {
  return [
    buildMediaStylePost(hotspot, brief, strategy),
    buildKnowledgeStylePost(hotspot, brief, strategy),
    buildDiscussionStylePost(hotspot, brief, strategy)
  ];
}
