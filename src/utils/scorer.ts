import type { Hotspot, ScoredHotspot } from '../data/mockHotspots';
import { DEFAULT_EDITORIAL_BRIEF, DEFAULT_TOPIC_STRATEGY, type EditorialBrief, type TopicStrategy } from '../types/workflow';

const SUBJECT_KEYWORDS: Record<TopicStrategy['preferredSubject'], string[]> = {
  民生服务: ['民生', '就业', '医保', '养老', '教育', '住房', '消费', '公共服务', '群众', '小区'],
  治理改革: ['治理', '改革', '政务', '基层', '营商环境', '制度', '干部', '高质量发展'],
  安全法治: ['安全', '法治', '执法', '监督', '应急', '防汛', '风险', '法律'],
  发展建设: ['发展', '建设', '科技', '产业', '农业', '城市更新', '新质生产力', '文化']
};

const FOCUS_KEYWORDS: Record<TopicStrategy['columnFocus'], string[]> = {
  综合政治: ['中央', '政策', '改革', '治理', '民生', '发展', '人民', '国家'],
  民生政策: SUBJECT_KEYWORDS.民生服务,
  治理改革: SUBJECT_KEYWORDS.治理改革,
  安全法治: SUBJECT_KEYWORDS.安全法治
};

const SOURCE_KEYWORDS: Record<TopicStrategy['sourcePreference'], string[]> = {
  央媒权威: ['新华社', '人民日报', '央视', '中央广播电视总台', '光明日报'],
  部委发布: ['国务院', '部', '委', '局', '条例', '通知'],
  地方实践: ['地方', '城市', '社区', '基层', '小区', '省', '市']
};

export function getHotScore(hotspot: Hotspot): number {
  return hotspot.likes + hotspot.comments * 3 + hotspot.reposts * 5;
}

export function getPotentialScore(hotspot: Hotspot): number {
  const baseScore = hotspot.likes * 0.2 + hotspot.comments * 0.5 + hotspot.reposts * 0.8;

  if (hotspot.trend === '快速上升') {
    return Math.round(baseScore + 1000);
  }

  if (hotspot.trend === '上升') {
    return Math.round(baseScore + 500);
  }

  return Math.round(baseScore);
}

export function scoreHotspot(hotspot: Hotspot): ScoredHotspot {
  return scoreHotspotForStrategy(hotspot, DEFAULT_EDITORIAL_BRIEF, DEFAULT_TOPIC_STRATEGY);
}

export function getEditorialFitScore(hotspot: Hotspot, brief: EditorialBrief, strategy: TopicStrategy): number {
  const text = `${hotspot.title} ${hotspot.summary} ${hotspot.content} ${hotspot.sentiment}`;
  const focusMatches = FOCUS_KEYWORDS[strategy.columnFocus].filter((keyword) => text.includes(keyword)).length;
  const subjectMatches = SUBJECT_KEYWORDS[strategy.preferredSubject].filter((keyword) => text.includes(keyword)).length;
  const sourceMatches = SOURCE_KEYWORDS[strategy.sourcePreference].filter((keyword) => `${text} ${hotspot.source}`.includes(keyword)).length;
  const trendBonus = hotspot.trend === '快速上升' ? 16 : hotspot.trend === '上升' ? 10 : hotspot.trend === '平稳' ? 4 : 0;
  const cadenceBonus = brief.publishCadence === '热点触发' && /快速上升|上升/.test(hotspot.trend)
    ? 6
    : brief.publishCadence === '工作日更新' && hotspot.trend === '平稳'
      ? 4
      : 2;
  const accountBonus = brief.accountPosition === '民生观察型账号' && /民生|就业|医保|养老|教育|住房|公共服务/.test(text)
    ? 10
    : brief.accountPosition === '青年知识型账号' && /教育|科技|产业|发展|校园|就业/.test(text)
      ? 10
      : brief.accountPosition === '政策解释型账号' && /政策|改革|治理|制度|法治|政务/.test(text)
        ? 10
        : 4;
  const riskPenalty = strategy.riskSensitivity === '敏感' && /安全|风险|处分|监督|执法|防汛|应急/.test(text) ? 8 : 0;
  const score = 38 + focusMatches * 8 + subjectMatches * 9 + sourceMatches * 4 + trendBonus + cadenceBonus + accountBonus - riskPenalty;

  return Math.max(30, Math.min(98, Math.round(score)));
}

