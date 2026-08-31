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
    line: 'あなたは、甲(きのえ)。天へ一直線に幹を伸ばす大樹よ。',
    desc: '曲がったことが大嫌いで、一度「こうだ」と決めたら簡単には折れない。その揺るがなさが、周りに安心と方向を与えているのよ。大樹の下に人が集まるように、あなたの周りには自然と人が寄ってくるはず。ただね、幹が太い木ほど、しなることを知らないと嵐で折れるの。あなたの弱点は、強さそのもの。頼られることには慣れているのに、頼ることを知らないでしょう。根を張るというのは、一人で立つことじゃない。支え合う土を持つことよ。たまには枝を下ろして、誰かに寄りかかりなさい。それができた時、あなたは本当の意味で大きくなるわ。',
    work: '指示を待つより自分で切り拓く立場で伸びるタイプ。裁量を持たせれば持たせるほど成果を出すから、リーダーや独立の道を恐れないことね。ただし、まっすぐ進むあまり周りの声が耳に入らなくなる癖がある。振り返ったら誰もいなかった、なんて事態だけは避けなさい。',
    love: '好きになったら脇目もふらず一直線。駆け引きなんて器用な真似はできないでしょう。その誠実さは何よりの武器だけど、押す一方では相手が息切れするわ。時には立ち止まって、相手の歩幅に合わせる優しさを覚えなさい。',
    relationships: '裏表がなく約束を違えないから、「あの人が言うなら」と信頼を集めるタイプ。ただ、自分の正しさを物差しにして人を測る癖があるわね。人にはそれぞれの事情と弱さがあるの。それを裁かずに受け止められた時、あなたの木陰はもっと多くの人の休み場所になるわ。広く浅くより、深く根を絡ませ合える少数を大事にしなさい。',
    advice: '折れない木より、しなれる木の方が長く生きるのよ。強情と芯の強さを、履き違えないことね。',
    lucky: { emoji: '🪴', name: '観葉植物', keyword: '観葉植物 卓上 ミニ', reason: 'まっすぐな気を保ちたいなら、こういうものを傍に置いておきなさい。' },
  },
  1: { // 乙
    title: '草花', reading: 'きのと',
    line: 'あなたは、乙(きのと)。踏まれても翌朝には立ち上がる草花よ。',
    desc: '一見か弱そうに見えて、その実、誰よりも粘り強い人。強風には逆らわず身を伏せて、嵐が過ぎればまた顔を上げる。そのしなやかさこそ、あなたの生き抜く知恵よ。どんな環境に植え替えられても、いつの間にか根づいてしまう適応力は天賦のもの。ただね、周りに合わせることが上手すぎて、「本当は自分がどう咲きたいのか」を見失う瞬間があるでしょう。譲ってばかりの優しさは、いつしか周りに甘えられるだけの都合の良さに変わるの。折れない草には、静かな意地があるものよ。時には風に逆らって、あなた自身の色で咲きなさい。',
    work: 'チームの隙間を埋める調整役として、なくてはならない存在になるタイプ。空気を読み、角を立てずに物事を進める力は立派な才能よ。ただ、意見を求められた場面でまで一歩引いていると、その働きは誰にも見えないまま。ここぞという時は、はっきり言葉にしなさい。',
    love: '相手の色に染まりやすく、気づけば自分を見失っているタイプ。顔色をうかがうだけの関係は、いずれあなたを枯らすわよ。素のあなたを見せても離れない相手、むしろ水をくれる相手。選ぶべきは、そういう人よ。',
    relationships: '誰とでも波風を立てずにやっていける器用さがあるタイプ。嫌われることがほとんどない代わりに、誰とも本当には深まらない。その距離の取り方に、心当たりがあるでしょう。合わせる相手と、本音を預ける相手は分けなさい。あなたの柔らかさは、安売りするものじゃないの。信じられる少数にだけ、根の深いところを見せればいいのよ。',
    advice: '譲るのと、諦めるのは別物よ。ここだけは、と思う場所では我を通しなさい。',
    lucky: { emoji: '🍵', name: 'ハーブティーセット', keyword: 'ハーブティー ギフトセット', reason: '踏まれた心を戻すには、まず一杯のお茶からよ。' },
  },
  2: { // 丙
    title: '太陽', reading: 'ひのえ',
    line: 'あなたは、丙(ひのえ)。何もかも照らし出す真昼の太陽よ。',
    desc: '隠そうとしても隠しきれない、生まれつきの華がある人。喜怒哀楽がそのまま顔に出て、その裏表のなさが周りの心まで明るくするの。あなたが部屋に入るだけで空気が変わる、そんな経験があるでしょう。ただね、太陽は沈むところを人に見せないもの。人前で輝くほどに、一人になった夜の静けさが応えるはずよ。熱しやすく冷めやすいのも、常に燃えていないと不安だから。でも、照らし続けるためには、自分を休ませる時間が要るの。誰も見ていない場所で充電することを、後ろめたく思わないことね。翳りも含めて、あなたは太陽なのよ。',
    work: '人前に立つ・発信する・場を沸かせる役割で本領を発揮するわ。営業や企画、表舞台の仕事とは相性抜群よ。ただ、日の当たらない地道な作業になると、途端に燃料切れを起こすでしょう。派手さのない仕事をやり切る力こそ、あなたの輝きを本物にするの。',
    love: '一目惚れの電撃型。燃え上がるのは早いけれど、冷めるのも早い。相手を「本当に愛されているの?」と不安にさせた経験があるはずよ。恋の始まりの熱より、日常を照らし続ける根気。あなたに試されるのは、そこね。',
    relationships: '気づけば輪の中心にいるタイプ。初対面の壁など無いに等しく、誰とでもすぐ打ち解けられるわ。ただ、その明るさが眩しすぎて、あなたの陰の部分に気づく人は少ないの。「悩みなんて無さそう」と言われて、少し寂しかったことがあるでしょう。弱音を見せられる相手を、一人でいいから確保しておきなさい。それがあなたの命綱になるのよ。',
    advice: '沈まない太陽はないの。休むことも、輝きのうちよ。',
    lucky: { emoji: '🕶️', name: 'サングラス', keyword: 'サングラス おしゃれ', reason: '眩しすぎるあなたには、少し陰を作る道具が要るわ。' },
  },
  3: { // 丁
    title: '灯火', reading: 'ひのと',
    line: 'あなたは、丁(ひのと)。闇の中でこそ美しく揺れる灯火よ。',
    desc: '物静かな佇まいの奥に、誰にも消せない炎を隠している人。感受性が鋭く、人の心の機微を細部まで感じ取ってしまう。だから傷つきやすいし、人一倍疲れやすいのよ。周りには「何を考えているかわからない」と言われても、実際はその場の誰よりも深く考え、深く感じている。太陽のように万人を照らす必要はないの。灯火の光は、暗闇にいる誰か一人の足元を照らすためにあるもの。それがあなたの役目よ。ただ、内に秘めた熱は、表に出さなければ無いのと同じに扱われてしまう。想いの一割でいいから、言葉と行動にして見せなさい。',
    work: '一つの分野をじっくり掘り下げる専門的な仕事や、少人数で丁寧に取り組む仕事が向いているわ。派手に目立つより、静かに信頼を積み上げていくタイプ。無理に社交的な役回りを演じると芯から消耗するから、自分の燃え方を守れる環境を選びなさい。',
    love: '心の扉を開くまでに時間がかかる分、一度開いた相手には深く、静かに、長く尽くすタイプ。ただ、不満や寂しさを溜め込んで、ある日ふっと火が消えるように離れたくなる癖があるでしょう。小出しに吐き出すことを覚えなさい。',
    relationships: '狭く、深く。心を許した数人との絆は、他の誰にも真似できない濃さを持つわ。一方で、大人数の集まりでは灯りが薄まるように存在感が消えるでしょう。でも、それを欠点だと思わないことね。あなたの価値は、一対一の静けさの中でこそ光るの。無理に輪の中心を目指すより、あなたの火を必要としている一人のそばにいなさい。',
    advice: 'その繊細さは弱さじゃない、感度の高さよ。鈍感なふりで自分を殺さないことね。',
    lucky: { emoji: '🕯️', name: 'アロマキャンドル', keyword: 'アロマキャンドル ギフト', reason: '静かな灯りを、自分のためにも一つ灯しなさい。' },
  },
  4: { // 戊
    title: '山', reading: 'つちのえ',
    line: 'あなたは、戊(つちのえ)。千年動かぬ、悠然たる山よ。',
    desc: '多少の嵐ではびくともしない、生まれついての安定感がある人。周りが浮き足立つ場面ほど、あなたの静けさが皆の錨になるの。「あの人がいると安心する」、そう言われてきたでしょう。ただ、動かない山は、裏を返せば自分からは動かない山でもある。慣れた場所、慣れたやり方に根を下ろしすぎて、変化への一歩が億劫になっていないかしら。でもね、あなたが一度腹を決めた時の実行力は、誰にも真似できないほど大きいのよ。周りが「まさかあの人が」と驚く決断を、静かに下せる人。その力を、守りだけでなく攻めにも使いなさい。',
    work: '長期戦でこそ光るタイプ。コツコツ積み上げる仕事や、責任を預かる管理的な立場が性に合うわ。方針がころころ変わる職場や、スピード一辺倒の環境は消耗するだけ。ただ、石橋を叩きすぎて好機を逃す癖があるわね。たまには叩かずに渡る勇気も持ちなさい。',
    love: '時間をかけて信頼を積む堅実型。浮ついた関係には興味がなく、腰を据えた安定を求めるタイプよ。ただ、想いを言葉にするのが苦手で、「私のこと、どう思っているの?」と相手を不安にさせがち。山は黙っていても動かないけれど、人の心は言葉がないと離れていくのよ。',
    relationships: '口数は少なくとも、その動じなさで自然と頼られるタイプ。ただ、自分から歩み寄るのは苦手で、待ちの姿勢になりがちね。実はじっくり相手を観察して、信頼に足る人かを静かに見極めているのでしょう。一度懐に入れた相手への義理堅さは、山のごとし。その懐の深さをもっと知ってもらうためにも、たまには自分から声をかけなさい。それだけで関係は動き出すわ。',
    advice: '守りの固さは十分よ。あとは一歩、自分から外へ踏み出すだけね。',
    lucky: { emoji: '☕', name: '陶器のマグカップ', keyword: '陶器 マグカップ', reason: '動じない器には、あなたを支える器を持たせなさい。' },
  },
  5: { // 己
    title: '田畑', reading: 'つちのと',
    line: 'あなたは、己(つちのと)。蒔かれた種を残らず育て上げる、豊かな田畑よ。',
    desc: '人を育て、支えることに天性の才を持つ人。あなたの何気ない一言や手助けに救われた人は、あなたが思っているより、ずっと多いのよ。土が黙って作物を育てるように、見返りを求めず尽くせるのがあなたの器。ただね、土だって痩せるの。栄養を与え続けるばかりで、自分自身を耕すことを忘れていないかしら。誰かの実りを喜んでいるうちに、ふと「自分の人生はどこにあるの」と虚しくなる夜が来るはずよ。人に注ぐ愛情の二割でいい、自分に向けなさい。あなたという畑が肥えてこそ、育てられる実りも大きくなるのだから。',
    work: '育てる・支える・まとめる役割で真価を発揮するタイプ。教育や人材育成、サポート職、縁の下の要となる仕事と相性がいいわ。ただ、手柄を人に譲る癖のせいで、正当な評価を取りこぼしがち。成果は自分の口で伝えなさい。それは自慢ではなく、報告よ。',
    love: '尽くすことに幸せを感じるタイプ。ただ、世話を焼きすぎると、恋人ではなく保護者になってしまうわよ。「してあげる」ばかりの関係は、対等とは言えない。あなたの望みも口に出しなさい。甘える側に回れて初めて、釣り合いが取れるのよ。',
    relationships: '聞き役・支え役が板についているタイプ。頼られると断れず、気づけば皆の相談窓口になっているでしょう。でも、あなた自身が弱った時、周りは案外気づかないの。いつも元気そうに見えるからよ。「実は疲れている」「今日は無理」と言えるようになりなさい。弱さを見せるのは、相手を信頼している証。それを渡された相手は、むしろ嬉しいものよ。',
    advice: '与えるだけの畑は、いつか痩せるの。あなたも誰かに耕されなさい。',
    lucky: { emoji: '👝', name: 'ポーチ・小物入れ', keyword: 'ポーチ おしゃれ 収納', reason: '与えてばかりのあなたには、自分だけの持ち場を作りなさい。' },
  },
  6: { // 庚
    title: '刃', reading: 'かのえ',
    line: 'あなたは、庚(かのえ)。曇りなく研ぎ澄まされた刃よ。',
    desc: '曖昧なものを曖昧なままにしておけない、切れ味鋭い人。白か黒か、正しいか間違いか。その明快さと決断の速さは、迷いだらけの世の中で得がたい強さよ。皆が言いよどむことを、あなたは真っ先に口にできる。ただね、よく切れる刃ほど、振るう場所を選ばなければ人を傷つけるの。あなたの「正しさ」は、いつも誰かの「事情」を切り捨てていないかしら。刃の本当の価値は、何を切るかではなく、何を切らずにおくかで決まるのよ。抜くべき時と、鞘に収めておくべき時。その見極めができた時、あなたは本物になるわ。',
    work: '決断と実行が求められる局面でこそ輝くタイプ。交渉ごとや、膿を出し切るべき場面での判断力は誰にも負けないわ。なあなあで進む組織には強い苛立ちを感じるでしょう。ただ、正論は言い方ひとつで薬にも刃にもなる。切り口の美しさにも、こだわりなさい。',
    love: '駆け引き抜きの直球勝負。思ったことをそのまま口にするから、誠実と取られることもあれば、鋭すぎると距離を置かれることもあるでしょう。好きな相手にこそ、刃を置いて素手で触れなさい。優しい言葉は、あなたが思うより効くのよ。',
    relationships: 'はっきり物を言う分、敵と味方がくっきり分かれるタイプ。でも、それでいいの。八方美人より、よほど信頼される生き方よ。あなたに苦言を呈してほしいと願う人すらいるはず。それだけ、言葉に嘘がないということだから。ただ、味方への感謝は案外伝えていないでしょう。守りたいものの名前は、口に出して言いなさい。',
    advice: '本当に強い刃は、めったに抜かれないものよ。',
    lucky: { emoji: '🥤', name: 'ステンレスタンブラー', keyword: 'ステンレスタンブラー おしゃれ', reason: '研ぎ澄ました心を、少し冷ましてやりなさい。' },
  },
  7: { // 辛
    title: '宝石', reading: 'かのと',
    line: 'あなたは、辛(かのと)。幾多の研磨に耐えて生まれた宝石よ。',
    desc: '鋭い美意識と、繊細な感性を併せ持つ人。人が見過ごす小さな綻びに真っ先に気づき、細部まで完璧を求めてしまう。その厳しさは、まず誰より自分自身に向かうでしょう。傷つきやすいのに、傷ついた顔を人に見せたくない。プライドの高さと打たれ弱さが同居しているのが、あなたの複雑なところよ。でもね、宝石が輝くのは、削られた過去があるからなの。あなたが恥じているその傷こそ、光を美しく乱反射させる面になっている。完璧である必要はないわ。他人に向ける採点の、半分の甘さで自分を採点しなさい。',
    work: '細部の精度が問われる仕事や、美的センスを活かせる分野で光るタイプ。雑な仕事が許せない性分は、品質そのものであなたの名を高めるわ。ただ、基準が高すぎて、自分も周りも息切れさせがち。「八割で出す」勇気も、時には必要よ。',
    love: '理想が高く、簡単には妥協しないタイプ。素直になりたいのに、プライドが先に立って可愛げのない一言を選んでしまう夜があるでしょう。でもね、弱さを見せられる相手にだけは、飾らないあなたでいなさい。磨く前の素肌にこそ、本当の価値があるのよ。',
    relationships: '選び抜いた少数と、深く。誰にでも心を開かないから「近寄りがたい」と言われがちだけど、恥じることはないわ。宝石は、路傍に転がっていないものよ。実際に打ち解けた相手は、あなたが誰より情に厚く、義理堅いことを知っているはず。心を開くのに時間がかかるのは欠点ではなく、それだけ本気で人と向き合う証。焦らず、あなたの速度で磨き合える相手を選びなさい。',
    advice: '傷を恥じないことね。その傷が、あなたの輝きの角度を作ったのよ。',
    lucky: { emoji: '💍', name: 'アクセサリー', keyword: 'アクセサリー シンプル', reason: '磨いてきた自分に、ふさわしい飾りを一つ。' },
  },
  8: { // 壬
    title: '大海', reading: 'みずのえ',
    line: 'あなたは、壬(みずのえ)。岸に縛られず地平まで広がる大海よ。',
    desc: 'スケールが大きく、何より自由を愛する人。一つの場所、一つの正解に留まることが性に合わないでしょう。常識の枠を平然と越えていく発想力と行動力は、周りには真似のできない魅力よ。ただね、海は満ちれば引くもの。その気まぐれな潮の満ち引きが、「あの人は掴めない」という不信に変わることもあるはずよ。器の大きさは本物。だからこそ惜しいの、一つの場所に腰を据えてやり抜いた経験の少なさが。流れ続けるだけの水は、何も満たせないわ。一度でいいから、あなたの全部を注ぎ込む港を決めてみなさい。',
    work: '決まりきった毎日より、変化と刺激のある環境で生きるタイプ。複数の物事を同時に回す器用さと、常識外れの発想力が武器よ。ただし、軌道に乗る手前で飽きて手放す癖が最大の敵。始めたことを最後まで見届けた数だけ、あなたの信用は積み上がるの。',
    love: '束縛が何より苦手な自由人。追われると引き、離れられると追いたくなる困った性分でしょう。相手は「本気なの?」と不安なはずよ。自由でいたいなら、その分、言葉の錨を打ちなさい。「大丈夫、離れない」の一言が、あなたの自由を守るのよ。',
    relationships: '誰とでも気さくにやれる社交性の持ち主。人脈は海のように広がるけれど、深入りは巧みに避けているでしょう。特定の誰かに寄りかかることを、無意識に恐れているのよ。でもね、どんな大海にも深いところがあるように、あなたの深部を知る人が一人もいないのは寂しすぎるわ。信頼できる相手には、浅瀬より奥へ招き入れなさい。',
    advice: '広さは十分。次は深さよ。一つの港に、錨を下ろしてごらんなさい。',
    lucky: { emoji: '🧳', name: '旅行用ポーチ', keyword: 'トラベルポーチ 旅行 収納', reason: '自由に漂うあなたには、身軽な旅の道具を。' },
  },
  9: { // 癸
    title: '雨露', reading: 'みずのと',
    line: 'あなたは、癸(みずのと)。音もなく大地に染み入る雨露よ。',
    desc: '多くを語らず、静かに周りを観察している人。その瞳は、人が隠したつもりの本音や、場の空気のわずかな変化まで見抜いているでしょう。鋭い直感と深い知性。それがあなたの水源よ。ただ、雨露は静かすぎて、そこにあることに誰も気づかないの。あなたの中には、言葉にされないまま眠っている洞察が湖ほど溜まっているはずよ。「察してもらう」のを待つのは、もうやめなさい。あなたが黙っている限り、その知性は無いものと同じに扱われる。静かな水ほど、口を開いた時の一滴が深く響くもの。その一滴を、惜しまないことね。',
    work: '調査・分析・企画の裏側など、深く考える仕事で真価を発揮するタイプ。あなたの出す答えの質は、声の大きい人たちの十歩先を行っているはずよ。ただ、黙っていては誰にも届かない。会議で一度、あなたから口火を切ってごらんなさい。周りの目が変わるわ。',
    love: '本音を見せず、察してもらうのを待ちがちなタイプ。でもね、言わない想いは、無い想いと同じに扱われるのが恋というものよ。百の察しを期待するより、一つの言葉を渡しなさい。あなたの静かな一言は、思うよりずっと深く相手に染みるわ。',
    relationships: '聞き上手で、相手の本音を自然と引き出してしまうタイプ。皆あなたに話を聞いてほしがるのに、あなたの話を聞いてくれる人には出会えていないでしょう。それはあなたが、自分の話をする隙を与えていないからよ。謎めいた人のままでは、誰もあなたを支えられないの。信頼できる相手には、あなたの雨を降らせてみなさい。',
    advice: '黙っていても伝わる、は幻想よ。大事な一滴ほど、声にして落としなさい。',
    lucky: { emoji: '💧', name: '加湿器・アロマディフューザー', keyword: 'アロマディフューザー 卓上', reason: '静かな気配には、静かに満ちる香りを添えなさい。' },
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
  parts.push(`生まれた年の星回りには、${STEM_FLAVOR[yStemIdx]}気が流れ込んでいるから、育った環境や家族との関わりの中で、その色が自然と身についているはずよ。`);
  parts.push(`社会に出て働く時期のあなたには、${STEM_FLAVOR[mStemIdx]}気質が強く出るでしょうね。`);
  if (pillars.hour) {
    const hStemIdx = STEMS.indexOf(pillars.hour.stem);
    parts.push(`人に見せない内面や、歳を重ねてから強まる部分には、${STEM_FLAVOR[hStemIdx]}気が表れてくるはずよ。`);
  } else {
    parts.push('生まれた時刻まで教えてもらえると、内面や晩年の傾向までもっと詳しく見えてくるわ。気になるなら、時刻も入れてもう一度占ってごらんなさい。');
  }
  return parts.join('');
}

