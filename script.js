// ===== 干支計算エンジン =====
// 検証済み基準日: 2007-01-01 = 乙未日(60干支インデックス31)
// 出典: 儒略日ベースの日干支計算式 (JDN+49) mod 60 の実例より逆算
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const STEM_READING = ['きのえ', 'きのと', 'ひのえ', 'ひのと', 'つちのえ', 'つちのと', 'かのえ', 'かのと', 'みずのえ', 'みずのと'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const STEM_ELEMENT = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'];
const STEM_YINYANG = ['陽', '陰', '陽', '陰', '陽', '陰', '陽', '陰', '陽', '陰'];

function dayGanzhiIndex(y, m, d) {
  const ref = Date.UTC(2007, 0, 1); // 2007-01-01 = index 31 (乙未)
  const target = Date.UTC(y, m - 1, d);
  const diff = Math.round((target - ref) / 86400000);
  return (((31 + diff) % 60) + 60) % 60;
}

// 立春(近似2/4)を年の境界とする。節気は年により前後1日程度ずれることがある(エンタメ精度)
function effectiveYear(y, m, d) {
  if (m < 2 || (m === 2 && d < 4)) return y - 1;
  return y;
}

// 年干支: 1984年 = 甲子(index0) を基準
function yearGanzhiIndex(y, m, d) {
  const effY = effectiveYear(y, m, d);
  return (((effY - 1984) % 60) + 60) % 60;
}

// 月柱: 節気の近似境界日(月,日)。寅月(立春)始まりの順で12個
const MONTH_BOUNDARIES = [
  { m: 2, d: 4, branch: '寅' },   // 立春
  { m: 3, d: 6, branch: '卯' },   // 驚蟄
  { m: 4, d: 5, branch: '辰' },   // 清明
  { m: 5, d: 6, branch: '巳' },   // 立夏
  { m: 6, d: 6, branch: '午' },   // 芒種
  { m: 7, d: 7, branch: '未' },   // 小暑
  { m: 8, d: 8, branch: '申' },   // 立秋
  { m: 9, d: 8, branch: '酉' },   // 白露
  { m: 10, d: 8, branch: '戌' },  // 寒露
  { m: 11, d: 7, branch: '亥' },  // 立冬
  { m: 12, d: 7, branch: '子' },  // 大雪
  { m: 1, d: 6, branch: '丑' },   // 小寒
];
// 五虎遁: 年干グループ(0:甲己 1:乙庚 2:丙辛 3:丁壬 4:戊癸)ごとの寅月の干インデックス
const TIGER_START_STEM = [2, 4, 6, 8, 0]; // 丙戊庚壬甲

function monthPosition(m, d) {
  const md = m * 100 + d;
  if (md >= 204 && md < 306) return 0;  // 寅
  if (md >= 306 && md < 405) return 1;  // 卯
  if (md >= 405 && md < 506) return 2;  // 辰
  if (md >= 506 && md < 606) return 3;  // 巳
  if (md >= 606 && md < 707) return 4;  // 午
  if (md >= 707 && md < 808) return 5;  // 未
  if (md >= 808 && md < 908) return 6;  // 申
  if (md >= 908 && md < 1008) return 7; // 酉
  if (md >= 1008 && md < 1107) return 8; // 戌
  if (md >= 1107 && md < 1207) return 9; // 亥
  if (md >= 1207 || md < 106) return 10; // 子
  return 11; // 丑
}

function monthGanzhi(y, m, d) {
  const yIdx = yearGanzhiIndex(y, m, d);
  const yStemIdx = yIdx % 10;
  const group = yStemIdx % 5;
  const pos = monthPosition(m, d);
  const stemIdx = (TIGER_START_STEM[group] + pos) % 10;
  const branchOrder = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];
  return { stem: STEMS[stemIdx], branch: branchOrder[pos] };
}

function computeFourPillars(y, m, d) {
  const dayIdx = dayGanzhiIndex(y, m, d);
  const yearIdx = yearGanzhiIndex(y, m, d);
  const month = monthGanzhi(y, m, d);
  return {
    day: { stem: STEMS[dayIdx % 10], branch: BRANCHES[dayIdx % 12], stemIdx: dayIdx % 10 },
    year: { stem: STEMS[yearIdx % 10], branch: BRANCHES[yearIdx % 12] },
    month,
  };
}

