import { useEffect, useMemo, useState } from 'react';
import { lastFetchedAt, lastFetchedHotspots } from './data/lastFetchedHotspots';
import { mockHotspots, type Hotspot, type Trend } from './data/mockHotspots';
import { generateXiaohongshuPosts, type GeneratedPost } from './utils/generator';
import {
  fetchLatestHotspots,
  OFFICIAL_SOURCES,
  readCachedLiveResult,
  type LiveFetchResult,
  type OfficialSource
} from './utils/liveFetcher';
import { getTopRecommendations, scoreHotspots } from './utils/scorer';
import {
  DEFAULT_WORKFLOW_STATE,
  type AccountPosition,
  type ContentAngle,
  type ContentGoal,
  type EditorialBrief,
  type EvidenceRequirement,
  type ExpressionBoundary,
  type NoteFormat,
  type PreferredSubject,
  type PublishCadence,
  type RiskSensitivity,
  type SourcePreference,
  type TargetReader,
  type TitleTone,
  type TopicStrategy,
  type WorkflowState
} from './types/workflow';

const trendClassMap: Record<Trend, string> = {
  快速上升: 'tag tag-red',
  上升: 'tag tag-orange',
  平稳: 'tag tag-blue',
  回落: 'tag tag-gray'
};

const DEFAULT_LIMIT = 20;
const WORKFLOW_CACHE_KEY = 'redbook-editorial-workflow';
const VISUAL_THEME_CACHE_KEY = 'redbook-visual-theme';
const ACCOUNT_POSITION_OPTIONS: AccountPosition[] = ['政策解释型账号', '民生观察型账号', '青年知识型账号'];
const TARGET_READER_OPTIONS: TargetReader[] = ['公共议题关注者', '城市青年', '基层工作者'];
const CONTENT_GOAL_OPTIONS: ContentGoal[] = ['讲清背景', '解释影响', '引发温和讨论'];
const EXPRESSION_BOUNDARY_OPTIONS: ExpressionBoundary[] = ['事实加轻评论', '只做事实梳理', '强调落地观察'];
const PUBLISH_CADENCE_OPTIONS: PublishCadence[] = ['热点触发', '每日快评', '工作日更新'];
const NOTE_FORMAT_OPTIONS: NoteFormat[] = ['速读卡片', '长图拆解', '问答解释'];
const EVIDENCE_REQUIREMENT_OPTIONS: EvidenceRequirement[] = ['官方通稿优先', '数据与案例并重', '多源交叉验证'];
const TOPIC_FOCUS_OPTIONS: TopicStrategy['columnFocus'][] = ['综合政治', '民生政策', '治理改革', '安全法治'];
const CONTENT_ANGLE_OPTIONS: ContentAngle[] = ['政策背景解释', '民生影响拆解', '执行细节追踪'];
const PREFERRED_SUBJECT_OPTIONS: PreferredSubject[] = ['民生服务', '治理改革', '安全法治', '发展建设'];
const RISK_SENSITIVITY_OPTIONS: RiskSensitivity[] = ['标准', '稳健', '敏感'];
const TITLE_TONE_OPTIONS: TitleTone[] = ['稳健说明', '问题切入', '结论前置'];
const SOURCE_PREFERENCE_OPTIONS: SourcePreference[] = ['央媒权威', '部委发布', '地方实践'];
const WORKFLOW_STEPS = [
  { id: 'brief', title: '策划简报', description: '账号定位与发布目标' },
  { id: 'strategy', title: '选题策略', description: '栏目方向与内容角度' },
  { id: 'fetch', title: '热点选题', description: '获取、推荐与筛选热点' },
  { id: 'generate', title: '内容生成', description: '详情分析与发布草稿' }
] as const;

type AppPage = 'planning' | 'workbench' | 'detail';
type VisualTheme = 'teal' | 'plum' | 'navy';

const VISUAL_THEME_OPTIONS: Array<{
  id: VisualTheme;
  name: string;
  description: string;
  chips: string[];
}> = [
  {
    id: 'teal',
    name: '雾蓝清稿',
    description: '浅雾蓝底，冷静清爽，适合政策解释型账号。',
    chips: ['#ecf4f6', '#153f4a', '#d35d4f']
  },
  {
    id: 'plum',
    name: '浅藤紫灰',
    description: '轻紫灰底，柔和但不甜，适合评论型内容。',
    chips: ['#f2eef6', '#4f315c', '#6b7f65']
  },
  {
    id: 'navy',
    name: '冰灰靛蓝',
    description: '浅冰灰底，信息层次利落，更偏新闻产品。',
    chips: ['#edf3f8', '#173053', '#c94e42']
  }
];

