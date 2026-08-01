/* ═══════════════════════════════════════════════════
   이성효의 명리학 - 사주팔자 운세 엔진 v4.0 (음양력 100% 일치 보정)
   ═══════════════════════════════════════════════════ */

/* ─── 데이터 ─── */
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

function getRestrained(e) {
    const idx = OHAENG_CYCLE.indexOf(e);
    return OHAENG_CYCLE[(idx + 2) % 5];
}

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
   음력 / 양력 정밀 상호 변환 (KoreanLunarCalendar)
   ═══════════════════════════════════════════ */

function lunarToSolar(lunarYear, lunarMonth, lunarDay, isIntercalation = false) {
    if (typeof KoreanLunarCalendar !== 'undefined') {
        try {
            const cal = new KoreanLunarCalendar();
            const ok = cal.setLunarDate(lunarYear, lunarMonth, lunarDay, isIntercalation);
            if (ok === false) {
                console.warn('Lunar date out of range:', lunarYear, lunarMonth, lunarDay, isIntercalation);
                return null;
            }
            const solar = cal.getSolarCalendar();
            return { year: solar.year, month: solar.month, day: solar.day };
        } catch (e) {
            console.warn('Lunar to solar error:', e);
        }
    }
    return null;
}

function solarToLunar(solarYear, solarMonth, solarDay) {
    if (typeof KoreanLunarCalendar !== 'undefined') {
        try {
            const cal = new KoreanLunarCalendar();
            const ok = cal.setSolarDate(solarYear, solarMonth, solarDay);
            if (ok === false) {
                console.warn('Solar date out of range:', solarYear, solarMonth, solarDay);
                return null;
            }
            const lunar = cal.getLunarCalendar();
            return { year: lunar.year, month: lunar.month, day: lunar.day, intercalation: lunar.intercalation };
        } catch (e) {
            console.warn('Solar to lunar error:', e);
        }
    }
    return null;
}

/* ═══════════════════════════════════════════
   사주 4주 계산 (절기 및 시각 반영)
   ═══════════════════════════════════════════ */

function getMonthJiIdx(month, day) {
    const dateMD = month * 100 + day;
    if (dateMD < 204) {
        if (dateMD >= 106) return 1;
        return 0;
    }
    const solarMonths = [
        { start: 204, branchIdx: 2 }, { start: 306, branchIdx: 3 }, { start: 405, branchIdx: 4 },
        { start: 506, branchIdx: 5 }, { start: 606, branchIdx: 6 }, { start: 707, branchIdx: 7 },
        { start: 808, branchIdx: 8 }, { start: 908, branchIdx: 9 }, { start: 1008, branchIdx: 10 },
        { start: 1107, branchIdx: 11 }, { start: 1207, branchIdx: 0 }
    ];
    for (let i = solarMonths.length - 1; i >= 0; i--) {
        if (dateMD >= solarMonths[i].start) return solarMonths[i].branchIdx;
    }
    return 2;
}

function calcYearPillar(year, month, day) {
    let adjustedYear = year;
    if (month < 2 || (month === 2 && day < 4)) adjustedYear = year - 1;
    const ganIdx = ((adjustedYear - 4) % 10 + 10) % 10;
    const jiIdx = ((adjustedYear - 4) % 12 + 12) % 12;
    return { gan: GANS[ganIdx], ji: JIJIS[jiIdx], ganIdx, jiIdx, year: adjustedYear };
}