// ===== 日主(日干)タイプ別 結果コンテンツ =====
const DAY_MASTER_TYPES = {
  0: { // 甲
    title: '大樹', reading: 'きのえ',
    line: 'あなたは、甲(きのえ)。まっすぐ伸びる大樹よ。',
    desc: '曲がったことが大嫌いで、思ったことをはっきり言うタイプ。周りから「頼りになる」と言われる反面、意地を張りすぎて損をすることも多いはずよ。人の上に立つ星を持っているから、変に謙遜せず堂々としていなさい。ただし、たまには人に頭を下げることも覚えること。',
    advice: 'プライドを守るより、素直に「ごめんね」と言えた方が、結局は得をするわよ。',
    lucky: { emoji: '🪴', name: '観葉植物', keyword: '観葉植物 卓上 ミニ' },
  },
  1: { // 乙
    title: '草花', reading: 'きのと',
    line: 'あなたは、乙(きのと)。しなやかに生きる草花よ。',
    desc: '一見おとなしそうに見えて、実は誰よりもしぶとい人。周りに合わせるのが上手で、敵を作らない処世術を自然と身につけているタイプね。ただ、自分を後回しにしすぎる癖があるでしょう。あなたが折れてばかりいると、周りはそれに甘えるだけよ。',
    advice: 'たまには我を通しなさい。譲ることと、諦めることは違うのよ。',
    lucky: { emoji: '🍵', name: 'ハーブティーセット', keyword: 'ハーブティー ギフトセット' },
  },
  2: { // 丙
    title: '太陽', reading: 'ひのえ',
    line: 'あなたは、丙(ひのえ)。まぶしいほどの太陽よ。',
    desc: 'どこにいても目立つ、隠しきれない華のある人。裏表がなく、感情がすぐ顔に出るタイプね。周りを明るくする才能があるけど、それは同時に「熱しやすく冷めやすい」ということでもあるの。',
    advice: '一つのことを続ける根気だけは、意識して鍛えなさい。それさえあれば怖いものなしよ。',
    lucky: { emoji: '🕶️', name: 'サングラス', keyword: 'サングラス おしゃれ' },
  },
  3: { // 丁
    title: '灯火', reading: 'ひのと',
    line: 'あなたは、丁(ひのと)。静かに燃える灯火よ。',
    desc: '一人で静かに燃える情熱を持っている人。表向きは物静かでも、内側には誰にも負けない熱い想いを秘めているはずよ。感受性が豊かな分、人の言葉に傷つきやすいところもあるでしょう。',
    advice: 'でもね、その繊細さこそがあなたの武器。鈍感なふりをする必要はないの。',
    lucky: { emoji: '🕯️', name: 'アロマキャンドル', keyword: 'アロマキャンドル ギフト' },
  },
  4: { // 戊
    title: '山', reading: 'つちのえ',
    line: 'あなたは、戊(つちのえ)。どっしり構えた山よ。',
    desc: '何があっても動じない、どっしりとした安定感がある人。周りから「あの人がいると安心する」と言われるタイプでしょう。ただ、その分変化を嫌って、殻に閉じこもりがちなの。',
    advice: '新しいことに飛び込む勇気を持てば、あなたはもっと大きく育つはずよ。',
    lucky: { emoji: '☕', name: '陶器のマグカップ', keyword: '陶器 マグカップ' },
  },
  5: { // 己
    title: '田畑', reading: 'つちのと',
    line: 'あなたは、己(つちのと)。実り豊かな田畑よ。',
    desc: '面倒見が良くて、人を育てる才能がある人。気づけば周りの世話ばかりして、自分のことは後回しになっていない?あなたが黙って支えているおかげで助かっている人は、あなたが思っているよりずっと多いのよ。',
    advice: 'たまには誰かに甘えることも覚えなさい。あなただけが頑張る必要はないの。',
    lucky: { emoji: '👝', name: 'ポーチ・小物入れ', keyword: 'ポーチ おしゃれ 収納' },
  },
  6: { // 庚
    title: '刃', reading: 'かのえ',
    line: 'あなたは、庚(かのえ)。鍛え抜かれた刃よ。',
    desc: '白黒はっきりさせないと気が済まない、意志の強い人。正義感が強く、間違ったことが許せないタイプね。ただ、その真っ直ぐさが時に人を傷つけることもあるでしょう。',
    advice: '切れ味だけでなく、たまには鞘に収まることも覚えなさい。',
    lucky: { emoji: '🥤', name: 'ステンレスタンブラー', keyword: 'ステンレスタンブラー おしゃれ' },
  },
  7: { // 辛
    title: '宝石', reading: 'かのと',
    line: 'あなたは、辛(かのと)。磨き抜かれた宝石よ。',
    desc: '美意識が高く、繊細な感性を持つ人。ちょっとしたことで傷つきやすい反面、芯は誰よりも強いの。人からどう見られるかを気にしすぎるところがあるでしょう。',
    advice: 'あなたの価値は、あなたが思っているよりずっと前から周りに伝わっているわよ。',
    lucky: { emoji: '💍', name: 'アクセサリー', keyword: 'アクセサリー シンプル' },
  },
  8: { // 壬
    title: '大海', reading: 'みずのえ',
    line: 'あなたは、壬(みずのえ)。すべてを飲み込む大海よ。',
    desc: 'スケールが大きく、自由を愛する人。一つの場所、一つの考え方に縛られるのが何よりも苦手でしょう。その自由さが周りを惹きつける魅力になっている一方、気まぐれに見えて信用を失うこともあるはずよ。',
    advice: 'たまには一つのことをやり通す胆力を見せなさい。それであなたの器がもう一回り大きくなるわ。',
    lucky: { emoji: '🧳', name: '旅行用ポーチ', keyword: 'トラベルポーチ 旅行 収納' },
  },
  9: { // 癸
    title: '雨露', reading: 'みずのと',
    line: 'あなたは、癸(みずのと)。静かに大地を潤す雨露よ。',
    desc: '表には出さないけど、鋭い直感と深い知性を持つ人。多くを語らないから誤解されやすいけど、実はいちばん周りをよく見ているタイプでしょう。秘密主義なところがあるはずよ。',
    advice: 'たまには本音を言葉にしなさい。黙っていても伝わると思ったら大間違いよ。',
    lucky: { emoji: '💧', name: '加湿器・アロマディフューザー', keyword: 'アロマディフューザー 卓上' },
  },
};

