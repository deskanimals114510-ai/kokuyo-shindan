// document.getElementById呼び出しをID単位でメモ化するヘルパー(DOM検索回数を削減するため導入)。
// shugorei.js/zensei.jsからも共通で使う(spinoff-common.jsが先に読み込まれるため参照可能)。
const $ = (function () {
  const cache = {};
  return function (id) {
    return cache[id] || (cache[id] = document.getElementById(id));
  };
})();

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

// 生年月日入力(年/月/日の3セレクト)。index.html(script.js)と同一ロジックを
// zensei.html/shugorei.htmlからも使えるよう共通化したもの。
function spinoffDaysInMonth(year, month) {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

function spinoffRefreshDayOptions(yearId, monthId, dayId, dayPlaceholderText) {
  const yearSel = $(yearId);
  const monthSel = $(monthId);
  const daySel = $(dayId);
  const prevValue = daySel.value;
  const max = spinoffDaysInMonth(yearSel.value, monthSel.value);
  daySel.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = dayPlaceholderText || '日';
  daySel.appendChild(placeholder);
  for (let d = 1; d <= max; d++) {
    const opt = document.createElement('option');
    opt.value = String(d);
    opt.textContent = String(d);
    daySel.appendChild(opt);
  }
  if (prevValue && Number(prevValue) <= max) daySel.value = prevValue;
}

function spinoffPopulateBirthdateSelects(yearId, monthId, dayId, dayPlaceholderText) {
  const yearSel = $(yearId);
  const monthSel = $(monthId);
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1920; y--) {
    const opt = document.createElement('option');
    opt.value = String(y);
    opt.textContent = String(y);
    yearSel.appendChild(opt);
  }
  for (let m = 1; m <= 12; m++) {
    const opt = document.createElement('option');
    opt.value = String(m);
    opt.textContent = String(m);
    monthSel.appendChild(opt);
  }
  spinoffRefreshDayOptions(yearId, monthId, dayId, dayPlaceholderText);
  yearSel.addEventListener('change', () => spinoffRefreshDayOptions(yearId, monthId, dayId, dayPlaceholderText));
  monthSel.addEventListener('change', () => spinoffRefreshDayOptions(yearId, monthId, dayId, dayPlaceholderText));
}

// 3セレクトまとめてのエラー表示/解除(前世診断・守護霊診断共通)
function spinoffShowBirthdateSelectsError(ids, errorId, message) {
  const errorEl = $(errorId);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
  ids.forEach(id => {
    const el = $(id);
    if (el) {
      el.classList.add('invalid');
      el.setAttribute('aria-invalid', 'true');
    }
  });
}

function spinoffClearBirthdateSelectsError(ids, errorId) {
  const errorEl = $(errorId);
  if (errorEl) errorEl.style.display = 'none';
  ids.forEach(id => {
    const el = $(id);
    if (el) {
      el.classList.remove('invalid');
      el.removeAttribute('aria-invalid');
    }
  });
}

// preload+media="print"で読み込んだGoogle Fontsを実際に適用する(初期描画をブロックしないための構成)。
// インラインonload属性はCSP(script-src 'self')でブロックされるため、外部JS側で切り替える。
(function spinoffApplyPreloadedFont() {
  const fontLink = $('font-link');
  if (fontLink) fontLink.media = 'all';
})();

function spinoffShowScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
}

// 結果表示後、支援技術・キーボード操作の両方に画面遷移を伝えるためフォーカスを移動する
function spinoffFocusHeading(id) {
  const heading = $(id);
  if (!heading) return;
  heading.setAttribute('tabindex', '-1');
  heading.focus();
}

// シェア手段別の効果測定(gtag未読み込み時は何もしない、計測失敗が機能を止めないよう安全に呼ぶ)
function spinoffTrackShareEvent(method) {
  if (typeof gtag === 'function') gtag('event', 'share', { method });
}

function spinoffCopyResultUrl(btnId, url) {
  const btn = $(btnId);
  navigator.clipboard.writeText(url).then(() => {
    spinoffTrackShareEvent('copy_url');
    const original = btn.textContent;
    btn.textContent = 'コピーしました ✓';
    setTimeout(() => { btn.textContent = original; }, 2000);
  });
}

function spinoffShareX(text, url) {
  const shareUrl = 'https://x.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url);
  window.open(shareUrl, '_blank', 'noopener');
  spinoffTrackShareEvent('x');
}

function spinoffShareLine(text, url) {
  const shareUrl = 'https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text);
  window.open(shareUrl, '_blank', 'noopener');
  spinoffTrackShareEvent('line');
}

// Web Share API(モバイルOSの共有シート経由)。対応環境のみ呼び出し元でボタンを表示する。
function spinoffShareNative(title, text, url) {
  if (!navigator.share) return;
  navigator.share({ title, text, url }).then(() => spinoffTrackShareEvent('native')).catch(() => {});
}

