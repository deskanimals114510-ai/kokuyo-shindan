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
    work: '仕事では、指示を待つより自分で切り拓く立場で伸びるタイプ。裁量を持たせれば持たせるほど成果を出すから、リーダーや独立の道を恐れないことね。ただし、まっすぐ進むあまり周りの声が耳に入らなくなる癖がある。振り返ったら誰もいなかった、なんて事態だけは避けなさい。',
    love: '恋愛は、好きになったら脇目もふらず一直線。駆け引きなんて器用な真似はできないでしょう。その誠実さは何よりの武器だけど、押す一方では相手が息切れするわ。時には立ち止まって、相手の歩幅に合わせる優しさを覚えなさい。',
    relationships: '人間関係では、裏表がなく約束を違えないから、「あの人が言うなら」と信頼を集めるタイプ。ただ、自分の正しさを物差しにして人を測る癖があるわね。人にはそれぞれの事情と弱さがあるの。それを裁かずに受け止められた時、あなたの木陰はもっと多くの人の休み場所になるわ。広く浅くより、深く根を絡ませ合える少数を大事にしなさい。',
    advice: '折れない木より、しなれる木の方が長く生きるのよ。強情と芯の強さを、履き違えないことね。',
    lucky: { emoji: '🪴', name: '観葉植物', keyword: '観葉植物 卓上 ミニ' },
  },
  1: { // 乙
    title: '草花', reading: 'きのと',
    line: 'あなたは、乙(きのと)。踏まれても翌朝には立ち上がる草花よ。',
    desc: '一見か弱そうに見えて、その実、誰よりも粘り強い人。強風には逆らわず身を伏せて、嵐が過ぎればまた顔を上げる。そのしなやかさこそ、あなたの生き抜く知恵よ。どんな環境に植え替えられても、いつの間にか根づいてしまう適応力は天賦のもの。ただね、周りに合わせることが上手すぎて、「本当は自分がどう咲きたいのか」を見失う瞬間があるでしょう。譲ってばかりの優しさは、いつしか周りに甘えられるだけの都合の良さに変わるの。折れない草には、静かな意地があるものよ。時には風に逆らって、あなた自身の色で咲きなさい。',
    work: '仕事では、チームの隙間を埋める調整役として、なくてはならない存在になるタイプ。空気を読み、角を立てずに物事を進める力は立派な才能よ。ただ、意見を求められた場面でまで一歩引いていると、その働きは誰にも見えないまま。ここぞという時は、はっきり言葉にしなさい。',
    love: '恋愛では、相手の色に染まりやすく、気づけば自分を見失っているタイプ。顔色をうかがうだけの関係は、いずれあなたを枯らすわよ。素のあなたを見せても離れない相手、むしろ水をくれる相手。選ぶべきは、そういう人よ。',
    relationships: '人間関係では、誰とでも波風を立てずにやっていける器用さがあるタイプ。嫌われることがほとんどない代わりに、誰とも本当には深まらない。その距離の取り方に、心当たりがあるでしょう。合わせる相手と、本音を預ける相手は分けなさい。あなたの柔らかさは、安売りするものじゃないの。信じられる少数にだけ、根の深いところを見せればいいのよ。',
    advice: '譲るのと、諦めるのは別物よ。ここだけは、と思う場所では我を通しなさい。',
    lucky: { emoji: '🍵', name: 'ハーブティーセット', keyword: 'ハーブティー ギフトセット' },
  },
  2: { // 丙
    title: '太陽', reading: 'ひのえ',
    line: 'あなたは、丙(ひのえ)。何もかも照らし出す真昼の太陽よ。',
    desc: '隠そうとしても隠しきれない、生まれつきの華がある人。喜怒哀楽がそのまま顔に出て、その裏表のなさが周りの心まで明るくするの。あなたが部屋に入るだけで空気が変わる、そんな経験があるでしょう。ただね、太陽は沈むところを人に見せないもの。人前で輝くほどに、一人になった夜の静けさが応えるはずよ。熱しやすく冷めやすいのも、常に燃えていないと不安だから。でも、照らし続けるためには、自分を休ませる時間が要るの。誰も見ていない場所で充電することを、後ろめたく思わないことね。翳りも含めて、あなたは太陽なのよ。',
    work: '仕事では、人前に立つ・発信する・場を沸かせる役割で本領を発揮するわ。営業や企画、表舞台の仕事とは相性抜群よ。ただ、日の当たらない地道な作業になると、途端に燃料切れを起こすでしょう。派手さのない仕事をやり切る力こそ、あなたの輝きを本物にするの。',
    love: '恋愛は、一目惚れの電撃型。燃え上がるのは早いけれど、冷めるのも早い。相手を「本当に愛されているの?」と不安にさせた経験があるはずよ。恋の始まりの熱より、日常を照らし続ける根気。あなたに試されるのは、そこね。',
    relationships: '人間関係では、気づけば輪の中心にいるタイプ。初対面の壁など無いに等しく、誰とでもすぐ打ち解けられるわ。ただ、その明るさが眩しすぎて、あなたの陰の部分に気づく人は少ないの。「悩みなんて無さそう」と言われて、少し寂しかったことがあるでしょう。弱音を見せられる相手を、一人でいいから確保しておきなさい。それがあなたの命綱になるのよ。',
    advice: '沈まない太陽はないの。休むことも、輝きのうちよ。',
    lucky: { emoji: '🕶️', name: 'サングラス', keyword: 'サングラス おしゃれ' },
  },
  3: { // 丁
    title: '灯火', reading: 'ひのと',
    line: 'あなたは、丁(ひのと)。闇の中でこそ美しく揺れる灯火よ。',
    desc: '物静かな佇まいの奥に、誰にも消せない炎を隠している人。感受性が鋭く、人の心の機微を細部まで感じ取ってしまう。だから傷つきやすいし、人一倍疲れやすいのよ。周りには「何を考えているかわからない」と言われても、実際はその場の誰よりも深く考え、深く感じている。太陽のように万人を照らす必要はないの。灯火の光は、暗闇にいる誰か一人の足元を照らすためにあるもの。それがあなたの役目よ。ただ、内に秘めた熱は、表に出さなければ無いのと同じに扱われてしまう。想いの一割でいいから、言葉と行動にして見せなさい。',
    work: '仕事では、一つの分野をじっくり掘り下げる専門的な仕事や、少人数で丁寧に取り組む仕事が向いているわ。派手に目立つより、静かに信頼を積み上げていくタイプ。無理に社交的な役回りを演じると芯から消耗するから、自分の燃え方を守れる環境を選びなさい。',
    love: '恋愛では、心の扉を開くまでに時間がかかる分、一度開いた相手には深く、静かに、長く尽くすタイプ。ただ、不満や寂しさを溜め込んで、ある日ふっと火が消えるように離れたくなる癖があるでしょう。小出しに吐き出すことを覚えなさい。',
    relationships: '人間関係は、狭く、深く。心を許した数人との絆は、他の誰にも真似できない濃さを持つわ。一方で、大人数の集まりでは灯りが薄まるように存在感が消えるでしょう。でも、それを欠点だと思わないことね。あなたの価値は、一対一の静けさの中でこそ光るの。無理に輪の中心を目指すより、あなたの火を必要としている一人のそばにいなさい。',
    advice: 'その繊細さは弱さじゃない、感度の高さよ。鈍感なふりで自分を殺さないことね。',
    lucky: { emoji: '🕯️', name: 'アロマキャンドル', keyword: 'アロマキャンドル ギフト' },
  },
  4: { // 戊
    title: '山', reading: 'つちのえ',
    line: 'あなたは、戊(つちのえ)。千年動かぬ、悠然たる山よ。',
    desc: '多少の嵐ではびくともしない、生まれついての安定感がある人。周りが浮き足立つ場面ほど、あなたの静けさが皆の錨になるの。「あの人がいると安心する」、そう言われてきたでしょう。ただ、動かない山は、裏を返せば自分からは動かない山でもある。慣れた場所、慣れたやり方に根を下ろしすぎて、変化への一歩が億劫になっていないかしら。でもね、あなたが一度腹を決めた時の実行力は、誰にも真似できないほど大きいのよ。周りが「まさかあの人が」と驚く決断を、静かに下せる人。その力を、守りだけでなく攻めにも使いなさい。',
    work: '仕事では、長期戦でこそ光るタイプ。コツコツ積み上げる仕事や、責任を預かる管理的な立場が性に合うわ。方針がころころ変わる職場や、スピード一辺倒の環境は消耗するだけ。ただ、石橋を叩きすぎて好機を逃す癖があるわね。たまには叩かずに渡る勇気も持ちなさい。',
    love: '恋愛は、時間をかけて信頼を積む堅実型。浮ついた関係には興味がなく、腰を据えた安定を求めるタイプよ。ただ、想いを言葉にするのが苦手で、「私のこと、どう思っているの?」と相手を不安にさせがち。山は黙っていても動かないけれど、人の心は言葉がないと離れていくのよ。',
    relationships: '人間関係では、口数は少なくとも、その動じなさで自然と頼られるタイプ。ただ、自分から歩み寄るのは苦手で、待ちの姿勢になりがちね。実はじっくり相手を観察して、信頼に足る人かを静かに見極めているのでしょう。一度懐に入れた相手への義理堅さは、山のごとし。その懐の深さをもっと知ってもらうためにも、たまには自分から声をかけなさい。それだけで関係は動き出すわ。',
    advice: '守りの固さは十分よ。あとは一歩、自分から外へ踏み出すだけね。',
    lucky: { emoji: '☕', name: '陶器のマグカップ', keyword: '陶器 マグカップ' },
  },
  5: { // 己
    title: '田畑', reading: 'つちのと',
    line: 'あなたは、己(つちのと)。蒔かれた種を残らず育て上げる、豊かな田畑よ。',
    desc: '人を育て、支えることに天性の才を持つ人。あなたの何気ない一言や手助けに救われた人は、あなたが思っているより、ずっと多いのよ。土が黙って作物を育てるように、見返りを求めず尽くせるのがあなたの器。ただね、土だって痩せるの。栄養を与え続けるばかりで、自分自身を耕すことを忘れていないかしら。誰かの実りを喜んでいるうちに、ふと「自分の人生はどこにあるの」と虚しくなる夜が来るはずよ。人に注ぐ愛情の二割でいい、自分に向けなさい。あなたという畑が肥えてこそ、育てられる実りも大きくなるのだから。',
    work: '仕事では、育てる・支える・まとめる役割で真価を発揮するタイプ。教育や人材育成、サポート職、縁の下の要となる仕事と相性がいいわ。ただ、手柄を人に譲る癖のせいで、正当な評価を取りこぼしがち。成果は自分の口で伝えなさい。それは自慢ではなく、報告よ。',
    love: '恋愛では、尽くすことに幸せを感じるタイプ。ただ、世話を焼きすぎると、恋人ではなく保護者になってしまうわよ。「してあげる」ばかりの関係は、対等とは言えない。あなたの望みも口に出しなさい。甘える側に回れて初めて、釣り合いが取れるのよ。',
    relationships: '人間関係では、聞き役・支え役が板についているタイプ。頼られると断れず、気づけば皆の相談窓口になっているでしょう。でも、あなた自身が弱った時、周りは案外気づかないの。いつも元気そうに見えるからよ。「実は疲れている」「今日は無理」と言えるようになりなさい。弱さを見せるのは、相手を信頼している証。それを渡された相手は、むしろ嬉しいものよ。',
    advice: '与えるだけの畑は、いつか痩せるの。あなたも誰かに耕されなさい。',
    lucky: { emoji: '👝', name: 'ポーチ・小物入れ', keyword: 'ポーチ おしゃれ 収納' },
  },
  6: { // 庚
    title: '刃', reading: 'かのえ',
    line: 'あなたは、庚(かのえ)。曇りなく研ぎ澄まされた刃よ。',
    desc: '曖昧なものを曖昧なままにしておけない、切れ味鋭い人。白か黒か、正しいか間違いか。その明快さと決断の速さは、迷いだらけの世の中で得がたい強さよ。皆が言いよどむことを、あなたは真っ先に口にできる。ただね、よく切れる刃ほど、振るう場所を選ばなければ人を傷つけるの。あなたの「正しさ」は、いつも誰かの「事情」を切り捨てていないかしら。刃の本当の価値は、何を切るかではなく、何を切らずにおくかで決まるのよ。抜くべき時と、鞘に収めておくべき時。その見極めができた時、あなたは本物になるわ。',
    work: '仕事では、決断と実行が求められる局面でこそ輝くタイプ。交渉ごとや、膿を出し切るべき場面での判断力は誰にも負けないわ。なあなあで進む組織には強い苛立ちを感じるでしょう。ただ、正論は言い方ひとつで薬にも刃にもなる。切り口の美しさにも、こだわりなさい。',
    love: '恋愛では、駆け引き抜きの直球勝負。思ったことをそのまま口にするから、誠実と取られることもあれば、鋭すぎると距離を置かれることもあるでしょう。好きな相手にこそ、刃を置いて素手で触れなさい。優しい言葉は、あなたが思うより効くのよ。',
    relationships: '人間関係では、はっきり物を言う分、敵と味方がくっきり分かれるタイプ。でも、それでいいの。八方美人より、よほど信頼される生き方よ。あなたに苦言を呈してほしいと願う人すらいるはず。それだけ、言葉に嘘がないということだから。ただ、味方への感謝は案外伝えていないでしょう。守りたいものの名前は、口に出して言いなさい。',
    advice: '本当に強い刃は、めったに抜かれないものよ。',
    lucky: { emoji: '🥤', name: 'ステンレスタンブラー', keyword: 'ステンレスタンブラー おしゃれ' },
  },
  7: { // 辛
    title: '宝石', reading: 'かのと',
    line: 'あなたは、辛(かのと)。幾多の研磨に耐えて生まれた宝石よ。',
    desc: '鋭い美意識と、繊細な感性を併せ持つ人。人が見過ごす小さな綻びに真っ先に気づき、細部まで完璧を求めてしまう。その厳しさは、まず誰より自分自身に向かうでしょう。傷つきやすいのに、傷ついた顔を人に見せたくない。プライドの高さと打たれ弱さが同居しているのが、あなたの複雑なところよ。でもね、宝石が輝くのは、削られた過去があるからなの。あなたが恥じているその傷こそ、光を美しく乱反射させる面になっている。完璧である必要はないわ。他人に向ける採点の、半分の甘さで自分を採点しなさい。',
    work: '仕事では、細部の精度が問われる仕事や、美的センスを活かせる分野で光るタイプ。雑な仕事が許せない性分は、品質そのものであなたの名を高めるわ。ただ、基準が高すぎて、自分も周りも息切れさせがち。「八割で出す」勇気も、時には必要よ。',
    love: '恋愛では、理想が高く、簡単には妥協しないタイプ。素直になりたいのに、プライドが先に立って可愛げのない一言を選んでしまう夜があるでしょう。でもね、弱さを見せられる相手にだけは、飾らないあなたでいなさい。磨く前の素肌にこそ、本当の価値があるのよ。',
    relationships: '人間関係は、選び抜いた少数と深く。誰にでも心を開かないから「近寄りがたい」と言われがちだけど、恥じることはないわ。宝石は、路傍に転がっていないものよ。実際に打ち解けた相手は、あなたが誰より情に厚く、義理堅いことを知っているはず。心を開くのに時間がかかるのは欠点ではなく、それだけ本気で人と向き合う証。焦らず、あなたの速度で磨き合える相手を選びなさい。',
    advice: '傷を恥じないことね。その傷が、あなたの輝きの角度を作ったのよ。',
    lucky: { emoji: '💍', name: 'アクセサリー', keyword: 'アクセサリー シンプル' },
  },
  8: { // 壬
    title: '大海', reading: 'みずのえ',
    line: 'あなたは、壬(みずのえ)。岸に縛られず地平まで広がる大海よ。',
    desc: 'スケールが大きく、何より自由を愛する人。一つの場所、一つの正解に留まることが性に合わないでしょう。常識の枠を平然と越えていく発想力と行動力は、周りには真似のできない魅力よ。ただね、海は満ちれば引くもの。その気まぐれな潮の満ち引きが、「あの人は掴めない」という不信に変わることもあるはずよ。器の大きさは本物。だからこそ惜しいの、一つの場所に腰を据えてやり抜いた経験の少なさが。流れ続けるだけの水は、何も満たせないわ。一度でいいから、あなたの全部を注ぎ込む港を決めてみなさい。',
    work: '仕事では、決まりきった毎日より、変化と刺激のある環境で生きるタイプ。複数の物事を同時に回す器用さと、常識外れの発想力が武器よ。ただし、軌道に乗る手前で飽きて手放す癖が最大の敵。始めたことを最後まで見届けた数だけ、あなたの信用は積み上がるの。',
    love: '恋愛では、束縛が何より苦手な自由人。追われると引き、離れられると追いたくなる困った性分でしょう。相手は「本気なの?」と不安なはずよ。自由でいたいなら、その分、言葉の錨を打ちなさい。「大丈夫、離れない」の一言が、あなたの自由を守るのよ。',
    relationships: '人間関係では、誰とでも気さくにやれる社交性の持ち主。人脈は海のように広がるけれど、深入りは巧みに避けているでしょう。特定の誰かに寄りかかることを、無意識に恐れているのよ。でもね、どんな大海にも深いところがあるように、あなたの深部を知る人が一人もいないのは寂しすぎるわ。信頼できる相手には、浅瀬より奥へ招き入れなさい。',
    advice: '広さは十分。次は深さよ。一つの港に、錨を下ろしてごらんなさい。',
    lucky: { emoji: '🧳', name: '旅行用ポーチ', keyword: 'トラベルポーチ 旅行 収納' },
  },
  9: { // 癸
    title: '雨露', reading: 'みずのと',
    line: 'あなたは、癸(みずのと)。音もなく大地に染み入る雨露よ。',
    desc: '多くを語らず、静かに周りを観察している人。その瞳は、人が隠したつもりの本音や、場の空気のわずかな変化まで見抜いているでしょう。鋭い直感と深い知性。それがあなたの水源よ。ただ、雨露は静かすぎて、そこにあることに誰も気づかないの。あなたの中には、言葉にされないまま眠っている洞察が湖ほど溜まっているはずよ。「察してもらう」のを待つのは、もうやめなさい。あなたが黙っている限り、その知性は無いものと同じに扱われる。静かな水ほど、口を開いた時の一滴が深く響くもの。その一滴を、惜しまないことね。',
    work: '仕事では、調査・分析・企画の裏側など、深く考える仕事で真価を発揮するタイプ。あなたの出す答えの質は、声の大きい人たちの十歩先を行っているはずよ。ただ、黙っていては誰にも届かない。会議で一度、あなたから口火を切ってごらんなさい。周りの目が変わるわ。',
    love: '恋愛では、本音を見せず、察してもらうのを待ちがちなタイプ。でもね、言わない想いは、無い想いと同じに扱われるのが恋というものよ。百の察しを期待するより、一つの言葉を渡しなさい。あなたの静かな一言は、思うよりずっと深く相手に染みるわ。',
    relationships: '人間関係では、聞き上手で、相手の本音を自然と引き出してしまうタイプ。皆あなたに話を聞いてほしがるのに、あなたの話を聞いてくれる人には出会えていないでしょう。それはあなたが、自分の話をする隙を与えていないからよ。謎めいた人のままでは、誰もあなたを支えられないの。信頼できる相手には、あなたの雨を降らせてみなさい。',
    advice: '黙っていても伝わる、は幻想よ。大事な一滴ほど、声にして落としなさい。',
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
  applyResult(pillars);
}

