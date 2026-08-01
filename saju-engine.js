/* ═══════════════════════════════════════════════════
   이성효의 명리학 - 사주팔자 심화 엔진 v3.0 (5단계 재검토 완료)
   ═══════════════════════════════════════════════════ */

/* ─── 기초 데이터 ─── */
const GANS = [
    { name: '甲', hangul: '갑', ohaeng: 'wood', yinyang: 'yang' },
    { name: '乙', hangul: '을', ohaeng: 'wood', yinyang: 'yin' },
    { name: '丙', hangul: '병', ohaeng: 'fire', yinyang: 'yang' },
    { name: '丁', hangul: '정', ohaeng: 'fire', yinyang: 'yin' },
    { name: '戊', hangul: '무', ohaeng: 'earth', yinyang: 'yang' },
    { name: '己', hangul: '기', ohaeng: 'earth', yinyang: 'yin' },
    { name: '庚', hangul: '경', ohaeng: 'metal', yinyang: 'yang' },
    { name: '辛', hangul: '신', ohaeng: 'metal', yinyang: 'yin' },
    { name: '壬', hangul: '임', ohaeng: 'water', yinyang: 'yang' },
    { name: '癸', hangul: '계', ohaeng: 'water', yinyang: 'yin' }
];

const JIJIS = [
    { name: '子', hangul: '자', ohaeng: 'water', zodiac: '쥐', hiddenGans: ['壬', '癸'] },
    { name: '丑', hangul: '축', ohaeng: 'earth', zodiac: '소', hiddenGans: ['癸', '辛', '己'] },
    { name: '寅', hangul: '인', ohaeng: 'wood', zodiac: '호랑이', hiddenGans: ['戊', '丙', '甲'] },
    { name: '卯', hangul: '묘', ohaeng: 'wood', zodiac: '토끼', hiddenGans: ['甲', '乙'] },
    { name: '辰', hangul: '진', ohaeng: 'earth', zodiac: '용', hiddenGans: ['乙', '癸', '戊'] },
    { name: '巳', hangul: '사', ohaeng: 'fire', zodiac: '뱀', hiddenGans: ['戊', '庚', '丙'] },
    { name: '午', hangul: '오', ohaeng: 'fire', zodiac: '말', hiddenGans: ['丙', '己', '丁'] },
    { name: '未', hangul: '미', ohaeng: 'earth', zodiac: '양', hiddenGans: ['丁', '乙', '己'] },
    { name: '申', hangul: '신', ohaeng: 'metal', zodiac: '원숭이', hiddenGans: ['戊', '壬', '庚'] },
    { name: '酉', hangul: '유', ohaeng: 'metal', zodiac: '닭', hiddenGans: ['庚', '辛'] },
    { name: '戌', hangul: '술', ohaeng: 'earth', zodiac: '개', hiddenGans: ['辛', '丁', '戊'] },
    { name: '亥', hangul: '해', ohaeng: 'water', zodiac: '돼지', hiddenGans: ['戊', '甲', '壬'] }
];

const OHAENG_NAMES = { wood: '木 (목)', fire: '火 (화)', earth: '土 (토)', metal: '金 (금)', water: '水 (수)' };
const OHAENG_KOR = { wood: '목', fire: '화', earth: '토', metal: '금', water: '수' };
const OHAENG_CYCLE = ['wood', 'fire', 'earth', 'metal', 'water'];

function getOhaengRelation(myOhaeng, targetOhaeng) {
    if (myOhaeng === targetOhaeng) return 'same';
    const myIdx = OHAENG_CYCLE.indexOf(myOhaeng);
    const targetIdx = OHAENG_CYCLE.indexOf(targetOhaeng);
    const diff = (targetIdx - myIdx + 5) % 5;
    if (diff === 1) return 'produce';
    if (diff === 2) return 'control';
    if (diff === 3) return 'controlled';
    if (diff === 4) return 'nourish';
    return 'same';
}

const SIPSEONG_MAP = {
    'same_same': '비견', 'same_diff': '겁재',
    'produce_same': '식신', 'produce_diff': '상관',
    'control_same': '편재', 'control_diff': '정재',
    'controlled_same': '편관', 'controlled_diff': '정관',
    'nourish_same': '편인', 'nourish_diff': '정인'
};