function affiliateUrl(keyword) {
  const base = `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}`;
  return AFFILIATE_TAG ? `${base}&tag=${encodeURIComponent(AFFILIATE_TAG)}` : base;
}
const AFFILIATE_TAG = 'tinywonders-22';

// ===== JA/EN切替(2026-08-30着手、2026-08-30完了。10日主全てFable翻訳済み。
// isPendingTranslationの仕組み自体は将来の追加日主/フィールドのために維持) =====
let LANG = 'ja';

// Fable(claude-fable-5)による書き起こし。line/desc/work/love/relationships/adviceの6項目×10日主=60本。
// title/readingは翻訳対象外(干支そのものなので不変)、luckyの商品名はLUCKY_NAME_ENで別途対応。
const DAY_MASTER_TYPES_EN = {
  0: {
    line: `You are Kinoe — the great tree that drives its trunk straight up toward the sky.`,
    desc: `You can't stand anything crooked, and once you've decided something is right, you don't budge. That unshakability is exactly what gives the people around you a sense of safety and direction. Just as people gather in the shade of a great tree, they naturally gather around you. But listen — the thicker the trunk, the more surely a tree snaps in a storm if it never learned to bend. Your weakness is your strength itself. You're used to being leaned on, but you have no idea how to lean on anyone. Putting down roots doesn't mean standing alone. It means sharing soil with others who hold you up. Lower your branches once in a while and rest your weight on someone. The day you can do that is the day you truly grow tall.`,
    work: `At work, you thrive when you're clearing your own path, not waiting for orders. The more freedom you're given, the more you deliver — so don't be afraid of leadership or striking out on your own. But you have a habit of charging straight ahead until you can no longer hear the voices around you. Whatever you do, don't turn around one day to find nobody there.`,
    love: `In love, once you fall, you go straight ahead without a sideways glance. Playing games? You couldn't if you tried. That sincerity is your greatest weapon, but push and push and your partner will run out of breath. Learn the kindness of stopping now and then to match their stride.`,
    relationships: `In relationships, you say what you mean and keep every promise, so people trust you — "if it's coming from them, it must be true." But you have a habit of measuring everyone against your own yardstick of what's right. People carry their own circumstances and their own weaknesses. The day you can accept that without passing judgment, your shade becomes a resting place for far more people. Forget wide and shallow — treasure the few whose roots you can truly entwine with yours.`,
    advice: `The tree that can bend outlives the tree that won't break. Don't mistake stubbornness for a strong core.`,
  },
  1: {
    line: `You are Kinoto — the wildflower that gets trampled and stands right back up by morning.`,
    desc: `You look delicate at first glance, but the truth is you're tougher than anyone. You don't fight the gale — you lie low, and when the storm passes, you lift your face again. That suppleness is your wisdom for surviving. Transplant you into any soil and before anyone notices, you've taken root — that adaptability is a gift. But here's the thing: you're so good at fitting in that there are moments you lose sight of how you actually want to bloom. Kindness that only ever yields eventually becomes a convenience for others to exploit. Even a blade of grass that won't break carries a quiet stubbornness. Every so often, defy the wind and bloom in your own color.`,
    work: `At work, you become indispensable as the one who fills the gaps in a team. Reading the room and moving things forward without ruffling feathers is a genuine talent. But if you keep stepping back even when someone asks for your opinion, all that work stays invisible. When the moment matters, say it out loud and say it plainly.`,
    love: `In love, you take on your partner's colors so easily that one day you look up and can't find yourself. A relationship where all you do is read their moods will wither you in the end. Find someone who doesn't leave when they see the real you — better yet, someone who waters you. That's the one worth choosing.`,
    relationships: `In relationships, you have the knack of getting along with anyone without making waves. Hardly anyone dislikes you — but no one truly gets close to you either. You know exactly the distance I'm talking about. Separate the people you accommodate from the people you trust with your real feelings. Your softness is not something to sell cheap. Show your deepest roots only to the few who've earned it.`,
    advice: `Yielding and giving up are not the same thing. Where it truly matters, dig in and hold your ground.`,
  },
  2: {
    line: `You are Hinoe — the midday sun that lights up everything it touches.`,
    desc: `You have a natural radiance that can't be hidden no matter how you try. Every emotion shows right on your face, and that openness brightens the hearts around you. You've felt it — the air in a room changes the moment you walk in. But listen: the sun never lets anyone watch it set. The brighter you shine in public, the harder the silence of your nights alone hits you. You burn hot and cool fast, too — because deep down, you're anxious unless you're always blazing. But to keep shining, you need time to rest. Don't feel guilty about recharging where no one can see you. The shadows are part of you. You're the sun either way.`,
    work: `At work, you come into your own when you're out front — presenting, promoting, lighting up the room. Sales, planning, anything on a stage: perfect fit. But hand you plain, unglamorous grunt work and your fuel runs out on the spot. It's the power to see the unflashy work through to the end that makes your shine the real thing.`,
    love: `In love, you're the lightning-strike type — love at first sight. You catch fire fast, and you cool off just as fast. Somewhere along the way, you've made a partner wonder, "Do you really love me?" What's being tested in you isn't the blaze at the start — it's the patience to keep lighting up the ordinary days.`,
    relationships: `In relationships, you always end up at the center of the circle. Walls with strangers might as well not exist for you — you warm up to anyone instantly. But your brightness is so dazzling that almost no one notices your shadows. Someone once said, "You look like you don't have a care in the world," and it stung a little, didn't it. Secure at least one person you can fall apart in front of. That person is your lifeline.`,
    advice: `There is no sun that never sets. Resting is part of shining.`,
  },
  3: {
    line: `You are Hinoto — the lamplight that burns most beautifully in the dark.`,
    desc: `Behind that quiet exterior, you hide a flame no one can put out. Your senses are razor-sharp — you pick up every subtle shift in the hearts around you, down to the finest detail. That's why you bruise easily, and why you tire faster than anyone. People may say they can't tell what you're thinking, but the truth is you think deeper and feel deeper than anyone else in the room. You don't need to light up the whole world like the sun. A lamp's light exists to guide the feet of one person lost in the dark. That is your calling. But heat kept locked inside gets treated as if it doesn't exist. Even a tenth of what you feel — put it into words and actions where people can see it.`,
    work: `At work, you're built for deep expertise — digging patiently into one field — or careful work in small, close teams. You're the type who quietly stacks up trust rather than grabbing the spotlight. Forcing yourself to play the social butterfly drains you to the core, so choose an environment that protects the way you burn.`,
    love: `In love, it takes you a long time to open the door — but once you open it for someone, you devote yourself deeply, quietly, and for the long haul. The trouble is your habit of bottling up every frustration and lonely moment until one day the flame simply goes out and you want to walk away. Learn to let it out in small doses.`,
    relationships: `Your relationships run narrow and deep. The bonds you share with the few you truly trust have an intensity no one else can imitate. In a big crowd, though, your presence thins out like lamplight in a bright room. Don't you dare call that a flaw. Your worth shines in the quiet of one-on-one. Don't force yourself toward the center of the circle — stay beside the one person who needs your fire.`,
    advice: `That sensitivity of yours isn't weakness — it's sharpness. Don't smother yourself playing numb.`,
  },
  4: {
    line: `You are Tsuchinoe — the serene mountain that hasn't moved in a thousand years.`,
    desc: `You were born with a stability that no ordinary storm can shake. The more everyone else panics, the more your stillness becomes their anchor. "I feel safe when you're around" — you've heard it all your life. But a mountain that never moves is also a mountain that never moves itself. Haven't you sunk your roots so deep into familiar places and familiar ways that taking a step toward change has started to feel like a chore? Here's what you should know: once you truly make up your mind, your power to act is beyond anyone's imitation. You're the type who can quietly make a decision that leaves everyone gasping, "Them? Really?" Use that power for offense, not just defense.`,
    work: `At work, you shine in the long game. Steady, brick-by-brick work and positions of real responsibility suit you down to the ground. A workplace that flip-flops on direction, or one that worships speed above all, will only grind you down. But you do have a habit of testing the bridge so many times that the chance walks past you. Once in a while, have the nerve to cross without knocking.`,
    love: `In love, you're the steady type who builds trust over time. Flings hold no interest for you — you want stability you can settle into. The trouble is you're terrible at putting feelings into words, so your partner ends up asking, "How do you actually feel about me?" A mountain can stay silent and never move — but a human heart, left without words, drifts away.`,
    relationships: `In relationships, you may not say much, but that unshakable calm makes people lean on you naturally. The catch: you're no good at closing the distance yourself, so you end up waiting. The truth is you're quietly watching, taking your time to judge whether someone deserves your trust — aren't you. And once someone is inside your circle, your loyalty stands like the mountain itself. If you want people to know how deep that shelter runs, reach out first once in a while. That alone will set things in motion.`,
    advice: `Your defenses are solid enough already. All that's left is one step — outward, on your own.`,
  },
  5: {
    line: `You are Tsuchinoto — the rich field that raises every seed sown in it.`,
    desc: `You have a born gift for raising people and holding them up. Far more people than you realize have been saved by an offhand word or a small kindness of yours. Like soil that grows crops without saying a word, you give without asking anything back — that's the measure of you. But listen — even soil goes thin. You keep feeding everyone else; when did you last till your own ground? One of these nights, mid-celebration of someone else's harvest, the question will hit you: "Where is my life in all this?" Take just two parts in ten of the love you pour into others and turn it on yourself. The richer your field grows, the greater the harvests you can raise.`,
    work: `At work, you show your true worth in the roles that raise, support, and hold things together — teaching, mentoring, the backbone jobs nobody sees. But that habit of handing your credit to others costs you recognition you've earned. State your results with your own mouth. That isn't bragging — it's reporting.`,
    love: `In love, giving is what makes you happy. But fuss over someone too much and you stop being a lover and become a guardian. A relationship that's all "let me do that for you" is not an equal one. Say what you want out loud. Only when you can be the one leaning does the scale finally balance.`,
    relationships: `With people, you've settled deep into the listener's seat, the supporter's seat. You can't say no when someone needs you, and before you know it you're everyone's help desk. But when you're the one running dry, nobody notices — because you always look fine. Learn to say "actually, I'm worn out" and "not today." Showing weakness is proof that you trust someone. The person you hand it to will be glad you did.`,
    advice: `A field that only gives will one day go barren. Let someone till you for a change.`,
  },
  6: {
    line: `You are Kanoe — a blade honed until not a trace of cloud remains.`,
    desc: `You cannot leave a vague thing vague. White or black, right or wrong. In a world full of hedging, that clarity and that speed of decision are a rare kind of strength — what everyone else swallows, you say first. But listen — the sharper the blade, the more it wounds when you don't choose where to swing it. Hasn't your "right" been cutting away someone's "circumstances" all along? A blade's true worth isn't decided by what it cuts. It's decided by what it chooses not to cut. When to draw, and when to keep it sheathed — the day you can tell the difference is the day you become the real thing.`,
    work: `At work, you shine exactly where decision and action are demanded — negotiations, the moments when the rot has to be cut out. Your judgment there bows to no one, and an organization that muddles along will grate on you badly. But remember: the same hard truth can be medicine or a blade, depending on how it's said. Care about the cleanness of the cut, too.`,
    love: `In love, you play it dead straight — no games. You say exactly what you think, so some read it as honesty and some step back from the edge. With the one you love, of all people, set the blade down and touch with bare hands. Soft words work better than you give them credit for.`,
    relationships: `With people, you speak your mind, so the line between friend and foe gets drawn sharp. Good. That's a far more trusted way to live than pleasing everyone. There are even people who want your blunt words — that's how little your words lie. But the gratitude you owe your own side? You've barely said it, have you. The things you want to protect — name them out loud.`,
    advice: `A truly strong blade is rarely drawn.`,
  },
  7: {
    line: `You are Kanoto — a gem born of countless rounds of polishing.`,
    desc: `You carry a sharp eye for beauty and a delicate sensitivity in the same body. You're the first to spot the tiny flaw everyone else walks past, and you demand perfection down to the last detail — a severity you turn on yourself before anyone. You bruise easily, yet you'd rather die than let the bruise show. That pride and that fragility living side by side is the complicated part of you. But listen — a gem shines because of what was ground away. The very scratch you're ashamed of has become the facet that scatters light most beautifully. You don't need to be flawless. Grade yourself at half the strictness you grade everyone else.`,
    work: `At work, you shine in fields where precision and taste decide everything. Your refusal to tolerate sloppy work will make your name on quality alone. But your bar sits so high that you leave yourself — and everyone around you — gasping. Sometimes it takes courage to ship at eighty percent. Find it.`,
    love: `In love, your ideals run high and you don't compromise cheaply. There are nights you want to be honest, but pride grabs the words first and hands you something cold to say instead. Listen — with the one person you can show weakness to, wear nothing but yourself. The real value is in the stone before the polish.`,
    relationships: `In friendship, you choose few and go deep. Because you don't open up to just anyone, people call you hard to approach — don't be ashamed of that. Gems don't lie around on the roadside. The ones who've actually gotten close know you're warmer-hearted and more loyal than anyone. Taking time to open up isn't a flaw; it's proof of how seriously you face people. No hurry. Choose the ones worth polishing against, at your own pace.`,
    advice: `Stop being ashamed of your scratches. They're what set the angle of your shine.`,
  },
  8: {
    line: `You are Mizunoe — the ocean that answers to no shore and runs all the way to the horizon.`,
    desc: `You're built on a grand scale, and you love freedom above all else. Staying in one place, settling for one right answer — it's simply not in your nature. The way you stride past common sense, in thought and in action, is a pull no one around you can imitate. But listen — a tide that rises also pulls out. That restless ebb and flow of yours can curdle into "you can never get a hold of that one." The size of your vessel is real. Which is exactly why it's such a waste — how rarely you've dropped anchor and seen one thing all the way through. Water that only keeps flowing fills nothing. Just once, choose the harbor you'll pour all of yourself into.`,
    work: `At work, you live on change and stimulation, not routine. Spinning several things at once, thinking past the edge of the map — those are your weapons. But your worst enemy is the habit of getting bored and letting go right before something takes off. Your credibility is built one finished thing at a time. Count them.`,
    love: `In love, you're a free spirit who can't stand a leash. Chased, you pull back; released, you want to chase — a troublesome tide, and your partner is left wondering if you're serious at all. If you want your freedom, pay for it in words. Drop the anchor of one sentence — "I'm not going anywhere" — and it will hold your freedom in place.`,
    relationships: `With people, you're easy company for anyone, and your connections spread wide as open water. But you steer neatly around going deep, don't you. Somewhere in you is a quiet fear of leaning on any one person. Listen — every ocean has its deep places, and it is far too lonely for not one soul to know yours. The ones you trust — invite them in past the shallows.`,
    advice: `You have the breadth. Now the depth. Try lowering your anchor in one harbor.`,
  },
  9: {
    line: `You are Mizunoto — the dew that soaks into the earth without a sound.`,
    desc: `You say little and watch everything. Those eyes see through the feelings people think they've hidden, catch the faintest shift in the air of a room. Sharp intuition and deep intelligence — that is your wellspring. But dew is so quiet that no one notices it's there. Inside you sits a lake's worth of insight that has never once been put into words. Stop waiting to be understood without speaking. As long as you stay silent, that intelligence gets treated as if it doesn't exist. The stiller the water, the deeper a single drop rings when it finally falls. Don't hoard that drop.`,
    work: `At work, you prove your worth where deep thinking is the whole job — research, analysis, the quiet engine room behind every plan. The answers you produce run ten steps ahead of the loud voices in the room. But silence carries nothing to anyone. In your next meeting, be the one who speaks first — just once. Watch how the room looks at you after.`,
    love: `In love, you hide what you really feel and wait to be read. But hear me — in love, a feeling left unspoken gets treated exactly like a feeling that doesn't exist. Instead of hoping for a hundred guesses, hand over one word. That quiet sentence of yours soaks in far deeper than you imagine.`,
    relationships: `With people, you're the listener who draws out what others never meant to say. Everyone wants to be heard by you — and yet you've never found the one who hears you. That's because you never leave an opening to talk about yourself. Stay the mystery, and no one will ever be able to hold you up. With the ones you trust, let your rain fall.`,
    advice: `"They'll understand without my saying it" is a fantasy. The drops that matter most — let them fall out loud.`,
  },
};