// 生年月日そのものではなく、干支インデックスだけをURLに載せて結果を再現するための符号化
// (birthdateをそのままURLに残さないためのプライバシー配慮)
function buildResultCode(pillars) {
  const y = STEMS.indexOf(pillars.year.stem);
  const m = STEMS.indexOf(pillars.month.stem);
  const h = pillars.hour ? STEMS.indexOf(pillars.hour.stem) : 'x';
  return `${pillars.day.stemIdx}${y}${m}${h}`;
}

function decodeResultCode(code) {
  if (!/^[0-9][0-9][0-9]([0-9]|x)$/.test(code)) return null;
  const dayIdx = Number(code[0]);
  const yearIdx = Number(code[1]);
  const monthIdx = Number(code[2]);
  const hourPart = code[3];
  return {
    day: { stem: STEMS[dayIdx], branch: '', stemIdx: dayIdx },
    year: { stem: STEMS[yearIdx], branch: '' },
    month: { stem: STEMS[monthIdx], branch: '' },
    hour: hourPart === 'x' ? null : { stem: STEMS[Number(hourPart)], branch: '' },
  };
}

function resultUrl() {
  if (!lastResult) return location.href;
  return location.origin + location.pathname + '?r=' + buildResultCode(lastResult.pillars);
}

function applyResult(pillars) {
  const type = DAY_MASTER_TYPES[pillars.day.stemIdx];
  lastResult = { pillars, type };

  document.getElementById('result-line').textContent = type.line;
  document.getElementById('result-desc').textContent = type.desc;
  document.getElementById('result-work').textContent = type.work;
  document.getElementById('result-love').textContent = type.love;
  document.getElementById('result-relationships').textContent = type.relationships;
  document.getElementById('result-background').textContent = buildBackgroundText(pillars);
  document.getElementById('result-advice').textContent = '【黒曜先生からひとこと】' + type.advice;

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
  const url = 'https://x.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(resultUrl());
  window.open(url, '_blank', 'noopener');
}