function calcSipseong(myGanIdx, targetGanIdx) {
    const my = GANS[myGanIdx];
    const target = GANS[targetGanIdx];
    const relation = getOhaengRelation(my.ohaeng, target.ohaeng);
    const sameYinYang = my.yinyang === target.yinyang;
    let key = relation === 'same' ? (sameYinYang ? 'same_same' : 'same_diff') : relation + (sameYinYang ? '_same' : '_diff');
    return SIPSEONG_MAP[key] || '비견';
}

/* ═══════════════════════════════════════════
   1단계: 정밀 24절기(節氣) 입절 시각 데이터
   ═══════════════════════════════════════════ */

// 12월절(입춘, 경칩, 청명, 입하, 망종, 소서, 입추, 백로, 한로, 입동, 대설, 소한) 정밀 기준표 (대략적 평균 절기일시)
const JEOLGI_MONTH_NAMES = ['소한', '입춘', '경칩', '청명', '입하', '망종', '소서', '입추', '백로', '한로', '입동', '대설'];

function getExactMonthJiIdx(year, month, day, hour = 12) {
    const dateMDH = month * 10000 + day * 100 + hour;

    // 입절 기준 시각 (월별 MMDDHH)
    // 1월: 소한(1/6 06시), 2월: 입춘(2/4 11시), 3월: 경칩(3/6 05시), 4월: 청명(4/5 09시)
    // 5월: 입하(5/6 03시), 6월: 망종(6/6 01시), 7월: 소서(7/7 18시), 8월: 입추(8/8 04시)
    // 9월: 백로(9/8 03시), 10월: 한로(10/8 10시), 11월: 입동(11/7 14시), 12월: 대설(12/7 07시)
    
    if (dateMDH < 10606) return 0; // 소한 전 (자월 -> 축월 연장)
    if (dateMDH < 20411) return 1; // 입춘 전 (축월)
    if (dateMDH < 30605) return 2; // 경칩 전 (인월)
    if (dateMDH < 40509) return 3; // 청명 전 (묘월)
    if (dateMDH < 50603) return 4; // 입하 전 (진월)
    if (dateMDH < 60601) return 5; // 망종 전 (사월)
    if (dateMDH < 70718) return 6; // 소서 전 (오월)
    if (dateMDH < 80804) return 7; // 입추 전 (미월)
    if (dateMDH < 90803) return 8; // 백로 전 (신월)
    if (dateMDH < 100810) return 9; // 한로 전 (유월)
    if (dateMDH < 110714) return 10; // 입동 전 (술월)
    if (dateMDH < 120707) return 11; // 대설 전 (해월)
    return 0; // 대설 이후 (자월)
}

function calcYearPillar(year, month, day, hour = 12) {
    let adjustedYear = year;
    const dateMDH = month * 10000 + day * 100 + hour;
    // 입춘(2월 4일 11시경) 전이면 전년도로 계산
    if (dateMDH < 20411) adjustedYear = year - 1;
    const ganIdx = ((adjustedYear - 4) % 10 + 10) % 10;
    const jiIdx = ((adjustedYear - 4) % 12 + 12) % 12;
    return { gan: GANS[ganIdx], ji: JIJIS[jiIdx], ganIdx, jiIdx, year: adjustedYear };
}

function calcMonthPillar(year, month, day, hour, yearGanIdx) {
    const monthBranchIdx = getExactMonthJiIdx(year, month, day, hour);
    const inMonthGan = ((yearGanIdx % 5) * 2 + 2) % 10;
    const monthGanIdx = ((inMonthGan + (monthBranchIdx - 2)) % 10 + 10) % 10;
    return { gan: GANS[monthGanIdx], ji: JIJIS[monthBranchIdx], ganIdx: monthGanIdx, jiIdx: monthBranchIdx };
}

function calcDayPillar(year, month, day) {
    const BASE_DATE = new Date(1900, 0, 1);
    const targetDate = new Date(year, month - 1, day);
    const diff = Math.round((targetDate - BASE_DATE) / (24 * 60 * 60 * 1000));
    const ganIdx = ((diff + 6) % 10 + 10) % 10;
    const jiIdx = ((diff + 0) % 12 + 12) % 12;
    return { gan: GANS[ganIdx], ji: JIJIS[jiIdx], ganIdx, jiIdx };
}

