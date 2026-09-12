// ===== 金運診断 画面制御(zensei.jsと同じ年干ベースの共通エンジンを使用) =====
let kinunLastResult = null;
const KINUN_BIRTHDATE_IDS = ['birth-year', 'birth-month', 'birth-day'];

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

  spinoffApplyLucky(stemIdx);

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
  spinoffShareX(text, kinunResultUrl());
});
$('btn-share-line').addEventListener('click', () => {
  if (!kinunLastResult) return;
  const text = `黒曜先生に金運を視てもらいました。あなたの金運は、${kinunLastResult.type.title}。\nあなたも視てもらいなさい→\n※エンタメ目的の診断です`;
  spinoffShareLine(text, kinunResultUrl());
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
