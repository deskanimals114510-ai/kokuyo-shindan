// ===== 守護霊診断 画面制御 =====
let shugoreiLastResult = null;

spinoffSetMaxBirthdate('birthdate');

function shugoreiFindType(stemIdx) {
  const stemChar = SPINOFF_STEMS[stemIdx];
  return SHUGOREI_DATA.find(t => t.stem === stemChar);
}

function shugoreiApplyResult(stemIdx, branchIdx) {
  const type = shugoreiFindType(stemIdx);
  const flavor = BRANCH_FLAVOR[SPINOFF_BRANCHES[branchIdx]];
  shugoreiLastResult = { stemIdx, branchIdx, type, flavor };

  const stemChar = SPINOFF_STEMS[stemIdx];
  const stemReading = SPINOFF_STEM_READING[stemIdx];
  document.getElementById('result-type-label').textContent = `年干:${stemChar}(${stemReading})`;
  document.getElementById('result-name').textContent = type.name;
  document.getElementById('result-appearance').textContent = type.appearance;
  document.getElementById('result-nature').textContent = type.nature;
  document.getElementById('result-blessing').textContent = type.blessing;
  document.getElementById('result-flavor').textContent = flavor;
  document.getElementById('result-quote').textContent = type.quoteLine;
  document.getElementById('result-advice').textContent = '【黒曜先生からひとこと】' + type.advice;

  spinoffShowScreen('screen-result');

  const cardOpts = {
    eyebrow: '守護霊診断',
    typeLabel: `年干 ${stemChar}(${stemReading})`,
    mainTitle: type.name,
    quote: type.quoteLine,
  };
  spinoffRenderCardPreview('result-card-preview', cardOpts);

  document.getElementById('btn-save-card').onclick = () => {
    spinoffDownloadCard('btn-save-card', `shugorei-shindan-${stemChar}.png`, cardOpts);
  };
}

function shugoreiStart() {
  const input = document.getElementById('birthdate');
  if (!input.value) {
    input.focus();
    return;
  }
  const [y, m, d] = input.value.split('-').map(Number);
  spinoffShowScreen('screen-loading');
  setTimeout(() => {
    const pillar = spinoffComputeYearPillar(y, m, d);
    shugoreiApplyResult(pillar.stemIdx, pillar.branchIdx);
  }, 1400);
}

function shugoreiRestart() {
  document.getElementById('birthdate').value = '';
  spinoffShowScreen('screen-start');
}

function shugoreiResultUrl() {
  if (!shugoreiLastResult) return location.href;
  return spinoffResultUrl('shugorei.html', shugoreiLastResult.stemIdx, shugoreiLastResult.branchIdx);
}

document.getElementById('btn-start').addEventListener('click', shugoreiStart);
document.getElementById('btn-restart').addEventListener('click', shugoreiRestart);
document.getElementById('btn-share').addEventListener('click', () => {
  if (!shugoreiLastResult) return;
  const text = `黒曜先生に守護霊を視てもらいました。\nあなたの守護霊は「${shugoreiLastResult.type.name}」。\nあなたも視てもらいなさい→\n#黒曜診断 #守護霊診断`;
  spinoffShareX(text, shugoreiResultUrl());
});
document.getElementById('btn-share-line').addEventListener('click', () => {
  if (!shugoreiLastResult) return;
  const text = `黒曜先生に守護霊を視てもらいました。あなたの守護霊は「${shugoreiLastResult.type.name}」。\nあなたも視てもらいなさい→`;
  spinoffShareLine(text, shugoreiResultUrl());
});
document.getElementById('btn-copy-url').addEventListener('click', () => {
  if (!shugoreiLastResult) return;
  spinoffCopyResultUrl('btn-copy-url', shugoreiResultUrl());
});

// 結果URL(?r=符号)で直接開かれた場合は、その場で同じ結果を再現して表示する
(function loadFromResultCode() {
  const code = new URLSearchParams(location.search).get('r');
  if (!code) return;
  const decoded = spinoffDecodeResultCode(code);
  if (!decoded) return;
  shugoreiApplyResult(decoded.stemIdx, decoded.branchIdx);
})();