function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN');
}

function getRouteHotspotId(): number | null {
  const match = window.location.hash.match(/^#\/hotspots\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function getRoutePage(): AppPage {
  if (window.location.hash.match(/^#\/hotspots\/(\d+)$/)) {
    return 'detail';
  }

  if (window.location.hash === '#/workbench') {
    return 'workbench';
  }

  return 'planning';
}

function formatFetchTime(value: string): string {
  if (!value) {
    return '暂无';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date
    .toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    .replace(/\//g, '-');
}

function getInitialHotspotState(): {
  hotspots: Hotspot[];
  fetchedAt: string;
  label: string;
  description: string;
} {
  const cachedResult = readCachedLiveResult();
  if (cachedResult) {
    return {
      hotspots: cachedResult.hotspots,
      fetchedAt: cachedResult.fetchedAt,
      label: '浏览器缓存',
      description: `来自上次成功获取的 ${cachedResult.hotspots.length} 条官方来源信息`
    };
  }

  if (lastFetchedHotspots.length > 0) {
    return {
      hotspots: lastFetchedHotspots,
      fetchedAt: lastFetchedAt,
      label: '离线快照',
      description: '使用本项目打包前最后一次真实抓取的数据'
    };
  }

  return {
    hotspots: mockHotspots,
    fetchedAt: '',
    label: 'Mock 示例',
    description: '用于离线展示的原始模拟数据'
  };
}

function getInitialWorkflowState(): WorkflowState {
  try {
    const raw = localStorage.getItem(WORKFLOW_CACHE_KEY);
    if (!raw) {
      return DEFAULT_WORKFLOW_STATE;
    }

    const parsed = JSON.parse(raw) as Partial<WorkflowState>;
    return {
      currentStep: parsed.currentStep ?? DEFAULT_WORKFLOW_STATE.currentStep,
      brief: { ...DEFAULT_WORKFLOW_STATE.brief, ...parsed.brief },
      strategy: { ...DEFAULT_WORKFLOW_STATE.strategy, ...parsed.strategy },
      fetchStatus: ''
    };
  } catch {
    return DEFAULT_WORKFLOW_STATE;
  }
}

function getInitialVisualTheme(): VisualTheme {
  try {
    const savedTheme = localStorage.getItem(VISUAL_THEME_CACHE_KEY);
    if (savedTheme === 'teal' || savedTheme === 'plum' || savedTheme === 'navy') {
      return savedTheme;
    }
  } catch {
    return 'teal';
  }

  return 'teal';
}

function BrandLockup({ contextLabel }: { contextLabel: string }) {
  return (
    <div className="brand-lockup">
      <div className="brand-seal" aria-hidden="true">
        <span>政</span>
        <span>评</span>
      </div>
      <div className="brand-copy">
        <div className="brand-rule">
          <span>{contextLabel}</span>
        </div>
        <h1>
          <span>时政评论</span>
          <span>选题策划助手</span>
        </h1>
      </div>
    </div>
  );
}

function App() {
  const [hotspotState, setHotspotState] = useState(getInitialHotspotState);
  const [workflowState, setWorkflowState] = useState(getInitialWorkflowState);
  const [visualTheme, setVisualTheme] = useState<VisualTheme>(getInitialVisualTheme);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedSources, setSelectedSources] = useState<OfficialSource[]>([...OFFICIAL_SOURCES]);
  const [fetchLimit, setFetchLimit] = useState(DEFAULT_LIMIT);
  const hotspots = useMemo(
    () => scoreHotspots(hotspotState.hotspots, workflowState.brief, workflowState.strategy),
    [hotspotState.hotspots, workflowState.brief, workflowState.strategy]
  );
  const recommendations = useMemo(() => getTopRecommendations(hotspots), [hotspots]);
  const [activePage, setActivePage] = useState<AppPage>(() => getRoutePage());
  const [routeHotspotId, setRouteHotspotId] = useState<number | null>(() => getRouteHotspotId());
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const detailHotspot = hotspots.find((item) => item.id === routeHotspotId) ?? null;
  const workflowStepIndex = WORKFLOW_STEPS.findIndex((step) => step.id === workflowState.currentStep);

  useEffect(() => {
    function syncRoute() {
      setActivePage(getRoutePage());
      setRouteHotspotId(getRouteHotspotId());
      setGeneratedPosts([]);
    }

    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      WORKFLOW_CACHE_KEY,
      JSON.stringify({
        currentStep: workflowState.currentStep,
        brief: workflowState.brief,
        strategy: workflowState.strategy
      })
    );
  }, [workflowState.brief, workflowState.currentStep, workflowState.strategy]);

  useEffect(() => {
    document.documentElement.dataset.theme = visualTheme;
    localStorage.setItem(VISUAL_THEME_CACHE_KEY, visualTheme);
  }, [visualTheme]);

  function openHotspotDetail(id: number) {
    window.location.hash = `/hotspots/${id}`;
  }

  function openWorkbench() {
    setWorkflowState((current) => ({
      ...current,
      currentStep: current.currentStep === 'generate' ? 'generate' : 'fetch'
    }));
    window.location.hash = '/workbench';
  }

  function backToPlanning() {
    window.location.hash = '';
    setGeneratedPosts([]);
  }

  function backToWorkbench() {
    window.location.hash = '/workbench';
    setGeneratedPosts([]);
  }

  function handleGenerate() {
    if (!detailHotspot) {
      return;
    }

    setWorkflowState((current) => ({ ...current, currentStep: 'generate' }));
    setGeneratedPosts(generateXiaohongshuPosts(detailHotspot, workflowState.brief, workflowState.strategy));
  }

  async function handleFetchLatest() {
    setIsFetching(true);
    setWorkflowState((current) => ({
      ...current,
      currentStep: 'fetch',
      fetchStatus: `正在获取 ${selectedSources.length} 个来源的${current.strategy.columnFocus}热点...`
    }));

    try {
      const result: LiveFetchResult = await fetchLatestHotspots({
        sources: selectedSources,
        limit: fetchLimit,
        focus: workflowState.strategy.columnFocus
      });
      setHotspotState({
        hotspots: result.hotspots,
        fetchedAt: result.fetchedAt,
        label: '实时获取',
        description: `成功获取 ${result.hotspots.length} 条，覆盖 ${result.sourceCount} 个官方来源`
      });
      setWorkflowState((current) => ({
        ...current,
        currentStep: 'generate',
        fetchStatus: '获取成功，已保存到浏览器缓存；离线时会优先使用这批数据。'
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取失败';
      setWorkflowState((current) => ({
        ...current,
        fetchStatus: `${message} 当前页面继续保留最近一次成功获取的数据。`
      }));
    } finally {
      setIsFetching(false);
    }
  }

  function toggleSource(source: OfficialSource) {
    setSelectedSources((current) => {
      if (current.includes(source)) {
        return current.filter((item) => item !== source);
      }

      return [...current, source];
    });
  }

  function resetFetchOptions() {
    setSelectedSources([...OFFICIAL_SOURCES]);
    setFetchLimit(DEFAULT_LIMIT);
    setWorkflowState(DEFAULT_WORKFLOW_STATE);
  }

  function updateBrief<Key extends keyof EditorialBrief>(key: Key, value: EditorialBrief[Key]) {
    setWorkflowState((current) => ({
      ...current,
      currentStep: 'brief',
      brief: { ...current.brief, [key]: value }
    }));
  }

  function updateStrategy<Key extends keyof TopicStrategy>(key: Key, value: TopicStrategy[Key]) {
    setWorkflowState((current) => ({
      ...current,
      currentStep: 'strategy',
      strategy: { ...current.strategy, [key]: value }
    }));
  }

  if (activePage === 'detail' && detailHotspot) {
    return (
      <main className="page-shell detail-page">
        <button className="back-button" onClick={backToWorkbench}>
          返回选题流程
        </button>

        <header className="detail-hero">
          <div className="detail-hero-main">
            <p className="eyebrow">热点详情 / 选题生成</p>
            <h1>{detailHotspot.title}</h1>
            <div className="detail-tags">
              <span className="tag tag-dark">{detailHotspot.source}</span>
              <span className="tag tag-green">{detailHotspot.sentiment}</span>
              <span className={trendClassMap[detailHotspot.trend]}>{detailHotspot.trend}</span>
              <span className="tag tag-blue">{detailHotspot.publishedAt}</span>
            </div>
          </div>
          <div className="detail-hero-actions">
            <button className="generate-button" onClick={handleGenerate}>
              一键生成三种风格
            </button>
            <a href={detailHotspot.url} target="_blank" rel="noreferrer">
              查看原文链接
            </a>
          </div>
        </header>

        <section className="detail-metrics">
          <div>
            <span>热度分</span>
            <strong>{formatNumber(detailHotspot.hotScore)}</strong>
          </div>
          <div>
            <span>上升潜力分</span>
            <strong>{formatNumber(detailHotspot.potentialScore)}</strong>
          </div>
          <div>
            <span>互动数据</span>
            <strong>
              {formatNumber(detailHotspot.likes + detailHotspot.comments + detailHotspot.reposts)}
            </strong>
          </div>
          <div>
            <span>策划匹配度</span>
            <strong>{detailHotspot.editorialFitScore}</strong>
          </div>
        </section>

        <section className="detail-grid">
          <article className="detail-card detail-summary-card">
            <p className="eyebrow">事件材料</p>
            <div className="detail-card-grid">
              <div className="detail-block">
                <h2>事件简介</h2>
                <p>{detailHotspot.content}</p>
              </div>
              <div className="detail-block">
                <h2>主流媒体原文摘要</h2>
                <p>{detailHotspot.summary}</p>
              </div>
              <div className="detail-block">
                <h2>观众情绪分析</h2>
                <p>当前情绪为“{detailHotspot.sentiment}”，适合采用解释型、梳理型表达，避免情绪化判断。</p>
              </div>
              <div className="detail-block">
                <h2>热度趋势分析</h2>
                <p>趋势为“{detailHotspot.trend}”。如果持续上升，可优先从政策背景、影响范围和执行细节三个角度做选题。</p>
              </div>
              <div className="detail-block">
                <h2>策划匹配说明</h2>
                <p>{detailHotspot.editorialFitReason}</p>
              </div>
              <div className="detail-block">
                <h2>策划承接建议</h2>
                <p>
                  适合做{detailHotspot.editorialAdvice.noteType}。首图角度：{detailHotspot.editorialAdvice.coverAngle}
                  ；正文切入：{detailHotspot.editorialAdvice.opening}
                </p>
              </div>
              <div className="detail-block">
                <h2>表达边界</h2>
                <p>{detailHotspot.editorialAdvice.avoid}</p>
              </div>
              <div className="detail-block">
                <h2>当前策划配置</h2>
                <p>
                  {workflowState.brief.accountPosition} / {workflowState.brief.targetReader} / {workflowState.strategy.contentAngle} / 风险敏感度：
                  {workflowState.strategy.riskSensitivity}
                </p>
              </div>
            </div>
          </article>
        </section>

        <section className="generated-page-section">
          <div className="section-title">
            <div>
              <p className="eyebrow">生成结果</p>
              <h2>三种不同风格的小红书文案</h2>
            </div>
          </div>

          {generatedPosts.length === 0 ? (
            <div className="empty-generate">
              点击上方“一键生成三种风格”，这里会并列展示主流媒体风格、硬核知识风格和叙述讨论风格。
            </div>
          ) : (
            <div className="generated-version-grid">
              {generatedPosts.map((post) => (
                <article className="generated-box" key={post.id}>
                  <div className={`xhs-cover xhs-cover-${post.cover.mode}`}>
                    <div className="xhs-cover-top">
                      <span>{post.cover.label}</span>
                      <small>3:4 首页图</small>
                    </div>
                    <div className="xhs-cover-body">
                      <h3>{post.cover.headline}</h3>
                      <p>{post.cover.subhead}</p>
                    </div>
                    <div className="xhs-cover-points">
                      {post.cover.points.map((point) => (
                        <span key={point}>{point}</span>
                      ))}
                    </div>
                    <div className="xhs-cover-meta">{post.cover.meta}</div>
                  </div>
                  <div className="generated-header">
                    <div>
                      <span className="version-label">{post.styleName}</span>
                      <p>{post.description}</p>
                    </div>
                  </div>
                  <h3>{post.title}</h3>
                  <pre>{post.body}</pre>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    );
  }

  if (activePage === 'planning') {
    return (
      <main className="page-shell planning-page">
        <header className="editorial-topbar">
          <div>
            <BrandLockup contextLabel="编辑策划链 / STEP 01" />
            <p>从编辑策划到小红书内容产出，先把账号、读者、边界和栏目策略定清楚，再进入热点选题流程。</p>
          </div>
          <div className="topbar-side">
            <div className="topbar-actions">
              <span>草稿自动保存</span>
              <div className="theme-corner" aria-label="配色切换">
                <span>配色</span>
                <div className="theme-swatch-row">
                  {VISUAL_THEME_OPTIONS.map((option) => (
                    <button
                      aria-label={`切换到${option.name}`}
                      className={`theme-swatch theme-swatch-${option.id} ${visualTheme === option.id ? 'is-selected' : ''}`}
                      key={option.id}
                      onClick={() => setVisualTheme(option.id)}
                      title={option.name}
                      type="button"
                    >
                      {option.name.slice(0, 1)}
                    </button>
                  ))}
                </div>
              </div>
              <button className="ghost-button" onClick={resetFetchOptions}>恢复默认</button>
            </div>

            <section className="complete-flow-overview">
              <div className="flow-overview-head">
                <h2>完整流程简介</h2>
                <p>策划是第一步，后续会沿用同一份策略完成热点获取、推荐判断和内容生成。</p>
              </div>
              <div className="flow-step-grid">
                {WORKFLOW_STEPS.map((step, index) => (
                  <article className={`flow-step-card ${index === 0 ? 'is-current' : ''}`} key={step.id}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </header>

        <section className="planning-layout">
          <div className="planning-stack">
            <article className="workflow-card editorial-section">
              <div className="workflow-card-head">
                <span className="section-number">一</span>
                <h2>账号定位</h2>
              </div>
              <div className="planning-grid">
                <div>
                  <span className="control-label">账号定位</span>
                  <div className="choice-row">
                    {ACCOUNT_POSITION_OPTIONS.map((option) => (
                      <button
                        className={`choice-chip ${workflowState.brief.accountPosition === option ? 'is-selected' : ''}`}
                        key={option}
                        onClick={() => updateBrief('accountPosition', option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="control-label">目标读者</span>
                  <div className="choice-row">
                    {TARGET_READER_OPTIONS.map((option) => (
                      <button
                        className={`choice-chip ${workflowState.brief.targetReader === option ? 'is-selected' : ''}`}
                        key={option}
                        onClick={() => updateBrief('targetReader', option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                <label>
                  <span className="control-label">内容目标</span>
                  <select value={workflowState.brief.contentGoal} onChange={(event) => updateBrief('contentGoal', event.target.value as ContentGoal)}>
                    {CONTENT_GOAL_OPTIONS.map((option) => (
                      <option value={option} key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="control-label">表达边界</span>
                  <select
                    value={workflowState.brief.expressionBoundary}
                    onChange={(event) => updateBrief('expressionBoundary', event.target.value as ExpressionBoundary)}
                  >
                    {EXPRESSION_BOUNDARY_OPTIONS.map((option) => (
                      <option value={option} key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <div>
                  <span className="control-label">发布节奏</span>
                  <div className="choice-row compact-choice-row">
                    {PUBLISH_CADENCE_OPTIONS.map((option) => (
                      <button
                        className={`choice-chip ${workflowState.brief.publishCadence === option ? 'is-selected' : ''}`}
                        key={option}
                        onClick={() => updateBrief('publishCadence', option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                <label>
                  <span className="control-label">笔记形态</span>
                  <select
                    value={workflowState.brief.noteFormat}
                    onChange={(event) => updateBrief('noteFormat', event.target.value as NoteFormat)}
                  >
                    {NOTE_FORMAT_OPTIONS.map((option) => (
                      <option value={option} key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="planning-wide-field">
                  <span className="control-label">证据要求</span>
                  <select
                    value={workflowState.brief.evidenceRequirement}
                    onChange={(event) => updateBrief('evidenceRequirement', event.target.value as EvidenceRequirement)}
                  >
                    {EVIDENCE_REQUIREMENT_OPTIONS.map((option) => (
                      <option value={option} key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
            </article>

            <article className="workflow-card editorial-section">
              <div className="workflow-card-head">
                <span className="section-number">二</span>
                <h2>选题策略</h2>
              </div>
              <div className="planning-grid">
                <label>
                  <span className="control-label">栏目方向</span>
                  <select
                    value={workflowState.strategy.columnFocus}
                    onChange={(event) => updateStrategy('columnFocus', event.target.value as TopicStrategy['columnFocus'])}
                  >
                    {TOPIC_FOCUS_OPTIONS.map((option) => (
                      <option value={option} key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="control-label">内容角度</span>
                  <select value={workflowState.strategy.contentAngle} onChange={(event) => updateStrategy('contentAngle', event.target.value as ContentAngle)}>
                    {CONTENT_ANGLE_OPTIONS.map((option) => (
                      <option value={option} key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <div>
                  <span className="control-label">优先题材</span>
                  <div className="choice-row">
                    {PREFERRED_SUBJECT_OPTIONS.map((option) => (
                      <button
                        className={`choice-chip ${workflowState.strategy.preferredSubject === option ? 'is-selected' : ''}`}
                        key={option}
                        onClick={() => updateStrategy('preferredSubject', option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="control-label">风险敏感度</span>
                  <div className="choice-row">
                    {RISK_SENSITIVITY_OPTIONS.map((option) => (
                      <button
                        className={`choice-chip ${workflowState.strategy.riskSensitivity === option ? 'is-selected' : ''}`}
                        key={option}
                        onClick={() => updateStrategy('riskSensitivity', option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="control-label">标题语气</span>
                  <div className="choice-row compact-choice-row">
                    {TITLE_TONE_OPTIONS.map((option) => (
                      <button
                        className={`choice-chip ${workflowState.strategy.titleTone === option ? 'is-selected' : ''}`}
                        key={option}
                        onClick={() => updateStrategy('titleTone', option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="planning-wide-field">
                  <span className="control-label">信息源偏好</span>
                  <select
                    value={workflowState.strategy.sourcePreference}
                    onChange={(event) => updateStrategy('sourcePreference', event.target.value as SourcePreference)}
                  >
                    {SOURCE_PREFERENCE_OPTIONS.map((option) => (
                      <option value={option} key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
            </article>
          </div>

          <aside className="strategy-brief">
            <div className="brief-card">
              <div className="brief-head">
                <h2>策略简报</h2>
                <span>实时摘要</span>
              </div>
              <dl>
                <div>
                  <dt>定位摘要</dt>
                  <dd>{workflowState.brief.accountPosition}，面向{workflowState.brief.targetReader}。</dd>
                </div>
                <div>
                  <dt>内容目标</dt>
                  <dd>
                    {workflowState.brief.contentGoal}，表达边界为“{workflowState.brief.expressionBoundary}”，
                    {workflowState.brief.publishCadence}发布。
                  </dd>
                </div>
                <div>
                  <dt>选题方向</dt>
                  <dd>{workflowState.strategy.columnFocus} / {workflowState.strategy.contentAngle} / {workflowState.strategy.preferredSubject}</dd>
                </div>
                <div>
                  <dt>生产参数</dt>
                  <dd>
                    {workflowState.brief.noteFormat} / {workflowState.strategy.titleTone} / {workflowState.strategy.sourcePreference}
                  </dd>
                </div>
                <div>
                  <dt>证据要求</dt>
                  <dd>{workflowState.brief.evidenceRequirement}</dd>
                </div>
                <div>
                  <dt>风险提示</dt>
                  <dd>{workflowState.strategy.riskSensitivity === '敏感' ? '优先选择事实链清晰、来源稳定、争议较低的选题。' : '可以在事实梳理后加入温和判断和后续观察。'}</dd>
                </div>
              </dl>
              <button className="primary-button enter-workbench-button" onClick={openWorkbench}>
                <span>进入热点选题</span>
                <strong aria-hidden="true">→</strong>
              </button>
            </div>
          </aside>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell workbench-page">
      <header className="workbench-header">
        <button className="back-button" onClick={backToPlanning}>返回策划</button>
        <div>
          <BrandLockup contextLabel="热点选题 / STEP 03" />
          <p>第三步：热点选题 / {workflowState.brief.accountPosition} / {workflowState.strategy.columnFocus} / {workflowState.strategy.contentAngle}</p>
        </div>
        <div className="workbench-side">
          <div className="workbench-status">
            <span>{hotspotState.label}</span>
            <span>近24小时 {hotspots.length} 条</span>
            <span>最后更新 {formatFetchTime(hotspotState.fetchedAt)}</span>
          </div>
          <section className="strategy-strip" aria-label="流程进度">
            {WORKFLOW_STEPS.map((step, index) => (
              <div className={`strategy-step ${index <= workflowStepIndex ? 'is-active' : ''}`} key={step.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{step.title}</strong>
              </div>
            ))}
          </section>
        </div>
      </header>

      <section className="live-fetch-panel">
        <div className="live-fetch-copy">
          <p className="eyebrow">官方来源实时信息</p>
          <h2>获取最新政治热点</h2>
          <p>
            将按“{workflowState.strategy.columnFocus} / {workflowState.strategy.preferredSubject}”策略进入抓取；成功结果会保存在本机。
          </p>
          {workflowState.fetchStatus && <div className="fetch-status">{workflowState.fetchStatus}</div>}
        </div>
        <div className="source-picker">
          <span className="control-label">信息源</span>
          <div className="source-options">
            {OFFICIAL_SOURCES.map((source) => (
              <label className="source-option" key={source}>
                <input
                  type="checkbox"
                  checked={selectedSources.includes(source)}
                  onChange={() => toggleSource(source)}
                />
                <span>{source}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="fetch-controls">
          <label>
            <span className="control-label">抓取条数</span>
            <select value={fetchLimit} onChange={(event) => setFetchLimit(Number(event.target.value))}>
              <option value={10}>10条</option>
              <option value={15}>15条</option>
              <option value={20}>20条</option>
            </select>
          </label>
          <label>
            <span className="control-label">选题方向</span>
            <select
              value={workflowState.strategy.columnFocus}
              onChange={(event) => updateStrategy('columnFocus', event.target.value as TopicStrategy['columnFocus'])}
            >
              {TOPIC_FOCUS_OPTIONS.map((option) => (
                <option value={option} key={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="fetch-actions">
          <button className="generate-button fetch-button" onClick={handleFetchLatest} disabled={isFetching || selectedSources.length === 0}>
            {isFetching ? '获取中...' : '获取最新信息'}
          </button>
          <button className="ghost-button reset-button" onClick={resetFetchOptions}>
            恢复默认
          </button>
        </div>
      </section>

      <section className="section">
        <div className="section-title">
          <div>
            <p className="eyebrow">STEP 04 / 综合潜力与策划匹配排序</p>
            <h2>推荐选题3条</h2>
          </div>
        </div>

        <div className="recommend-grid">
          {recommendations.map((item, index) => (
            <article className="recommend-card" key={item.id}>
              <div className="rank">TOP {index + 1}</div>
              <h3>{item.title}</h3>
              <div className="card-meta">
                <span>{item.source}</span>
                <span className={trendClassMap[item.trend]}>{item.trend}</span>
              </div>
              <div className="score-line">
                <span>上升潜力分</span>
                <strong>{formatNumber(item.potentialScore)}</strong>
              </div>
              <div className="fit-meter">
                <span>策划匹配度</span>
                <strong>{item.editorialFitScore}</strong>
              </div>
              <p className="reason">{item.editorialFitReason}</p>
              <button className="primary-button" onClick={() => openHotspotDetail(item.id)}>
                查看详情
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="section list-section">
        <div className="section-title">
          <div>
            <p className="eyebrow">官方主流媒体热点池</p>
            <h2>近24小时政治热点{hotspots.length}条</h2>
          </div>
        </div>

        <div className="hotspot-card-grid">
          {hotspots.map((item, index) => (
            <article className="hotspot-card" key={item.id}>
              <div className="hotspot-card-main">
                <span className="material-index">{String(index + 1).padStart(2, '0')}</span>
                <h3>{item.title}</h3>
                <div className="hotspot-meta">
                  <span>{item.source}</span>
                  <span>{item.publishedAt}</span>
                </div>
                <p>{item.summary}</p>
              </div>
              <div className="hotspot-card-side">
                <div className="hotspot-card-stats">
                  <span>
                    热度 <strong>{formatNumber(item.hotScore)}</strong>
                  </span>
                  <span>
                    潜力 <strong>{formatNumber(item.potentialScore)}</strong>
                  </span>
                </div>
                <div className="tag-group">
                  <span className="tag tag-green">{item.sentiment}</span>
                  <span className={trendClassMap[item.trend]}>{item.trend}</span>
                  <span className="tag tag-fit">匹配 {item.editorialFitScore}</span>
                </div>
                <button className="ghost-button" onClick={() => openHotspotDetail(item.id)}>
                  查看详情
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
