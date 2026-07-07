import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageName = 'redbook-offline-package-latest';
const packageDir = join(root, packageName);
const siteDir = join(packageDir, 'site');
const sourceDir = join(packageDir, 'source');
const skillsDir = join(packageDir, 'skills');
const presentationDir = join(packageDir, 'presentation');

await rm(packageDir, { recursive: true, force: true });
await mkdir(siteDir, { recursive: true });
await mkdir(sourceDir, { recursive: true });
await mkdir(skillsDir, { recursive: true });
await mkdir(presentationDir, { recursive: true });

const standaloneHtml = await buildStandaloneHtml();
await writeFile(join(packageDir, 'index.html'), standaloneHtml, 'utf8');
await writeFile(join(siteDir, 'index.html'), standaloneHtml, 'utf8');

await copyProjectSource();
await copySkill();
await copyPresentation();
await writeReadme();

console.log(packageDir);

async function buildStandaloneHtml() {
  let html = await readFile(join(root, 'dist/index.html'), 'utf8');

  html = await replaceLinkedAsset(html, /<link rel="stylesheet" crossorigin href="([^"]+\.css)">/g, async (assetPath) => {
    const css = await readFile(join(root, 'dist', stripLeadingSlash(assetPath)), 'utf8');
    return `<style>\n${css}\n</style>`;
  });

  html = await replaceLinkedAsset(html, /<script type="module" crossorigin src="([^"]+\.js)"><\/script>/g, async (assetPath) => {
    const js = await readFile(join(root, 'dist', stripLeadingSlash(assetPath)), 'utf8');
    return `<script type="module">\n${js}\n</script>`;
  });

  html = html.replace(/<script[^>]+src="[^"]*sw\.js"[^>]*><\/script>/g, '');
  html = html.replace(
    /;?"serviceWorker"in navigator&&window\.addEventListener\("load",\(\)=>\{navigator\.serviceWorker\.register\("[^"]*sw\.js"\)\.catch\(\(\)=>\{\}\)\}\);?/g,
    ''
  );
  html = html.replace('</head>', '<meta name="offline-standalone" content="true">\n</head>');

  return html;
}

async function replaceLinkedAsset(html, pattern, replacer) {
  let result = '';
  let lastIndex = 0;

  for (const match of html.matchAll(pattern)) {
    result += html.slice(lastIndex, match.index);
    result += await replacer(match[1]);
    lastIndex = match.index + match[0].length;
  }

  return result + html.slice(lastIndex);
}

function stripLeadingSlash(assetPath) {
  return assetPath
    .replace(/^\/redbook-policy-topic-assistant\//, '')
    .replace(/^\//, '');
}

async function copyProjectSource() {
  const files = [
    'index.html',
    'README.md',
    '.gitignore',
    'package-lock.json',
    'package.json',
    'tsconfig.json',
    'vite.config.ts'
  ];

  for (const file of files) {
    await cp(join(root, file), join(sourceDir, file));
  }

  for (const dir of ['src', 'public', 'functions', 'scripts']) {
    await cp(join(root, dir), join(sourceDir, dir), {
      recursive: true,
      filter: (source) => !source.includes('node_modules') && !source.includes('.DS_Store')
    });
  }
}

async function copySkill() {
  const skillSource = '/Users/lane/.claude/skills/guizang-social-card-skill';
  if (!existsSync(skillSource)) {
    return;
  }

  await cp(skillSource, join(skillsDir, 'guizang-social-card-skill'), {
    recursive: true,
    filter: (source) => !source.includes('/.git') && !source.includes('node_modules') && !source.includes('.DS_Store')
  });
}

async function copyPresentation() {
  const pptStandalone = join(root, '实习项目汇报-PPT', '实习项目汇报-离线独立版.html');
  if (existsSync(pptStandalone)) {
    await cp(pptStandalone, join(presentationDir, '实习项目汇报-离线独立版.html'));
  }
}

async function writeReadme() {
  const readme = `# 时政评论类小红书选题助手离线包

这个压缩包可拷贝给非本机用户，在无互联网环境下浏览当前 Demo。

## 直接浏览

解压后打开包根目录里的：

\`\`\`txt
index.html
\`\`\`

该入口已经把网页运行所需的 CSS 和 JavaScript 内联到单个 HTML 文件中，不依赖外网、后端、数据库、登录系统或额外资源加载。

## 目录说明

\`\`\`txt
index.html
  离线演示入口，最推荐打开这个文件

site/
  同一个离线演示入口的备份

source/
  当前项目源码，保留本地开发、真实信息获取和线上部署相关文件

skills/
  本项目用到的 guizang-social-card-skill

presentation/
  项目汇报 PPT 的离线独立版
\`\`\`

## 注意

- 离线浏览只需要根目录的 \`index.html\`。
- 离线环境下无法真实访问官方新闻源，页面会使用最近一次抓取快照或内置示例数据。
- 如需重新开发或重新构建，需要 Node.js 环境和依赖包；本离线包默认不包含 \`node_modules\`，以减少体积。
`;

  await writeFile(join(packageDir, 'README_OFFLINE.md'), readme, 'utf8');
}