const LUCKY_NAME_EN = [
  'Potted Plant', 'Herbal Tea Set', 'Sunglasses', 'Aroma Candle', 'Ceramic Mug',
  'Pouch / Accessory Case', 'Stainless Tumbler', 'Accessory', 'Travel Pouch', 'Humidifier / Aroma Diffuser',
];

// lucky.reasonのEN版(日主インデックス0-9、JAのreasonと対応する黒曜先生の一言)
const LUCKY_REASON_EN = [
  "If you want to keep that straight-growing spirit of yours, keep one of these close.",
  "To bring a trampled heart back, start with a single cup of tea.",
  "Someone as dazzling as you needs a little shade of your own making.",
  "Light one of these quietly, for yourself, for once.",
  "An unshakable vessel deserves a vessel that holds it up in turn.",
  "You who only ever give — carve out one corner that's yours alone.",
  "Let that honed-sharp mind of yours cool down a little.",
  "You've polished yourself this far — give yourself an ornament worthy of it.",
  "A spirit as free as yours needs travel gear light enough to match.",
  "A quiet presence deserves a scent that fills the room just as quietly.",
];

function getDayMasterType(stemIdx) {
  const ja = DAY_MASTER_TYPES[stemIdx];
  if (LANG !== 'en') return { ...ja, isPendingTranslation: false };
  const en = DAY_MASTER_TYPES_EN[stemIdx];
  if (en) return { ...ja, ...en, isPendingTranslation: false };
  return { ...ja, isPendingTranslation: true };
}