function calcMonthPillar(year, month, day, yearGanIdx) {
    const monthBranchIdx = getMonthJiIdx(month, day);
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

function countOhaeng(pillars) {
    const count = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    pillars.forEach(p => {
        if (count[p.gan.ohaeng] !== undefined) count[p.gan.ohaeng]++;
        if (count[p.ji.ohaeng] !== undefined) count[p.ji.ohaeng]++;
    });
    return count;
}

const YUK_HAP = { 0: 1, 1: 0, 2: 11, 11: 2, 3: 10, 10: 3, 4: 9, 9: 4, 5: 8, 8: 5, 6: 7, 7: 6 };
const YUK_CHUNG = { 0: 6, 6: 0, 1: 7, 7: 1, 2: 8, 8: 2, 3: 9, 9: 3, 4: 10, 10: 4, 5: 11, 11: 5 };

function checkJiJiRelation(jiIdx1, jiIdx2) {
    if (YUK_HAP[jiIdx1] === jiIdx2) return 'hap';
    if (YUK_CHUNG[jiIdx1] === jiIdx2) return 'chung';
    return null;
}

/* ═══════════════════════════════════════════
   대운 계산 엔진 (원본 파일 100% 동일)
   ═══════════════════════════════════════════ */

const DAEWOON_DESCRIPTIONS = [
    { title: '소년기', desc: '성장과 학습의 시기입니다. 기초를 다지고 자신의 재능을 발견하는 중요한 시기입니다.' },
    { title: '청년기', desc: '사회에 첫발을 내딛고 자신의 위치를 찾아가는 시기입니다. 도전과 모험이 필요한 때입니다.' },
    { title: '장년기', desc: '사회적 입지가 확립되고 전문성이 발휘되는 시기입니다. 자신의 분야에서 최고의 성과를 낼 수 있습니다.' },
    { title: '중년기', desc: '안정과 성숙의 시기입니다. 그동안 쌓아온 경험과 지혜가 빛을 발합니다.' },
    { title: '장년후기', desc: '풍요와 여유의 시기입니다. 후배를 양성하고 지식을 나누는 보람을 느낍니다.' },
    { title: '노년기', desc: '지혜와 통찰의 시기입니다. 인생을 되돌아보며 내면의 평화를 찾습니다.' }
];

function findNextJeolgi(year, month, day, isForward) {
    const jeolgis = [
        { m: 2, d: 4 }, { m: 2, d: 19 }, { m: 3, d: 6 }, { m: 3, d: 21 },
        { m: 4, d: 5 }, { m: 4, d: 20 }, { m: 5, d: 6 }, { m: 5, d: 21 },
        { m: 6, d: 6 }, { m: 6, d: 22 }, { m: 7, d: 7 }, { m: 7, d: 23 },
        { m: 8, d: 8 }, { m: 8, d: 23 }, { m: 9, d: 8 }, { m: 9, d: 23 },
        { m: 10, d: 8 }, { m: 10, d: 23 }, { m: 11, d: 7 }, { m: 11, d: 22 },
        { m: 12, d: 7 }, { m: 12, d: 22 }, { m: 1, d: 6 }, { m: 1, d: 20 }
    ];

    if (isForward) {
        for (const j of jeolgis) {
            if (j.m === month && j.d > day) return new Date(year, j.m - 1, j.d);
            if (j.m > month && j.m <= 12) return new Date(year, j.m - 1, j.d);
        }
        return new Date(year + 1, 0, 6);
    } else {
        const reversed = [...jeolgis].reverse();
        for (const j of reversed) {
            if (j.m < month || (j.m === month && j.d < day)) return new Date(year, j.m - 1, j.d);
        }
        return new Date(year - 1, 11, 22);
    }
}

function daysBetween(d1, d2) {
    return Math.round((d2 - d1) / (24 * 60 * 60 * 1000));
}

function calcDaewoon(birthYear, birthMonth, birthDay, hour, gender, yearGanIdx, monthPillar) {
    const isYangYear = yearGanIdx % 2 === 0;
    const isForward = (isYangYear && gender === 'male') || (!isYangYear && gender === 'female');
    const directionKor = isForward ? '순행(順行)' : '역행(逆行)';

    const nextJeolgiDate = findNextJeolgi(birthYear, birthMonth, birthDay, isForward);
    const daysToJeolgi = nextJeolgiDate ? Math.abs(daysBetween(new Date(birthYear, birthMonth - 1, birthDay), nextJeolgiDate)) : 0;

    let daewoonStartAge = Math.round(daysToJeolgi / 3);
    if (daewoonStartAge < 0) daewoonStartAge = 0;
    if (daewoonStartAge > 20 || daysToJeolgi === 0) daewoonStartAge = 1;

    const daewoons = [];
    let currentGanIdx = monthPillar.ganIdx;
    let currentJiIdx = monthPillar.jiIdx;

    for (let i = 0; i < 8; i++) {
        const startAge = daewoonStartAge + i * 10;
        const endAge = startAge + 10;
        if (i > 0) {
            if (isForward) {
                currentGanIdx = (currentGanIdx + 1) % 10;
                currentJiIdx = (currentJiIdx + 1) % 12;
            } else {
                currentGanIdx = ((currentGanIdx - 1) % 10 + 10) % 10;
                currentJiIdx = ((currentJiIdx - 1) % 12 + 12) % 12;
            }
        }
        const ganji = `${GANS[currentGanIdx].name}${JIJIS[currentJiIdx].hangul}`;
        const ganjiKor = `${GANS[currentGanIdx].hangul}${JIJIS[currentJiIdx].hangul}`;
        const titleIdx = Math.min(i, DAEWOON_DESCRIPTIONS.length - 1);
        const currentYear = new Date().getFullYear();
        const isCurrent = currentYear >= birthYear + startAge && currentYear < birthYear + endAge;

        daewoons.push({
            index: i + 1,
            startAge,
            endAge,
            ganji,
            ganjiKor,
            startYear: birthYear + startAge,
            endYear: birthYear + endAge,
            title: DAEWOON_DESCRIPTIONS[titleIdx].title,
            desc: DAEWOON_DESCRIPTIONS[titleIdx].desc,
            isCurrent
        });
    }

    return { daewoons, startAge: daewoonStartAge, direction: directionKor, isForward };
}

/* ═══════════════════════════════════════════
   상세 해석 데이터베이스 (원본 100% 보존)
   ═══════════════════════════════════════════ */

const SIPSEONG_DETAIL = {
    '비견': {
        personality: '독립심이 강하고 자기주관이 뚜렷합니다. 경쟁심이 있어 승부욕이 강하며, 리더십이 있습니다. 정의감이 투철하고 의리가 있습니다.',
        wealth: '고정적인 수입보다 활동적인 재물운이 있습니다. 남과 협력하기보다 독자적인 방식으로 재물을 모옵니다.',
        love: '연애에서 주도적인 역할을 선호합니다. 상대방에게 적극적으로 표현하지만, 자기 주장이 강해 다툼이 있을 수 있습니다.',
        career: '경쟁이 있는 분야에서 능력을 발휘합니다. 운동, 군인, 경찰, 경영자, 창업에 적합합니다.',
        caution: '고집과 자존심이 지나치면 주변과 갈등이 생길 수 있습니다. 타인의 의견을 존중하는 태도가 필요합니다.'
    },
    '겁재': {
        personality: '사교적이고 활동적이며, 사람들과 어울리기를 좋아합니다. 모험심이 강하고 변화를 두려워하지 않습니다.',
        wealth: '큰 돈이 들어왔다 나가는 경향이 있습니다. 소비 욕구가 강해 저축보다는 투자나 소비에 적극적입니다.',
        love: '이성을 유혹하는 매력이 있습니다. 다수의 이성과 엮이기 쉬우며, 감정의 기복이 있습니다.',
        career: '사람을 다루는 직업이나 영업, 마케팅, 연예계에 적합합니다. 창의적인 분야에서 두각을 나타냅니다.',
        caution: '금전 관리에 주의가 필요합니다. 충동적인 소비와 투자는 피하는 것이 좋습니다.'
    },
    '식신': {
        personality: '온화하고 자비로우며, 예술적 감각이 뛰어납니다. 풍류를 즐기고 타인에게 베푸는 것을 좋아합니다.',
        wealth: '먹을 복과 재물운이 함께 합니다. 예술, 요리, 창작 활동을 통해 재물을 얻을 수 있습니다.',
        love: '다정다감하고 상대방을 잘 챙깁니다. 여유롭고 온화한 연애 스타일로 상대방에게 안정감을 줍니다.',
        career: '예술가, 요리사, 디자이너, 교육자, 상담사 등 창의성과 섬세함을 요하는 직업에 적합합니다.',
        caution: '지나친 낙관주의와 게으름을 경계해야 합니다. 현실적인 계획과 실행이 필요합니다.'
    },
    '상관': {
        personality: '뛰어난 표현력과 카리스마를 지녔습니다. 예술적 재능이 뛰어나며, 자유분방한 성격입니다.',
        wealth: '예술과 창작 활동을 통한 수익이 있습니다. 명성과 함께 재물이 따라오는 스타일입니다.',
        love: '강렬하고 열정적인 사랑을 추구합니다. 표현을 잘 하지만, 변덕이 심할 수 있습니다.',
        career: '연예인, 아나운서, 작가, 연출가, 정치가 등 카리스마와 표현력이 필요한 직업에 적합합니다.',
        caution: '말 때문에 구설수에 오르기 쉽습니다. 자신의 의견을 표현할 때 상대방을 배려하는 태도가 필요합니다.'
    },
    '편재': {
        personality: '대범하고 활동적이며, 사업수완이 뛰어납니다. 모험을 두려워하지 않고 큰 그림을 그리는 것을 좋아합니다.',
        wealth: '큰 재물운이 있습니다. 사업과 투자에 뛰어난 감각을 지녔으며, 여러 재물이 한꺼번에 들어올 수 있습니다.',
        love: '적극적이고 대범한 연애 스타일입니다. 여러 이성에게 인기가 많고, 자유로운 연애를 선호합니다.',
        career: '사업가, 투자자, 부동산 개발, 무역, CEO 등 큰 돈이 움직이는 분야에 적합합니다.',
        caution: '큰 수익이 있는 만큼 큰 손실의 위험도 있습니다. 무리한 투자와 도박은 절대 피해야 합니다.'
    },
    '정재': {
        personality: '신중하고 현실적이며, 안정적이고 계획적인 성격입니다. 신뢰감을 주고 책임감이 강합니다.',
        wealth: '안정적인 재물운으로 꾸준히 저축하고 모으는 능력이 뛰어납니다. 근면성실하게 재물을 쌓습니다.',
        love: '진실하고 안정적인 연애를 추구합니다. 책임감 있는 모습으로 상대방에게 신뢰를 줍니다.',
        career: '회사원, 공무원, 교사, 금융인 등 안정적이고 체계적인 직업에 적합합니다.',
        caution: '너무 안정에 집착하면 새로운 기회를 놓칠 수 있습니다. 때로는 과감한 도전도 필요합니다.'
    },
    '편관': {
        personality: '강한 추진력과 카리스마를 지녔습니다. 권위적이고 리더십이 있으며, 목표를 향해 돌진합니다.',
        wealth: '위기를 기회로 바꾸는 능력이 있습니다. 어려운 상황을 극복하며 재물을 얻습니다.',
        love: '강한 소유욕과 보호본능을 보입니다. 남녀 모두에게 적극적이고 주도적인 연애를 합니다.',
        career: '군인, 경찰, 법조인, 외과의사, CEO 등 강한 카리스마가 필요한 직업에 적합합니다.',
        caution: '스트레스 관리가 매우 중요합니다. 과도한 경쟁심과 완벽주의는 건강을 해칠 수 있습니다.'
    },
    '정관': {
        personality: '원칙과 규율을 중시하며, 신뢰감 있고 책임감이 강합니다. 사회적 인정을 중요하게 생각합니다.',
        wealth: '직장 내 승진과 명예를 통해 재물이 증가합니다. 안정적이고 규칙적인 수입이 있습니다.',
        love: '책임감 있는 연애를 합니다. 결혼을 전제로 한 진지한 관계를 선호하며, 상대방에게 신뢰를 줍니다.',
        career: '공무원, 교사, 판사, 검사, 의사 등 사회적 지위가 있는 직업에 적합합니다.',
        caution: '원칙에 너무 얽매이면 융통성이 부족해질 수 있습니다. 때로는 유연한 사고가 필요합니다.'
    },
    '편인': {
        personality: '독창적이고 직관력이 뛰어납니다. 깊은 통찰력과 분석력을 지녔으며, 독특한 시각을 가지고 있습니다.',
        wealth: '예상치 못한 재물이 들어오는 경우가 많습니다. 특별한 재능이나 아이디어로 수익을 창출합니다.',
        love: '감정 표현이 서툴러 오해를 받기 쉽습니다. 깊은 사랑을 하지만 표현 방식이 독특합니다.',
        career: '연구원, 교수, 철학자, 심리학자, IT 전문가 등 깊은 통찰력이 필요한 직업에 적합합니다.',
        caution: '현실감각이 부족할 수 있습니다. 이상과 현실의 균형을 맞추는 것이 중요합니다.'
    },
    '정인': {
        personality: '온화하고 자애로우며, 학식과 교양이 풍부합니다. 남을 도와주는 것을 좋아하고 인품이 좋습니다.',
        wealth: '주변의 도움으로 재물이 안정됩니다. 부동산이나 장기적인 투자에 강합니다.',
        love: '헌신적이고 돌봄을 주는 연애 스타일입니다. 상대방을 잘 보살피고 이해심이 많습니다.',
        career: '교육자, 의사, 상담사, 사회복지사 등 남을 돕는 직업에 적합합니다.',
        caution: '의존성이 강해질 수 있습니다. 때로는 스스로 판단하고 결정하는 독립성이 필요합니다.'
    }
};

const SIPSEONG_FORTUNE = {
    '비견': { positive: '자신감과 추진력이 상승하는 해입니다. 주변에 든든한 동료나 협력자를 만나 함께 성장할 기회가 많습니다.', negative: '경쟁이 치열해지고 주변과의 마찰이 있을 수 있습니다. 자존심 때문에 손해를 볼 수 있으니 유연함을 유지하세요.', advice: '함께 갈 동료를 찾고, 경쟁보다는 협력에 초점을 맞추세요.' },
    '겁재': { positive: '새로운 인연과의 만남이 활발한 해입니다. 예상치 못한 기회가 찾아올 수 있습니다.', negative: '뜻하지 않은 지출이나 손재수가 있을 수 있습니다. 타인과의 금전 문제에 각별히 주의해야 합니다.', advice: '감정적인 소비를 자제하고, 중요한 결정은 충분한 숙고 후에 내리세요.' },
    '식신': { positive: '재능과 창의성이 빛나는 해입니다. 새로운 프로젝트나 취미를 시작하기 좋습니다.', negative: '지나친 낙관주의로 인해 현실을 간과할 수 있습니다. 계획 없이 소비하거나 과식에 주의하세요.', advice: '창의적인 에너지를 생산적인 방향으로 활용하세요.' },
    '상관': { positive: '카리스마와 표현력이 돋보이는 해입니다. 예술적인 감각이 빛납니다.', negative: '말 때문에 구설수에 오를 수 있습니다. 상사나 윗사람과의 관계에서 마찰이 생길 수 있습니다.', advice: '자신의 의견을 표현할 때 상대방의 입장을 고려하세요.' },
    '편재': { positive: '예상치 못한 수입이나 재물운이 있는 해입니다. 투자나 부업에서 좋은 성과를 거둘 수 있습니다.', negative: '큰 돈이 들어오는 만큼 지출도 커질 수 있습니다. 도박이나 과도한 투자는 피하세요.', advice: '들어온 돈을 잘 관리하고, 장기적인 재정 계획을 세우세요.' },
    '정재': { positive: '안정적인 재물운과 직장운이 있는 해입니다. 꾸준한 노력이 결실을 맺습니다.', negative: '너무 안정에 치우쳐 새로운 기회를 놓칠 수 있습니다. 변화를 두려워하지 마세요.', advice: '현재의 안정을 유지하면서도 새로운 기회에 도전하는 균형이 필요합니다.' },
    '편관': { positive: '도전과 극복의 해입니다. 어려운 상황을 헤쳐나가는 힘이 생깁니다.', negative: '스트레스와 압박이 많을 수 있습니다. 건강 관리에 특히 신경 쓰세요.', advice: '도전을 성장의 기회로 받아들이세요. 규칙적인 생활과 운동으로 스트레스를 관리하세요.' },
    '정관': { positive: '사회적 지위와 명예가 상승하는 해입니다. 직장 내 평가가 좋아집니다.', negative: '책임감이 과중해질 수 있으며, 자유로운 활동이 제한될 수 있습니다.', advice: '맡은 일에 최선을 다하되, 자기만의 시간도 확보하세요.' },
    '편인': { positive: '직관과 통찰력이 뛰어난 해입니다. 학문이나 명상 등 내면의 성장에 좋은 시기입니다.', negative: '현실 감각이 둔해지고, 고립되기 쉬우며, 예상치 못한 사고나 건강 문제가 있을 수 있습니다.', advice: '직감을 따르되 현실적인 검증도 병행하세요.' },
    '정인': { positive: '안정과 보호를 받는 해입니다. 주변의 도움과 지원이 많아집니다.', negative: '의존성이 강해져 독립적인 판단이 흐려질 수 있습니다.', advice: '도움을 받는 것도 중요하지만, 스스로 판단하고 결정하는 훈련이 필요한 시기입니다.' }
};

const OHAENG_CHARACTER = {
    wood: { name: '목(木)', trait: '성장과 확장', desc: '인자하고 포용력 있으며, 계획적이고 진취적입니다. 곧은 의지와 강한 생명력을 지녔습니다.', strong: '리더십과 창의력이 뛰어납니다. 다소 고집이 세고 완고할 수 있습니다.', weak: '의존적이고 결단력이 부족할 수 있습니다.', color: '#27ae60' },
    fire: { name: '화(火)', trait: '열정과 활동', desc: '열정적이고 활동적이며, 사교적이고 표현력이 풍부합니다.', strong: '열정과 추진력이 뛰어나지만, 쉽게 흥분하고 충동적일 수 있습니다.', weak: '소극적이고 우유부단하며, 리더십이 부족할 수 있습니다.', color: '#e74c3c' },
    earth: { name: '토(土)', trait: '안정과 조화', desc: '신중하고 현실적이며, 신뢰감을 주고 책임감이 강합니다.', strong: '안정적이고 신뢰할 수 있으나, 고집이 세고 변화에 둔감할 수 있습니다.', weak: '불안정하고 집중력이 부족하며, 현실 감각이 떨어질 수 있습니다.', color: '#c9a96c' },
    metal: { name: '금(金)', trait: '의리와 결단', desc: '강한 의지와 정의감을 지녔으며, 결단력이 빠르고 실행력이 뛰어납니다.', strong: '강한 추진력과 카리스마가 있으나, 차갑고 냉철해 보일 수 있습니다.', weak: '결단력이 부족하고 쉽게 흔들리며, 자신감이 부족할 수 있습니다.', color: '#5dade2' },
    water: { name: '수(水)', trait: '지혜와 유연', desc: '지혜롭고 직관력이 뛰어나며, 상황에 유연하게 대처합니다.', strong: '지혜롭고 통찰력이 뛰어나지만, 지나치게 신중하고 소극적일 수 있습니다.', weak: '직관력이 부족하고, 불안감이 많으며 쉽게 흔들립니다.', color: '#3498db' }
};

function getCategoryFortune(sipseong, category) {
    const fortunes = {
        재물운: {
            '비견': '동업이나 공동 투자에서 이익이 있을 수 있습니다. 독단적인 투자는 피하세요.',
            '겁재': '뜻하지 않은 지출이 생길 수 있습니다. 금전 거래 시 각별히 주의하세요.',
            '식신': '먹을 복과 함께 재물이 들어옵니다. 예술이나 창작 활동으로 수익이 날 수 있습니다.',
            '상관': '새로운 재물운이 열리지만, 위험도 따릅니다. 안전한 자산 관리가 필요합니다.',
            '편재': '큰 재물운이 있는 해입니다. 투자와 사업에서 좋은 성과를 기대할 수 있습니다.',
            '정재': '안정적인 수입과 저축이 늘어납니다. 꾸준히 관리하면 재산이 불어납니다.',
            '편관': '재물을 얻는 과정에 어려움이 있을 수 있습니다. 무리한 투자는 피하세요.',
            '정관': '직장 내 수입이 안정적입니다. 승진이나 연봉 인상을 기대할 수 있습니다.',
            '편인': '예상치 못한 수입이 있을 수 있으나, 재정 관리에 주의가 필요합니다.',
            '정인': '주변의 도움으로 재물운이 안정됩니다. 부동산이나 장기 투자에 유리합니다.'
        },
        애정운: {
            '비견': '자존심 때문에 연인과 다툴 수 있습니다. 상대방을 이해하려는 노력이 필요합니다.',
            '겁재': '새로운 인연이 찾아올 수 있으나, 삼각관계에 주의하세요.',
            '식신': '애정운이 상승합니다. 자연스러운 만남과 즐거운 데이트가 많아집니다.',
            '상관': '연애에 적극적이지만, 상대방에게 상처를 줄 수 있는 말을 조심하세요.',
            '편재': '이성운이 매우 좋습니다. 매력이 상승하여 많은 이성의 관심을 받을 수 있습니다.',
            '정재': '안정적인 연애가 가능합니다. 결혼을 고려하는 진지한 관계로 발전할 수 있습니다.',
            '편관': '연애에 장애물이 생길 수 있습니다. 강한 끌림이 있지만 갈등도 따릅니다.',
            '정관': '좋은 인연을 만날 확률이 높습니다. 책임감 있는 만남이 이어집니다.',
            '편인': '감정 표현이 서툴러 오해가 생길 수 있습니다. 솔직한 소통이 필요합니다.',
            '정인': '주변의 소개로 좋은 인연을 만날 수 있습니다. 안정적인 만남이 이어집니다.'
        },
        건강운: {
            '비견': '전반적으로 건강하나 과로에 주의하세요. 경쟁심이 스트레스를 유발할 수 있습니다.',
            '겁재': '예상치 못한 건강 문제가 발생할 수 있습니다. 정기 검진을 받으세요.',
            '식신': '건강이 양호한 편입니다. 식도락과 소화기 건강에만 주의하세요.',
            '상관': '스트레스 관리가 필요합니다. 목과 호흡기 건강에 주의하세요.',
            '편재': '활동량이 많아 건강 관리가 소홀해질 수 있습니다. 규칙적인 생활이 필요합니다.',
            '정재': '건강 상태가 안정적입니다. 꾸준한 운동으로 체력을 유지하세요.',
            '편관': '건강에 적신호가 켜질 수 있습니다. 과로와 스트레스 관리에 특히 신경 쓰세요.',
            '정관': '건강 관리를 체계적으로 하기 좋은 시기입니다. 규칙적인 검진을 추천합니다.',
            '편인': '소화기와 면역력에 문제가 생길 수 있습니다. 휴식과 영양 관리가 중요합니다.',
            '정인': '전반적으로 건강하나, 약간의 허약함이 있을 수 있습니다. 보양식이 도움됩니다.'
        },
        직장운: {
            '비견': '동료와의 협력이 중요한 해입니다. 경쟁 의식을 버리고 팀워크를 발휘하세요.',
            '겁재': '직장 내 변화와 경쟁이 심할 수 있습니다. 실력으로 승부하세요.',
            '식신': '아이디어와 창의력이 빛을 발합니다. 새로운 프로젝트에 적극 참여하세요.',
            '상관': '상사와의 관계에 주의하세요. 자신의 능력을 증명할 기회가 옵니다.',
            '편재': '새로운 사업이나 부업에서 성과가 있을 수 있습니다. 다양한 기회가 찾아옵니다.',
            '정재': '직장 내 입지가 안정됩니다. 승진이나 좋은 평가를 기대할 수 있습니다.',
            '편관': '승진이나 도전의 기회가 오지만, 책임과 압박도 따릅니다.',
            '정관': '직장 내에서 인정을 받고 신뢰가 쌓이는 해입니다. 공적인 업무에 집중하세요.',
            '편인': '직장보다는 개인적인 성장과 공부가 중요한 시기입니다. 이직이나 전환을 고려하세요.',
            '정인': '상사나 선배의 도움으로 직장 내 안정을 찾습니다. 멘토를 찾기에 좋은 시기입니다.'
        }
    };
    return (fortunes[category] && fortunes[category][sipseong]) || '올해는 평온한 한 해가 될 것입니다.';
}

function getOhaengAdvice(ohaengCount, dayGan) {
    const maxOhaeng = Object.entries(ohaengCount).sort((a, b) => b[1] - a[1])[0];
    const minOhaeng = Object.entries(ohaengCount).filter(e => e[0] !== dayGan.ohaeng).sort((a, b) => a[1] - b[1])[0];
    let advice = '';
    const dayElement = OHAENG_KOR[dayGan.ohaeng];

    if (maxOhaeng[1] >= 4) {
        advice += `${OHAENG_KOR[maxOhaeng[0]]} 기운이 강합니다. ${OHAENG_CHARACTER[maxOhaeng[0]].strong} `;
        const restrained = getRestrained(maxOhaeng[0]);
        advice += `${OHAENG_KOR[restrained]} 기운을 보충하여 균형을 맞추는 것이 좋습니다.`;
    } else if (maxOhaeng[1] <= 2) {
        advice += `오행이 고르게 분포되어 있습니다. 무난하고 안정적인 성격입니다. `;
        if (minOhaeng && minOhaeng[1] === 0) {
            advice += `다만 ${OHAENG_KOR[minOhaeng[0]]} 기운이 약하니, ${OHAENG_KOR[minOhaeng[0]]}에 해당하는 색이나 활동으로 보충하는 것이 좋습니다.`;
        }
    } else {
        advice += `비교적 균형 잡힌 오행을 가지고 있습니다. ${dayElement}의 기질이 주로 나타나며, 상황에 따라 유연하게 대처할 수 있습니다.`;
    }
    return advice;
}

function getJiRelationText(sajuPillars, yearJiIdx) {
    const texts = [];
    const pillarNames = ['년지', '월지', '일지', '시지'];
    sajuPillars.forEach((p, i) => {
        const relation = checkJiJiRelation(p.jiIdx, yearJiIdx);
        if (relation === 'hap') {
            texts.push(`${pillarNames[i]}과 세운이 합(合)합니다. 좋은 변화와 기회가 찾아옵니다.`);
        } else if (relation === 'chung') {
            texts.push(`${pillarNames[i]}과 세운이 충(沖)합니다. 예상치 못한 변화나 도전이 있을 수 있습니다.`);
        }
    });
    return texts;
}

function generateYearFortune(sajuPillars, dayGanIdx, dayJiIdx, year, yearGanIdx, yearJiIdx) {
    const sipseong = calcSipseong(dayGanIdx, yearGanIdx);
    const fortune = SIPSEONG_FORTUNE[sipseong] || SIPSEONG_FORTUNE['비견'];
    const jiRelations = getJiRelationText(sajuPillars, yearJiIdx);
    let totalFortune = fortune.positive + ' ' + fortune.negative;
    if (jiRelations.length > 0) totalFortune += ' ' + jiRelations.join(' ');

    return {
        year,
        ganji: `${GANS[yearGanIdx].name}${JIJIS[yearJiIdx].hangul}`,
        ganjiKor: `${GANS[yearGanIdx].hangul}${JIJIS[yearJiIdx].hangul}`,
        sipseong,
        total: totalFortune,
        wealth: getCategoryFortune(sipseong, '재물운'),
        love: getCategoryFortune(sipseong, '애정운'),
        health: getCategoryFortune(sipseong, '건강운'),
        career: getCategoryFortune(sipseong, '직장운'),
        advice: fortune.advice,
        jiRelations
    };
}

function generateAllFortunes(sajuPillars, dayGanIdx, dayJiIdx, birthYear, startYear, count = 15) {
    const fortunes = [];
    for (let i = 0; i < count; i++) {
        const year = startYear + i;
        const yearPillar = calcYearPillar(year, 1, 1);
        const fortune = generateYearFortune(sajuPillars, dayGanIdx, dayJiIdx, year, yearPillar.ganIdx, yearPillar.jiIdx);
        fortune.age = year - birthYear;
        fortunes.push(fortune);
    }
    return fortunes;
}

function generateCharacterAnalysis(dayGan, ohaengCount, sajuPillars) {
    const dayElement = OHAENG_CHARACTER[dayGan.ohaeng];
    const maxOhaeng = Object.entries(ohaengCount).sort((a, b) => b[1] - a[1])[0];

    let text = `<p>당신의 일간은 <strong>${dayGan.hangul}(${dayGan.name})</strong>으로, 오행 중 <strong>${dayElement.name}</strong>에 속합니다. ${dayElement.trait}의 특성을 지니고 있습니다.</p>`;
    text += `<p>${dayElement.desc}</p>`;

    if (maxOhaeng[1] >= 4) {
        text += `<p>${OHAENG_CHARACTER[maxOhaeng[0]].name} 기운이 가장 강합니다. ${OHAENG_CHARACTER[maxOhaeng[0]].strong}</p>`;
    }
    const minOhaeng = Object.entries(ohaengCount).filter(e => e[0] !== dayGan.ohaeng).sort((a, b) => a[1] - b[1])[0];
    if (minOhaeng && minOhaeng[1] === 0) {
        text += `<p>${OHAENG_CHARACTER[minOhaeng[0]].name} 기운이 없거나 매우 약합니다. ${OHAENG_CHARACTER[minOhaeng[0]].weak}</p>`;
    }

    const animals = sajuPillars.map(p => p.ji.zodiac);
    text += `<p>사주에는 ${animals.join(', ')}의 기운이 함께 합니다.</p>`;
    text += `<p>당신은 ${dayElement.name}의 기질을 바탕으로 성장해 나가는 인생입니다. 자신의 강점을 살리고 약점을 보완하는 방향으로 나아가면 더욱 조화로운 삶을 살 수 있습니다.</p>`;

    return text;
}

/* ═══════════════════════════════════════════
   궁합 계산 엔진 (원본 100% 동일 복원)
   ═══════════════════════════════════════════ */

function calculateCompatibility(person1, person2) {
    const ohaengScore = calculateOhaengCompat(person1.ohaengCount, person2.ohaengCount);
    const jiRelationScore = calculateJiCompat(person1.pillars, person2.pillars);
    const sipseongCompat = calcSipseong(person1.dayGanIdx, person2.dayGanIdx);
    const elementCompat = calculateElementCompat(person1.dayGan.ohaeng, person2.dayGan.ohaeng);

    const totalScore = Math.round((ohaengScore * 0.3) + (jiRelationScore * 0.3) + (elementCompat * 0.4));

    let desc = '';
    let grade = '';
    if (totalScore >= 85) { desc = '매우 좋은 궁합입니다! 서로에게 큰 도움이 되는 인연입니다.'; grade = '최상'; }
    else if (totalScore >= 70) { desc = '좋은 궁합입니다. 서로를 이해하고 보완해줄 수 있는 관계입니다.'; grade = '상'; }
    else if (totalScore >= 55) { desc = '무난한 궁합입니다. 서로 노력하면 좋은 관계를 유지할 수 있습니다.'; grade = '중'; }
    else if (totalScore >= 40) { desc = '다소 어려움이 있을 수 있습니다. 서로에 대한 이해와 배려가 필요합니다.'; grade = '중하'; }
    else { desc = '충돌이 있을 수 있는 궁합입니다. 서로 다른 점을 인정하고 존중하는 태도가 중요합니다.'; grade = '하'; }

    const sipseongDesc = getCompatSipseongDesc(sipseongCompat);
    const jiDetails = getJiCompatDetails(person1.pillars, person2.pillars);

    return {
        totalScore,
        grade,
        desc,
        ohaengScore,
        jiRelationScore,
        elementCompat,
        sipseongCompat,
        sipseongDesc,
        jiDetails
    };
}

function calculateOhaengCompat(ohaeng1, ohaeng2) {
    let score = 0;
    OHAENG_CYCLE.forEach(oh => {
        const diff = Math.abs((ohaeng1[oh] || 0) - (ohaeng2[oh] || 0));
        if (diff <= 1) score += 20;
        else if (diff <= 2) score += 15;
        else score += 10;
    });
    return Math.min(score, 100);
}

function calculateJiCompat(pillars1, pillars2) {
    let totalHap = 0, totalChung = 0;
    pillars1.forEach(p1 => {
        pillars2.forEach(p2 => {
            const rel = checkJiJiRelation(p1.jiIdx, p2.jiIdx);
            if (rel === 'hap') totalHap++;
            if (rel === 'chung') totalChung++;
        });
    });
    let score = 50 + (totalHap * 10) - (totalChung * 8);
    return Math.max(0, Math.min(100, score));
}

function calculateElementCompat(oh1, oh2) {
    const rel = getOhaengRelation(oh1, oh2);
    if (rel === 'same') return 60;
    if (rel === 'produce') return 95;
    if (rel === 'nourish') return 85;
    if (rel === 'control') return 35;
    if (rel === 'controlled') return 40;
    return 50;
}

function getCompatSipseongDesc(sipseong) {
    const descs = {
        '비견': '서로 비슷한 성향으로 이해는 빠르지만, 경쟁 관계가 될 수 있습니다. 서로를 인정하고 존중해야 합니다.',
        '겁재': '강한 끌림이 있지만 다툼도 많을 수 있습니다. 서로에 대한 이해와 양보가 필요합니다.',
        '식신': '상대방에게 편안함을 느끼고, 서로를 잘 챙겨주는 좋은 관계입니다. 안정적인 궁합입니다.',
        '상관': '자유분방하고 열정적인 관계이나, 감정 기복이 있을 수 있습니다. 서로를 존중하는 태도가 중요합니다.',
        '편재': '서로에게 매력을 느끼고 적극적으로 다가가는 관계입니다. 다만 자유로움을 존중해야 합니다.',
        '정재': '안정적이고 신뢰할 수 있는 관계입니다. 서로에게 책임감을 느끼고 헌신하는 좋은 인연입니다.',
        '편관': '강한 끌림과 동시에 갈등이 있을 수 있는 관계입니다. 카리스마 넘치는 궁합이지만 양보가 필요합니다.',
        '정관': '서로에게 존중과 신뢰를 주는 좋은 관계입니다. 사회적으로도 조화로운 커플입니다.',
        '편인': '깊은 이해와 교감이 가능한 관계입니다. 다만 감정 표현이 서툴러 오해가 있을 수 있습니다.',
        '정인': '서로를 잘 보살피고 이해하는 좋은 관계입니다. 헌신적인 사랑을 나눌 수 있는 인연입니다.'
    };
    return descs[sipseong] || '서로 노력에 따라 좋은 관계를 유지할 수 있습니다.';
}

function getJiCompatDetails(pillars1, pillars2) {
    const details = [];
    const names = ['년', '월', '일', '시'];
    pillars1.forEach((p1, i) => {
        pillars2.forEach((p2, j) => {
            const rel = checkJiJiRelation(p1.jiIdx, p2.jiIdx);
            if (rel === 'hap') {
                details.push(`${names[i]}주 ${p1.ji.hangul}(${p1.ji.zodiac})와 ${names[j]}주 ${p2.ji.hangul}(${p2.ji.zodiac})이(가) 합(合)합니다. 서로 잘 맞는 관계입니다.`);
            } else if (rel === 'chung') {
                details.push(`${names[i]}주 ${p1.ji.hangul}(${p1.ji.zodiac})와 ${names[j]}주 ${p2.ji.hangul}(${p2.ji.zodiac})이(가) 충(沖)합니다. 서로 다른 부분이 많지만, 극복하면 강한 관계가 됩니다.`);
            }
        });
    });
    return details;
}

/* ═══════════════════════════════════════════
   5단계 고도화 데이터 (12운성, 12신살, 용신 등)
   ═══════════════════════════════════════════ */

const WUNSEONG_LIST = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양'];
const WUNSEONG_START_JI = { 0: 11, 1: 6, 2: 2, 3: 9, 4: 2, 5: 9, 6: 5, 7: 0, 8: 8, 9: 3 };

function calc12Wunseong(dayGanIdx, targetJiIdx) {
    const isYang = GANS[dayGanIdx].yinyang === 'yang';
    const startJi = WUNSEONG_START_JI[dayGanIdx];
    const offset = isYang ? (targetJiIdx - startJi + 12) % 12 : (startJi - targetJiIdx + 12) % 12;
    return WUNSEONG_LIST[offset];
}

const SINSAL_12_LIST = ['겁살', '재살', '천살', '지살', '년살(도화)', '월살', '망신살', '장성살', '반안살', '역마살', '육해살', '화개살'];

function calc12Sinsal(baseJiIdx, targetJiIdx) {
    let groupStartJi = 8;
    if ([8, 0, 4].includes(baseJiIdx)) groupStartJi = 5;
    else if ([2, 6, 10].includes(baseJiIdx)) groupStartJi = 11;
    else if ([5, 9, 1].includes(baseJiIdx)) groupStartJi = 2;

    const offset = (targetJiIdx - groupStartJi + 12) % 12;
    return SINSAL_12_LIST[offset];
}

function evaluateStrengthAndYongshin(dayGan, pillars) {
    const myOhaeng = dayGan.ohaeng;
    const nourishOhaeng = OHAENG_CYCLE[(OHAENG_CYCLE.indexOf(myOhaeng) + 4) % 5];

    let score = 0;
    if (pillars[1].ji.ohaeng === myOhaeng || pillars[1].ji.ohaeng === nourishOhaeng) score += 40;
    if (pillars[2].ji.ohaeng === myOhaeng || pillars[2].ji.ohaeng === nourishOhaeng) score += 20;
    [pillars[0], pillars[3]].forEach(p => {
        if (p.gan.ohaeng === myOhaeng || p.gan.ohaeng === nourishOhaeng) score += 10;
        if (p.ji.ohaeng === myOhaeng || p.ji.ohaeng === nourishOhaeng) score += 10;
    });

    const isStrong = score >= 50;
    const strengthText = isStrong ? '신강(身強) 사주' : '신약(身弱) 사주';
    const yongshinOhaeng = isStrong ? OHAENG_CYCLE[(OHAENG_CYCLE.indexOf(myOhaeng) + 2) % 5] : nourishOhaeng;
    const heeshinOhaeng = isStrong ? OHAENG_CYCLE[(OHAENG_CYCLE.indexOf(myOhaeng) + 1) % 5] : myOhaeng;

    return { score, isStrong, strengthText, yongshin: OHAENG_NAMES[yongshinOhaeng], heeshin: OHAENG_NAMES[heeshinOhaeng] };
}

/* ═══════════════════════════════════════════
   통합 메인 계산 함수 (음양력 완전 보정)
   ═══════════════════════════════════════════ */

function calculateSaju(inputYear, inputMonth, inputDay, hour, gender, calType = 'solar') {
    let solarYear = inputYear;
    let solarMonth = inputMonth;
    let solarDay = inputDay;

    let lunarDateInfo = null;

    if (calType === 'lunar') {
        // 음력 -> 양력 변환 (변환 실패 시 입력값 그대로 사용)
        if (typeof KoreanLunarCalendar === 'undefined') {
            console.warn('KoreanLunarCalendar 라이브러리를 불러오지 못했습니다. 음력→양력 변환이 불가능합니다.');
        }
        const converted = lunarToSolar(inputYear, inputMonth, inputDay);
        if (converted) {
            solarYear = converted.year;
            solarMonth = converted.month;
            solarDay = converted.day;
        }
        lunarDateInfo = { year: inputYear, month: inputMonth, day: inputDay };
    } else {
        // 양력 -> 음력 계산
        lunarDateInfo = solarToLunar(inputYear, inputMonth, inputDay);
    }

    const yearPillar = calcYearPillar(solarYear, solarMonth, solarDay);
    const monthPillar = calcMonthPillar(solarYear, solarMonth, solarDay, yearPillar.ganIdx);
    const dayPillar = calcDayPillar(solarYear, solarMonth, solarDay);
    const hourVal = hour !== '' ? parseInt(hour) : null;
    const hourPillar = calcHourPillar(hourVal, dayPillar.ganIdx);

    const pillars = [yearPillar, monthPillar, dayPillar, hourPillar];
    const ohaengCount = countOhaeng(pillars);
    const sipseongs = pillars.map(p => calcSipseong(dayPillar.ganIdx, p.ganIdx));

    const daewoon = calcDaewoon(solarYear, solarMonth, solarDay, hour, gender, yearPillar.ganIdx, monthPillar);

    const wunseongs = pillars.map(p => calc12Wunseong(dayPillar.ganIdx, p.jiIdx));
    const sinsals = pillars.map(p => calc12Sinsal(yearPillar.jiIdx, p.jiIdx));
    const yongshinData = evaluateStrengthAndYongshin(dayPillar.gan, pillars);

    return {
        yearPillar, monthPillar, dayPillar, hourPillar,
        pillars, ohaengCount, sipseongs,
        dayGan: dayPillar.gan, dayGanIdx: dayPillar.ganIdx,
        dayJi: dayPillar.ji,
        daewoon,
        wunseongs,
        sinsals,
        yongshinData,
        solarDate: { year: solarYear, month: solarMonth, day: solarDay },
        lunarDate: lunarDateInfo
    };
}

window.calculateSaju = calculateSaju;
window.calculateCompatibility = calculateCompatibility;
window.generateAllFortunes = generateAllFortunes;
window.generateCharacterAnalysis = generateCharacterAnalysis;
window.SIPSEONG_DETAIL = SIPSEONG_DETAIL;
window.OHAENG_KOR = OHAENG_KOR;
window.OHAENG_NAMES = OHAENG_NAMES;
