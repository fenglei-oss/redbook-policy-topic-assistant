import type { Hotspot, Trend } from '../data/mockHotspots';

export type OfficialSource = Hotspot['source'];
export type TopicFocus = '综合政治' | '民生政策' | '治理改革' | '安全法治';

interface SourceConfig {
  source: OfficialSource;
  url: string;
  browserUrl: string;
  type: 'rss' | 'html';
  allowUndatedPoliticalItems?: boolean;
  allowCurrentChannelItems?: boolean;
  fallbacks?: Array<Pick<SourceConfig, 'url' | 'browserUrl' | 'type'>>;
}

export interface LiveFetchResult {
  fetchedAt: string;
  hotspots: Hotspot[];
  sourceCount: number;
}

export interface LiveFetchOptions {
  sources: OfficialSource[];
  limit: number;
  focus: TopicFocus;
}

const SOURCE_CONFIGS: SourceConfig[] = [
  {
    source: '新华社',
    url: 'https://www.news.cn/politicspro/',
    browserUrl: '/news-proxy/xinhua/politicspro/',
    type: 'html'
  },
  {
    source: '人民日报',
    url: 'http://politics.people.com.cn/',
    browserUrl: '/news-proxy/people/',
    type: 'html',
    fallbacks: [
      {
        url: 'http://www.people.com.cn/rss/politics.xml',
        browserUrl: '/news-proxy/people-rss/rss/politics.xml',
        type: 'rss'
      }
    ]
  },
  {
    source: '中央广播电视总台',
    url: 'https://news.cctv.com/china/',
    browserUrl: '/news-proxy/cctv/china/',
    type: 'html',
    allowCurrentChannelItems: true
  },
  {
    source: '求是杂志社',
    url: 'https://www.qstheory.cn/index.htm',
    browserUrl: '/news-proxy/qstheory/index.htm',
    type: 'html'
  },
  {
    source: '光明日报',
    url: 'https://news.gmw.cn/',
    browserUrl: '/news-proxy/gmw/',
    type: 'html'
  },
  {
    source: '学习强国',
    url: 'https://www.xuexi.cn/',
    browserUrl: '/news-proxy/xuexi/',
    type: 'html'
  },
  {
    source: '中国共产党员网',
    url: 'https://www.12371.cn/',
    browserUrl: '/news-proxy/12371/',
    type: 'html',
    allowUndatedPoliticalItems: true
  }
];

export const OFFICIAL_SOURCES = SOURCE_CONFIGS.map((config) => config.source);

const POLITICAL_KEYWORDS = [
  '习近平',
  '李强',
  '中共中央',
  '国务院',
  '全国人大',
  '全国政协',
  '中央',
  '政策',
  '改革',
  '治理',
  '法治',
  '民生',
  '高质量发展',
  '中国式现代化',
  '人民',
  '政务',
  '基层',
  '干部',
  '党建',
  '国家',
  '发展'
];

const FOCUS_KEYWORDS: Record<TopicFocus, string[]> = {
  综合政治: POLITICAL_KEYWORDS,
  民生政策: ['民生', '就业', '医保', '养老', '教育', '住房', '消费', '公共服务', '收入', '群众'],
  治理改革: ['改革', '治理', '政务', '基层', '营商环境', '高质量发展', '中国式现代化', '制度', '干部'],
  安全法治: ['安全', '法治', '执法', '监督', '应急', '防汛', '风险', '法律', '国家安全']
};

const CACHE_KEY = 'redbook-last-live-hotspots';

export function readCachedLiveResult(): LiveFetchResult | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as LiveFetchResult;
    if (!Array.isArray(parsed.hotspots) || parsed.hotspots.length === 0) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveCachedLiveResult(result: LiveFetchResult) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(result));
}

export async function fetchLatestHotspots(options: LiveFetchOptions): Promise<LiveFetchResult> {
  const selectedSources = options.sources.length > 0 ? options.sources : OFFICIAL_SOURCES;
  const selectedConfigs = SOURCE_CONFIGS.filter((config) => selectedSources.includes(config.source));
  const batches = await Promise.allSettled(selectedConfigs.map((config) => fetchSource(config, options.focus)));
  const successfulBatches = batches.map((result) => (result.status === 'fulfilled' ? result.value : []));
  const uniqueHotspots = selectBalanced(successfulBatches, options.limit);

  if (uniqueHotspots.length === 0) {
    throw new Error('未能从所选官方来源获取到符合条件的政治热点。');
  }

  const liveResult: LiveFetchResult = {
    fetchedAt: new Date().toISOString(),
    hotspots: uniqueHotspots,
    sourceCount: successfulBatches.filter((batch) => batch.length > 0).length
  };

  saveCachedLiveResult(liveResult);
  return liveResult;
}

async function fetchSource(config: SourceConfig, focus: TopicFocus): Promise<Hotspot[]> {
  const candidates: SourceConfig[] = [
    config,
    ...(config.fallbacks ?? []).map((fallback) => ({ ...fallback, source: config.source }))
  ];
  let lastError: unknown = null;

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate.browserUrl, {
        cache: 'no-store',
        headers: {
          Accept: candidate.type === 'rss' ? 'application/rss+xml, application/xml, text/xml' : 'text/html'
        }
      });

      if (!response.ok) {
        throw new Error(`${candidate.source} 获取失败`);
      }

      const text = await response.text();
      const items = candidate.type === 'rss' ? parseRss(text, candidate) : parseHtml(text, candidate);

      return items
        .filter((item) => isEligibleNewsItem(item, candidate, focus))
        .slice(0, 8)
        .map((item, index) => toHotspot(item, candidate, index));
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function parseRss(text: string, config: SourceConfig) {
  const document = new DOMParser().parseFromString(text, 'application/xml');
  return Array.from(document.querySelectorAll('item')).map((item) => ({
    title: normalizeTitle(item.querySelector('title')?.textContent ?? ''),
    url: cleanUrl(item.querySelector('link')?.textContent ?? '', config.url),
    publishedAt: item.querySelector('pubDate')?.textContent ?? '',
    summary: summarizeText(stripTags(item.querySelector('description')?.textContent ?? ''))
  }));
}

