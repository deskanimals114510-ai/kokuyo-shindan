// ===== 天職診断 画面制御(zensei.jsと同じ年干ベースの共通エンジンを使用) =====
let tenshokuLastResult = null;
const TENSHOKU_BIRTHDATE_IDS = ['birth-year', 'birth-month', 'birth-day'];

// 天職診断専用の開運アイテム(2026-09-12追加、汎用SPINOFF_LUCKYとの差し替え)。
// 各タイプの働き方アーキタイプ(先頭に立つ人/調整役/場を沸かす人…tenshoku-data.jsのtitleと対応)に沿って、
// 仕事道具に統一。SPINOFF_STEMSと同じ甲〜癸(index0〜9)の並び。
const TENSHOKU_LUCKY = [
  { emoji: '🖊️', name: '高級ボールペン', keyword: 'ボールペン 高級 ビジネス ギフト', price: '¥2,000〜6,000', hitokoto: '先頭に立って道を拓くあなたには、署名にふさわしい一本を持たせなさい。' },
  { emoji: '📅', name: 'システム手帳', keyword: 'システム手帳 スケジュール管理', price: '¥2,500〜6,000', hitokoto: '隙間を編む調整役には、全体を見渡せる手帳が要るのよ。' },
  { emoji: '💳', name: '名刺入れ', keyword: '名刺入れ 本革 ビジネス', price: '¥2,000〜5,000', hitokoto: '光を浴びて場を沸かすあなたには、人と出会う道具を整えておきなさい。' },
  { emoji: '💡', name: 'デスクライト', keyword: 'デスクライト LED 目に優しい', price: '¥2,000〜5,000', hitokoto: '一点を照らす専門職には、手元を照らす灯りが似合うわ。' },
  { emoji: '💼', name: '本革ビジネスバッグ', keyword: 'ビジネスバッグ 本革 メンズ', price: '¥6,000〜15,000', hitokoto: '十年で信頼を築く山には、長く使える鞄を持たせなさい。' },
  { emoji: '📔', name: '育成ノート・目標管理手帳', keyword: '目標管理 ノート 手帳', price: '¥1,000〜2,500', hitokoto: '育てて実らせるあなたには、育ちを記録する場所が必要なの。' },
  { emoji: '⏱️', name: 'タイマー・時間管理ツール', keyword: 'タイマー 時間管理 デスク', price: '¥1,500〜3,500', hitokoto: '一刀で決める交渉人には、時を測る道具を持たせておきなさい。' },
  { emoji: '🖋️', name: '万年筆', keyword: '万年筆 高級 ギフト', price: '¥3,000〜8,000', hitokoto: '細部に宿る美の職人には、書き心地にこだわる一本を。' },
  { emoji: '💻', name: 'ノートPCバッグ', keyword: 'ノートPCバッグ ビジネス 軽量', price: '¥3,000〜7,000', hitokoto: '境界を越えて回すあなたには、どこへでも持ち出せる道具入れを。' },
  { emoji: '📓', name: '思考整理ノート', keyword: '思考整理 ノート 方眼', price: '¥800〜2,000', hitokoto: '静かに本質を読むあなたには、考えを書き留める静かな場所を。' },
];

spinoffPopulateBirthdateSelects('birth-year', 'birth-month', 'birth-day');

function tenshokuFindType(stemIdx) {
  const stemChar = SPINOFF_STEMS[stemIdx];
  return TENSHOKU_DATA.find(t => t.stem === stemChar);
}

function tenshokuApplyResult(stemIdx, branchIdx) {
  const type = tenshokuFindType(stemIdx);
  const flavor = BRANCH_FLAVOR[SPINOFF_BRANCHES[branchIdx]];
  tenshokuLastResult = { stemIdx, branchIdx, type, flavor };

  const stemChar = SPINOFF_STEMS[stemIdx];
  const stemReading = SPINOFF_STEM_READING[stemIdx];
  $('result-type-label').textContent = `日主:${stemChar}(${stemReading})`;
  $('result-title').textContent = `あなたの天職は、${type.title}。`;
  const heroImg = $('result-hero-img');
  heroImg.src = `img/nichishu/${type.slug}.jpg`;
  heroImg.alt = `日主「${stemChar}(${stemReading})」のイメージイラスト`;

  const episodesEl = $('result-episodes');
  episodesEl.innerHTML = '';
  type.paragraphs.forEach(p => {
    const el = document.createElement('p');
    el.className = 'spinoff-episode';
    el.textContent = p;
    episodesEl.appendChild(el);
  });

  $('result-flavor').textContent = flavor;
  $('result-final-line').textContent = type.finalLine;

  spinoffApplyLucky(stemIdx, TENSHOKU_LUCKY);

  spinoffShowScreen('screen-result');
  spinoffFocusHeading('result-title');

  const cardOpts = {
    eyebrow: '天職診断',
    typeLabel: `日主 ${stemChar}(${stemReading})`,
    mainTitle: type.title,
    quote: type.finalLine,
  };
  spinoffRenderCardPreview('result-card-preview', cardOpts);

  $('btn-save-card').onclick = () => {
    spinoffDownloadCard('btn-save-card', `tenshoku-shindan-${stemChar}.png`, cardOpts);
  };
}

