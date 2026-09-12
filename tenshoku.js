// ===== 天職診断 画面制御(zensei.jsと同じ年干ベースの共通エンジンを使用) =====
let tenshokuLastResult = null;
const TENSHOKU_BIRTHDATE_IDS = ['birth-year', 'birth-month', 'birth-day'];

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

  spinoffApplyLucky(stemIdx);

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