const UI_TEXT = {
  ja: {
    pageTitle: '黒曜診断 - 四柱推命で生年月日から無料鑑定',
    pageDescription: '生年月日から四柱推命ベースで占う無料診断。占い師「黒曜先生」があなたの本質をズバッと一言で言い切ります。',
    eyebrowStart: '四柱推命ベース・無料鑑定',
    startTitle: '黒曜診断',
    startLeadHtml: '占い師「黒曜先生」が、あなたの生年月日から<br>本質を<span class="accent">一言で言い切ります。</span>',
    nichishuLink: '📖 占う前に、日主10タイプ一覧を見る',
    labelBirthdate: '生年月日を入力',
    labelBirthtime: '生まれた時刻(わかれば・任意)',
    startBtn: '占ってもらう ✦',
    startSub: '生年月日から、あなたの核となる気質を鑑定します。生まれた時刻まで入れると、より詳しい鑑定になります',
    loadingText: '黒曜先生が、生まれた日を読み解いています…',
    errorRequired: '生年月日を、年・月・日すべて選んでから占ってもらいなさい。',
    errorGeneric: '占いの途中で何かが乱れたようね。もう一度、試してごらんなさい。',
    subheadWork: '💼 仕事・お金の傾向',
    subheadLove: '💞 恋愛の傾向',
    subheadRelationships: '🤝 人間関係の傾向',
    subheadBackground: '🌙 生まれ持った背景',
    pendingTranslationNote: '',
    adviceLabel: '【黒曜先生からひとこと】',
    luckyLabel: '🔮 黒曜先生おすすめの開運アイテム',
    luckySeeMore: (name) => `${name}を見てみる`,
    shareBtn: 'Xでシェア ✦',
    lineBtn: 'LINEでシェア',
    copyUrlBtn: '結果URLをコピー 🔗',
    copiedLabel: 'コピーしました ✓',
    restartBtn: 'もう一度占う',
    gogyoLink: '🔮 お相手との五行相性を見る',
    followLabel1: '🔮 性格診断で、自分をもっと知ってみなさい',
    followLinkQuiz: '性格・恋愛・仕事タイプ診断',
    followLabel2: '🌙 黒曜先生の番外編も視てもらいなさい',
    followLinkZensei: '前世診断',
    followLinkShugorei: '守護霊診断',
    followLabel3: '🐹 Desk Animalsをフォローする',
    footerPr: '🔖 本ページの「開運アイテム」リンクにはアフィリエイト(広告)リンクを含みます。リンク経由の購入により、当サイトが紹介料を得る場合があります。',
    footerDisclaimer: '本診断はエンタメ目的のコンテンツです。四柱推命の考え方をベースにしていますが、生まれ月の区切りには実際の暦と前後1日程度ずれることがある近似日付を使用しています。夜23時以降に生まれた方は、生まれた日の干支を翌日のものとして扱う昔ながらの考え方を採用していますが、これは流派によって扱いが異なる点にご留意ください。挿絵はAI画像生成、英語版の文章はAIによる書き起こし・翻訳です。科学的な診断や実際の鑑定に代わるものではありません。',
    footerPrivacy: '生年月日・時刻そのものは診断のためだけに使用し、サーバーへの送信・保存は一切行いません(鑑定はすべてお使いの端末内で計算しています)。なお、アクセス解析(Googleアナリティクス)は行っており、閲覧したページの情報が計測されます。',
    footerNichishuLink: '日主10タイプ一覧を見る',
    shareText: (line) => `黒曜先生に占われました。\n${line}\nあなたも占われてみなさい→\n#黒曜診断 #四柱推命`,
    shareTextLine: (line) => `黒曜先生に占われました。${line}\nあなたも占われてみなさい→`,
  },
  en: {
    pageTitle: 'Kokuyo Fortune Reading - A Free BaZi Reading From Your Birth Date',
    pageDescription: 'A free BaZi (Four Pillars of Destiny) fortune reading based on your birth date. Fortune-teller Kokuyo-sensei sums up your true nature in one blunt line.',
    eyebrowStart: 'BaZi-Based Free Reading',
    startTitle: 'Kokuyo Fortune Reading',
    startLeadHtml: 'Fortune-teller Kokuyo-sensei reads your birth date and<br>sums up your true nature <span class="accent">in one line.</span>',
    nichishuLink: '📖 Browse the 10 Day-Master Types First',
    labelBirthdate: 'Enter Your Birth Date',
    labelBirthtime: 'Birth Time (optional, if known)',
    startBtn: 'Get Your Reading ✦',
    startSub: "We'll read your core nature from your birth date. Add your birth time for an even deeper reading.",
    loadingText: 'Kokuyo-sensei is reading the day you were born…',
    errorRequired: 'Choose a year, month, and day before asking for your reading.',
    errorGeneric: 'Something went wrong mid-reading. Give it another try.',
    subheadWork: '💼 Career & Money',
    subheadLove: '💞 Love',
    subheadRelationships: '🤝 Relationships',
    subheadBackground: '🌙 What Shaped You',
    pendingTranslationNote: '🌐 English write-up for this type is coming soon — shown in Japanese for now.',
    adviceLabel: '【A word from Kokuyo-sensei】',
    luckyLabel: "🔮 Kokuyo-sensei's Lucky Pick",
    luckySeeMore: (name) => `Shop ${name}`,
    shareBtn: 'Share on X ✦',
    lineBtn: 'Share on LINE',
    copyUrlBtn: 'Copy Result URL 🔗',
    copiedLabel: 'Copied ✓',
    restartBtn: 'Try Again',
    gogyoLink: "🔮 Check Your Match's Element Compatibility",
    followLabel1: '🔮 Get to know yourself better',
    followLinkQuiz: 'Personality / Love / Career Type Quiz',
    followLabel2: '🌙 More readings from Kokuyo-sensei',
    followLinkZensei: 'Past Life Reading',
    followLinkShugorei: 'Guardian Spirit Reading',
    followLabel3: '🐹 Follow Desk Animals',
    footerPr: '🔖 The "Lucky Item" links on this page include affiliate links. Purchases made through them may earn this site a referral fee.',
    footerDisclaimer: "This reading is for entertainment purposes only. It's based on BaZi (Four Pillars of Destiny) principles, but the month boundaries use approximate dates that can be off by about a day from the actual calendar. Births after 11pm follow the traditional convention of using the next day's stem/branch, though this varies by school of thought. The illustrations are AI-generated, and this English text is an AI-assisted write-up/translation. It is not a substitute for a scientific assessment or a professional reading.",
    footerPrivacy: "Your birth date and time themselves are used only for this reading and are never sent to or stored on a server (the reading is calculated entirely on your device). We do use Google Analytics for traffic measurement, which records information about the pages you view.",
    footerNichishuLink: 'Browse the 10 Day-Master Types',
    shareText: (line) => `Kokuyo-sensei just read my fortune.\n${line}\nGet your own reading →\n#KokuyoFortuneReading #BaZi`,
    shareTextLine: (line) => `Kokuyo-sensei just read my fortune. ${line}\nGet your own reading →`,
  },
};