function tenshokuStart() {
  const y = Number($('birth-year').value);
  const m = Number($('birth-month').value);
  const d = Number($('birth-day').value);
  if (!y || !m || !d) {
    spinoffShowBirthdateSelectsError(TENSHOKU_BIRTHDATE_IDS, 'birthdate-error', '生年月日を選んでから視てもらいなさい。');
    return;
  }
  spinoffClearBirthdateSelectsError(TENSHOKU_BIRTHDATE_IDS, 'birthdate-error');
  spinoffShowScreen('screen-loading');
  setTimeout(() => {
    try {
      const pillar = spinoffComputeYearPillar(y, m, d);
      tenshokuApplyResult(pillar.stemIdx, pillar.branchIdx);
    } catch (e) {
      console.error('天職診断の生成に失敗しました', e);
      spinoffShowScreen('screen-start');
      spinoffShowBirthdateSelectsError(TENSHOKU_BIRTHDATE_IDS, 'birthdate-error', '占いの途中で何かが乱れたようね。もう一度、試してごらんなさい。');
    }
  }, 700);
}

function tenshokuRestart() {
  $('birth-year').value = '';
  $('birth-month').value = '';
  $('birth-day').value = '';
  spinoffRefreshDayOptions('birth-year', 'birth-month', 'birth-day');
  spinoffClearBirthdateSelectsError(TENSHOKU_BIRTHDATE_IDS, 'birthdate-error');
  spinoffShowScreen('screen-start');
}

function tenshokuResultUrl() {
  if (!tenshokuLastResult) return location.href;
  return spinoffResultUrl('tenshoku.html', tenshokuLastResult.stemIdx, tenshokuLastResult.branchIdx);
}

$('btn-start').addEventListener('click', tenshokuStart);
$('btn-restart').addEventListener('click', tenshokuRestart);
$('btn-share').addEventListener('click', () => {
  if (!tenshokuLastResult) return;
  const text = `黒曜先生に天職を視てもらいました。\nあなたの天職は、${tenshokuLastResult.type.title}。\n${tenshokuLastResult.type.finalLine}\nあなたも視てもらいなさい→\n※エンタメ目的の診断です\n#黒曜診断 #天職診断`;
  spinoffShareX(text, tenshokuResultUrl());
});
$('btn-share-line').addEventListener('click', () => {
  if (!tenshokuLastResult) return;
  const text = `黒曜先生に天職を視てもらいました。あなたの天職は、${tenshokuLastResult.type.title}。\nあなたも視てもらいなさい→\n※エンタメ目的の診断です`;
  spinoffShareLine(text, tenshokuResultUrl());
});
$('btn-copy-url').addEventListener('click', () => {
  if (!tenshokuLastResult) return;
  spinoffCopyResultUrl('btn-copy-url', tenshokuResultUrl());
});
spinoffSetupNativeShare('btn-share-native', () => {
  if (!tenshokuLastResult) return { title: '', text: '', url: '' };
  return {
    title: '黒曜診断・天職診断',
    text: `黒曜先生に天職を視てもらいました。あなたの天職は、${tenshokuLastResult.type.title}。\nあなたも視てもらいなさい→`,
    url: tenshokuResultUrl(),
  };
});

// 結果URL(?r=符号)で直接開かれた場合は、その場で同じ結果を再現して表示する
(function loadFromResultCode() {
  const code = new URLSearchParams(location.search).get('r');
  if (!code) return;
  const decoded = spinoffDecodeResultCode(code);
  if (!decoded) return;
  tenshokuApplyResult(decoded.stemIdx, decoded.branchIdx);
})();
