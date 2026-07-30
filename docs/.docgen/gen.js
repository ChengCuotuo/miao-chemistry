// 使用手册 Markdown -> DOCX 转换脚本
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const HTMLtoDOCX = require('html-to-docx');

const DOCS_DIR = path.resolve(__dirname, '..');
const MD_FILE = path.join(DOCS_DIR, '使用手册.md');
const OUT_FILE = path.join(DOCS_DIR, '使用手册.docx');

// 读取 PNG 宽高（解析 IHDR 头）
function pngSize(buf) {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

async function main() {
  const md = fs.readFileSync(MD_FILE, 'utf-8');
  let html = marked.parse(md, { mangle: false, headerIds: false });

  // 将本地图片替换为 base64 内嵌，并按 620px 宽度等比缩放
  html = html.replace(
    /<img src="(images\/[^"]+)" alt="([^"]*)"\s*\/?>/g,
    (m, src, alt) => {
      const imgPath = path.join(DOCS_DIR, src);
      const buf = fs.readFileSync(imgPath);
      const { width, height } = pngSize(buf);
      const targetW = 620;
      const targetH = Math.round((height / width) * targetW);
      const b64 = buf.toString('base64');
      return `<p style="text-align:center"><img src="data:image/png;base64,${b64}" width="${targetW}" height="${targetH}" alt="${alt}" /></p><p style="text-align:center;color:#888;font-size:10pt">▲ ${alt}</p>`;
    },
  );

  const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${html}</body></html>`;

  const buffer = await HTMLtoDOCX(fullHtml, null, {
    title: 'Miao教学管理系统使用手册',
    creator: 'chunlei.wang',
    font: 'PingFang SC',
    fontSize: 22, // 半点单位，即 11pt
    table: { row: { cantSplit: true } },
    pageNumber: true,
    footer: true,
  });

  fs.writeFileSync(OUT_FILE, buffer);
  console.log('DONE:', OUT_FILE, fs.statSync(OUT_FILE).size, 'bytes');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