// ===== 画面制御 =====
let lastResult = null;

// 生年月日入力(年/月/日の3セレクト)。ネイティブtype="date"のドラムロールスクロール負担を避けるための構成。
function populateBirthdateSelects() {
  const yearSel = document.getElementById('birth-year');
  const monthSel = document.getElementById('birth-month');
  const daySel = document.getElementById('birth-day');
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1920; y--) {
    const opt = document.createElement('option');
    opt.value = String(y);
    opt.textContent = String(y);
    yearSel.appendChild(opt);
  }
  for (let m = 1; m <= 12; m++) {
    const opt = document.createElement('option');
    opt.value = String(m);
    opt.textContent = String(m);
    monthSel.appendChild(opt);
  }
  refreshDayOptions();
  yearSel.addEventListener('change', refreshDayOptions);
  monthSel.addEventListener('change', refreshDayOptions);
}

function daysInMonth(year, month) {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

function refreshDayOptions() {
  const yearSel = document.getElementById('birth-year');
  const monthSel = document.getElementById('birth-month');
  const daySel = document.getElementById('birth-day');
  const prevValue = daySel.value;
  const max = daysInMonth(yearSel.value, monthSel.value);
  daySel.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '日';
  daySel.appendChild(placeholder);
  for (let d = 1; d <= max; d++) {
    const opt = document.createElement('option');
    opt.value = String(d);
    opt.textContent = String(d);
    daySel.appendChild(opt);
  }
  if (prevValue && Number(prevValue) <= max) daySel.value = prevValue;
}
populateBirthdateSelects();

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showBirthdateError(message) {
  const t = UI_TEXT[LANG];
  const errorEl = document.getElementById('birthdate-error');
  errorEl.textContent = message || t.errorRequired;
  errorEl.style.display = 'block';
  ['birth-year', 'birth-month', 'birth-day'].forEach(id => {
    const el = document.getElementById(id);
    el.classList.add('invalid');
    el.setAttribute('aria-invalid', 'true');
  });
}

function clearBirthdateError() {
  const errorEl = document.getElementById('birthdate-error');
  errorEl.style.display = 'none';
  ['birth-year', 'birth-month', 'birth-day'].forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('invalid');
    el.removeAttribute('aria-invalid');
  });
}

