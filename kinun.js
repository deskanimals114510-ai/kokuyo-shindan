// ===== 金運診断 画面制御(zensei.jsと同じ年干ベースの共通エンジンを使用) =====
let kinunLastResult = null;
const KINUN_BIRTHDATE_IDS = ['birth-year', 'birth-month', 'birth-day'];

// 金運診断専用の開運アイテム(2026-09-12追加、汎用SPINOFF_LUCKYとの差し替え)。
// 各タイプの金運アーキタイプ(大黒柱/野の花/太陽…kinun-data.jsのtitleと対応)に沿って、
// お金そのものに関わるアイテムに統一。SPINOFF_STEMSと同じ甲〜癸(index0〜9)の並び。
const KINUN_LUCKY = [
  { emoji: '👛', name: '長財布', keyword: '長財布 メンズ レディース 本革', price: '¥4,000〜10,000', hitokoto: '誰にも借りない大黒柱には、それにふさわしい構えの財布を持たせなさい。' },
  { emoji: '💳', name: '三つ折りミニ財布', keyword: '三つ折り財布 コンパクト', price: '¥2,000〜5,000', hitokoto: '風に乗って稼ぐあなたには、身軽な財布がちょうどいいわ。' },
  { emoji: '🐷', name: '貯金箱', keyword: '貯金箱 おしゃれ インテリア', price: '¥1,500〜3,000', hitokoto: '光った分だけ出ていくなら、まず受け皿を用意しておきなさい。' },
  { emoji: '🔐', name: '開運ミニ金庫', keyword: 'ミニ金庫 卓上 鍵付き', price: '¥2,000〜4,500', hitokoto: '静かに燃える灯は、そっと蓄える場所があってこそ消えないのよ。' },
  { emoji: '👝', name: '長財布(本革・重厚タイプ)', keyword: '長財布 本革 メンズ 上質', price: '¥5,000〜12,000', hitokoto: '動かぬ山には、どっしりとした財布を持たせるのが一番よ。' },
  { emoji: '📔', name: '家計簿・マネーノート', keyword: '家計簿 マネーノート 手書き', price: '¥1,000〜2,000', hitokoto: '与えて痩せるあなたには、まず数字を見える形にすることが大事なの。' },
  { emoji: '💼', name: 'キャッシュレス対応ミニ財布', keyword: 'キャッシュレス財布 ミニマル', price: '¥2,500〜5,000', hitokoto: '損切りが得意なあなたには、無駄のないミニマルな財布を。' },
  { emoji: '💍', name: '金運ブレスレット', keyword: 'ブレスレット 天然石 金運', price: '¥1,500〜4,000', hitokoto: '磨くほど値上がりする宝石には、身につける飾りがよく似合うわ。' },
  { emoji: '🌊', name: 'ロングウォレット', keyword: 'ロングウォレット 大容量', price: '¥4,000〜9,000', hitokoto: '潮の満ち引きで稼ぐあなたには、大きな流れを受け止める財布を。' },
  { emoji: '🪙', name: 'コインケース・小銭入れ', keyword: 'コインケース 小銭入れ おしゃれ', price: '¥1,000〜2,500', hitokoto: '察して稼ぐあなたには、小さな滴を大事に集める入れ物を。' },
];

spinoffPopulateBirthdateSelects('birth-year', 'birth-month', 'birth-day');

function kinunFindType(stemIdx) {
  const stemChar = SPINOFF_STEMS[stemIdx];
  return KINUN_DATA.find(t => t.stem === stemChar);
}

function kinunApplyResult(stemIdx, branchIdx) {
  const type = kinunFindType(stemIdx);
  const flavor = BRANCH_FLAVOR[SPINOFF_BRANCHES[branchIdx]];
  kinunLastResult = { stemIdx, branchIdx, type, flavor };

  const stemChar = SPINOFF_STEMS[stemIdx];
  const stemReading = SPINOFF_STEM_READING[stemIdx];
  $('result-type-label').textContent = `日主:${stemChar}(${stemReading})`;
  $('result-title').textContent = `あなたの金運は、${type.title}。`;
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

  spinoffApplyLucky(stemIdx, KINUN_LUCKY);

  spinoffShowScreen('screen-result');
  spinoffFocusHeading('result-title');

  const cardOpts = {
    eyebrow: '金運診断',
    typeLabel: `日主 ${stemChar}(${stemReading})`,
    mainTitle: type.title,
    quote: type.finalLine,
  };
  spinoffRenderCardPreview('result-card-preview', cardOpts);

  $('btn-save-card').onclick = () => {
    spinoffDownloadCard('btn-save-card', `kinun-shindan-${stemChar}.png`, cardOpts);
  };
}