function parseHtml(text: string, config: SourceConfig) {
  const document = new DOMParser().parseFromString(text, 'text/html');
  return Array.from(document.querySelectorAll('a'))
    .map((link) => {
      const url = cleanUrl(link.getAttribute('href') ?? '', config.url);
      return {
        title: normalizeTitle(link.textContent ?? ''),
        url,
        publishedAt: inferPublishedDate(url),
        summary: ''
      };
    })
    .filter((item) => item.title.length >= 8 && item.url.startsWith('http'));
}

function toHotspot(
  item: { title: string; url: string; publishedAt: string; summary: string },
  config: SourceConfig,
  index: number
): Hotspot {
  const trend = inferTrend(index);
  const sourceWeight = SOURCE_CONFIGS.length - SOURCE_CONFIGS.findIndex((source) => source.source === config.source);
  const likes = Math.max(900, 5200 - index * 360 + sourceWeight * 90);
  const comments = Math.max(120, 1180 - index * 95 + sourceWeight * 32);
  const reposts = Math.max(80, 860 - index * 72 + sourceWeight * 24);
  const summary = item.summary || `${config.source}近期发布相关报道，标题聚焦“${item.title}”。`;

  return {
    id: stableId(`${config.source}-${item.url}`),
    title: item.title,
    source: config.source,
    publishedAt: formatPublishedAt(item.publishedAt),
    content: summary,
    url: item.url,
    likes,
    comments,
    reposts,
    summary,
    sentiment: inferSentiment(item.title),
    trend
  };
}

function inferTrend(index: number): Trend {
  if (index <= 1) {
    return '快速上升';
  }
  if (index <= 4) {
    return '上升';
  }
  if (index <= 6) {
    return '平稳';
  }
  return '回落';
}

function inferSentiment(title: string): string {
  if (/就业|医保|养老|教育|住房|消费|民生/.test(title)) {
    return '民生关注';
  }
  if (/改革|政策|法治|治理|政务/.test(title)) {
    return '理性讨论';
  }
  if (/安全|防汛|应急|风险/.test(title)) {
    return '安全关切';
  }
  return '稳健关注';
}

function formatPublishedAt(raw: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const date = raw ? new Date(raw) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  return safeDate
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

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/<!\[CDATA\[|\]\]>/g, '').trim();
}

function stripTags(value: string): string {
  return value.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '');
}

function normalizeTitle(value: string): string {
  const title = cleanText(stripTags(value));
  if (title.length <= 56) {
    return title;
  }

  const firstSentence = title.split(/[。！？!?]/)[0];
  if (firstSentence.length >= 8 && firstSentence.length <= 56) {
    return firstSentence;
  }

  return `${title.slice(0, 54)}...`;
}

function summarizeText(value: string): string {
  const summary = cleanText(stripTags(value));
  if (summary.length <= 140) {
    return summary;
  }

  return `${summary.slice(0, 138)}...`;
}

function cleanUrl(value: string, baseUrl: string): string {
  try {
    return new URL(value.trim(), baseUrl).toString();
  } catch {
    return '';
  }
}

function isPoliticalTitle(title: string, focus: TopicFocus): boolean {
  return FOCUS_KEYWORDS[focus].some((keyword) => title.includes(keyword));
}

function isEligibleNewsItem(item: { title: string; publishedAt: string }, config: SourceConfig, focus: TopicFocus): boolean {
  const hasPoliticalKeyword = isPoliticalTitle(item.title, focus);
  const hasCurrentDate = isCurrentNewsDate(item.publishedAt);

  if (hasPoliticalKeyword && hasCurrentDate) {
    return true;
  }

  if (config.allowCurrentChannelItems && hasCurrentDate) {
    return true;
  }

  return Boolean(config.allowUndatedPoliticalItems && hasPoliticalKeyword && !item.publishedAt);
}

function inferPublishedDate(url: string): string {
  const patterns = [
    /\/(20\d{2})(\d{2})(\d{2})\//,
    /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
    /\/(20\d{2})-(\d{2})\/(\d{2})\//,
    /\/n1\/(20\d{2})\/(\d{2})(\d{2})\//
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }

  return '';
}

function isCurrentNewsDate(raw: string): boolean {
  const date = new Date(raw);
  if (!raw || Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const published = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const dayDifference = Math.floor((today - published) / 86_400_000);

  return dayDifference >= 0 && dayDifference <= 1;
}

function dedupeByUrl(items: Hotspot[]): Hotspot[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.url || item.title;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function selectBalanced(batches: Hotspot[][], limit: number): Hotspot[] {
  const selected: Hotspot[] = [];
  const seen = new Set<string>();
  let cursor = 0;

  while (selected.length < limit && batches.some((batch) => cursor < batch.length)) {
    for (const batch of batches) {
      const item = batch[cursor];
      if (!item) {
        continue;
      }

      const key = item.url || item.title;
      if (!seen.has(key)) {
        seen.add(key);
        selected.push(item);
      }

      if (selected.length >= limit) {
        break;
      }
    }

    cursor += 1;
  }

  return dedupeByUrl(selected);
}

function stableId(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}