function focusResultHeading() {
  const heading = document.getElementById('result-line');
  heading.setAttribute('tabindex', '-1');
  heading.focus();
}

function startDivination() {
  const y = document.getElementById('birth-year').value;
  const m = document.getElementById('birth-month').value;
  const d = document.getElementById('birth-day').value;
  if (!y || !m || !d) {
    showBirthdateError();
    return;
  }
  clearBirthdateError();
  const timeInput = document.getElementById('birthtime');
  let hour = null;
  if (timeInput.value) {
    hour = Number(timeInput.value.split(':')[0]);
  }
  showScreen('screen-loading');
  setTimeout(() => {
    try {
      renderResult(Number(y), Number(m), Number(d), hour);
    } catch (e) {
      console.error('鑑定の生成に失敗しました', e);
      showScreen('screen-start');
      showBirthdateError(UI_TEXT[LANG].errorGeneric);
    }
  }, 1400);
}

function renderResult(y, m, d, hour) {
  const pillars = computeFourPillars(y, m, d, hour);
  applyResult(pillars);
}

// 生年月日そのものではなく、干支インデックスだけをURLに載せて結果を再現するための符号化
// (birthdateをそのままURLに残さないためのプライバシー配慮)。末尾1文字は現在の表示言語(j/e)。
function buildResultCode(pillars) {
  const y = STEMS.indexOf(pillars.year.stem);
  const m = STEMS.indexOf(pillars.month.stem);
  const h = pillars.hour ? STEMS.indexOf(pillars.hour.stem) : 'x';
  const langChar = LANG === 'en' ? 'e' : 'j';
  return `${pillars.day.stemIdx}${y}${m}${h}${langChar}`;
}

