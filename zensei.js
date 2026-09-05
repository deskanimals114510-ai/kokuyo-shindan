// ===== 前世診断 画面制御 =====
let zenseiLastResult = null;
const ZENSEI_BIRTHDATE_IDS = ['birth-year', 'birth-month', 'birth-day'];

spinoffPopulateBirthdateSelects('birth-year', 'birth-month', 'birth-day');

function zenseiFindType(stemIdx) {
  const stemChar = SPINOFF_STEMS[stemIdx];
  return ZENSEI_DATA.find(t => t.stem === stemChar);
}

function zenseiApplyResult(stemIdx, branchIdx) {
  const type = zenseiFindType(stemIdx);
  const flavor = BRANCH_FLAVOR[SPINOFF_BRANCHES[branchIdx]];
  zenseiLastResult = { stemIdx, branchIdx, type, flavor };

  const stemChar = SPINOFF_STEMS[stemIdx];
  const stemReading = SPINOFF_STEM_READING[stemIdx];
  $('result-type-label').textContent = `年干:${stemChar}(${stemReading})`;
  $('result-title').textContent = `あなたの前世は、${type.title}だった。`;
  const zenseiImg = $('result-zensei-img');
  zenseiImg.src = `img/zensei/${type.slug}.jpg`;
  zenseiImg.alt = `前世「${type.title}」のイメージイラスト`;

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
    eyebrow: '前世診断',
    typeLabel: `年干 ${stemChar}(${stemReading})`,
    mainTitle: type.title,
    quote: type.finalLine,
  };
  spinoffRenderCardPreview('result-card-preview', cardOpts);

  $('btn-save-card').onclick = () => {
    spinoffDownloadCard('btn-save-card', `zensei-shindan-${stemChar}.png`, cardOpts);
  };
}

function zenseiStart() {
  const y = Number($('birth-year').value);
  const m = Number($('birth-month').value);
  const d = Number($('birth-day').value);
  if (!y || !m || !d) {
    spinoffShowBirthdateSelectsError(ZENSEI_BIRTHDATE_IDS, 'birthdate-error', '生年月日を選んでから視てもらいなさい。');
    return;
  }
  spinoffClearBirthdateSelectsError(ZENSEI_BIRTHDATE_IDS, 'birthdate-error');
  spinoffShowScreen('screen-loading');
  setTimeout(() => {
    try {
      const pillar = spinoffComputeYearPillar(y, m, d);
      zenseiApplyResult(pillar.stemIdx, pillar.branchIdx);
    } catch (e) {
      console.error('前世診断の生成に失敗しました', e);
      spinoffShowScreen('screen-start');
      spinoffShowBirthdateSelectsError(ZENSEI_BIRTHDATE_IDS, 'birthdate-error', '占いの途中で何かが乱れたようね。もう一度、試してごらんなさい。');
    }
  }, 700);
}

function zenseiRestart() {
  $('birth-year').value = '';
  $('birth-month').value = '';
  $('birth-day').value = '';
  spinoffRefreshDayOptions('birth-year', 'birth-month', 'birth-day');
  spinoffClearBirthdateSelectsError(ZENSEI_BIRTHDATE_IDS, 'birthdate-error');
  spinoffShowScreen('screen-start');
}

function zenseiResultUrl() {
  if (!zenseiLastResult) return location.href;
  return spinoffResultUrl('zensei.html', zenseiLastResult.stemIdx, zenseiLastResult.branchIdx);
}

$('btn-start').addEventListener('click', zenseiStart);
$('btn-restart').addEventListener('click', zenseiRestart);
$('btn-share').addEventListener('click', () => {
  if (!zenseiLastResult) return;
  const text = `黒曜先生に前世を視てもらいました。\nあなたの前世は、${zenseiLastResult.type.title}だった。\n${zenseiLastResult.type.finalLine}\nあなたも視てもらいなさい→\n※エンタメ目的の診断です\n#黒曜診断 #前世診断`;
  spinoffShareX(text, zenseiResultUrl());
});
$('btn-share-line').addEventListener('click', () => {
  if (!zenseiLastResult) return;
  const text = `黒曜先生に前世を視てもらいました。あなたの前世は、${zenseiLastResult.type.title}だった。\nあなたも視てもらいなさい→\n※エンタメ目的の診断です`;
  spinoffShareLine(text, zenseiResultUrl());
});
$('btn-copy-url').addEventListener('click', () => {
  if (!zenseiLastResult) return;
  spinoffCopyResultUrl('btn-copy-url', zenseiResultUrl());
});
spinoffSetupNativeShare('btn-share-native', () => {
  if (!zenseiLastResult) return { title: '', text: '', url: '' };
  return {
    title: '黒曜診断・前世診断',
    text: `黒曜先生に前世を視てもらいました。あなたの前世は、${zenseiLastResult.type.title}だった。\nあなたも視てもらいなさい→`,
    url: zenseiResultUrl(),
  };
});

// 結果URL(?r=符号)で直接開かれた場合は、その場で同じ結果を再現して表示する
(function loadFromResultCode() {
  const code = new URLSearchParams(location.search).get('r');
  if (!code) return;
  const decoded = spinoffDecodeResultCode(code);
  if (!decoded) return;
  zenseiApplyResult(decoded.stemIdx, decoded.branchIdx);
})();