// 対応環境でのみ指定ボタンを表示し、クリックでWeb Share APIを呼ぶ
function spinoffSetupNativeShare(btnId, getShareArgs) {
  if (!navigator.share) return;
  const btn = $(btnId);
  if (!btn) return;
  btn.style.display = '';
  btn.addEventListener('click', () => {
    const { title, text, url } = getShareArgs();
    spinoffShareNative(title, text, url);
  });
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
  const preview = $(previewId);
  if (!preview) return;
  preview.innerHTML = '';
  try {
    const canvas = await spinoffBuildCardCanvas(opts);
    const img = document.createElement('img');
    img.src = canvas.toDataURL('image/png');
    img.alt = ''; // ページ内テキストと重複するプレビュー画像のため装飾扱い
    img.width = canvas.width;
    img.height = canvas.height;
    preview.appendChild(img);
  } catch (e) {
    console.error('結果カードプレビューの生成に失敗しました', e);
    preview.remove();
  }
}

async function spinoffDownloadCard(btnId, filename, opts) {
  const btn = $(btnId);
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

// ===== ラッキーアイテム(Amazonアフィリエイト) =====
// 黒曜診断本体(script.js)のDAY_MASTER_TYPES[n].luckyと同一のemoji/name/keywordを、
// 年干インデックス(0=甲…9=癸)をキーに値だけ独立して転記したもの(本体は一切改変しない・importもしない)。
// キーワードは本体側で既に目視検証済みのため、ここでの追加調査は不要。
// price: Amazon実勢の目安価格帯(新規追加)。hitokoto: 黒曜先生トーンの一言コピー、
// 年干が持つ気質アーキタイプ(大樹/草花/太陽…)に紐づけているので、前世診断・守護霊診断どちらの結果にも使い回せる。
const SPINOFF_AFFILIATE_TAG = 'tinywonders-22';

function spinoffAffiliateUrl(keyword) {
  const base = `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}`;
  return SPINOFF_AFFILIATE_TAG ? `${base}&tag=${encodeURIComponent(SPINOFF_AFFILIATE_TAG)}` : base;
}

const SPINOFF_LUCKY = [
  { emoji: '🪴', name: '観葉植物', keyword: '観葉植物 卓上 ミニ', price: '¥1,500〜3,000', hitokoto: 'まっすぐな気を保ちたいなら、こういうものを傍に置いておきなさい。' },
  { emoji: '🍵', name: 'ハーブティーセット', keyword: 'ハーブティー ギフトセット', price: '¥1,500〜3,000', hitokoto: '踏まれた心を戻すには、まず一杯のお茶からよ。' },
  { emoji: '🕶️', name: 'サングラス', keyword: 'サングラス おしゃれ', price: '¥2,000〜5,000', hitokoto: '眩しすぎるあなたには、少し陰を作る道具が要るわ。' },
  { emoji: '🕯️', name: 'アロマキャンドル', keyword: 'アロマキャンドル ギフト', price: '¥1,500〜3,000', hitokoto: '静かな灯りを、自分のためにも一つ灯しなさい。' },
  { emoji: '☕', name: '陶器のマグカップ', keyword: '陶器 マグカップ', price: '¥1,000〜2,500', hitokoto: '動じない器には、あなたを支える器を持たせなさい。' },
  { emoji: '👝', name: 'ポーチ・小物入れ', keyword: 'ポーチ おしゃれ 収納', price: '¥1,500〜3,000', hitokoto: '与えてばかりのあなたには、自分だけの持ち場を作りなさい。' },
  { emoji: '🥤', name: 'ステンレスタンブラー', keyword: 'ステンレスタンブラー おしゃれ', price: '¥1,500〜3,500', hitokoto: '研ぎ澄ました心を、少し冷ましてやりなさい。' },
  { emoji: '💍', name: 'アクセサリー', keyword: 'アクセサリー シンプル', price: '¥1,500〜4,000', hitokoto: '磨いてきた自分に、ふさわしい飾りを一つ。' },
  { emoji: '🧳', name: '旅行用ポーチ', keyword: 'トラベルポーチ 旅行 収納', price: '¥1,500〜3,000', hitokoto: '自由に漂うあなたには、身軽な旅の道具を。' },
  { emoji: '💧', name: '加湿器・アロマディフューザー', keyword: 'アロマディフューザー 卓上', price: '¥2,000〜4,000', hitokoto: '静かな気配には、静かに満ちる香りを添えなさい。' },
];

// 前世診断・守護霊診断の結果画面に、年干インデックスからラッキーアイテムカードを差し込む共通処理
// (両ページのHTMLはid="lucky-link"/"lucky-emoji"/"lucky-name"/"lucky-price"/"lucky-hitokoto"を持つ前提)
function spinoffApplyLucky(stemIdx) {
  const item = SPINOFF_LUCKY[stemIdx];
  const link = $('lucky-link');
  if (!link || !item) return;
  link.href = spinoffAffiliateUrl(item.keyword);
  link.removeAttribute('tabindex');
  const emojiEl = $('lucky-emoji');
  if (emojiEl) emojiEl.textContent = item.emoji;
  const nameEl = $('lucky-name');
  if (nameEl) nameEl.textContent = item.name + 'を見てみる';
  const priceEl = $('lucky-price');
  if (priceEl) priceEl.textContent = '目安 ' + item.price + '(変動あり)';
  const hitokotoEl = $('lucky-hitokoto');
  if (hitokotoEl) hitokotoEl.textContent = item.hitokoto;
}

// ===== アクセス解析 =====
// GA4読み込みは analytics.js に一本化(shugorei.html/zensei.htmlでspinoff-common.jsより先に読み込む)。