function affiliateUrl(keyword) {
  const base = `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}`;
  return AFFILIATE_TAG ? `${base}&tag=${encodeURIComponent(AFFILIATE_TAG)}` : base;
}
const AFFILIATE_TAG = 'tinywonders-22';

// ===== 画面制御 =====
let lastResult = null;

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function startDivination() {
  const input = document.getElementById('birthdate');
  if (!input.value) {
    input.focus();
    return;
  }
  const [y, m, d] = input.value.split('-').map(Number);
  showScreen('screen-loading');
  setTimeout(() => renderResult(y, m, d), 1400);
}

function renderResult(y, m, d) {
  const pillars = computeFourPillars(y, m, d);
  const type = DAY_MASTER_TYPES[pillars.day.stemIdx];
  lastResult = { pillars, type };

  document.getElementById('result-line').textContent = type.line;
  document.getElementById('result-desc').textContent = type.desc;
  document.getElementById('result-advice').textContent = '【黒曜先生からひとこと】' + type.advice;
  document.getElementById('result-pillars').textContent =
    `年柱: ${pillars.year.stem}${pillars.year.branch} ・ 月柱: ${pillars.month.stem}${pillars.month.branch} ・ 日柱(日主): ${pillars.day.stem}${pillars.day.branch}`;

  const luckyLink = document.getElementById('lucky-link');
  luckyLink.href = affiliateUrl(type.lucky.keyword);
  document.getElementById('lucky-emoji').textContent = type.lucky.emoji;
  document.getElementById('lucky-name').textContent = type.lucky.name + 'を見てみる';

  showScreen('screen-result');
}

function restart() {
  document.getElementById('birthdate').value = '';
  showScreen('screen-start');
}

function shareResult() {
  if (!lastResult) return;
  const text = `黒曜先生に占われました。\n${lastResult.type.line}\n#黒曜診断 #四柱推命`;
  const url = 'https://x.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(location.href);
  window.open(url, '_blank', 'noopener');
}

function shareResultLine() {
  if (!lastResult) return;
  const text = `黒曜先生に占われました。${lastResult.type.line}`;
  const url = 'https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(location.href) + '&text=' + encodeURIComponent(text);
  window.open(url, '_blank', 'noopener');
}

document.getElementById('btn-start').addEventListener('click', startDivination);
document.getElementById('btn-restart').addEventListener('click', restart);
document.getElementById('btn-share').addEventListener('click', shareResult);
document.getElementById('btn-share-line').addEventListener('click', shareResultLine);
