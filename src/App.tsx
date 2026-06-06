import { useEffect, useMemo, useState } from 'react';
import { mockHotspots, type ScoredHotspot, type Trend } from './data/mockHotspots';
import { generateXiaohongshuPosts, type GeneratedPost } from './utils/generator';
import { getTopRecommendations, scoreHotspots } from './utils/scorer';

const trendClassMap: Record<Trend, string> = {
  快速上升: 'tag tag-red',
  上升: 'tag tag-orange',
  平稳: 'tag tag-blue',
  回落: 'tag tag-gray'
};

function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN');
}

function getRouteHotspotId(): number | null {
  const match = window.location.hash.match(/^#\/hotspots\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function App() {
  const hotspots = useMemo(() => scoreHotspots(mockHotspots), []);
  const recommendations = useMemo(() => getTopRecommendations(hotspots), [hotspots]);
  const [routeHotspotId, setRouteHotspotId] = useState<number | null>(() => getRouteHotspotId());
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const detailHotspot = hotspots.find((item) => item.id === routeHotspotId) ?? null;

  useEffect(() => {
    function syncRoute() {
      setRouteHotspotId(getRouteHotspotId());
      setGeneratedPosts([]);
    }

    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);

  function openHotspotDetail(id: number) {
    window.location.hash = `/hotspots/${id}`;
  }

  function backToHome() {
    window.location.hash = '';
    setGeneratedPosts([]);
  }

  function handleGenerate() {
    if (!detailHotspot) {
      return;
    }

    setGeneratedPosts(generateXiaohongshuPosts(detailHotspot));
  }

  if (detailHotspot) {
    return (
      <main className="page-shell detail-page">
        <button className="back-button" onClick={backToHome}>
          返回热点列表
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

  return (
    <main className="page-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">轻量级实习项目 Demo</p>
          <h1>实政评论类小红书选题助手</h1>
          <p className="subtitle">基于主流媒体热点信息，辅助主编进行选题判断和内容生成</p>
        </div>
        <div className="hero-panel">
          <span>模拟抓取</span>
          <strong>近24小时 · 20条</strong>
          <small>新华社 / 人民日报 / 中央广播电视总台 / 求是杂志社 / 光明日报</small>
        </div>
      </header>

      <section className="section">
        <div className="section-title">
          <div>
            <p className="eyebrow">按上升潜力分排序</p>
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
              <p className="reason">
                推荐理由：互动量高且趋势为“{item.trend}”，适合做政策背景解释、民生影响拆解和后续观察类内容。
              </p>
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
            <p className="eyebrow">模拟主流媒体热点池</p>
            <h2>近24小时政治热点20条</h2>
          </div>
        </div>

        <div className="hotspot-list">
          {hotspots.map((item) => (
            <article className="hotspot-row" key={item.id}>
              <div className="hotspot-main">
                <h3>{item.title}</h3>
                <div className="hotspot-meta">
                  <span>{item.source}</span>
                  <span>{item.publishedAt}</span>
                </div>
                <div className="mobile-metrics">
                  <span>热度 {formatNumber(item.hotScore)}</span>
                  <span>潜力 {formatNumber(item.potentialScore)}</span>
                </div>
              </div>
              <div className="metric">
                <span>热度分</span>
                <strong>{formatNumber(item.hotScore)}</strong>
              </div>
              <div className="metric">
                <span>上升潜力分</span>
                <strong>{formatNumber(item.potentialScore)}</strong>
              </div>
              <div className="tag-group">
                <span className="tag tag-green">{item.sentiment}</span>
                <span className={trendClassMap[item.trend]}>{item.trend}</span>
              </div>
              <button className="ghost-button" onClick={() => openHotspotDetail(item.id)}>
                查看详情
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
