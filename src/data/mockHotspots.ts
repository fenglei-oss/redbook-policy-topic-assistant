export type Trend = '快速上升' | '上升' | '平稳' | '回落';

export interface Hotspot {
  id: number;
  title: string;
  source: '新华社' | '人民日报' | '中央广播电视总台' | '求是杂志社' | '光明日报';
  publishedAt: string;
  content: string;
  url: string;
  likes: number;
  comments: number;
  reposts: number;
  summary: string;
  sentiment: string;
  trend: Trend;
}

export interface ScoredHotspot extends Hotspot {
  hotScore: number;
  potentialScore: number;
}

export const mockHotspots: Hotspot[] = [
  {
    id: 1,
    title: '多部门部署推进新一轮基层治理能力建设',
    source: '新华社',
    publishedAt: '2026-06-06 08:20',
    content: '多部门围绕基层治理、公共服务、矛盾调处和数字化协同作出部署，强调完善县乡村联动机制，提升基层服务群众和解决实际问题的能力。',
    url: 'https://www.news.cn/politics/example-1.html',
    likes: 4820,
    comments: 1360,
    reposts: 920,
    summary: '多部门围绕基层治理能力建设作出部署，重点涉及公共服务、矛盾调处和数字化协同。',
    sentiment: '关注执行效果',
    trend: '快速上升'
  },
  {
    id: 2,
    title: '人民日报评论：以高质量发展推进中国式现代化',
    source: '人民日报',
    publishedAt: '2026-06-06 07:50',
    content: '评论文章指出，高质量发展是全面建设社会主义现代化国家的首要任务，要把创新、协调、绿色、开放、共享的发展理念贯穿经济社会发展全过程。',
    url: 'https://www.people.com.cn/politics/example-2.html',
    likes: 3890,
    comments: 820,
    reposts: 760,
    summary: '人民日报评论文章聚焦高质量发展，强调以新发展理念推进中国式现代化。',
    sentiment: '理性讨论',
    trend: '上升'
  },
  {
    id: 3,
    title: '中央广播电视总台关注多地优化营商环境举措',
    source: '中央广播电视总台',
    publishedAt: '2026-06-06 06:40',
    content: '报道梳理多地近期推出的优化营商环境举措，包括政务服务提速、涉企事项一网通办、规范行政检查等内容。',
    url: 'https://www.cctv.com/politics/example-3.html',
    likes: 4510,
    comments: 990,
    reposts: 640,
    summary: '总台报道多地优化营商环境的新举措，涉及政务服务、企业办事和行政检查规范化。',
    sentiment: '期待落地',
    trend: '快速上升'
  },
  {
    id: 4,
    title: '求是杂志刊文阐释新时代全面深化改革方法论',
    source: '求是杂志社',
    publishedAt: '2026-06-06 05:30',
    content: '文章从系统观念、问题导向、人民立场等角度阐释全面深化改革的实践要求，强调在重点领域和关键环节持续发力。',
    url: 'https://www.qstheory.cn/politics/example-4.html',
    likes: 2660,
    comments: 580,
    reposts: 700,
    summary: '求是杂志文章阐释全面深化改革的方法论，强调系统观念、问题导向和人民立场。',
    sentiment: '专业关注',
    trend: '上升'
  },
  {
    id: 5,
    title: '光明日报聚焦高校毕业生就业服务提质',
    source: '光明日报',
    publishedAt: '2026-06-06 04:10',
    content: '报道关注高校毕业生就业服务工作，介绍多地通过岗位拓展、职业指导、困难帮扶等方式提升就业服务质效。',
    url: 'https://www.gmw.cn/politics/example-5.html',
    likes: 5120,
    comments: 1710,
    reposts: 810,
    summary: '光明日报关注高校毕业生就业服务提质，重点在岗位拓展、职业指导和困难帮扶。',
    sentiment: '高度关切',
    trend: '快速上升'
  },
  {
    id: 6,
    title: '新华社报道国家安全教育进校园活动持续开展',
    source: '新华社',
    publishedAt: '2026-06-05 23:45',
    content: '各地围绕国家安全教育开展主题活动，通过公开课、案例展示、互动体验等形式增强学生安全意识和法治意识。',
    url: 'https://www.news.cn/politics/example-6.html',
    likes: 2380,
    comments: 420,
    reposts: 360,
    summary: '各地持续开展国家安全教育进校园活动，强调增强学生安全意识和法治意识。',
    sentiment: '认可为主',
    trend: '回落'
  },
  {
    id: 7,
    title: '人民日报关注民营经济促进法配套措施',
    source: '人民日报',
    publishedAt: '2026-06-05 22:10',
    content: '报道指出，相关部门正在推动民营经济促进法配套措施落地，重点优化公平竞争环境，依法保护企业和企业家合法权益。',
    url: 'https://www.people.com.cn/politics/example-7.html',
    likes: 4320,
    comments: 1120,
    reposts: 850,
    summary: '人民日报关注民营经济促进法配套措施，核心是公平竞争和合法权益保护。',
    sentiment: '积极期待',
    trend: '快速上升'
  },
  {
    id: 8,
    title: '总台报道城市更新中老旧小区改造新进展',
    source: '中央广播电视总台',
    publishedAt: '2026-06-05 21:25',
    content: '报道展示多地老旧小区改造进展，包括加装电梯、管网更新、公共空间优化和社区服务完善。',
    url: 'https://www.cctv.com/politics/example-8.html',
    likes: 3650,
    comments: 940,
    reposts: 480,
    summary: '总台报道城市更新中的老旧小区改造进展，关注居住环境和公共服务提升。',
    sentiment: '民生关注',
    trend: '上升'
  },
  {
    id: 9,
    title: '求是杂志社解读发展新质生产力的实践路径',
    source: '求是杂志社',
    publishedAt: '2026-06-05 20:15',
    content: '文章围绕科技创新、产业升级和人才培养展开，提出因地制宜发展新质生产力，避免一哄而上和脱离实际。',
    url: 'https://www.qstheory.cn/politics/example-9.html',
    likes: 3760,
    comments: 760,
    reposts: 780,
    summary: '文章解读发展新质生产力的实践路径，强调科技创新、产业升级和因地制宜。',
    sentiment: '理性关注',
    trend: '上升'
  },
  {
    id: 10,
    title: '光明日报评论：让公共文化服务更贴近群众',
    source: '光明日报',
    publishedAt: '2026-06-05 19:30',
    content: '评论指出，公共文化服务要提升覆盖面与可及性，推动优质文化资源向基层延伸，更好满足群众精神文化需求。',
    url: 'https://www.gmw.cn/politics/example-10.html',
    likes: 2140,
    comments: 390,
    reposts: 310,
    summary: '光明日报评论公共文化服务，强调资源下沉、贴近群众和提升可及性。',
    sentiment: '温和认可',
    trend: '平稳'
  },
  {
    id: 11,
    title: '新华社关注防汛救灾责任落实和物资保障',
    source: '新华社',
    publishedAt: '2026-06-05 18:40',
    content: '报道介绍多地进入汛期后的防汛救灾准备情况，强调压实责任、加强巡查、完善物资储备和应急响应。',
    url: 'https://www.news.cn/politics/example-11.html',
    likes: 4980,
    comments: 1080,
    reposts: 1020,
    summary: '新华社关注防汛救灾准备，重点是责任落实、巡查排险、物资储备和应急响应。',
    sentiment: '安全关切',
    trend: '快速上升'
  },
  {
    id: 12,
    title: '人民日报报道农业强国建设中的科技支撑',
    source: '人民日报',
    publishedAt: '2026-06-05 17:55',
    content: '报道展示农业科技在良种、农机、智慧农业和绿色生产中的应用，强调用科技提升粮食安全保障能力。',
    url: 'https://www.people.com.cn/politics/example-12.html',
    likes: 2470,
    comments: 520,
    reposts: 430,
    summary: '人民日报报道农业强国建设中的科技支撑，涉及良种、农机、智慧农业和绿色生产。',
    sentiment: '稳定关注',
    trend: '上升'
  },
  {
    id: 13,
    title: '总台聚焦医保支付方式改革试点进展',
    source: '中央广播电视总台',
    publishedAt: '2026-06-05 16:35',
    content: '报道介绍医保支付方式改革试点情况，关注费用控制、服务质量、医院运营和患者体验之间的平衡。',
    url: 'https://www.cctv.com/politics/example-13.html',
    likes: 4280,
    comments: 1450,
    reposts: 670,
    summary: '总台报道医保支付方式改革试点，核心在费用控制、服务质量和患者体验平衡。',
    sentiment: '关切较高',
    trend: '快速上升'
  },
  {
    id: 14,
    title: '求是杂志文章谈坚持和完善人民代表大会制度',
    source: '求是杂志社',
    publishedAt: '2026-06-05 15:20',
    content: '文章围绕制度优势、全过程人民民主和依法履职展开，强调把制度优势转化为治理效能。',
    url: 'https://www.qstheory.cn/politics/example-14.html',
    likes: 1860,
    comments: 310,
    reposts: 420,
    summary: '求是文章讨论人民代表大会制度，聚焦制度优势、全过程人民民主和治理效能。',
    sentiment: '专业讨论',
    trend: '平稳'
  },
  {
    id: 15,
    title: '光明日报关注乡村公共服务均等化建设',
    source: '光明日报',
    publishedAt: '2026-06-05 14:45',
    content: '报道关注乡村教育、医疗、养老和文化服务建设，强调通过资源统筹和数字化服务缩小城乡公共服务差距。',
    url: 'https://www.gmw.cn/politics/example-15.html',
    likes: 3010,
    comments: 820,
    reposts: 520,
    summary: '光明日报关注乡村公共服务均等化，涉及教育、医疗、养老和文化服务。',
    sentiment: '民生期待',
    trend: '上升'
  },
  {
    id: 16,
    title: '新华社报道政务服务跨省通办事项扩围',
    source: '新华社',
    publishedAt: '2026-06-05 13:30',
    content: '政务服务跨省通办事项持续扩围，企业和群众可在线办理更多高频事项，减少异地办事成本。',
    url: 'https://www.news.cn/politics/example-16.html',
    likes: 3560,
    comments: 740,
    reposts: 610,
    summary: '新华社报道政务服务跨省通办扩围，重点降低企业和群众异地办事成本。',
    sentiment: '积极认可',
    trend: '上升'
  },
  {
    id: 17,
    title: '人民日报评论加强网络空间治理守护清朗环境',
    source: '人民日报',
    publishedAt: '2026-06-05 12:15',
    content: '评论指出，网络空间治理需要平台、监管部门和用户共同参与，依法治理网络乱象，保护个人信息和未成年人权益。',
    url: 'https://www.people.com.cn/politics/example-17.html',
    likes: 3320,
    comments: 1260,
    reposts: 540,
    summary: '人民日报评论网络空间治理，强调依法治理、平台责任和用户权益保护。',
    sentiment: '讨论热烈',
    trend: '快速上升'
  },
  {
    id: 18,
    title: '总台关注重大工程建设带动区域协调发展',
    source: '中央广播电视总台',
    publishedAt: '2026-06-05 11:05',
    content: '报道介绍重大工程建设进展，分析交通、水利、能源等项目对区域协调发展和民生改善的带动作用。',
    url: 'https://www.cctv.com/politics/example-18.html',
    likes: 2210,
    comments: 360,
    reposts: 390,
    summary: '总台关注重大工程建设，分析交通、水利、能源项目对区域协调发展的带动作用。',
    sentiment: '平稳关注',
    trend: '平稳'
  },
  {
    id: 19,
    title: '求是杂志社文章强调党员干部调查研究能力',
    source: '求是杂志社',
    publishedAt: '2026-06-05 10:20',
    content: '文章指出，调查研究是谋事之基、成事之道，要深入基层、掌握实情、回应群众关切，防止形式主义。',
    url: 'https://www.qstheory.cn/politics/example-19.html',
    likes: 1730,
    comments: 280,
    reposts: 350,
    summary: '文章强调党员干部调查研究能力，重点是深入基层、掌握实情和回应群众关切。',
    sentiment: '理性认可',
    trend: '平稳'
  },
  {
    id: 20,
    title: '光明日报报道法治政府建设年度重点任务',
    source: '光明日报',
    publishedAt: '2026-06-05 09:10',
    content: '报道梳理法治政府建设年度重点任务，包括规范行政执法、推进政务公开、完善行政复议和提升依法行政能力。',
    url: 'https://www.gmw.cn/politics/example-20.html',
    likes: 2920,
    comments: 680,
    reposts: 460,
    summary: '光明日报梳理法治政府建设年度重点任务，涉及行政执法、政务公开和依法行政。',
    sentiment: '稳健关注',
    trend: '上升'
  }
];