function decodeResultCode(code) {
  if (!/^[0-9][0-9][0-9]([0-9]|x)[je]?$/.test(code)) return null;
  const dayIdx = Number(code[0]);
  const yearIdx = Number(code[1]);
  const monthIdx = Number(code[2]);
  const hourPart = code[3];
  const langChar = code[4];
  return {
    day: { stem: STEMS[dayIdx], branch: '', stemIdx: dayIdx },
    year: { stem: STEMS[yearIdx], branch: '' },
    month: { stem: STEMS[monthIdx], branch: '' },
    hour: hourPart === 'x' ? null : { stem: STEMS[Number(hourPart)], branch: '' },
    lang: langChar === 'e' ? 'en' : (langChar === 'j' ? 'ja' : null),
  };
}

function resultUrl() {
  if (!lastResult) return location.href;
  return location.origin + location.pathname + '?r=' + buildResultCode(lastResult.pillars);
}

function applyResult(pillars) {
  const t = UI_TEXT[LANG];
  const type = getDayMasterType(pillars.day.stemIdx);
  lastResult = { pillars, type };

  document.getElementById('result-line').textContent = type.line;
  document.getElementById('result-desc').textContent = type.desc;
  document.getElementById('result-work').textContent = type.work;
  document.getElementById('result-love').textContent = type.love;
  document.getElementById('result-relationships').textContent = type.relationships;
  document.getElementById('result-background').textContent = buildBackgroundText(pillars);
  document.getElementById('result-advice').textContent = t.adviceLabel + type.advice;

  const pendingNoteEl = document.getElementById('result-pending-note');
  if (type.isPendingTranslation) {
    pendingNoteEl.textContent = t.pendingTranslationNote;
    pendingNoteEl.style.display = 'block';
  } else {
    pendingNoteEl.style.display = 'none';
  }

  const luckyLink = document.getElementById('lucky-link');
  luckyLink.href = affiliateUrl(type.lucky.keyword);
  document.getElementById('lucky-emoji').textContent = type.lucky.emoji;
  const luckyName = LANG === 'en' ? LUCKY_NAME_EN[pillars.day.stemIdx] : type.lucky.name;
  document.getElementById('lucky-name').textContent = t.luckySeeMore(luckyName);
  const luckyReason = LANG === 'en' ? LUCKY_REASON_EN[pillars.day.stemIdx] : type.lucky.reason;
  document.getElementById('lucky-reason').textContent = luckyReason || '';

  showScreen('screen-result');
  focusResultHeading();
}