function kinunStart() {
  const y = Number($('birth-year').value);
  const m = Number($('birth-month').value);
  const d = Number($('birth-day').value);
  if (!y || !m || !d) {
    spinoffShowBirthdateSelectsError(KINUN_BIRTHDATE_IDS, 'birthdate-error', '生年月日を選んでから視てもらいなさい。');
    return;
  }
  spinoffClearBirthdateSelectsError(KINUN_BIRTHDATE_IDS, 'birthdate-error');
  spinoffShowScreen('screen-loading');
  setTimeout(() => {
    try {
      const pillar = spinoffComputeYearPillar(y, m, d);
      kinunApplyResult(pillar.stemIdx, pillar.branchIdx);
    } catch (e) {
      console.error('金運診断の生成に失敗しました', e);
      spinoffShowScreen('screen-start');
      spinoffShowBirthdateSelectsError(KINUN_BIRTHDATE_IDS, 'birthdate-error', '占いの途中で何かが乱れたようね。もう一度、試してごらんなさい。');
    }
  }, 700);
}

function kinunRestart() {
  $('birth-year').value = '';
  $('birth-month').value = '';
  $('birth-day').value = '';
  spinoffRefreshDayOptions('birth-year', 'birth-month', 'birth-day');
  spinoffClearBirthdateSelectsError(KINUN_BIRTHDATE_IDS, 'birthdate-error');
  spinoffShowScreen('screen-start');
}

function kinunResultUrl() {
  if (!kinunLastResult) return location.href;
  return spinoffResultUrl('kinun.html', kinunLastResult.stemIdx, kinunLastResult.branchIdx);
}

$('btn-start').addEventListener('click', kinunStart);
$('btn-restart').addEventListener('click', kinunRestart);
$('btn-share').addEventListener('click', () => {
  if (!kinunLastResult) return;
  const text = `黒曜先生に金運を視てもらいました。\nあなたの金運は、${kinunLastResult.type.title}。\n${kinunLastResult.type.finalLine}\nあなたも視てもらいなさい→\n※エンタメ目的の診断です\n#黒曜診断 #金運診断`;
  spinoffShareX(text, spinoffShareOgUrl('kinun', kinunLastResult.type.slug));
});
$('btn-share-line').addEventListener('click', () => {
  if (!kinunLastResult) return;
  const text = `黒曜先生に金運を視てもらいました。あなたの金運は、${kinunLastResult.type.title}。\nあなたも視てもらいなさい→\n※エンタメ目的の診断です`;
  spinoffShareLine(text, spinoffShareOgUrl('kinun', kinunLastResult.type.slug));
});
$('btn-copy-url').addEventListener('click', () => {
  if (!kinunLastResult) return;
  spinoffCopyResultUrl('btn-copy-url', kinunResultUrl());
});
spinoffSetupNativeShare('btn-share-native', () => {
  if (!kinunLastResult) return { title: '', text: '', url: '' };
  return {
    title: '黒曜診断・金運診断',
    text: `黒曜先生に金運を視てもらいました。あなたの金運は、${kinunLastResult.type.title}。\nあなたも視てもらいなさい→`,
    url: kinunResultUrl(),
  };
});

// 結果URL(?r=符号)で直接開かれた場合は、その場で同じ結果を再現して表示する
(function loadFromResultCode() {
  const code = new URLSearchParams(location.search).get('r');
  if (!code) return;
  const decoded = spinoffDecodeResultCode(code);
  if (!decoded) return;
  kinunApplyResult(decoded.stemIdx, decoded.branchIdx);
})();