function buildEditorialFitReason(hotspot: Hotspot, brief: EditorialBrief, strategy: TopicStrategy, score: number): string {
  const riskNote = strategy.riskSensitivity === '敏感'
    ? '表达需更强调事实来源和后续观察'
    : strategy.riskSensitivity === '稳健'
      ? '适合以背景解释为主，少做价值判断'
      : '可在事实梳理后加入轻量讨论';

  return `匹配度 ${score}：适合${brief.accountPosition}面向${brief.targetReader}做“${strategy.contentAngle}”，优先承接${strategy.preferredSubject}栏目；按${brief.publishCadence}节奏处理，信息源优先${strategy.sourcePreference}，${riskNote}。`;
}

function buildEditorialAdvice(hotspot: Hotspot, brief: EditorialBrief, strategy: TopicStrategy): ScoredHotspot['editorialAdvice'] {
  const noteType = `${brief.noteFormat} · ${strategy.contentAngle === '政策背景解释'
    ? '解释型笔记'
    : strategy.contentAngle === '民生影响拆解'
      ? '影响拆解型笔记'
      : '后续追踪型笔记'}`;
  const coverAngleBase = brief.contentGoal === '引发温和讨论'
    ? '用一个具体问题做首页图，例如“这件事会影响谁？”'
    : brief.contentGoal === '解释影响'
      ? `突出“${strategy.preferredSubject}会怎样变化”`
      : '突出“发生了什么、为什么重要”';
  const coverAngle = `${coverAngleBase}，版式采用${strategy.coverStyle}。`;
  const opening = brief.targetReader === '城市青年'
    ? '从日常生活中的具体感受切入，再回到政策背景。'
    : brief.targetReader === '基层工作者'
      ? '先讲执行场景和工作变化，再补充权威来源。'
      : '先交代主流媒体报道事实，再解释公共议题价值。';
  const avoid = strategy.riskSensitivity === '敏感'
    ? `避免未经证实的推断、情绪化归因和过度承诺效果；证据要求按“${brief.evidenceRequirement}”处理。`
    : brief.expressionBoundary === '只做事实梳理'
      ? `避免加入主观判断，重点保留时间、来源和后续观察点；优先使用${strategy.sourcePreference}。`
      : `避免脱离${hotspot.source}原文，评论部分保持温和；标题语气使用“${strategy.titleTone}”。`;

  return { noteType, coverAngle, opening, avoid };
}

export function scoreHotspotForStrategy(hotspot: Hotspot, brief: EditorialBrief, strategy: TopicStrategy): ScoredHotspot {
  const editorialFitScore = getEditorialFitScore(hotspot, brief, strategy);
  return {
    ...hotspot,
    hotScore: getHotScore(hotspot),
    potentialScore: getPotentialScore(hotspot),
    editorialFitScore,
    editorialFitReason: buildEditorialFitReason(hotspot, brief, strategy, editorialFitScore),
    editorialAdvice: buildEditorialAdvice(hotspot, brief, strategy)
  };
}

export function scoreHotspots(
  hotspots: Hotspot[],
  brief: EditorialBrief = DEFAULT_EDITORIAL_BRIEF,
  strategy: TopicStrategy = DEFAULT_TOPIC_STRATEGY
): ScoredHotspot[] {
  return hotspots.map((hotspot) => scoreHotspotForStrategy(hotspot, brief, strategy));
}

export function getTopRecommendations(hotspots: ScoredHotspot[], count = 3): ScoredHotspot[] {
  return [...hotspots]
    .sort((a, b) => b.potentialScore + b.editorialFitScore * 80 - (a.potentialScore + a.editorialFitScore * 80))
    .slice(0, count);
}
