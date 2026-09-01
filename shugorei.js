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
  $('result-type-label').textContent = `年干:${stemChar}(${stemReading})`;
  $('result-name').textContent = type.name;
  const guardianImg = $('result-guardian-img');
  guardianImg.src = `img/shugorei/${type.slug}.jpg`;
  guardianImg.alt = `守護霊「${type.name}」のイメージイラスト`;
  $('result-appearance').textContent = type.appearance;
  $('result-nature').textContent = type.nature;
  $('result-blessing').textContent = type.blessing;
  $('result-flavor').textContent = flavor;
  $('result-quote').textContent = type.quoteLine;
  $('result-advice').textContent = '【黒曜先生からひとこと】' + type.advice;

  spinoffApplyLucky(stemIdx);

  spinoffShowScreen('screen-result');
  spinoffFocusHeading('result-name');

  const cardOpts = {
    eyebrow: '守護霊診断',
    typeLabel: `年干 ${stemChar}(${stemReading})`,
    mainTitle: type.name,
    quote: type.quoteLine,
  };
  spinoffRenderCardPreview('result-card-preview', cardOpts);

  $('btn-save-card').onclick = () => {
    spinoffDownloadCard('btn-save-card', `shugorei-shindan-${stemChar}.png`, cardOpts);
  };
}

function shugoreiStart() {
  const input = $('birthdate');
  if (!input.value) {
    spinoffShowFieldError('birthdate', 'birthdate-error', '生年月日を選んでから視てもらいなさい。');
    return;
  }
  spinoffClearFieldError('birthdate', 'birthdate-error');
  const [y, m, d] = input.value.split('-').map(Number);
  spinoffShowScreen('screen-loading');
  setTimeout(() => {
    try {
      const pillar = spinoffComputeYearPillar(y, m, d);
      shugoreiApplyResult(pillar.stemIdx, pillar.branchIdx);
    } catch (e) {
      console.error('守護霊診断の生成に失敗しました', e);
      spinoffShowScreen('screen-start');
      spinoffShowFieldError('birthdate', 'birthdate-error', '占いの途中で何かが乱れたようね。もう一度、試してごらんなさい。');
    }
  }, 700);
}

function shugoreiRestart() {
  $('birthdate').value = '';
  spinoffClearFieldError('birthdate', 'birthdate-error');
  spinoffShowScreen('screen-start');
}

function shugoreiResultUrl() {
  if (!shugoreiLastResult) return location.href;
  return spinoffResultUrl('shugorei.html', shugoreiLastResult.stemIdx, shugoreiLastResult.branchIdx);
}

$('btn-start').addEventListener('click', shugoreiStart);
$('btn-restart').addEventListener('click', shugoreiRestart);
$('btn-share').addEventListener('click', () => {
  if (!shugoreiLastResult) return;
  const text = `黒曜先生に守護霊を視てもらいました。\nあなたの守護霊は「${shugoreiLastResult.type.name}」。\nあなたも視てもらいなさい→\n※エンタメ目的の診断です\n#黒曜診断 #守護霊診断`;
  spinoffShareX(text, shugoreiResultUrl());
});
$('btn-share-line').addEventListener('click', () => {
  if (!shugoreiLastResult) return;
  const text = `黒曜先生に守護霊を視てもらいました。あなたの守護霊は「${shugoreiLastResult.type.name}」。\nあなたも視てもらいなさい→\n※エンタメ目的の診断です`;
  spinoffShareLine(text, shugoreiResultUrl());
});
$('btn-copy-url').addEventListener('click', () => {
  if (!shugoreiLastResult) return;
  spinoffCopyResultUrl('btn-copy-url', shugoreiResultUrl());
});
spinoffSetupNativeShare('btn-share-native', () => {
  if (!shugoreiLastResult) return { title: '', text: '', url: '' };
  return {
    title: '黒曜診断・守護霊診断',
    text: `黒曜先生に守護霊を視てもらいました。あなたの守護霊は「${shugoreiLastResult.type.name}」。\nあなたも視てもらいなさい→`,
    url: shugoreiResultUrl(),
  };
});

// 結果URL(?r=符号)で直接開かれた場合は、その場で同じ結果を再現して表示する
(function loadFromResultCode() {
  const code = new URLSearchParams(location.search).get('r');
  if (!code) return;
  const decoded = spinoffDecodeResultCode(code);
  if (!decoded) return;
  shugoreiApplyResult(decoded.stemIdx, decoded.branchIdx);
})();