function shareResultLine() {
  if (!lastResult) return;
  const text = `黒曜先生に占われました。${lastResult.type.line}`;
  const url = 'https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(resultUrl()) + '&text=' + encodeURIComponent(text);
  window.open(url, '_blank', 'noopener');
}

function copyResultUrl() {
  if (!lastResult) return;
  const btn = document.getElementById('btn-copy-url');
  navigator.clipboard.writeText(resultUrl()).then(() => {
    const original = btn.textContent;
    btn.textContent = 'コピーしました ✓';
    setTimeout(() => { btn.textContent = original; }, 2000);
  });
}

document.getElementById('btn-start').addEventListener('click', startDivination);
document.getElementById('btn-restart').addEventListener('click', restart);
document.getElementById('btn-share').addEventListener('click', shareResult);
document.getElementById('btn-share-line').addEventListener('click', shareResultLine);
document.getElementById('btn-copy-url').addEventListener('click', copyResultUrl);

// 結果URL(?r=符号)で直接開かれた場合は、その場で同じ結果を再現して表示する
(function loadFromResultCode() {
  const code = new URLSearchParams(location.search).get('r');
  if (!code) return;
  const pillars = decodeResultCode(code);
  if (!pillars) return;
  applyResult(pillars);
})();

// ===== アクセス解析(任意) =====
// GA4の測定IDが決まったらここに設定してください(空文字の間は何も読み込みません、追加コストなし)
const GA_MEASUREMENT_ID = 'G-NHH50DVLVN';
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