function calcHourPillar(hour24, dayGanIdx) {
    let jiIdx;
    if (hour24 === null || hour24 === undefined || hour24 === '') {
        jiIdx = 0;
    } else {
        const h = parseInt(hour24);
        jiIdx = Math.floor(((h + 1) % 24) / 2);
    }
    const jaSiGan = ((dayGanIdx % 5) * 2) % 10;
    const ganIdx = (jaSiGan + jiIdx) % 10;
    return { gan: GANS[ganIdx], ji: JIJIS[jiIdx], ganIdx, jiIdx };
}

/* ═══════════════════════════════════════════
   2단계: 12운성 (十二運星) 엔진
   ═══════════════════════════════════════════ */

const WUNSEONG_LIST = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양'];

// 각 천간의 장생(長生) 지지 인덱스
const WUNSEONG_START_JI = {
    0: 11, // 甲(양목) -> 亥(11)
    1: 6,  // 乙(음목) -> 午(6) [역행]
    2: 2,  // 丙(양화) -> 寅(2)
    3: 9,  // 丁(음화) -> 酉(9) [역행]
    4: 2,  // 戊(양토) -> 寅(2)
    5: 9,  // 己(음토) -> 酉(9) [역행]
    6: 5,  // 庚(양금) -> 巳(5)
    7: 0,  // 辛(음금) -> 子(0) [역행]
    8: 8,  // 壬(양수) -> 申(8)
    9: 3   // 癸(음수) -> 卯(3) [역행]
};

const WUNSEONG_DESC = {
    '장생': { title: '장생(長生) - 탄생과 발전', desc: '새로운 생명이 태어나는 기운입니다. 후원자가 많고 발전 가능성이 무궁무진합니다.' },
    '목욕': { title: '목욕(沐浴) - 매력과 시련', desc: '자신을 가꾸고 매력을 발산하는 시기입니다. 예술적 호기심이 크나 구설수를 조심해야 합니다.' },
    '관대': { title: '관대(冠帶) - 출세와 열정', desc: '의관을 정제하고 사회로 나아가는 기운입니다. 의욕과 자신감이 넘칩니다.' },
    '건록': { title: '건록(建祿) - 자립과 번영', desc: '독립적인 실력을 갖추고 승승장구하는 완숙한 기운입니다. 재물과 명예가 안정됩니다.' },
    '제왕': { title: '제왕(帝旺) - 정점과 카리스마', desc: '에너지의 정점입니다. 강력한 리더십과 카리스마를 발휘하나 아집을 경계해야 합니다.' },
    '쇠': { title: '쇠(衰) - 온건과 원숙', desc: '정점을 지나 여유와 지혜가 쌓이는 시기입니다. 신중하고 온건한 판단력을 가집니다.' },
    '병': { title: '병(病) - 다감과 동정', desc: '마음이 감성적이고 동정심이 많아집니다. 직관력과 예술적 기질이 발현됩니다.' },
    '사': { title: '사(死) - 침착과 사색', desc: '육체적 활동보다 정신적 사색이 깊어지는 시기입니다. 학문과 연구에 탁월합니다.' },
    '묘': { title: '묘(墓) - 저축과 축적', desc: '기운을 집약하고 창고에 저장하는 시기입니다. 알뜰한 재물 관리와 내실에 강화됩니다.' },
    '절': { title: '절(絶) - 단절과 재도약', desc: '과거와의 완전한 단절 후 새로운 전환점을 맞이하는 역동적인 변화의 기운입니다.' },
    '태': { title: '태(胎) - 잉태와 희망', desc: '새로운 씨앗이 잉태되는 시기입니다. 창의적인 아이디어와 꿈이 싹틉니다.' },
    '양': { title: '양(養) - 양육과 조력', desc: '부모의 보호 속에 자라나는 안정된 기운입니다. 주변의 보살핌과 평화가 따릅니다.' }
};

function calc12Wunseong(dayGanIdx, targetJiIdx) {
    const isYang = GANS[dayGanIdx].yinyang === 'yang';
    const startJi = WUNSEONG_START_JI[dayGanIdx];
    let offset;
    if (isYang) {
        offset = (targetJiIdx - startJi + 12) % 12;
    } else {
        offset = (startJi - targetJiIdx + 12) % 12;
    }
    const name = WUNSEONG_LIST[offset];
    return { name, detail: WUNSEONG_DESC[name] };
}

