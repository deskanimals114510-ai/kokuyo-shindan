// ===== 前世診断 画面制御 =====
let zenseiLastResult = null;

spinoffSetMaxBirthdate('birthdate');

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
  document.getElementById('result-type-label').textContent = `年干:${stemChar}(${stemReading})`;
  document.getElementById('result-title').textContent = `あなたの前世は、${type.title}だった。`;

  const episodesEl = document.getElementById('result-episodes');
  episodesEl.innerHTML = '';
  type.paragraphs.forEach(p => {
    const el = document.createElement('p');
    el.className = 'spinoff-episode';
    el.textContent = p;
    episodesEl.appendChild(el);
  });

  document.getElementById('result-flavor').textContent = flavor;
  document.getElementById('result-final-line').textContent = type.finalLine;

  spinoffApplyLucky(stemIdx);

  spinoffShowScreen('screen-result');

  const cardOpts = {
    eyebrow: '前世診断',
    typeLabel: `年干 ${stemChar}(${stemReading})`,
    mainTitle: type.title,
    quote: type.finalLine,
  };
  spinoffRenderCardPreview('result-card-preview', cardOpts);

  document.getElementById('btn-save-card').onclick = () => {
    spinoffDownloadCard('btn-save-card', `zensei-shindan-${stemChar}.png`, cardOpts);
  };
}

function zenseiStart() {
  const input = document.getElementById('birthdate');
  if (!input.value) {
    input.focus();
    return;
  }
  const [y, m, d] = input.value.split('-').map(Number);
  spinoffShowScreen('screen-loading');
  setTimeout(() => {
    const pillar = spinoffComputeYearPillar(y, m, d);
    zenseiApplyResult(pillar.stemIdx, pillar.branchIdx);
  }, 1400);
}

function zenseiRestart() {
  document.getElementById('birthdate').value = '';
  spinoffShowScreen('screen-start');
}

function zenseiResultUrl() {
  if (!zenseiLastResult) return location.href;
  return spinoffResultUrl('zensei.html', zenseiLastResult.stemIdx, zenseiLastResult.branchIdx);
}

document.getElementById('btn-start').addEventListener('click', zenseiStart);
document.getElementById('btn-restart').addEventListener('click', zenseiRestart);
document.getElementById('btn-share').addEventListener('click', () => {
  if (!zenseiLastResult) return;
  const text = `黒曜先生に前世を視てもらいました。\nあなたの前世は、${zenseiLastResult.type.title}だった。\n${zenseiLastResult.type.finalLine}\nあなたも視てもらいなさい→\n#黒曜診断 #前世診断`;
  spinoffShareX(text, zenseiResultUrl());
});
document.getElementById('btn-share-line').addEventListener('click', () => {
  if (!zenseiLastResult) return;
  const text = `黒曜先生に前世を視てもらいました。あなたの前世は、${zenseiLastResult.type.title}だった。\nあなたも視てもらいなさい→`;
  spinoffShareLine(text, zenseiResultUrl());
});
document.getElementById('btn-copy-url').addEventListener('click', () => {
  if (!zenseiLastResult) return;
  spinoffCopyResultUrl('btn-copy-url', zenseiResultUrl());
});

// 結果URL(?r=符号)で直接開かれた場合は、その場で同じ結果を再現して表示する
(function loadFromResultCode() {
  const code = new URLSearchParams(location.search).get('r');
  if (!code) return;
  const decoded = spinoffDecodeResultCode(code);
  if (!decoded) return;
  zenseiApplyResult(decoded.stemIdx, decoded.branchIdx);
})();
