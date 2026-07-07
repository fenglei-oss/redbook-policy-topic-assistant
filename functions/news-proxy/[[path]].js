const ROUTES = {
  xinhua: {
    origin: 'https://www.news.cn',
    allowedPaths: ['/politicspro/']
  },
  people: {
    origin: 'http://politics.people.com.cn',
    allowedPaths: ['/']
  },
  'people-rss': {
    origin: 'http://www.people.com.cn',
    allowedPaths: ['/rss/politics.xml']
  },
  cctv: {
    origin: 'https://news.cctv.com',
    allowedPaths: ['/china/']
  },
  qstheory: {
    origin: 'https://www.qstheory.cn',
    allowedPaths: ['/index.htm']
  },
  gmw: {
    origin: 'https://news.gmw.cn',
    allowedPaths: ['/']
  },
  xuexi: {
    origin: 'https://www.xuexi.cn',
    allowedPaths: ['/']
  },
  '12371': {
    origin: 'https://www.12371.cn',
    allowedPaths: ['/']
  }
};

export async function onRequestGet(context) {
  const segments = Array.isArray(context.params.path) ? context.params.path : [context.params.path];
  const [sourceKey, ...pathSegments] = segments.filter(Boolean);
  const route = ROUTES[sourceKey];

  if (!route) {
    return jsonResponse({ error: '不支持的信息源' }, 404);
  }

  const trailingSlash = new URL(context.request.url).pathname.endsWith('/') ? '/' : '';
  const requestedPath = pathSegments.length > 0 ? `/${pathSegments.join('/')}${trailingSlash}` : '/';

  if (!route.allowedPaths.includes(requestedPath)) {
    return jsonResponse({ error: '不允许访问该路径' }, 403);
  }

  try {
    const upstream = await fetch(new URL(requestedPath, route.origin), {
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
      headers: {
        Accept: context.request.headers.get('Accept') || 'text/html,application/xhtml+xml,application/xml',
        'User-Agent': 'Mozilla/5.0 (compatible; RedbookPolicyTopicAssistant/1.0)'
      }
    });

    if (!upstream.ok) {
      return jsonResponse({ error: `官方来源返回 ${upstream.status}` }, 502);
    }

    const headers = new Headers();
    headers.set('Content-Type', upstream.headers.get('Content-Type') || 'text/html; charset=utf-8');
    headers.set('Cache-Control', 'no-store');
    headers.set('X-Content-Type-Options', 'nosniff');

    return new Response(upstream.body, {
      status: 200,
      headers
    });
  } catch {
    return jsonResponse({ error: '官方来源暂时无法访问' }, 504);
  }
}

function jsonResponse(body, status) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}
