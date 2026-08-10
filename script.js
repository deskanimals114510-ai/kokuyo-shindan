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

// 23時以降(遅子時)は日柱の計算上、翌日の干支を用いる(四柱推命の伝統的な取り扱い、諸説あり)
function dayGanzhiIndexForHour(y, m, d, hour) {
  if (hour !== null && hour >= 23) {
    const next = new Date(Date.UTC(y, m - 1, d));
    next.setUTCDate(next.getUTCDate() + 1);
    return dayGanzhiIndex(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
  }
  return dayGanzhiIndex(y, m, d);
}

// 五鼠遁: 日干グループ(0:甲己 1:乙庚 2:丙辛 3:丁壬 4:戊癸)ごとの子時の干インデックス
const RAT_START_STEM = [0, 2, 4, 6, 8]; // 甲丙戊庚壬

function hourGanzhi(dayStemIdx, hour) {
  const group = dayStemIdx % 5;
  // 子時=23:00-00:59を0とし、以後2時間ごとに丑,寅...と進む
  const branchPos = Math.floor((hour + 1) / 2) % 12;
  const stemIdx = (RAT_START_STEM[group] + branchPos) % 10;
  return { stem: STEMS[stemIdx], branch: BRANCHES[branchPos] };
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

function computeFourPillars(y, m, d, hour) {
  const h = (hour === undefined || hour === null || isNaN(hour)) ? null : hour;
  const dayIdx = dayGanzhiIndexForHour(y, m, d, h);
  const yearIdx = yearGanzhiIndex(y, m, d);
  const month = monthGanzhi(y, m, d);
  const result = {
    day: { stem: STEMS[dayIdx % 10], branch: BRANCHES[dayIdx % 12], stemIdx: dayIdx % 10 },
    year: { stem: STEMS[yearIdx % 10], branch: BRANCHES[yearIdx % 12] },
    month,
    hour: null,
  };
  if (h !== null) {
    result.hour = hourGanzhi(dayIdx % 10, h);
  }
  return result;
}

// ===== 日主(日干)タイプ別 結果コンテンツ =====
const DAY_MASTER_TYPES = {
  0: { // 甲
    title: '大樹', reading: 'きのえ',
    line: 'あなたは、甲(きのえ)。まっすぐ伸びる大樹よ。',
    desc: '曲がったことが大嫌いで、思ったことをはっきり言うタイプ。周りから「頼りになる」「一本芯が通っている」と言われる反面、意地を張りすぎて損をすることも多いはずよ。人の上に立つ星を持っているから、変に謙遜せず堂々としていなさい。ただし、その真っ直ぐさは時に周りを萎縮させることもある。強さと優しさは、両方持てて初めて本物なのよ。',
    work: '仕事では、自分で決めて自分で動く裁量のある立場が向いているわ。指示待ちの環境だと、あなたの良さは半分も発揮されない。リーダーやマネジメント、独立といった方向で力を伸ばしなさい。ただし、部下や後輩の意見を聞かずに突っ走ると、気づけば周りが誰もついてきていない、なんてことになりかねないから注意しなさい。',
    love: '恋愛では、自分から動くタイプ。好きになったら一直線で、駆け引きが苦手なところがあるでしょう。それは美点でもあるけれど、相手のペースを考えずに押しすぎる癖もあるはずよ。たまには相手に委ねてみることも覚えなさい。',
    advice: 'プライドを守るより、素直に「ごめんね」と言えた方が、結局は得をするわよ。',
    lucky: { emoji: '🪴', name: '観葉植物', keyword: '観葉植物 卓上 ミニ' },
  },
  1: { // 乙
    title: '草花', reading: 'きのと',
    line: 'あなたは、乙(きのと)。しなやかに生きる草花よ。',
    desc: '一見おとなしそうに見えて、実は誰よりもしぶとい人。周りに合わせるのが上手で、敵を作らない処世術を自然と身につけているタイプね。ただ、自分を後回しにしすぎる癖があるでしょう。あなたが折れてばかりいると、周りはそれに甘えるだけよ。柔らかさは武器だけど、使い方を間違えると、ただ都合よく扱われるだけになるから気をつけなさい。',
    work: '仕事では、一人で完結させるより、チームの中で調整役や潤滑油になる方が力を発揮するタイプ。空気を読む力、周りを立てる気配りは、あなたにしかない才能よ。ただ、意見を求められた時にまで遠慮していると、あなたの価値は正しく評価されない。ここぞという時は、はっきり言葉にしなさい。',
    love: '恋愛では、相手に合わせすぎて自分を見失いやすいタイプ。相手の顔色をうかがう癖が強く出ると、疲れるだけの関係になってしまうから気をつけなさい。あなたが素の自分を出しても離れない人こそ、本物の相手よ。',
    advice: 'たまには我を通しなさい。譲ることと、諦めることは違うのよ。',
    lucky: { emoji: '🍵', name: 'ハーブティーセット', keyword: 'ハーブティー ギフトセット' },
  },
  2: { // 丙
    title: '太陽', reading: 'ひのえ',
    line: 'あなたは、丙(ひのえ)。まぶしいほどの太陽よ。',
    desc: 'どこにいても目立つ、隠しきれない華のある人。裏表がなく、感情がすぐ顔に出るタイプね。周りを明るくする才能があるけど、それは同時に「熱しやすく冷めやすい」ということでもあるの。注目されることに慣れているぶん、一人の時間や地味な作業が続くと途端に元気をなくすでしょう。',
    work: '仕事では、人前に立つ・発信する・盛り上げる、といった役割で本領を発揮するタイプ。営業、企画、人前に出る仕事と相性がいいわ。ただし、地道なコツコツ作業や、日の当たらない裏方仕事になると、途端に集中力が続かなくなる。そこは意識して鍛えなさい。',
    love: '恋愛では、一目惚れ型。好きになるのも早いけど、冷めるのも早い。相手からすると「本当に自分のことが好きなの?」と不安にさせてしまうこともあるはずよ。関係が落ち着いてきた時こそ、熱を絶やさない努力が必要ね。',
    advice: '一つのことを続ける根気だけは、意識して鍛えなさい。それさえあれば怖いものなしよ。',
    lucky: { emoji: '🕶️', name: 'サングラス', keyword: 'サングラス おしゃれ' },
  },
  3: { // 丁
    title: '灯火', reading: 'ひのと',
    line: 'あなたは、丁(ひのと)。静かに燃える灯火よ。',
    desc: '一人で静かに燃える情熱を持っている人。表向きは物静かでも、内側には誰にも負けない熱い想いを秘めているはずよ。感受性が豊かな分、人の言葉に傷つきやすいところもあるでしょう。周りからは「何を考えているかわからない」と言われることもあるはずだけど、実際は誰よりも深く物事を感じ取っているのよ。',
    work: '仕事では、一人でじっくり向き合う専門性の高い仕事、あるいは少人数での丁寧な仕事が向いているわ。大勢の前でパッと目立つより、じわじわと信頼を積み上げるタイプ。無理に周りに合わせて明るく振る舞おうとすると、消耗するだけだから、自分のペースを大事にしなさい。',
    love: '恋愛では、なかなか本心を見せない分、じっくり時間をかけて信頼できる相手を選ぶタイプ。一度心を開いた相手には、驚くほど深く尽くすでしょう。ただ、我慢しすぎて気持ちを溜め込む癖があるから、たまには吐き出しなさい。',
    advice: 'でもね、その繊細さこそがあなたの武器。鈍感なふりをする必要はないの。',
    lucky: { emoji: '🕯️', name: 'アロマキャンドル', keyword: 'アロマキャンドル ギフト' },
  },
  4: { // 戊
    title: '山', reading: 'つちのえ',
    line: 'あなたは、戊(つちのえ)。どっしり構えた山よ。',
    desc: '何があっても動じない、どっしりとした安定感がある人。周りから「あの人がいると安心する」と言われるタイプでしょう。ただ、その分変化を嫌って、殻に閉じこもりがちなの。動じない強さは長所だけど、それが「頑固」に変わる瞬間もあるから、自分では気づきにくい部分ね。',
    work: '仕事では、長期的にコツコツ積み上げる仕事、責任のある管理職的なポジションに向いているわ。急な方針転換や、スピード重視の環境ではストレスを感じやすいはず。安定を築くのが得意な分、リスクを取る決断は苦手でしょう。たまには石橋を叩く前に渡ってみなさい。',
    love: '恋愛では、じっくり時間をかけて信頼を築くタイプ。浮ついた関係より、腰を据えた安定した関係を望むでしょう。ただ、自分から気持ちを言葉にするのが苦手で、相手に「何を考えているかわからない」と思われがちよ。',
    advice: '新しいことに飛び込む勇気を持てば、あなたはもっと大きく育つはずよ。',
    lucky: { emoji: '☕', name: '陶器のマグカップ', keyword: '陶器 マグカップ' },
  },
  5: { // 己
    title: '田畑', reading: 'つちのと',
    line: 'あなたは、己(つちのと)。実り豊かな田畑よ。',
    desc: '面倒見が良くて、人を育てる才能がある人。気づけば周りの世話ばかりして、自分のことは後回しになっていない?あなたが黙って支えているおかげで助かっている人は、あなたが思っているよりずっと多いのよ。ただ、尽くしすぎるあまり、自分の限界に気づかないところがあるから要注意ね。',
    work: '仕事では、人を育てる、支える、まとめる役割で真価を発揮するタイプ。教育、サポート、バックオフィス的な仕事とも相性がいいわ。ただ、自分の手柄を主張するのが苦手で、正当な評価を逃しがち。もっと堂々と成果をアピールしなさい。',
    love: '恋愛では、相手に尽くすタイプ。相手の世話を焼くことに幸せを感じる一方、尽くしすぎて対等な関係を築けなくなることもあるはずよ。愛されるためではなく、対等でいるために、自分の希望も伝えなさい。',
    advice: 'たまには誰かに甘えることも覚えなさい。あなただけが頑張る必要はないの。',
    lucky: { emoji: '👝', name: 'ポーチ・小物入れ', keyword: 'ポーチ おしゃれ 収納' },
  },
  6: { // 庚
    title: '刃', reading: 'かのえ',
    line: 'あなたは、庚(かのえ)。鍛え抜かれた刃よ。',
    desc: '白黒はっきりさせないと気が済まない、意志の強い人。正義感が強く、間違ったことが許せないタイプね。ただ、その真っ直ぐさが時に人を傷つけることもあるでしょう。あなたにとっての「正しさ」が、必ずしも周りにとっての正しさとは限らないの。そこを忘れないでほしいわ。',
    work: '仕事では、決断力・実行力が求められる場面で力を発揮するタイプ。曖昧な指示や、なあなあで進む環境にはストレスを感じやすいはず。交渉ごとや、白黒つけるべき局面での判断力はあなたの武器よ。ただ、正論を振りかざしすぎると、周りから煙たがられることもあるから、言い方には気をつけなさい。',
    love: '恋愛では、駆け引きが苦手で、思ったことをそのまま口にするタイプ。それが誠実さとして伝わることもあれば、きつく受け取られることもあるでしょう。時には切れ味を抑えて、優しい言葉を選ぶ練習も必要ね。',
    advice: '切れ味だけでなく、たまには鞘に収まることも覚えなさい。',
    lucky: { emoji: '🥤', name: 'ステンレスタンブラー', keyword: 'ステンレスタンブラー おしゃれ' },
  },
  7: { // 辛
    title: '宝石', reading: 'かのと',
    line: 'あなたは、辛(かのと)。磨き抜かれた宝石よ。',
    desc: '美意識が高く、繊細な感性を持つ人。ちょっとしたことで傷つきやすい反面、芯は誰よりも強いの。人からどう見られるかを気にしすぎるところがあるでしょう。完璧に磨かれた宝石ほど、小さな傷も目立ってしまう。そのぶん自分にも他人にも厳しくなりがちだから、たまには力を抜きなさい。',
    work: '仕事では、細部までこだわる丁寧な仕事、美的センスを活かせる分野で輝くタイプ。ただ、自分にも周りにも高い基準を求めすぎて、疲れてしまうことがあるはずよ。完璧じゃなくても価値がある、ということを覚えておきなさい。',
    love: '恋愛では、理想が高く、相手にも自分にも妥協しないタイプ。プライドが邪魔をして素直になれない瞬間もあるでしょう。でも、あなたの弱さを見せられる相手こそ、本当に大切にすべき人よ。',
    advice: 'あなたの価値は、あなたが思っているよりずっと前から周りに伝わっているわよ。',
    lucky: { emoji: '💍', name: 'アクセサリー', keyword: 'アクセサリー シンプル' },
  },
  8: { // 壬
    title: '大海', reading: 'みずのえ',
    line: 'あなたは、壬(みずのえ)。すべてを飲み込む大海よ。',
    desc: 'スケールが大きく、自由を愛する人。一つの場所、一つの考え方に縛られるのが何よりも苦手でしょう。その自由さが周りを惹きつける魅力になっている一方、気まぐれに見えて信用を失うこともあるはずよ。器は大きいけれど、その分、腰を据えて何かをやり通す経験が、あなたをもう一段階成長させるはずね。',
    work: '仕事では、決まったルーティンより、変化のある環境、複数のことを同時に動かす仕事が向いているタイプ。発想力・行動力はあなたの武器だけど、飽きっぽさが弱点になることも。始めたことを最後まで見届ける癖をつけなさい。',
    love: '恋愛では、束縛を嫌い、自由な関係を好むタイプ。相手からすると「本気度が見えない」と不安にさせてしまうこともあるはずよ。自由でいたいなら、その分言葉で安心感を与える努力もしなさい。',
    advice: 'たまには一つのことをやり通す胆力を見せなさい。それであなたの器がもう一回り大きくなるわ。',
    lucky: { emoji: '🧳', name: '旅行用ポーチ', keyword: 'トラベルポーチ 旅行 収納' },
  },
  9: { // 癸
    title: '雨露', reading: 'みずのと',
    line: 'あなたは、癸(みずのと)。静かに大地を潤す雨露よ。',
    desc: '表には出さないけど、鋭い直感と深い知性を持つ人。多くを語らないから誤解されやすいけど、実はいちばん周りをよく見ているタイプでしょう。秘密主義なところがあるはずよ。静かな水のように見えて、内側では誰よりも深く物事を考えている。それを言葉にする勇気さえ持てば、周りの見る目は一気に変わるはずよ。',
    work: '仕事では、リサーチ、分析、裏方での企画立案など、じっくり考える仕事で真価を発揮するタイプ。人前でアピールするのは苦手でも、あなたの提案の質の高さは誰よりも際立っているはずよ。もっと自分の意見を表に出す練習をしなさい。',
    love: '恋愛では、なかなか本音を見せず、相手に察してもらうことを期待しがちなタイプ。それでは伝わらないこともあると心得なさい。自分から言葉にする勇気を持ちなさい。',
    advice: 'たまには本音を言葉にしなさい。黙っていても伝わると思ったら大間違いよ。',
    lucky: { emoji: '💧', name: '加湿器・アロマディフューザー', keyword: 'アロマディフューザー 卓上' },
  },
};

// 干ごとの短い気質フレーズ(年柱・月柱・時柱の解釈に流用)
const STEM_FLAVOR = [
  'まっすぐで独立心の強い',       // 甲
  '柔軟でしなやかな',             // 乙
  '華やかで情熱的な',             // 丙
  '物静かだが内に熱を秘めた',     // 丁
  'どっしりと安定した',           // 戊
  '面倒見のいい世話好きな',       // 己
  '白黒はっきりさせたい芯の強い', // 庚
  '美意識の高い繊細な',           // 辛
  '自由でスケールの大きい',       // 壬
  '直感力に優れた物静かな',       // 癸
];

function buildBackgroundText(pillars) {
  const yStemIdx = STEMS.indexOf(pillars.year.stem);
  const mStemIdx = STEMS.indexOf(pillars.month.stem);
  const parts = [];
  parts.push(`年柱には${STEM_FLAVOR[yStemIdx]}気を持つ${pillars.year.stem}${pillars.year.branch}が入っているから、育った環境や家族との関わりの中で、その色が自然と身についているはずよ。`);
  parts.push(`月柱は${STEM_FLAVOR[mStemIdx]}${pillars.month.stem}${pillars.month.branch}。社会に出て働く時のあなたには、この気質が強く出るでしょうね。`);
  if (pillars.hour) {
    const hStemIdx = STEMS.indexOf(pillars.hour.stem);
    parts.push(`時柱は${STEM_FLAVOR[hStemIdx]}${pillars.hour.stem}${pillars.hour.branch}。人に見せない内面や、歳を重ねてから強まる部分に、この気が表れてくるはずよ。`);
  } else {
    parts.push('時柱(生まれた時刻)まで入れると、内面や晩年の傾向までもっと詳しく見えてくるわ。気になるなら、時刻も入れてもう一度占ってごらんなさい。');
  }
  return parts.join('');
}

function affiliateUrl(keyword) {
  const base = `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}`;
  return AFFILIATE_TAG ? `${base}&tag=${encodeURIComponent(AFFILIATE_TAG)}` : base;
}
const AFFILIATE_TAG = 'tinywonders-22';

// ===== 画面制御 =====
let lastResult = null;

// 未来日を選べないよう、生年月日の上限を「今日」に動的設定(ハードコードすると年をまたいで壊れるため)
(function setMaxBirthdate() {
  const today = new Date();
  const iso = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  document.getElementById('birthdate').max = iso;
})();

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
  const timeInput = document.getElementById('birthtime');
  let hour = null;
  if (timeInput.value) {
    hour = Number(timeInput.value.split(':')[0]);
  }
  showScreen('screen-loading');
  setTimeout(() => renderResult(y, m, d, hour), 1400);
}

function renderResult(y, m, d, hour) {
  const pillars = computeFourPillars(y, m, d, hour);
  const type = DAY_MASTER_TYPES[pillars.day.stemIdx];
  lastResult = { pillars, type };

  document.getElementById('result-line').textContent = type.line;
  document.getElementById('result-desc').textContent = type.desc;
  document.getElementById('result-work').textContent = type.work;
  document.getElementById('result-love').textContent = type.love;
  document.getElementById('result-background').textContent = buildBackgroundText(pillars);
  document.getElementById('result-advice').textContent = '【黒曜先生からひとこと】' + type.advice;
  let pillarsText = `年柱: ${pillars.year.stem}${pillars.year.branch} ・ 月柱: ${pillars.month.stem}${pillars.month.branch} ・ 日柱(日主): ${pillars.day.stem}${pillars.day.branch}`;
  pillarsText += pillars.hour
    ? ` ・ 時柱: ${pillars.hour.stem}${pillars.hour.branch}`
    : ` ・ 時柱: 不明(未入力のため省略)`;
  document.getElementById('result-pillars').textContent = pillarsText;

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

// ===== アクセス解析(任意) =====
// GA4の測定IDが決まったらここに設定してください(空文字の間は何も読み込みません、追加コストなし)
const GA_MEASUREMENT_ID = '';
if (GA_MEASUREMENT_ID) {
  const gaScript = document.createElement('script');
  gaScript.async = true;
  gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(gaScript);
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);
}