/* ═══════════════════════════════════════════
   3단계: 12신살 (十二神殺) & 특수 신살 DB
   ═══════════════════════════════════════════ */

const SINSAL_12_LIST = ['겁살', '재살', '천살', '지살', '년살(도화)', '월살', '망신살', '장성살', '반안살', '역마살', '육해살', '화개살'];

const SINSAL_12_DESC = {
    '겁살': '재물이나 기회를 빼앗기거나 강한 경쟁을 겪는 기운이나, 이를 극복하면 커다란 권력을 쥡니다.',
    '재살': '꾀와 순발력이 뛰어나 위기를 지혜롭게 모면하며 수완이 좋습니다.',
    '천살': '하늘의 뜻과 같은 예상치 못한 변수를 의미하며, 겸손함으로 대처해야 합니다.',
    '지살': '자주 이동하거나 밖으로 활동 범위를 넓히는 긍정적인 변동의 기운입니다.',
    '년살(도화)': '대중의 시선을 사로잡는 강력한 매력과 인기, 예술적 기질을 뜻합니다.',
    '월살': '어두운 밤에 달빛을 만나는 형국으로, 어려움 속에서 의외의 조력자를 만납니다.',
    '망신살': '자신의 치부가 드러나거나 과감한 모험으로 주위의 주목을 받습니다.',
    '장성살': '군대의 장군처럼 리더십과 주도권을 쥐고 당당하게 승리하는 기운입니다.',
    '반안살': '말 안장 위에 오르는 형국으로 안정된 지위와 편안한 출세를 의미합니다.',
    '역마살': '원거리 이동, 해외 연통, 활발한 유통과 개척의 강력한 에너지입니다.',
    '육해살': '여섯 가지 해로움을 경계하되, 정신적인 기도와 명상으로 인성을 도모합니다.',
    '화개살': '학문, 예술, 종교, 철학의 깊은 개화(開花)를 뜻하며 재능이 명성을 얻습니다.'
};

function calc12Sinsal(baseJiIdx, targetJiIdx) {
    // baseJiIdx (년지 또는 일지) 삼합 그룹 파악
    let groupStartJi;
    // 申子辰 (8, 0, 4) -> 巳(5) 시작
    if ([8, 0, 4].includes(baseJiIdx)) groupStartJi = 5;
    // 寅午戌 (2, 6, 10) -> 亥(11) 시작
    else if ([2, 6, 10].includes(baseJiIdx)) groupStartJi = 11;
    // 巳酉丑 (5, 9, 1) -> 寅(2) 시작
    else if ([5, 9, 1].includes(baseJiIdx)) groupStartJi = 2;
    // 亥卯未 (11, 3, 7) -> 申(8) 시작
    else groupStartJi = 8;

    const offset = (targetJiIdx - groupStartJi + 12) % 12;
    const name = SINSAL_12_LIST[offset];
    return { name, desc: SINSAL_12_DESC[name] };
}

function calcSpecialSinsals(dayGanIdx, pillars) {
    const specials = [];
    const ganName = GANS[dayGanIdx].name;

    pillars.forEach((p, idx) => {
        const jiName = p.ji.name;
        const ganJiCombo = `${p.gan.name}${p.ji.name}`;

        // 천을귀인 (天乙貴人)
        const cheonEulMap = { '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'], '乙': ['子', '申'], '己': ['子', '申'], '丙': ['亥', '酉'], '丁': ['亥', '酉'], '辛': ['午', '寅'], '壬': ['卯', '巳'], '癸': ['卯', '巳'] };
        if (cheonEulMap[ganName] && cheonEulMap[ganName].includes(jiName)) {
            specials.push({ name: '천을귀인(天乙貴人)', location: `${idx === 0 ? '년' : idx === 1 ? '월' : idx === 2 ? '일' : '시'}지`, desc: '최고의 길신으로 위기에서 귀인의 도움을 받아 화를 복으로 바꿉니다.' });
        }

        // 문창귀인 (文昌貴人)
        const munChangMap = { '甲': '巳', '乙': '午', '丙': '申', '戊': '申', '丁': '酉', '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯' };
        if (munChangMap[ganName] === jiName) {
            specials.push({ name: '문창귀인(文昌貴人)', location: `${idx === 0 ? '년' : idx === 1 ? '월' : idx === 2 ? '일' : '시'}지`, desc: '학문과 글재주가 뛰어나고 지혜롭며 시험운과 명예운이 길합니다.' });
        }

        // 백호대살 (白虎大殺)
        const baekHoList = ['甲辰', '乙未', '丙戌', '丁丑', '戊辰', '壬戌', '癸丑'];
        if (baekHoList.includes(ganJiCombo)) {
            specials.push({ name: '백호대살(白虎大殺)', location: `${idx === 0 ? '년' : idx === 1 ? '월' : idx === 2 ? '일' : '시'}주`, desc: '강렬한 추진력과 카리스마를 지니며 전문가로서 대성할 자질입니다.' });
        }

        // 괴강살 (魁罡殺)
        const goeGangList = ['戊戌', '庚辰', '庚戌', '壬辰', '壬戌'];
        if (goeGangList.includes(ganJiCombo)) {
            specials.push({ name: '괴강살(魁罡殺)', location: `${idx === 0 ? '년' : idx === 1 ? '월' : idx === 2 ? '일' : '시'}주`, desc: '용맹하고 총명하며 대중을 이끄는 과감한 리더십의 살입니다.' });
        }
    });

    return specials;
}

