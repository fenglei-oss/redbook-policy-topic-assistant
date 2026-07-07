import type { TopicFocus } from '../utils/liveFetcher';

export type AccountPosition = '政策解释型账号' | '民生观察型账号' | '青年知识型账号';
export type TargetReader = '城市青年' | '基层工作者' | '公共议题关注者';
export type ContentGoal = '讲清背景' | '解释影响' | '引发温和讨论';
export type ExpressionBoundary = '只做事实梳理' | '事实加轻评论' | '强调落地观察';
export type PublishCadence = '每日快评' | '工作日更新' | '热点触发';
export type NoteFormat = '速读卡片' | '长图拆解' | '问答解释';
export type EvidenceRequirement = '官方通稿优先' | '数据与案例并重' | '多源交叉验证';
export type ContentAngle = '政策背景解释' | '民生影响拆解' | '执行细节追踪';
export type PreferredSubject = '民生服务' | '治理改革' | '安全法治' | '发展建设';
export type RiskSensitivity = '稳健' | '标准' | '敏感';
export type TitleTone = '稳健说明' | '问题切入' | '结论前置';
export type CoverStyle = '红蓝政务' | '报纸摘要' | '时间线';
export type SourcePreference = '央媒权威' | '部委发布' | '地方实践';

export interface EditorialBrief {
  accountPosition: AccountPosition;
  targetReader: TargetReader;
  contentGoal: ContentGoal;
  expressionBoundary: ExpressionBoundary;
  publishCadence: PublishCadence;
  noteFormat: NoteFormat;
  evidenceRequirement: EvidenceRequirement;
}

export interface TopicStrategy {
  columnFocus: TopicFocus;
  contentAngle: ContentAngle;
  preferredSubject: PreferredSubject;
  riskSensitivity: RiskSensitivity;
  titleTone: TitleTone;
  coverStyle: CoverStyle;
  sourcePreference: SourcePreference;
}

export interface WorkflowState {
  currentStep: 'brief' | 'strategy' | 'fetch' | 'generate';
  brief: EditorialBrief;
  strategy: TopicStrategy;
  fetchStatus: string;
}

export const DEFAULT_EDITORIAL_BRIEF: EditorialBrief = {
  accountPosition: '政策解释型账号',
  targetReader: '公共议题关注者',
  contentGoal: '讲清背景',
  expressionBoundary: '事实加轻评论',
  publishCadence: '热点触发',
  noteFormat: '速读卡片',
  evidenceRequirement: '官方通稿优先'
};

export const DEFAULT_TOPIC_STRATEGY: TopicStrategy = {
  columnFocus: '综合政治',
  contentAngle: '政策背景解释',
  preferredSubject: '民生服务',
  riskSensitivity: '标准',
  titleTone: '稳健说明',
  coverStyle: '报纸摘要',
  sourcePreference: '央媒权威'
};

export const DEFAULT_WORKFLOW_STATE: WorkflowState = {
  currentStep: 'brief',
  brief: DEFAULT_EDITORIAL_BRIEF,
  strategy: DEFAULT_TOPIC_STRATEGY,
  fetchStatus: ''
};
