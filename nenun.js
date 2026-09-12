// ===== 2027年の運勢 画面制御(zensei.jsと同じ年干ベースの共通エンジンを使用) =====
let nenunLastResult = null;
const NENUN_BIRTHDATE_IDS = ['birth-year', 'birth-month', 'birth-day'];

spinoffPopulateBirthdateSelects('birth-year', 'birth-month', 'birth-day');

function nenunFindType(stemIdx) {
  const stemChar = SPINOFF_STEMS[stemIdx];
  return NENUN_DATA.find(t => t.stem === stemChar);
}

function nenunApplyResult(stemIdx, branchIdx) {
  const type = nenunFindType(stemIdx);
  const flavor = BRANCH_FLAVOR[SPINOFF_BRANCHES[branchIdx]];
  nenunLastResult = { stemIdx, branchIdx, type, flavor };

  const stemChar = SPINOFF_STEMS[stemIdx];
  const stemReading = SPINOFF_STEM_READING[stemIdx];
  $('result-type-label').textContent = `日主:${stemChar}(${stemReading})`;
  $('result-title').textContent = `2027年のあなたは、${type.title}。`;
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
    eyebrow: '2027年の運勢',
    typeLabel: `日主 ${stemChar}(${stemReading})`,
    mainTitle: type.title,
    quote: type.finalLine,
  };
  spinoffRenderCardPreview('result-card-preview', cardOpts);

  $('btn-save-card').onclick = () => {
    spinoffDownloadCard('btn-save-card', `nenun-shindan-${stemChar}.png`, cardOpts);
  };
}

function nenunStart() {
  const y = Number($('birth-year').value);
  const m = Number($('birth-month').value);
  const d = Number($('birth-day').value);
  if (!y || !m || !d) {
    spinoffShowBirthdateSelectsError(NENUN_BIRTHDATE_IDS, 'birthdate-error', '生年月日を選んでから視てもらいなさい。');
    return;
  }
  spinoffClearBirthdateSelectsError(NENUN_BIRTHDATE_IDS, 'birthdate-error');
  spinoffShowScreen('screen-loading');
  setTimeout(() => {
    try {
      const pillar = spinoffComputeYearPillar(y, m, d);
      nenunApplyResult(pillar.stemIdx, pillar.branchIdx);
    } catch (e) {
      console.error('2027年の運勢の生成に失敗しました', e);
      spinoffShowScreen('screen-start');
      spinoffShowBirthdateSelectsError(NENUN_BIRTHDATE_IDS, 'birthdate-error', '占いの途中で何かが乱れたようね。もう一度、試してごらんなさい。');
    }
  }, 700);
}

function nenunRestart() {
  $('birth-year').value = '';
  $('birth-month').value = '';
  $('birth-day').value = '';
  spinoffRefreshDayOptions('birth-year', 'birth-month', 'birth-day');
  spinoffClearBirthdateSelectsError(NENUN_BIRTHDATE_IDS, 'birthdate-error');
  spinoffShowScreen('screen-start');
}

function nenunResultUrl() {
  if (!nenunLastResult) return location.href;
  return spinoffResultUrl('nenun.html', nenunLastResult.stemIdx, nenunLastResult.branchIdx);
}

$('btn-start').addEventListener('click', nenunStart);
$('btn-restart').addEventListener('click', nenunRestart);
$('btn-share').addEventListener('click', () => {
  if (!nenunLastResult) return;
  const text = `黒曜先生に2027年の運勢を視てもらいました。\n2027年のあなたは、${nenunLastResult.type.title}。\n${nenunLastResult.type.finalLine}\nあなたも視てもらいなさい→\n※エンタメ目的の診断です\n#黒曜診断 #2027年の運勢`;
  spinoffShareX(text, spinoffShareOgUrl('nenun', nenunLastResult.type.slug));
});
$('btn-share-line').addEventListener('click', () => {
  if (!nenunLastResult) return;
  const text = `黒曜先生に2027年の運勢を視てもらいました。2027年のあなたは、${nenunLastResult.type.title}。\nあなたも視てもらいなさい→\n※エンタメ目的の診断です`;
  spinoffShareLine(text, spinoffShareOgUrl('nenun', nenunLastResult.type.slug));
});
$('btn-copy-url').addEventListener('click', () => {
  if (!nenunLastResult) return;
  spinoffCopyResultUrl('btn-copy-url', nenunResultUrl());
});
spinoffSetupNativeShare('btn-share-native', () => {
  if (!nenunLastResult) return { title: '', text: '', url: '' };
  return {
    title: '黒曜診断・2027年の運勢',
    text: `黒曜先生に2027年の運勢を視てもらいました。2027年のあなたは、${nenunLastResult.type.title}。\nあなたも視てもらいなさい→`,
    url: nenunResultUrl(),
  };
});

// 結果URL(?r=符号)で直接開かれた場合は、その場で同じ結果を再現して表示する
(function loadFromResultCode() {
  const code = new URLSearchParams(location.search).get('r');
  if (!code) return;
  const decoded = spinoffDecodeResultCode(code);
  if (!decoded) return;
  nenunApplyResult(decoded.stemIdx, decoded.branchIdx);
})();