/* ═══════════════════════════════════════════
   4단계: 형·충·파·해·합 매트릭스 심화 분석
   ═══════════════════════════════════════════ */

function analyzeRelations(pillars) {
    const relations = [];
    const names = ['년주', '월주', '일주', '시주'];

    const YUK_HAP = { 0: 1, 1: 0, 2: 11, 11: 2, 3: 10, 10: 3, 4: 9, 9: 4, 5: 8, 8: 5, 6: 7, 7: 6 };
    const YUK_CHUNG = { 0: 6, 6: 0, 1: 7, 7: 1, 2: 8, 8: 2, 3: 9, 9: 3, 4: 10, 10: 4, 5: 11, 11: 5 };
    const WON_JIN = { 0: 7, 7: 0, 1: 6, 6: 1, 2: 9, 9: 2, 3: 8, 8: 3, 4: 11, 11: 4, 5: 10, 10: 5 };

    for (let i = 0; i < pillars.length; i++) {
        for (let j = i + 1; j < pillars.length; j++) {
            const ji1 = pillars[i].jiIdx;
            const ji2 = pillars[j].jiIdx;

            if (YUK_HAP[ji1] === ji2) {
                relations.push({ type: '육합(六合)', desc: `${names[i]} 지지(${pillars[i].ji.hangul})와 ${names[j]} 지지(${pillars[j].ji.hangul})가 육합하여 화합과 기쁨을 형성합니다.` });
            }
            if (YUK_CHUNG[ji1] === ji2) {
                relations.push({ type: '육충(六沖)', desc: `${names[i]} 지지(${pillars[i].ji.hangul})와 ${names[j]} 지지(${pillars[j].ji.hangul})가 충돌하여 역동적 변화와 역경 극복을 암시합니다.` });
            }
            if (WON_JIN[ji1] === ji2) {
                relations.push({ type: '원진살(怨嗔殺)', desc: `${names[i]}와 ${names[j]} 사이에 원진의 기운이 있어 섬세한 감정 관리가 요구됩니다.` });
            }
        }
    }
    return relations;
}

/* ═══════════════════════════════════════════
   5단계: 신강/신약, 용신/희신 & 격국 분석 엔진
   ═══════════════════════════════════════════ */