function restart() {
  document.getElementById('birth-year').value = '';
  document.getElementById('birth-month').value = '';
  document.getElementById('birth-day').value = '';
  refreshDayOptions();
  document.getElementById('birthtime').value = '';
  clearBirthdateError();
  showScreen('screen-start');
}

function shareResult() {
  if (!lastResult) return;
  const t = UI_TEXT[LANG];
  const text = t.shareText(lastResult.type.line);
  const url = 'https://x.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(resultUrl());
  window.open(url, '_blank', 'noopener');
}

function shareResultLine() {
  if (!lastResult) return;
  const t = UI_TEXT[LANG];
  const text = t.shareTextLine(lastResult.type.line);
  const url = 'https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(resultUrl()) + '&text=' + encodeURIComponent(text);
  window.open(url, '_blank', 'noopener');
}

function copyResultUrl() {
  if (!lastResult) return;
  const t = UI_TEXT[LANG];
  const btn = document.getElementById('btn-copy-url');
  navigator.clipboard.writeText(resultUrl()).then(() => {
    const original = btn.textContent;
    btn.textContent = t.copiedLabel;
    setTimeout(() => { btn.textContent = original; }, 2000);
  });
}

// ===== JA/EN切替UI =====
function applyLangUI() {
  const t = UI_TEXT[LANG];
  document.title = t.pageTitle;
  const metaDescEl = document.querySelector('meta[name="description"]');
  if (metaDescEl) metaDescEl.setAttribute('content', t.pageDescription);
  document.getElementById('start-eyebrow').textContent = t.eyebrowStart;
  document.getElementById('start-title').textContent = t.startTitle;
  document.getElementById('start-lead').innerHTML = t.startLeadHtml;
  document.getElementById('nichishu-link').textContent = t.nichishuLink;
  document.getElementById('label-birthdate').textContent = t.labelBirthdate;
  document.getElementById('label-birthtime').textContent = t.labelBirthtime;
  document.getElementById('btn-start').textContent = t.startBtn;
  document.getElementById('start-sub').textContent = t.startSub;
  document.getElementById('loading-text').textContent = t.loadingText;
  document.getElementById('subhead-work').textContent = t.subheadWork;
  document.getElementById('subhead-love').textContent = t.subheadLove;
  document.getElementById('subhead-relationships').textContent = t.subheadRelationships;
  document.getElementById('subhead-background').textContent = t.subheadBackground;
  document.getElementById('lucky-label').childNodes[0].nodeValue = t.luckyLabel;
  document.getElementById('btn-share').textContent = t.shareBtn;
  document.getElementById('btn-share-line').textContent = t.lineBtn;
  document.getElementById('btn-copy-url').textContent = t.copyUrlBtn;
  document.getElementById('btn-restart').textContent = t.restartBtn;
  document.getElementById('gogyo-link').textContent = t.gogyoLink;
  document.getElementById('follow-label-1').textContent = t.followLabel1;
  document.getElementById('follow-link-quiz').textContent = t.followLinkQuiz;
  document.getElementById('follow-label-2').textContent = t.followLabel2;
  document.getElementById('follow-link-zensei').textContent = t.followLinkZensei;
  document.getElementById('follow-link-shugorei').textContent = t.followLinkShugorei;
  document.getElementById('follow-label-3').textContent = t.followLabel3;
  document.getElementById('footer-pr').textContent = t.footerPr;
  document.getElementById('footer-disclaimer').textContent = t.footerDisclaimer;
  document.getElementById('footer-privacy').textContent = t.footerPrivacy;
  document.getElementById('footer-nichishu-link').textContent = t.footerNichishuLink;
  document.documentElement.lang = LANG;
  // 結果画面が表示中に切り替えた場合、鑑定結果(言語依存のテキスト)を再計算してから再描画する
  if (lastResult) {
    applyResult(lastResult.pillars);
  }
}
function setLang(lang) {
  LANG = lang;
  document.getElementById('btn-lang-ja').classList.toggle('active', lang === 'ja');
  document.getElementById('btn-lang-en').classList.toggle('active', lang === 'en');
  applyLangUI();
}
document.getElementById('btn-lang-ja').addEventListener('click', () => setLang('ja'));
document.getElementById('btn-lang-en').addEventListener('click', () => setLang('en'));

document.getElementById('btn-start').addEventListener('click', startDivination);
document.getElementById('btn-restart').addEventListener('click', restart);
document.getElementById('btn-share').addEventListener('click', shareResult);
document.getElementById('btn-share-line').addEventListener('click', shareResultLine);
document.getElementById('btn-copy-url').addEventListener('click', copyResultUrl);

// 結果URL(?r=符号)で直接開かれた場合は、その場で同じ結果を再現して表示する
// (符号の末尾1文字に埋め込まれた表示言語も復元する。旧形式の符号(言語なし)は従来通りja扱い)
(function loadFromResultCode() {
  const code = new URLSearchParams(location.search).get('r');
  if (!code) return;
  const pillars = decodeResultCode(code);
  if (!pillars) {
    // 不正な結果コード。<head>のインラインスクリプトが誤って先読み表示していた場合に備え、
    // 通常のスタート画面に戻す(CSSの`html.deep-link-result`によるresult強制表示を解除)。
    document.documentElement.classList.remove('deep-link-result');
    showBirthdateError('結果を読み込めませんでした。もう一度、生年月日から占ってごらんなさい。');
    return;
  }
  if (pillars.lang) {
    LANG = pillars.lang;
    document.getElementById('btn-lang-ja').classList.toggle('active', LANG === 'ja');
    document.getElementById('btn-lang-en').classList.toggle('active', LANG === 'en');
    applyLangUI();
  }
  applyResult(pillars);
})();

// ===== アクセス解析(任意) =====
// GA4の測定IDが決まったらここに設定してください(空文字の間は何も読み込みません、追加コストなし)
const GA_MEASUREMENT_ID = 'G-NHH50DVLVN';
// ローカル開発サーバー(_devserver.ps1)からのアクセスを除外するガード。
// これがないと動作確認のたびに本番GA4にダミーのpageview/eventが記録されてしまう(2026-08-28判明)。
const isLocalDev = ['localhost', '127.0.0.1', ''].includes(location.hostname);
if (GA_MEASUREMENT_ID && !isLocalDev) {
  const gaScript = document.createElement('script');
  gaScript.async = true;
  gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(gaScript);
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag('js', new Date());
  // 結果URL(?r=符号)がそのままGoogleへ送信されないよう、クエリ文字列を除いたURLで計測する
  gtag('config', GA_MEASUREMENT_ID, { page_location: location.origin + location.pathname });
}
