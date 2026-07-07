import { writeFile } from 'node:fs/promises';

const SOURCES = [
  {
    source: '新华社',
    url: 'https://www.news.cn/politicspro/',
    type: 'html'
  },
  {
    source: '人民日报',
    url: 'http://politics.people.com.cn/',
    type: 'html',
    fallbacks: [
      {
        url: 'http://www.people.com.cn/rss/politics.xml',
        type: 'rss'
      }
    ]
  },
  {
    source: '中央广播电视总台',
    url: 'https://news.cctv.com/china/',
    type: 'html',
    allowCurrentChannelItems: true
  },
  {
    source: '求是杂志社',
    url: 'https://www.qstheory.cn/index.htm',
    type: 'html'
  },
  {
    source: '光明日报',
    url: 'https://news.gmw.cn/',
    type: 'html'
  },
  {
    source: '学习强国',
    url: 'https://www.xuexi.cn/',
    type: 'html'
  },
  {
    source: '中国共产党员网',
    url: 'https://www.12371.cn/',
    type: 'html',
    allowUndatedPoliticalItems: true
  }
];

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

const SOURCE_LIST = SOURCES.map((item) => item.source);

async function main() {
  const fetchedAt = new Date().toISOString();
  const batches = await Promise.allSettled(SOURCES.map(fetchSource));
  const successfulBatches = batches.map((result) => (result.status === 'fulfilled' ? result.value : []));
  const hotspots = selectBalanced(successfulBatches, 20);
  const failed = batches
    .map((result, index) => ({ result, source: SOURCES[index].source }))
    .filter(({ result }) => result.status === 'rejected')
    .map(({ result, source }) => `${source}: ${result.reason?.message ?? '未知错误'}`);

  if (hotspots.length === 0) {
    throw new Error(`没有抓取到可写入的新闻数据。失败来源：${failed.join('；') || '无'}`);
  }

  const content = [
    "import type { Hotspot } from './mockHotspots';",
    '',
    `export const lastFetchedAt = ${JSON.stringify(fetchedAt)};`,
    '',
    `export const lastFetchedSources = ${JSON.stringify(SOURCE_LIST, null, 2)};`,
    '',
    `export const lastFetchedHotspots: Hotspot[] = ${JSON.stringify(hotspots, null, 2)};`,
    ''
  ].join('\n');

  await writeFile('src/data/lastFetchedHotspots.ts', content, 'utf8');

  console.log(`已写入 src/data/lastFetchedHotspots.ts，共 ${hotspots.length} 条。`);
  if (failed.length > 0) {
    console.log(`部分来源抓取失败：${failed.join('；')}`);
  }
}

async function fetchSource(config) {
  const candidates = [config, ...(config.fallbacks ?? []).map((fallback) => ({ ...fallback, source: config.source }))];
  let lastError = null;

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate.url, {
        headers: {
          Accept: candidate.type === 'rss' ? 'application/rss+xml, application/xml, text/xml' : 'text/html',
          'User-Agent': 'Mozilla/5.0 (compatible; RedbookPolicyTopicAssistant/1.0)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await decodeResponse(response);
      const items = candidate.type === 'rss' ? parseRss(text, candidate) : parseHtml(text, candidate);

      return items
        .filter((item) => item.title.length >= 8)
        .filter((item) => isEligibleNewsItem(item, candidate))
        .slice(0, 10)
        .map((item, index) => toHotspot(item, candidate, index));
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('fetch failed');
}

async function decodeResponse(response) {
  const buffer = await response.arrayBuffer();
  const utf8 = new TextDecoder('utf-8').decode(buffer);
  if (!utf8.includes('�')) {
    return utf8;
  }

  try {
    return new TextDecoder('gb18030').decode(buffer);
  } catch {
    return utf8;
  }
}

function parseRss(text, config) {
  const itemMatches = text.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  return itemMatches.map((item) => ({
    title: normalizeTitle(cleanText(matchTag(item, 'title'))),
    url: cleanUrl(cleanText(matchTag(item, 'link')), config.url),
    publishedAt: cleanText(matchTag(item, 'pubDate')),
    summary: summarizeText(stripTags(cleanText(matchTag(item, 'description'))))
  }));
}

function parseHtml(text, config) {
  const matches = text.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);
  return Array.from(matches)
    .map((match) => {
      const url = cleanUrl(decodeHtml(match[1]), config.url);
      return {
        title: normalizeTitle(cleanText(stripTags(match[2]))),
        url,
        publishedAt: inferPublishedDate(url),
        summary: ''
      };
    })
    .filter((item) => item.url.startsWith('http'));
}

function toHotspot(item, config, index) {
  const trend = inferTrend(index);
  const sourceWeight = SOURCES.length - SOURCES.findIndex((source) => source.source === config.source);
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

function inferTrend(index) {
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

function inferSentiment(title) {
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

function formatPublishedAt(raw) {
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

function matchTag(text, tag) {
  const match = text.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? match[1] : '';
}

function stripTags(value) {
  return value.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '');
}

function cleanText(value) {
  return decodeHtml(value)
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTitle(value) {
  const title = cleanText(value);
  if (title.length <= 56) {
    return title;
  }

  const firstSentence = title.split(/[。！？!?]/)[0];
  if (firstSentence.length >= 8 && firstSentence.length <= 56) {
    return firstSentence;
  }

  return `${title.slice(0, 54)}...`;
}

function summarizeText(value) {
  const summary = cleanText(value);
  if (summary.length <= 140) {
    return summary;
  }

  return `${summary.slice(0, 138)}...`;
}

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function cleanUrl(value, baseUrl) {
  try {
    return new URL(value.trim(), baseUrl).toString();
  } catch {
    return '';
  }
}

function isPoliticalTitle(title) {
  return POLITICAL_KEYWORDS.some((keyword) => title.includes(keyword));
}

function isEligibleNewsItem(item, config) {
  const hasPoliticalKeyword = isPoliticalTitle(item.title);
  const hasCurrentDate = isCurrentNewsDate(item.publishedAt);

  if (hasPoliticalKeyword && hasCurrentDate) {
    return true;
  }

  if (config.allowCurrentChannelItems && hasCurrentDate) {
    return true;
  }

  return Boolean(config.allowUndatedPoliticalItems && hasPoliticalKeyword && !item.publishedAt);
}

function inferPublishedDate(url) {
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

function isCurrentNewsDate(raw) {
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

function dedupeByUrl(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.url || item.title;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function selectBalanced(batches, limit) {
  const selected = [];
  const seen = new Set();
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

function stableId(input) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
