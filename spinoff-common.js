// ===== スピンオフ診断(前世診断・守護霊診断)共通エンジン =====
// 黒曜診断本体(script.js)には一切手を加えず、年柱計算に必要な最小限のロジックのみを
// このファイルに独立して持たせている(本体の計算式と同じ検証済みアルゴリズムを踏襲)。

const SPINOFF_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const SPINOFF_STEM_READING = ['きのえ', 'きのと', 'ひのえ', 'ひのと', 'つちのえ', 'つちのと', 'かのえ', 'かのと', 'みずのえ', 'みずのと'];
const SPINOFF_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const SPINOFF_BRANCH_READING = ['ね', 'うし', 'とら', 'う', 'たつ', 'み', 'うま', 'ひつじ', 'さる', 'とり', 'いぬ', 'い'];

// 立春(近似2/4)を年の境界とする(script.jsのeffectiveYearと同一ロジック)
function spinoffEffectiveYear(y, m, d) {
  if (m < 2 || (m === 2 && d < 4)) return y - 1;
  return y;
}

// 年干支: 1984年 = 甲子(index0) を基準(script.jsのyearGanzhiIndexと同一ロジック)
function spinoffYearGanzhiIndex(y, m, d) {
  const effY = spinoffEffectiveYear(y, m, d);
  return (((effY - 1984) % 60) + 60) % 60;
}

function spinoffComputeYearPillar(y, m, d) {
  const idx = spinoffYearGanzhiIndex(y, m, d);
  return { stemIdx: idx % 10, branchIdx: idx % 12 };
}

// 生年月日そのものではなく干支インデックスだけをURLに載せて結果を再現する(プライバシー配慮)
function spinoffBuildResultCode(stemIdx, branchIdx) {
  return `${stemIdx}${String(branchIdx).padStart(2, '0')}`;
}

function spinoffDecodeResultCode(code) {
  if (!/^[0-9][0-1][0-9]$/.test(code)) return null;
  const stemIdx = Number(code[0]);
  const branchIdx = Number(code.slice(1));
  if (stemIdx > 9 || branchIdx > 11) return null;
  return { stemIdx, branchIdx };
}

function spinoffResultUrl(pageFile, stemIdx, branchIdx) {
  return location.origin + location.pathname.replace(/[^/]*$/, pageFile) + '?r=' + spinoffBuildResultCode(stemIdx, branchIdx);
}

// 未来日を選べないよう、生年月日の上限を「今日」に動的設定
function spinoffSetMaxBirthdate(inputId) {
  const today = new Date();
  const iso = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  const el = document.getElementById(inputId);
  if (el) el.max = iso;
}

function spinoffShowScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function spinoffCopyResultUrl(btnId, url) {
  const btn = document.getElementById(btnId);
  navigator.clipboard.writeText(url).then(() => {
    const original = btn.textContent;
    btn.textContent = 'コピーしました ✓';
    setTimeout(() => { btn.textContent = original; }, 2000);
  });
}

function spinoffShareX(text, url) {
  const shareUrl = 'https://x.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url);
  window.open(shareUrl, '_blank', 'noopener');
}

function spinoffShareLine(text, url) {
  const shareUrl = 'https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text);
  window.open(shareUrl, '_blank', 'noopener');
}

// ===== 結果カード画像生成(Canvas、黒曜診断ダークテーマ準拠の軽量版) =====
const SPINOFF_CARD_PAL = {
  bg1: '#0d0a1a', bg2: '#1a1330', bg3: '#241a3d',
  gold: '#d4af6a', goldBright: '#f0cd82', purple: '#8a6fd6',
  text: '#ece6f5', sub: '#a99cc9',
};

function spinoffCardRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function spinoffCardDrawBackground(ctx, w, h) {
  const g = ctx.createRadialGradient(w * 0.5, h * 0.05, 0, w * 0.5, h * 0.5, w * 0.75);
  g.addColorStop(0, SPINOFF_CARD_PAL.bg3);
  g.addColorStop(0.5, SPINOFF_CARD_PAL.bg2);
  g.addColorStop(1, SPINOFF_CARD_PAL.bg1);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // 星の粒(装飾)
  const rand = mulberry32(42);
  ctx.fillStyle = 'rgba(212,175,106,0.55)';
  for (let i = 0; i < 40; i++) {
    const x = rand() * w, y = rand() * h * 0.9, r = rand() * 1.6 + 0.4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 決定的な疑似乱数(カードのたびに星の配置が変わらないように固定シード)
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function spinoffCardWrapAtSize(ctx, text, maxWidth, weight, family, size) {
  ctx.font = `${weight} ${size}px ${family}`;
  const units = text.split('');
  const lines = [];
  let cur = '';
  units.forEach((u) => {
    const trial = cur + u;
    if (!cur || ctx.measureText(trial).width <= maxWidth) {
      cur = trial;
    } else {
      lines.push(cur);
      cur = u;
    }
  });
  if (cur) lines.push(cur);
  return lines;
}

function spinoffCardFitTextMultiline(ctx, text, maxWidth, weight, family, maxSize, minSize, maxLines) {
  let size = maxSize;
  let lines = spinoffCardWrapAtSize(ctx, text, maxWidth, weight, family, size);
  while (lines.length > maxLines && size > minSize) {
    size -= 1;
    lines = spinoffCardWrapAtSize(ctx, text, maxWidth, weight, family, size);
  }
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    ctx.font = `${weight} ${size}px ${family}`;
    let last = lines[maxLines - 1];
    while (last.length > 1 && ctx.measureText(last + '…').width > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = last + '…';
  }
  return { size, lines };
}

function spinoffLoadFonts() {
  if (document.fonts && document.fonts.ready) {
    return document.fonts.ready.catch(() => {});
  }
  return Promise.resolve();
}

// 前世診断・守護霊診断で共通に使う結果カード(1200x630、X/OGP兼用)
// eyebrow: 例"前世診断" / typeLabel: 例"甲(きのえ)・大樹" / mainTitle: タイプ名や守護霊名 / quote: 引用向け一文
async function spinoffBuildCardCanvas(opts) {
  await spinoffLoadFonts();
  const W = 1200, H = 630;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  spinoffCardDrawBackground(ctx, W, H);

  const pad = 76;
  ctx.save();
  spinoffCardRoundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 22);
  ctx.strokeStyle = 'rgba(212,175,106,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = SPINOFF_CARD_PAL.gold;
  ctx.font = "700 26px 'Cinzel', 'Shippori Mincho', serif";
  ctx.fillText(opts.eyebrow, W / 2, 158);

  ctx.fillStyle = SPINOFF_CARD_PAL.sub;
  ctx.font = "600 24px 'Shippori Mincho', serif";
  ctx.fillText(opts.typeLabel, W / 2, 202);

  ctx.fillStyle = SPINOFF_CARD_PAL.goldBright;
  const titleFit = spinoffCardFitTextMultiline(ctx, opts.mainTitle, W - pad * 2 - 60, '800', "'Shippori Mincho', serif", 52, 32, 2);
  let ty = 280;
  ctx.font = `800 ${titleFit.size}px 'Shippori Mincho', serif`;
  titleFit.lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, ty + i * titleFit.size * 1.25);
  });
  let quoteY = ty + titleFit.lines.length * titleFit.size * 1.25 + 46;

  ctx.strokeStyle = 'rgba(212,175,106,0.3)';
  ctx.beginPath();
  ctx.moveTo(W / 2 - 90, quoteY - 34);
  ctx.lineTo(W / 2 + 90, quoteY - 34);
  ctx.stroke();

  ctx.fillStyle = SPINOFF_CARD_PAL.text;
  const quoteFit = spinoffCardFitTextMultiline(ctx, opts.quote, W - pad * 2 - 100, '600', "'Shippori Mincho', serif", 30, 20, 3);
  ctx.font = `600 ${quoteFit.size}px 'Shippori Mincho', serif`;
  quoteFit.lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, quoteY + i * quoteFit.size * 1.5);
  });

  ctx.fillStyle = SPINOFF_CARD_PAL.sub;
  ctx.font = "600 18px 'Cinzel', sans-serif";
  ctx.fillText('KOKUYO-SHINDAN', W / 2, H - pad - 4);

  return canvas;
}

async function spinoffRenderCardPreview(previewId, opts) {
  const preview = document.getElementById(previewId);
  if (!preview) return;
  preview.innerHTML = '';
  try {
    const canvas = await spinoffBuildCardCanvas(opts);
    const img = document.createElement('img');
    img.src = canvas.toDataURL('image/png');
    img.alt = 'result card preview';
    preview.appendChild(img);
  } catch (e) {
    console.error('結果カードプレビューの生成に失敗しました', e);
    preview.remove();
  }
}

async function spinoffDownloadCard(btnId, filename, opts) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const original = btn.textContent;
  btn.textContent = '生成中…';
  btn.disabled = true;
  try {
    const canvas = await spinoffBuildCardCanvas(opts);
    await new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const a = document.createElement('a');
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        resolve();
      }, 'image/png');
    });
  } catch (e) {
    console.error('結果カード生成に失敗しました', e);
  } finally {
    btn.textContent = original;
    btn.disabled = false;
  }
}

// ===== アクセス解析(黒曜診断本体と同一のGA4測定ID) =====
(function spinoffLoadGA() {
  const GA_MEASUREMENT_ID = 'G-NHH50DVLVN';
  if (!GA_MEASUREMENT_ID) return;
  const gaScript = document.createElement('script');
  gaScript.async = true;
  gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(gaScript);
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);
})();