function evaluateStrengthAndYongshin(dayGan, pillars, ohaengCount) {
    const myOhaeng = dayGan.ohaeng;
    const sameOhaeng = myOhaeng;
    
    // 인성(나를 생하는 오행)
    const nourishOhaeng = OHAENG_CYCLE[(OHAENG_CYCLE.indexOf(myOhaeng) + 4) % 5];

    let score = 0;
    
    // 월지 득령 (+40점)
    if (pillars[1].ji.ohaeng === sameOhaeng || pillars[1].ji.ohaeng === nourishOhaeng) {
        score += 40;
    }
    // 일지 득지 (+20점)
    if (pillars[2].ji.ohaeng === sameOhaeng || pillars[2].ji.ohaeng === nourishOhaeng) {
        score += 20;
    }
    // 타 천간/지지 득세 (개당 +10점)
    [pillars[0], pillars[3]].forEach(p => {
        if (p.gan.ohaeng === sameOhaeng || p.gan.ohaeng === nourishOhaeng) score += 10;
        if (p.ji.ohaeng === sameOhaeng || p.ji.ohaeng === nourishOhaeng) score += 10;
    });

    const isStrong = score >= 50;
    const strengthText = isStrong ? '신강(身強) 사주' : '신약(身弱) 사주';
    const strengthDesc = isStrong 
        ? '일간의 기운이 강하여 자기주관이 뚜렷하고 추진력이 뛰어납니다. 재성과 관성을 적극 활용하는 것이 길합니다.'
        : '일간의 기운이 다소 안으로 보존되어 주변의 조력과 인성(학문/덕망)을 흡수할 때 큰 성공을 이룹니다.';

    // 용신 구하기
    let yongshinOhaeng, heeshinOhaeng;
    if (isStrong) {
        // 신강 -> 식상, 재성, 관성이 용신
        yongshinOhaeng = OHAENG_CYCLE[(OHAENG_CYCLE.indexOf(myOhaeng) + 2) % 5]; // 재성
        heeshinOhaeng = OHAENG_CYCLE[(OHAENG_CYCLE.indexOf(myOhaeng) + 1) % 5]; // 식상
    } else {
        // 신약 -> 인성, 비겁이 용신
        yongshinOhaeng = nourishOhaeng; // 인성
        heeshinOhaeng = sameOhaeng; // 비겁
    }

    // 격국 도출 (월지 기준)
    const monthJi = pillars[1].ji;
    const mainHiddenGan = monthJi.hiddenGans[monthJi.hiddenGans.length - 1];
    const hiddenGanIdx = GANS.findIndex(g => g.name === mainHiddenGan);
    const gyeokgukSipseong = calcSipseong(dayGan.ganIdx || GANS.findIndex(g => g.name === dayGan.name), hiddenGanIdx);
    const gyeokgukName = `${gyeokgukSipseong}격(格局)`;

    return {
        score,
        isStrong,
        strengthText,
        strengthDesc,
        yongshin: OHAENG_NAMES[yongshinOhaeng],
        heeshin: OHAENG_NAMES[heeshinOhaeng],
        gyeokguk: gyeokgukName
    };
}

/* ═══════════════════════════════════════════
   통합 메인 계산 함수
   ═══════════════════════════════════════════ */

function calculateSajuAdvanced(year, month, day, hour, gender) {
    const yearPillar = calcYearPillar(year, month, day, hour);
    const monthPillar = calcMonthPillar(year, month, day, hour, yearPillar.ganIdx);
    const dayPillar = calcDayPillar(year, month, day);
    const hourVal = hour !== '' ? parseInt(hour) : null;
    const hourPillar = calcHourPillar(hourVal, dayPillar.ganIdx);

    const pillars = [yearPillar, monthPillar, dayPillar, hourPillar];
    const dayGan = dayPillar.gan;
    const dayGanIdx = dayPillar.ganIdx;

    // 12운성 계산
    const wunseongs = pillars.map(p => calc12Wunseong(dayGanIdx, p.jiIdx));

    // 12신살 계산 (년지 기준 & 일지 기준)
    const sinsalsYearIndex = pillars.map(p => calc12Sinsal(yearPillar.jiIdx, p.jiIdx));
    const sinsalsDayIndex = pillars.map(p => calc12Sinsal(dayPillar.jiIdx, p.jiIdx));

    // 특수 신살
    const specialSinsals = calcSpecialSinsals(dayGanIdx, pillars);

    // 형충파해 분석
    const complexRelations = analyzeRelations(pillars);

    // 오행 카운트
    const ohaengCount = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    pillars.forEach(p => {
        ohaengCount[p.gan.ohaeng]++;
        ohaengCount[p.ji.ohaeng]++;
    });

    // 신강신약 & 용신 & 격국
    const yongshinData = evaluateStrengthAndYongshin(dayGan, pillars, ohaengCount);

    return {
        yearPillar, monthPillar, dayPillar, hourPillar,
        pillars, dayGan, dayGanIdx,
        wunseongs,
        sinsalsYearIndex,
        sinsalsDayIndex,
        specialSinsals,
        complexRelations,
        ohaengCount,
        yongshinData
    };
}

window.calculateSajuAdvanced = calculateSajuAdvanced;
