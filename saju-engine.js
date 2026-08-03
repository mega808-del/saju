/* ═══════════════════════════════════════════════════
   이성효의 명리학 - 사주팔자 운세 엔진 v5.2
   (동적 맞춤 풀이 + 일주 오프셋 보정 + 정밀 절기 공식 + 야자시분일 + 격국/형충파해/육친/카테고리 확장)
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

/* ═══════════════════════════════════════════
   ★ v5.2 정밀 절기(節氣) 엔진 - 천문 근사 공식 (NOAA/AA 태양황경 기준)
   - 태양 황경이 15° 간격(입춘=315°)을 지나는 시각을 뉴턴 반복으로 계산
   - 정확도 약 ±1~2분 (사주 월주/연주/대운 기산 경계 판정에 충분)
   - 검증 앵커: 2024 입춘=2/4 16:27 KST / 2000 입춘=2/4 21:40 / 1984 입춘=2/5 00:19
               / 1992 청명=4/4 21:45 / 2024 동지=12/21 18:21
   ═══════════════════════════════════════════ */
const RAD = Math.PI / 180;

function jdFromGregorian(y, m, d) {
    // 그레고리력 (y, m, d) 0시(UT)의 율리우스일
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

function gregorianFromJD(jd) {
    // 율리우스일 → 그레고리력 (일은 소수부 포함)
    jd = jd + 0.5;
    const Z = Math.floor(jd);
    const F = jd - Z;
    let A = Z;
    if (Z >= 2299161) {
        const alpha = Math.floor((Z - 1867216.25) / 36524.25);
        A = Z + 1 + alpha - Math.floor(alpha / 4);
    }
    const B = A + 1524;
    const C = Math.floor((B - 122.1) / 365.25);
    const D = Math.floor(365.25 * C);
    const E = Math.floor((B - D) / 30.6001);
    const day = B - D - Math.floor(30.6001 * E) + F;
    const mm = (E < 14) ? E - 1 : E - 13;
    const yy = (mm > 2) ? C - 4716 : C - 4715;
    return { y: yy, m: mm, d: day };
}

function sunApparentLongitude(T) {
    // T = J2000 이후 세기수, 태양 겉보기 황경(도) - Meeus 근사 (정확도 ~1분)
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * RAD)
            + (0.019993 - 0.000101 * T) * Math.sin(2 * M * RAD)
            + 0.000289 * Math.sin(3 * M * RAD);
    const omega = 125.04 - 1934.136 * T;
    return L0 + C - 0.00569 - 0.00478 * Math.sin(omega * RAD);
}

const _termCache = {};
const WOLJEOL_LON = [315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285]; // 입춘~소한 (황경)
const LON_TO_BRANCH = { 315: 2, 345: 3, 15: 4, 45: 5, 75: 6, 105: 7, 135: 8, 165: 9, 195: 10, 225: 11, 255: 0, 285: 1 };
// 24절기 전체 추정일 (정확한 수렴을 위해 중기 포함) - 황경: 입춘315→우수330→경칩345→춘분0→청명15→...
const TERM_GUESS = { 315: [2, 4], 330: [2, 19], 345: [3, 6], 0: [3, 21], 15: [4, 5], 30: [4, 20],
                     45: [5, 6], 60: [5, 21], 75: [6, 6], 90: [6, 21], 105: [7, 7], 120: [7, 23],
                     135: [8, 8], 150: [8, 23], 165: [9, 8], 180: [9, 23], 195: [10, 8], 210: [10, 23],
                     225: [11, 8], 240: [11, 22], 255: [12, 7], 270: [12, 22], 285: [1, 6], 300: [1, 20] };

function findSolarTermTime(year, targetLon) {
    // 해당 연도의 특정 황경 절입 시각(KST 벽시계 기준 Date) 반환
    const key = year + '-' + targetLon;
    if (_termCache[key]) return _termCache[key];
    const guess = TERM_GUESS[targetLon] || [2, 4];
    let T = (jdFromGregorian(year, guess[0], guess[1]) - 2451545.0) / 36525.0;
    for (let i = 0; i < 10; i++) {
        let dLon = sunApparentLongitude(T) - targetLon;
        dLon = ((dLon % 360) + 540) % 360 - 180;
        if (Math.abs(dLon) < 1e-7) break;
        T -= dLon / 36000.76983; // 도/세기
    }
    const jdKST = 2451545.0 + T * 36525.0 + 9 / 24; // UT → KST(+9h)
    const g = gregorianFromJD(jdKST);
    const totalMin = Math.round((g.d - Math.floor(g.d)) * 24 * 60);
    const h = Math.floor(totalMin / 60);
    const min = totalMin % 60;
    const result = new Date(g.y, g.m - 1, Math.floor(g.d), h, min);
    _termCache[key] = result;
    return result;
}

function getMonthJiIdx(year, month, day, hour = 12) {
    // ★ v5.2: 연도별 실제 12월절 시각 기준으로 월지 판정 (고정일 근사 제거)
    const hh = (hour === null || hour === undefined) ? 12 : hour;
    const now = new Date(year, month - 1, day, hh);
    let best = null, bestLon = null;
    for (const yr of [year - 1, year]) {
        for (const lon of WOLJEOL_LON) {
            const t = findSolarTermTime(yr, lon);
            if (t <= now && (!best || t > best)) { best = t; bestLon = lon; }
        }
    }
    return bestLon === null ? 2 : LON_TO_BRANCH[bestLon];
}

function calcYearPillar(year, month, day, hour = 12) {
    // ★ v5.2: 실제 입춘 시각(황경 315°) 기준으로 연주 판정
    const hh = (hour === null || hour === undefined) ? 12 : hour;
    const ipchun = findSolarTermTime(year, 315);
    const now = new Date(year, month - 1, day, hh);
    let adjustedYear = year;
    if (now < ipchun) adjustedYear = year - 1;
    const ganIdx = ((adjustedYear - 4) % 10 + 10) % 10;
    const jiIdx = ((adjustedYear - 4) % 12 + 12) % 12;
    return { gan: GANS[ganIdx], ji: JIJIS[jiIdx], ganIdx, jiIdx, year: adjustedYear };
}

function calcMonthPillar(year, month, day, yearGanIdx, hour = 12) {
    const monthBranchIdx = getMonthJiIdx(year, month, day, hour);
    const inMonthGan = ((yearGanIdx % 5) * 2 + 2) % 10;
    // ★ v5.1 보정: 인월(寅, 2) 기준 오프셋을 12지지 순환으로 래핑 처리
    // (子월=0, 丑월=1은 인월 이전이므로 +10, +11 스텝이 되어야 정확함)
    // 검증: 2000-01-01=丙子월 / 2024-01-01=甲子월 / 1900-01-01=丙子월
    const offset = ((monthBranchIdx - 2) % 12 + 12) % 12;
    const monthGanIdx = ((inMonthGan + offset) % 10 + 10) % 10;
    return { gan: GANS[monthGanIdx], ji: JIJIS[monthBranchIdx], ganIdx: monthGanIdx, jiIdx: monthBranchIdx };
}

function calcDayPillar(year, month, day) {
    const BASE_DATE = new Date(1900, 0, 1);
    const targetDate = new Date(year, month - 1, day);
    const diff = Math.round((targetDate - BASE_DATE) / (24 * 60 * 60 * 1000));
    // ★ 일주(日柱) 오프셋 보정 (v5.0): 1900-01-01 = 甲戌일(지수 10) 기준
    // 검증 앵커 3중: 1949-10-01=甲子일 / 2000-01-01=戊午일 / 2024-01-01=甲子일
    const index = ((diff + 10) % 60 + 60) % 60;
    const ganIdx = index % 10;
    const jiIdx = index % 12;
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

/* ★ v5.0: 대운 설명을 해당 대운 천간(십성) + 지지 오행 + 나이 구간에 따라 동적으로 조합 */
function generateDaewoonDesc(ganIdx, jiIdx, dayGanIdx, decadeIdx) {
    const decade = DAEWOON_DESCRIPTIONS[Math.min(decadeIdx, DAEWOON_DESCRIPTIONS.length - 1)];
    const phase = SIPSEONG_PHASE[calcSipseong(dayGanIdx, ganIdx)] || '';
    const jiOhaeng = JIJIS[jiIdx].ohaeng;
    const ganKor = GANS[ganIdx].hangul;
    const jiKor = JIJIS[jiIdx].hangul;
    const jiFlavor = OHAENG_CHARACTER[jiOhaeng].trait;
    return `${decade.desc} 이 시기의 기운은 ${ganKor}${jiKor}(${OHAENG_KOR[GANS[ganIdx].ohaeng]}·${OHAENG_KOR[jiOhaeng]})로 ${jiFlavor}의 에너지가 담겨 있으며, ${phase}`;
}

/* ★ v5.1~v5.2: 대운 기산은 반드시 12월절(節: 입춘~소한)만 사용해야 정확함.
   (24절기 전체를 쓰면 中氣(춘분 등)를 절기로 오인하여 기산 나이가 크게 어긋남)
   v5.2: 고정일 대신 연도별 실제 절입 시각 사용 (청명 1992 = 4/4 21:45 등) */
function findNextJeolgi(year, month, day, isForward) {
    const now = new Date(year, month - 1, day, 12);
    if (isForward) {
        // 다음 월절: 생일 이후의 가장 가까운 절
        let best = null;
        for (const lon of WOLJEOL_LON) {
            for (const yr of [year, year + 1]) {
                const t = findSolarTermTime(yr, lon);
                if (t > now && (!best || t < best)) best = t;
            }
        }
        return best;
    } else {
        // 이전 월절: 생일 이전의 가장 가까운 절
        let best = null;
        for (const lon of WOLJEOL_LON) {
            for (const yr of [year - 1, year]) {
                const t = findSolarTermTime(yr, lon);
                if (t < now && (!best || t > best)) best = t;
            }
        }
        return best;
    }
}

function daysBetween(d1, d2) {
    return Math.round((d2 - d1) / (24 * 60 * 60 * 1000));
}

function calcDaewoon(birthYear, birthMonth, birthDay, hour, gender, yearGanIdx, monthPillar, dayGanIdx) {
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
            desc: generateDaewoonDesc(currentGanIdx, currentJiIdx, dayGanIdx, i),
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

/* ───────────────────────────────────────────────────────
   ★ v5.0 동적 맞춤형 해설 데이터 사전 (입력값 기반 조합)
   - 모든 해설이 각 사람의 사주 특성값에 따라 다르게 조합됨
   ─────────────────────────────────────────────────────── */

/* 1) 일간(日干) 10종 고유 성격 데이터 */
const DAY_GAN_CHARACTER = {
    '甲': {
        essence: '큰 나무와 같이 곧게 자라는 존재',
        personality: '원칙과 신의를 중시하는 곧은 성품입니다. 한번 정한 목표는 어떤 어려움이 있어도 끝까지 밀어붙이는 추진력이 있으며, 남을 보호하고 이끄는 책임감이 강합니다.',
        strength: '뚜렷한 주관과 리더십, 그리고 타인을 포용하는 너그러움',
        weakness: '고집이 세어 상대의 의견을 수용하기 어렵고, 때로는 완고해 보입니다.',
        growth: '바위를 뚫고 자라는 나무처럼, 역경이 클수록 더 강하게 성장하는 유형입니다. 굽힐 줄도 알아야 더 높이 솟을 수 있습니다.',
        career: '경영, 공직, 건축, 교육, 의학처럼 조직을 이끌고 책임을 지는 분야에 적합합니다.',
        love: '보호자 기질이 강해 연인을 지켜주려는 마음이 큽니다. 다만 자기 기준을 강요하지 않도록 주의해야 합니다.',
        caution: '완고함과 고집이 주변과의 거리를 만들 수 있습니다. 부드러운 유연함을 갖추면 인생이 더 열립니다.'
    },
    '乙': {
        essence: '유연하게 뻗어가는 덩굴과 풀',
        personality: '부드러운 외면 안에 강한 내면을 지닌 외유내강형입니다. 상황에 맞게 몸을 낮추는 적응력이 뛰어나며, 곁에 있는 사람을 섬세하게 챙깁니다.',
        strength: '뛰어난 적응력과 유연함, 그리고 섬세한 관찰력',
        weakness: '결단이 늦고 우유부단해질 때가 있으며, 스스로를 낮춰 손해를 보기도 합니다.',
        growth: '바람이 불면 한번 굽히지만 결코 꺾이지 않는 생명력입니다. 나만의 생존 전략으로 어디서든 피어날 수 있습니다.',
        career: '예술, 디자인, 상담, 보건, 화훼·유통처럼 섬세함과 공감 능력이 필요한 분야에 적합합니다.',
        love: '상대방의 마음을 읽고 먼저 배려하는 다정한 스타일입니다. 감정을 표현할 때는 조금 더 솔직해지는 것이 좋습니다.',
        caution: '주변의 의견에 휩쓸려 방향을 잃기 쉽습니다. 자신의 중심을 단단히 잡아야 합니다.'
    },
    '丙': {
        essence: '모두에게 빛을 주는 태양',
        personality: '밝고 활기찬 에너지로 주변을 따뜻하게 만드는 사교형입니다. 낙천적이고 대범하며, 사람들에게 기쁨과 희망을 주는 재능이 있습니다.',
        strength: '눈부신 카리스마와 긍정 에너지, 그리고 넓은 인맥',
        weakness: '열정이 식기도 빠르며, 지나친 낙관으로 현실 점검이 소홀해질 수 있습니다.',
        growth: '태양처럼 떠오르기 위해서는 스스로 빛을 지켜야 합니다. 꾸준함이 담긴 열정이 가장 강한 힘이 됩니다.',
        career: '연예, 방송, 영업, 마케팅, 정치, 교육 등 사람을 밝게 만드는 분야에 적합합니다.',
        love: '연애에서도 주도적이고 열정적입니다. 상대방을 사로잡는 매력이 있지만, 지속적인 관심을 보여주는 것이 중요합니다.',
        caution: '쉽게 타오르는 만큼 쉽게 식습니다. 중요한 일은 끝까지 책임지는 성실함이 필요합니다.'
    },
    '丁': {
        essence: '은은하게 세상을 밝히는 촛불',
        personality: '섬세하고 정이 많으며, 겉으로는 조용하지만 속에는 강한 열정이 타오르는 유형입니다. 사람의 마음을 헤아리는 공감 능력이 탁월합니다.',
        strength: '깊은 공감력과 집중력, 그리고 은은하지만 끈질긴 열정',
        weakness: '예민하고 속으로 삭이는 성향이 있어 마음의 상처가 오래 남습니다.',
        growth: '어둠 속에서도 꺼지지 않는 촛불처럼, 고요한 집중 속에서 가장 큰 결실을 맺습니다.',
        career: '연구, 문학, 의료, 상담, 예술, 요리 등 섬세한 몰입이 필요한 분야에 적합합니다.',
        love: '깊고 진실한 사랑을 합니다. 화려한 표현보다는 작은 것에 담긴 정성으로 사랑을 보여줍니다.',
        caution: '마음을 말로 표현하는 연습이 필요합니다. 감정을 속으로만 쌓지 말고 터뜨리세요.'
    },
    '戊': {
        essence: '우직하게 서 있는 큰 산',
        personality: '중후하고 신뢰감이 있으며, 한번 마음을 주면 끝까지 지키는 의리파입니다. 안정감이 있어 주변 사람들이 기대고 싶어 합니다.',
        strength: '누구에게나 신뢰를 주는 안정감과 강한 책임감',
        weakness: '변화를 싫어하고, 한번 결정하면 좀처럼 바꾸지 않는 경직성이 있습니다.',
        growth: '산이 굳건할수록 골짜기가 깊듯, 안정된 내면이 있기에 큰 성취가 가능합니다. 때로는 새로운 길도 열어야 합니다.',
        career: '건설, 부동산, 공직, 금융, 농업 등 안정적이고 체계적인 분야에 적합합니다.',
        love: '변함없는 사랑을 주는 듬직한 연인입니다. 다만 감정 표현이 다소 무뚝뚝할 수 있습니다.',
        caution: '새로운 변화와 도전에 과도하게 저항하지 마세요. 유연함도 강함의 일부입니다.'
    },
    '己': {
        essence: '꾸준히 가꾸어지는 비옥한 밭',
        personality: '치밀하고 신중하며, 노력파입니다. 큰소리치지 않지만 묵묵히 자신의 일을 완성해내는 신뢰형이며, 풍부한 수용력으로 사람들을 포용합니다.',
        strength: '꼼꼼한 실행력과 성실함, 그리고 뛰어난 수용력',
        weakness: '걱정이 많고 스스로를 과소평가하는 경향이 있어 기회를 놓치기도 합니다.',
        growth: '밭을 가는 만큼 결실이 맺히듯, 꾸준한 노력이 가장 확실한 성공 경로입니다.',
        career: '재무, 회계, 행정, 식품, 서비스, 교육 등 꼼꼼함이 필요한 분야에 적합합니다.',
        love: '섬세하고 정성스럽게 상대방을 보살핍니다. 당신의 노력을 인정해주는 사람과 만나는 것이 좋습니다.',
        caution: '자기 확신이 부족해 남의 눈치를 보는 버릇을 버려야 합니다. 당신은 충분히 가치 있는 사람입니다.'
    },
    '庚': {
        essence: '단단하게 벼려진 강철',
        personality: '강골의 기상과 명확한 정의감을 지녔으며, 말과 행동이 정직합니다. 승부를 좋아하고 실행력이 빨라 어려운 일도 돌파해냅니다.',
        strength: '강한 실행력과 판단력, 그리고 흔들리지 않는 결단력',
        weakness: '직설적인 표현으로 상대에게 상처를 주기 쉽고, 타협을 싫어합니다.',
        growth: '강철은 불 속에서 단단해지듯, 시련이 당신을 더 강하게 만듭니다.',
        career: '군인, 경찰, 법조, 공학, 스포츠, 외과 등 강한 추진력이 필요한 분야에 적합합니다.',
        love: '정직하고 진실한 사랑을 합니다. 다만 말투를 부드럽게 다듬으면 관계가 더 좋아집니다.',
        caution: '정의감이 때로는 타인에게 칼이 될 수 있습니다. 강함 안에 온기를 담아야 합니다.'
    },
    '辛': {
        essence: '정교하게 빛나는 보석',
        personality: '예민한 감각과 완벽주의 성향을 지녔으며, 세련된 미적 안목을 갖춘 유형입니다. 다듬어질수록 더욱 빛나는 존재입니다.',
        strength: '뛰어난 직감과 완벽함을 향한 집요함, 그리고 섬세한 감각',
        weakness: '과도한 완벽주의와 예민함으로 스스로를 힘들게 합니다.',
        growth: '보석은 갈고 닦을수록 가치가 높아지듯, 끊임없는 자기 연마가 당신의 길입니다.',
        career: '금융, 보석·패션, 예술, 약학, 정밀 기술 등 정교함이 필요한 분야에 적합합니다.',
        love: '깊이 있고 섬세한 사랑을 합니다. 완벽한 연인보다 서로를 있는 그대로 받아들이는 관계가 필요합니다.',
        caution: '예민함을 관리하는 것이 중요합니다. 세상은 완벽할 필요가 없으며, 당신도 완벽할 필요가 없습니다.'
    },
    '壬': {
        essence: '거대한 바다와 큰 강물',
        personality: '넓은 포용력과 큰 그림을 보는 혜안을 지녔습니다. 지혜롭고 유연하며, 어떤 상황에서도 새로운 길을 만들어내는 창의력이 있습니다.',
        strength: '큰 통찰력과 포용력, 그리고 위기를 기회로 바꾸는 지혜',
        weakness: '감정의 기복이 있어 스스로도 감당하기 어려울 때가 있습니다.',
        growth: '바다처럼 깊이 쌓은 지혜는 어떤 폭풍에도 흔들리지 않습니다.',
        career: '해운, 무역, IT, 언론, 종교, 연구 등 큰 흐름을 읽는 분야에 적합합니다.',
        love: '넓고 자유로운 사랑을 주는 매력적인 연인입니다. 다만 상대방에게 안정감을 주는 노력이 필요합니다.',
        caution: '감정의 파도를 다스리는 법을 배워야 합니다. 안정감 있는 삶의 리듬이 큰 힘이 됩니다.'
    },
    '癸': {
        essence: '만물을 적시는 이슬과 빗물',
        personality: '섬세한 직관과 깊은 통찰력을 지녔으며, 남의 아픔을 누구보다 잘 이해합니다. 조용하지만 그 영향력은 깊고 오래 갑니다.',
        strength: '예리한 직감력과 감성, 그리고 묵묵한 꾸준함',
        weakness: '자신감이 부족하고 소극적이어서 자신의 재능을 숨기기 쉽습니다.',
        growth: '빗물은 흙 속 깊이 스며들어 싹을 틔우듯, 당신의 섬세함이 큰 결실로 이어집니다.',
        career: '상담, 심리, 간호, 연구, 예술, 작문 등 섬세한 감성과 지혜가 필요한 분야에 적합합니다.',
        love: '깊고 애틋한 사랑을 합니다. 당신의 감성은 누구도 따라올 수 없는 매력입니다.',
        caution: '자신의 재능을 당당하게 드러내세요. 조용함은 강점이지만, 세상은 당신의 목소리를 들어야 합니다.'
    }
};

/* 2) 12운성 의미 사전 */
const WUNSEONG_MEANING = {
    '장생': '새싹이 돋아나는 시작의 기운입니다. 배움과 성장, 새로운 출발이 이루어지는 자리입니다.',
    '목욕': '물에 몸을 씻듯 정리가 필요한 때입니다. 외모와 인상 관리, 인간관계 정리가 중요한 자리입니다.',
    '관대': '성숙하고 성실한 시기입니다. 책임이 따르지만 남의 신뢰를 얻는 자리입니다.',
    '건록': '벼슬을 얻는 기운으로, 사회적 위치와 실력을 인정받는 자리입니다. 명예와 안정이 함께합니다.',
    '제왕': '기운이 절정에 달하는 최고의 자리입니다. 강한 추진력과 함께 큰 책임도 따릅니다.',
    '쇠': '기운이 꺾이기 시작하는 시점입니다. 무리한 욕심을 내려놓고 정리와 재충전이 필요한 자리입니다.',
    '병': '기운이 시드는 때입니다. 몸과 마음의 휴식이 절실한 자리입니다.',
    '사': '기운이 극도로 약해진 때입니다. 무리하지 않고 견디는 지혜가 필요한 자리입니다.',
    '묘': '한 번에 죽었다가 다시 살아나는 변화의 자리입니다. 끊어내고 새로 시작할 용기가 필요합니다.',
    '절': '기운이 완전히 끊어진 것 같은 최저점입니다. 하지만 모든 시작은 절망 끝에서 비롯됩니다.',
    '태': '다시 싹이 트는 임신과 같은 기운입니다. 새로운 희망과 기대가 차오르는 자리입니다.',
    '양': '갓 태어난 아기처럼 연약하지만 성장의 가능성을 가득 품은 자리입니다.'
};

/* 3) 12신살 의미 사전 */
const SINSAL_MEANING = {
    '겁살': '다툼과 경쟁이 따르는 살입니다. 대인 관계에서 신중함이 필요한 자리입니다.',
    '재살': '뜻하지 않은 변화와 재난을 암시하는 살입니다. 안전과 건강에 각별히 주의해야 하는 자리입니다.',
    '천살': '하늘의 변수처럼 예측할 수 없는 사건이 있을 수 있는 자리입니다. 기본에 충실하면 큰 피해를 피할 수 있습니다.',
    '지살': '흙과 땅의 기운이 얽힌 자리로, 거주지 이동이나 환경 변화가 있을 수 있습니다.',
    '년살(도화)': '매력과 인기, 이성 관계가 활발해지는 도화의 기운입니다. 주변의 관심이 몰리는 자리입니다.',
    '월살': '달의 기운처럼 감정이 출렁이는 자리입니다. 부모나 연장자와의 관계에 유의가 필요합니다.',
    '망신살': '체면이 손상될 일에 주의해야 하는 자리입니다. 말과 행동에 신중함이 필요합니다.',
    '장성살': '권위와 리더십의 살입니다. 단점을 극복하면 큰 지도력이 발휘되는 자리입니다.',
    '반안살': '안정된 직장과 평안함을 주는 길살입니다. 견실한 성취가 따르는 자리입니다.',
    '역마살': '멀리 떠나는 이동의 살입니다. 해외, 출장, 이사 등 활동 반경이 넓어지는 자리입니다.',
    '육해살': '고민과 번뇌가 따르는 살입니다. 마음을 비우고 쉬어가는 지혜가 필요한 자리입니다.',
    '화개살': '예술과 학문, 종교적 재능이 열리는 길살입니다. 예리한 통찰력이 발휘되는 자리입니다.'
};

/* 3-2) ★ v5.2: 12신살 전체표 (년지 기준 12지지 각각의 살) */
function calcAllSinsal(baseJiIdx) {
    const list = [];
    for (let t = 0; t < 12; t++) {
        const sal = calc12Sinsal(baseJiIdx, t);
        list.push({ ji: JIJIS[t].name, jiHangul: JIJIS[t].hangul, sal, meaning: SINSAL_MEANING[sal] || '' });
    }
    return list;
}

/* 3-3) ★ v5.2: 격국(格局) - 월지 본기 지장간과 일간의 십성 관계로 10격 판정 */
const GYEOKGUK_BY_SIPSEONG = {
    '비견': '건록격(建禄格)', '겁재': '양인격(羊刃格)', '식신': '식신격(食神格)', '상관': '상관격(傷官格)',
    '편재': '편재격(偏財格)', '정재': '정재격(正財格)', '편관': '칠살격(七殺格)', '정관': '정관격(正官格)',
    '편인': '편인격(偏印格)', '정인': '정인격(正印格)'
};
const GYEOKGUK_DESC = {
    '건록격(建禄格)': '월지가 일간과 같은 오행으로, 자립심과 주체성이 강한 격입니다. 스스로 길을 개척하는 독립형 인생을 살게 됩니다.',
    '양인격(羊刃格)': '강한 추진력과 카리스마를 가진 격입니다. 큰 힘을 지녔으나 이를 다스리는 지혜가 필요합니다.',
    '식신격(食神格)': '재능과 감수성이 뛰어난 격입니다. 예술과 창작, 복록이 따르는 길을 걷게 됩니다.',
    '상관격(傷官格)': '탁월한 표현력과 두뇌를 가진 격입니다. 전문성과 창의성으로 승부하는 인생입니다.',
    '편재격(偏財格)': '사업수완과 기회 포착력이 탁월한 격입니다. 큰 재물을 움직이는 활동적인 인생입니다.',
    '정재격(正財格)': '성실과 신뢰로 재물을 쌓아가는 격입니다. 안정적인 가정과 재산을 일구는 인생입니다.',
    '칠살격(七殺格)': '위기를 기회로 바꾸는 강인한 격입니다. 극복과 도전이 성장의 원동력이 됩니다.',
    '정관격(正官格)': '품위와 책임감이 돋보이는 격입니다. 사회적 신망과 명예를 쌓는 인생입니다.',
    '편인격(偏印格)': '독창적인 통찰력과 영감을 가진 격입니다. 남다른 길을 가는 지적 인생입니다.',
    '정인격(正印格)': '학식과 인덕이 풍부한 격입니다. 배움과 도움을 주고받으며 성장하는 인생입니다.'
};

function calcGyeokguk(dayGanIdx, monthPillar) {
    const benGi = (monthPillar.ji.hiddenGans && monthPillar.ji.hiddenGans[0]) || monthPillar.gan.name;
    const benGiIdx = GANS.findIndex(g => g.name === benGi);
    const sipseong = calcSipseong(dayGanIdx, benGiIdx);
    return GYEOKGUK_BY_SIPSEONG[sipseong] || '정관격(正官格)';
}

/* 3-4) ★ v5.2: 육친(六親) 관계 - 십성 → 가족/인연 매핑 */
const YUKCHIN_BY_SIPSEONG = {
    '비견': '형제·자매, 동료', '겁재': '형제·자매, 경쟁자', '식신': '자녀(아들), 재능·기쁨', '상관': '자녀(딸), 표현·창의',
    '편재': '아버지(남성 기준)·큰 재물', '정재': '아내(남성 기준)·안정 재물', '편관': '연인·직장 상사(여성 기준)',
    '정관': '남편(여성 기준)·직장·명예', '편인': '서모·은사·할머니', '정인': '어머니, 학식·보호'
};
const YUKCHIN_DESC = {
    '비견': '가까운 형제자매나 또래 동료처럼, 서로 경쟁하며 성장시키는 존재입니다.',
    '겁재': '형제자매 중에서도 힘을 겨루는 관계입니다. 때로는 경쟁자로 작용합니다.',
    '식신': '자식 복과 재능이 따르는 기운입니다. 자녀와의 인연이 깊습니다.',
    '상관': '딸과의 인연, 그리고 자유로운 표현으로 세상과 소통하는 기운입니다.',
    '편재': '아버지나 큰 재물을 뜻합니다. 활동적이고 대범한 재물운의 근원입니다.',
    '정재': '아내 또는 안정된 재산을 뜻합니다. 알뜰하게 살림을 일구는 기운입니다.',
    '편관': '여성에게는 연인이나 직장 상사, 남성에게는 큰 도전과 책임을 뜻합니다.',
    '정관': '여성에게는 남편, 남성에게는 사회적 명예와 직장을 뜻합니다.',
    '편인': '어머니를 도와주는 존재나 은사, 학문적 스승을 뜻합니다.',
    '정인': '어머니와 같은 무조건적인 보호와 사랑의 기운입니다.'
};

/* 3-5) ★ v5.2: 형·충·파·해·합 심화 매트릭스 */
const YUK_HYEONG_PAIRS = {
    2: [5, 8], 5: [2, 8], 8: [2, 5],      // 寅巳申 삼형
    1: [10, 7], 10: [1, 7], 7: [1, 10],   // 丑戌未 삼형
    0: [3], 3: [0],                        // 子卯 형
    4: [6, 9, 11], 6: [4, 9, 11], 9: [4, 6, 11], 11: [4, 6, 9] // 辰午酉亥 자형
};
const YUK_PA = { 0: 9, 9: 0, 6: 3, 3: 6, 2: 11, 11: 2, 5: 8, 8: 5, 4: 1, 1: 4, 10: 7, 7: 10 }; // 子酉/午卯/寅亥/巳申/辰丑/戌未
const YUK_HAE = { 0: 7, 7: 0, 1: 6, 6: 1, 2: 5, 5: 2, 3: 4, 4: 3, 8: 11, 11: 8, 9: 10, 10: 9 }; // 子未/丑午/寅巳/卯辰/申亥/酉戌

function checkHyeongPaHae(jiIdx1, jiIdx2) {
    if (YUK_HYEONG_PAIRS[jiIdx1] && YUK_HYEONG_PAIRS[jiIdx1].includes(jiIdx2)) return 'hyeong';
    if (YUK_PA[jiIdx1] === jiIdx2) return 'pa';
    if (YUK_HAE[jiIdx1] === jiIdx2) return 'hae';
    return null;
}

const HPH_TEXT = {
    'hap': '합(合): 서로 끌리며 협력하는 관계입니다. 좋은 변화와 기회가 따릅니다.',
    'chung': '충(沖): 서로 부딪히며 변화를 일으키는 관계입니다. 예상치 못한 변동이 있을 수 있습니다.',
    'hyeong': '형(刑): 서로 상처를 주고받을 수 있는 긴장 관계입니다. 말과 행동에 조심이 필요합니다.',
    'pa': '파(破): 조화가 깨지는 관계입니다. 가까운 사이에서 오해가 생기기 쉽습니다.',
    'hae': '해(害): 은근한 갈등과 손해가 따르는 관계입니다. 적당한 거리를 두는 것이 좋습니다.'
};

function analyzeHyeongChungPaHae(pillars) {
    const names = ['년지', '월지', '일지', '시지'];
    const details = [];
    for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 4; j++) {
            const a = pillars[i].jiIdx, b = pillars[j].jiIdx;
            let type = checkJiJiRelation(a, b) || checkHyeongPaHae(a, b);
            if (type) details.push({ a: names[i], b: names[j], type, text: HPH_TEXT[type] });
        }
    }
    return details;
}

/* 4) 대운(10년 주기) 십성별 핵심 기운 사전 */
const SIPSEONG_PHASE = {
    '비견': '동료와의 협력과 경쟁이 두드러지는 시기입니다. 사람과 어울리되 자신의 색을 잃지 않아야 합니다.',
    '겁재': '큰 인연과 큰 변화가 함께 오는 시기입니다. 재물과 인간관계의 선택이 인생을 가르는 때입니다.',
    '식신': '재능과 기쁨이 꽃피는 시기입니다. 즐거운 일과 창작 활동이 커다란 성취로 이어집니다.',
    '상관': '개성과 반항심이 커지는 시기입니다. 기존 질서에 도전하되 말조심이 중요한 때입니다.',
    '편재': '사업과 투자, 큰 기회의 시기입니다. 대범한 도전이 큰 재물을 불러옵니다.',
    '정재': '안정적인 재물과 가정이 자리 잡는 시기입니다. 성실한 쌓기가 가장 확실한 밑천입니다.',
    '편관': '책임과 도전이 몰려오는 시기입니다. 위기를 기회로 바꾸는 승부처입니다.',
    '정관': '명예와 사회적 인정을 얻는 시기입니다. 공적인 역할이 나를 키워줍니다.',
    '편인': '학문과 내면의 성장이 깊어지는 시기입니다. 혼자만의 시간이 나를 단단하게 만듭니다.',
    '정인': '보호와 지원을 받는 시기입니다. 배움과 인연이 큰 힘이 되어 돌아옵니다.'
};

/* 5) 세운(년) 오행 관계별 보충 해설 사전 */
const ELEMENT_YEAR_NOTE = {
    'produce': '올해의 기운은 당신의 일간을 생(生)해주는 상생의 에너지입니다. 누군가의 도움과 지원이 크고, 몸과 마음이 차오르는 한 해입니다.',
    'nourish': '올해의 기운은 당신의 일간을 뒷받침해주는 기운입니다. 든든한 아군과 은인을 만날 수 있는 한 해입니다.',
    'same': '올해의 기운은 당신의 일간과 같은 오행입니다. 자아가 강해지고 주장이 뚜렷해지며, 경쟁이 치열해질 수 있습니다.',
    'control': '당신의 일간이 올해의 기운을 다스리는 해입니다. 주도권을 쥐고 밀어붙이기 좋지만, 무리로 인한 소모를 조심해야 합니다.',
    'controlled': '올해의 기운이 당신의 일간을 다스리는 해입니다. 상대의 눈치와 환경의 제약이 따르니, 지혜롭게 수를 두는 것이 중요합니다.'
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
        },
        학업운: {
            '비견': '혼자 공부하는 것보다 스터디 그룹에서 성과가 큽니다. 또래와 경쟁하며 성장하는 해입니다.',
            '겁재': '학업 경쟁이 치열한 해입니다. 남과 비교하기보다 과거의 나와 비교하세요.',
            '식신': '공부가 즐거워지는 해입니다. 흥미 위주의 학습이 큰 효과를 냅니다.',
            '상관': '창의적 사고가 필요한 시험에서 유리합니다. 논술과 면접에 강점이 있습니다.',
            '편재': '공부보다 실무와 현장 경험이 먼저인 해입니다. 인턴이나 프로젝트에 적합합니다.',
            '정재': '계획을 세워 꾸준히 실천하면 성적이 오르는 해입니다. 성실함이 빛을 봅니다.',
            '편관': '시험과 도전이 많은 해입니다. 압박 속에서도 끝까지 완주하는 힘이 중요합니다.',
            '정관': '규칙적인 공부 습관이 성과로 이어지는 해입니다. 자격증 취득에 유리합니다.',
            '편인': '남다른 공부법이 빛나는 해입니다. 독학과 자기 주도 학습에 적합합니다.',
            '정인': '좋은 스승과 선배를 만나 학업이 발전하는 해입니다. 멘토를 찾기에 좋습니다.'
        },
        금전운: {
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
        인덕운: {
            '비견': '동료와의 신뢰가 쌓이는 해입니다. 서로를 세우는 관계를 만드세요.',
            '겁재': '도움을 주고받는 사이에서 오해가 생길 수 있습니다. 이익 계산보다 의리를 우선하세요.',
            '식신': '사람들에게 호감을 주는 해입니다. 베풀면 베푸는 만큼 돌아옵니다.',
            '상관': '말 실수로 인연을 놓칠 수 있습니다. 부드러운 표현이 인덕을 쌓습니다.',
            '편재': '인맥이 크게 넓어지는 해입니다. 다양한 사람들이 당신에게 기회를 가져다줍니다.',
            '정재': '꾸준하고 믿음직한 인연이 늘어나는 해입니다. 신뢰가 곧 인덕입니다.',
            '편관': '강한 인상 때문에 오해를 받을 수 있습니다. 다정한 첫인상이 인덕의 시작입니다.',
            '정관': '사회적 신망이 높아지는 해입니다. 주변 사람들이 당신을 따르게 됩니다.',
            '편인': '은사나 스승의 도움을 받는 해입니다. 지혜로운 조언자가 나타납니다.',
            '정인': '선배와 후배의 도움을 두루 받는 해입니다. 감사의 인사를 잊지 마세요.'
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

    // ★ v5.0: 올해 오행과 일간 오행의 관계에 따른 개인 맞춤 보충 해설
    const dayOhaeng = GANS[dayGanIdx].ohaeng;
    const yearOhaeng = GANS[yearGanIdx].ohaeng;
    const rel = getOhaengRelation(dayOhaeng, yearOhaeng);
    const elementNote = ELEMENT_YEAR_NOTE[rel] || '';

    let totalFortune = fortune.positive + ' ' + fortune.negative;
    if (jiRelations.length > 0) totalFortune += ' ' + jiRelations.join(' ');
    totalFortune += ' ' + elementNote;

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
        academic: getCategoryFortune(sipseong, '학업운'),
        money: getCategoryFortune(sipseong, '금전운'),
        luck: getCategoryFortune(sipseong, '인덕운'),
        advice: fortune.advice,
        elementNote,
        jiRelations
    };
}

function generateAllFortunes(sajuPillars, dayGanIdx, dayJiIdx, birthYear, startYear, count = 15) {
    const fortunes = [];
    for (let i = 0; i < count; i++) {
        const year = startYear + i;
        // ★ v5.1: 세운 연주는 입춘(2/4 이후) 기준으로 계산 (2026년 → 丙午, 종전 1/1 기준은 乙巳 오류)
        const yearPillar = calcYearPillar(year, 2, 15);
        const fortune = generateYearFortune(sajuPillars, dayGanIdx, dayJiIdx, year, yearPillar.ganIdx, yearPillar.jiIdx);
        fortune.age = year - birthYear;
        fortunes.push(fortune);
    }
    return fortunes;
}

/* 월간 십성 기운이 인생에 미치는 영향 사전 */
const MONTH_SIPSEONG_NOTE = {
    '비견': '월간의 비견 기운은 자립심을 키우고, 또래 속에서 자신의 자리를 확인하려는 욕구를 만듭니다.',
    '겁재': '월간의 겁재 기운은 활발한 활동성과 도전 욕구를 불러일으키며, 때로는 주변과의 경쟁을 부릅니다.',
    '식신': '월간의 식신 기운은 재능과 감수성을 꽃피우며, 즐기면서 사는 삶의 방식을 선호하게 합니다.',
    '상관': '월간의 상관 기운은 독창성과 표현욕을 키우며, 틀에 얽매이지 않는 삶을 추구하게 합니다.',
    '편재': '월간의 편재 기운은 기회를 포착하는 감각과 사업 수완을 발달시켜, 큰 그림을 그리는 삶을 만듭니다.',
    '정재': '월간의 정재 기운은 안정과 현실 감각을 심어주어, 꾸준히 쌓아가는 삶을 선호하게 합니다.',
    '편관': '월간의 편관 기운은 도전 정신과 승부 근성을 만들어, 어려운 일을 마다하지 않는 기질을 만듭니다.',
    '정관': '월간의 정관 기운은 책임감과 규율을 중시하는 성향을 만들어, 사회적 신망을 쌓는 삶을 살게 합니다.',
    '편인': '월간의 편인 기운은 독특한 사고와 직관을 키우며, 남과 다른 길을 가는 통찰력을 제공합니다.',
    '정인': '월간의 정인 기운은 학문과 배움에 대한 애정을 만들며, 지식과 인덕을 쌓는 삶을 살게 합니다.'
};

function generateCharacterAnalysis(dayGan, ohaengCount, sajuPillars) {
    const dayElement = OHAENG_CHARACTER[dayGan.ohaeng];
    const dayGanChar = DAY_GAN_CHARACTER[dayGan.name] || DAY_GAN_CHARACTER['甲'];
    const dayGanIdx = sajuPillars[2].ganIdx;
    const monthSipseong = calcSipseong(dayGanIdx, sajuPillars[1].ganIdx);
    const dayJiWunseong = calc12Wunseong(dayGanIdx, sajuPillars[2].jiIdx);
    const maxOhaeng = Object.entries(ohaengCount).sort((a, b) => b[1] - a[1])[0];

    let text = `<p>당신의 일간은 <strong>${dayGan.hangul}(${dayGan.name})</strong>으로, 오행 중 <strong>${dayElement.name}</strong>에 속합니다. ${dayElement.trait}의 특성을 지니고 있으며, ${dayGanChar.essence}의 기질을 지닌 존재입니다.</p>`;
    text += `<p>${dayGanChar.personality}</p>`;
    text += `<p><strong>강점:</strong> ${dayGanChar.strength} / <strong>약점:</strong> ${dayGanChar.weakness}</p>`;
    text += `<p><strong>성장 방향:</strong> ${dayGanChar.growth}</p>`;

    text += `<p>사주의 월간은 <strong>${sajuPillars[1].gan.hangul}(${sajuPillars[1].gan.name})</strong>로, 일간 기준 <strong>${monthSipseong}</strong>의 기운을 품고 있습니다. ${MONTH_SIPSEONG_NOTE[monthSipseong] || ''}</p>`;
    text += `<p>일지의 12운성은 <strong>${dayJiWunseong}</strong>입니다. ${WUNSEONG_MEANING[dayJiWunseong]}</p>`;

    if (maxOhaeng[1] >= 4) {
        text += `<p>${OHAENG_CHARACTER[maxOhaeng[0]].name} 기운이 가장 강합니다. ${OHAENG_CHARACTER[maxOhaeng[0]].strong}</p>`;
    }
    const minOhaeng = Object.entries(ohaengCount).filter(e => e[0] !== dayGan.ohaeng).sort((a, b) => a[1] - b[1])[0];
    if (minOhaeng && minOhaeng[1] === 0) {
        text += `<p>${OHAENG_CHARACTER[minOhaeng[0]].name} 기운이 없거나 매우 약합니다. ${OHAENG_CHARACTER[minOhaeng[0]].weak}</p>`;
    }

    const animals = sajuPillars.map(p => p.ji.zodiac);
    text += `<p>사주에는 ${animals.join(', ')}의 기운이 함께 합니다.</p>`;
    text += `<p><strong>어울리는 분야:</strong> ${dayGanChar.career}</p>`;
    text += `<p><strong>연애 성향:</strong> ${dayGanChar.love}</p>`;
    text += `<p><strong>주의할 점:</strong> ${dayGanChar.caution}</p>`;

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

    // 오행 부족(0회) 및 최다 오행 탐색 (동적 해설용)
    const cnt = countOhaeng(pillars);
    const missing = OHAENG_CYCLE.filter(oh => (cnt[oh] || 0) === 0);
    const maxOhaeng = OHAENG_CYCLE.reduce((a, b) => (cnt[a] || 0) >= (cnt[b] || 0) ? a : b, OHAENG_CYCLE[0]);

    let desc;
    if (isStrong) {
        desc = `일간 ${dayGan.name}의 기운이 사주 전체에서 충분히 지지되어 ${strengthText}로 판정됩니다. 힘이 넘치므로 이를 적절히 다스리는 ${OHAENG_NAMES[yongshinOhaeng]}가 핵심 처방이며, ${OHAENG_NAMES[heeshinOhaeng]}가 이를 돕습니다.`;
        if (missing.length > 0) desc += ` 다만 ${missing.map(oh => OHAENG_KOR[oh]).join('·')} 기운이 비어 있어, 강한 ${OHAENG_KOR[maxOhaeng]} 기운을 조절해줄 다이어트가 필요합니다.`;
    } else {
        desc = `일간 ${dayGan.name}의 기운이 사주 내에서 지지가 부족하여 ${strengthText}로 판정됩니다. 힘을 보태주는 ${OHAENG_NAMES[yongshinOhaeng]}가 최우선 처방이며, ${OHAENG_NAMES[heeshinOhaeng]}가 든든한 버팀목이 됩니다.`;
        if (missing.length > 0) desc += ` 특히 ${missing.map(oh => OHAENG_KOR[oh]).join('·')} 기운이 전혀 없어, 이를 보충하는 환경과 습관이 큰 변화를 가져옵니다.`;
    }

    return { score, isStrong, strengthText, yongshin: OHAENG_NAMES[yongshinOhaeng], heeshin: OHAENG_NAMES[heeshinOhaeng], desc, missingOhaeng: missing, dominantOhaeng: maxOhaeng };
}

/* ═══════════════════════════════════════════
   통합 메인 계산 함수 (음양력 완전 보정)
   ═══════════════════════════════════════════ */

function calculateSaju(inputYear, inputMonth, inputDay, hour, gender, calType = 'solar', isIntercalation = false, jasiRule = 'yajasi') {
    let solarYear = inputYear;
    let solarMonth = inputMonth;
    let solarDay = inputDay;

    let lunarDateInfo = null;

    if (calType === 'lunar') {
        // 음력 -> 양력 변환 (★ v5.1: 윤달(윤월) isIntercalation 지원)
        if (typeof KoreanLunarCalendar === 'undefined') {
            console.warn('KoreanLunarCalendar 라이브러리를 불러오지 못했습니다. 음력→양력 변환이 불가능합니다.');
        }
        const converted = lunarToSolar(inputYear, inputMonth, inputDay, !!isIntercalation);
        if (converted) {
            solarYear = converted.year;
            solarMonth = converted.month;
            solarDay = converted.day;
        }
        lunarDateInfo = { year: inputYear, month: inputMonth, day: inputDay, intercalation: !!isIntercalation };
    } else {
        // 양력 -> 음력 계산
        lunarDateInfo = solarToLunar(inputYear, inputMonth, inputDay);
    }

    // ★ v5.2: 자시 처리
    //   - hour=23 (23:00~23:59, 야자시) → 다음날 일주·시주·대운 기준
    //   - hour=0  (00:00~00:59, 정자시) → 당일 일주 기준
    //   - 앱 UI의 '자시' 버튼(0)을 야자시(23)로 해석할지 여부는 UI 계층(script.js)에서 결정
    let hourVal = (hour === '' || hour === undefined || hour === null) ? null : parseInt(hour);

    // ★ v5.2: 야자시(23:00~23:59)는 다음날 일주·시주·대운 기준 (년·월주는 원래 날짜)
    let dY = solarYear, dM = solarMonth, dD = solarDay;
    const isYajasi = hourVal !== null && hourVal >= 23;
    if (isYajasi) {
        const next = new Date(solarYear, solarMonth - 1, solarDay + 1);
        dY = next.getFullYear(); dM = next.getMonth() + 1; dD = next.getDate();
    }

    const yearPillar = calcYearPillar(solarYear, solarMonth, solarDay, hourVal);
    const monthPillar = calcMonthPillar(solarYear, solarMonth, solarDay, yearPillar.ganIdx, hourVal);
    const dayPillar = calcDayPillar(dY, dM, dD);
    const hourPillar = calcHourPillar(hourVal, dayPillar.ganIdx);

    const pillars = [yearPillar, monthPillar, dayPillar, hourPillar];
    const ohaengCount = countOhaeng(pillars);
    const sipseongs = pillars.map(p => calcSipseong(dayPillar.ganIdx, p.ganIdx));

    const daewoon = calcDaewoon(dY, dM, dD, hour, gender, yearPillar.ganIdx, monthPillar, dayPillar.ganIdx);

    const wunseongs = pillars.map(p => calc12Wunseong(dayPillar.ganIdx, p.jiIdx));
    const sinsals = pillars.map(p => calc12Sinsal(yearPillar.jiIdx, p.jiIdx));
    const yongshinData = evaluateStrengthAndYongshin(dayPillar.gan, pillars);

    // ★ v5.2: 격국 / 12신살 전체 / 형충파해 / 육친관계
    const gyeokguk = calcGyeokguk(dayPillar.ganIdx, monthPillar);
    const gyeokgukDesc = GYEOKGUK_DESC[gyeokguk] || '';
    const allSinsal = calcAllSinsal(yearPillar.jiIdx);
    const hyeongchungDetails = analyzeHyeongChungPaHae(pillars);
    const yukchinDetails = pillars.map((p, i) => ({
        pillar: i,
        sipseong: sipseongs[i],
        yukchin: YUKCHIN_BY_SIPSEONG[sipseongs[i]] || '',
        desc: YUKCHIN_DESC[sipseongs[i]] || ''
    }));

    // ★ v5.0: 12운성/12신살 의미 텍스트 동적 조합 (렌더링용)
    const wunseongDetails = pillars.map((p, i) => ({
        pillar: i, name: wunseongs[i], meaning: WUNSEONG_MEANING[wunseongs[i]] || ''
    }));
    const sinsalDetails = pillars.map((p, i) => ({
        pillar: i, name: sinsals[i], meaning: SINSAL_MEANING[sinsals[i]] || ''
    }));

    return {
        yearPillar, monthPillar, dayPillar, hourPillar,
        pillars, ohaengCount, sipseongs,
        dayGan: dayPillar.gan, dayGanIdx: dayPillar.ganIdx,
        dayJi: dayPillar.ji,
        daewoon,
        wunseongs,
        sinsals,
        wunseongDetails,
        sinsalDetails,
        gyeokguk,
        gyeokgukDesc,
        allSinsal,
        hyeongchungDetails,
        yukchinDetails,
        isYajasi,
        jasiRule,
        yongshinData,
        solarDate: { year: solarYear, month: solarMonth, day: solarDay },
        lunarDate: lunarDateInfo
    };
}

/* ═══════════════════════════════════════════
   ★ v5.0: JSON 응답 규격 빌더 (기존 구조 100% 호환 + 풀이 데이터 포함)
   입력값이 달라지면 아래 JSON의 모든 해설 필드가 동적으로 달라짐
   ═══════════════════════════════════════════ */

function buildFortuneJSON(result, inputMeta) {
    const pillars8 = result.pillars.map(p => `${p.gan.name}${p.ji.hangul}`);
    const pillarNames = ['year', 'month', 'day', 'hour'];
    const pillarsDetail = {};
    result.pillars.forEach((p, i) => {
        pillarsDetail[pillarNames[i]] = {
            gan: p.gan.name,
            ganHangul: p.gan.hangul,
            ji: p.ji.name,
            jiHangul: p.ji.hangul,
            zodiac: p.ji.zodiac,
            ohaeng: { gan: p.gan.ohaeng, ji: p.ji.ohaeng }
        };
    });

    const ohaengPercent = {};
    OHAENG_CYCLE.forEach(oh => {
        ohaengPercent[oh] = Math.round(((result.ohaengCount[oh] || 0) / 8) * 100);
    });

    const yearPillar = result.yearPillar;
    const wunseongByPillar = {};
    const sinsalByPillar = {};
    result.wunseongDetails.forEach(w => { wunseongByPillar[pillarNames[w.pillar]] = { name: w.name, meaning: w.meaning }; });
    result.sinsalDetails.forEach(s => { sinsalByPillar[pillarNames[s.pillar]] = { name: s.name, meaning: s.meaning }; });

    const yearlyFortunes = generateAllFortunes(
        result.pillars, result.dayGanIdx, result.dayPillar.jiIdx,
        result.solarDate.year, new Date().getFullYear(), 15
    );

    return {
        meta: { generator: 'lee-saju-engine', version: 'v5.2', generatedAt: new Date().toISOString() },
        input: inputMeta || {},
        saju: {
            pillars8,
            pillarsDetail,
            yearPillar: { gan: yearPillar.gan.name, ji: yearPillar.ji.name, ganji: `${yearPillar.gan.name}${yearPillar.ji.hangul}` },
            dayGan: { name: result.dayGan.name, hangul: result.dayGan.hangul, ohaeng: result.dayGan.ohaeng },
            solarDate: result.solarDate,
            lunarDate: result.lunarDate,
            isYajasi: result.isYajasi || false,
            jasiRule: result.jasiRule || 'yajasi'
        },
        ohaeng: {
            count: result.ohaengCount,
            percent: ohaengPercent,
            dominant: result.yongshinData.dominantOhaeng,
            missing: result.yongshinData.missingOhaeng
        },
        sipseong: {
            byPillar: ['년간', '월간', '일간(본인)', '시간'].map((label, i) => ({ label, name: result.sipseongs[i] })),
            main: result.sipseongs[2]
        },
        gyeokguk: {
            name: result.gyeokguk,
            desc: GYEOKGUK_DESC[result.gyeokguk] || '',
            monthJi: result.monthPillar.ji.name
        },
        hyeongchung: {
            details: result.hyeongchungDetails || []
        },
        yukchin: {
            details: result.yukchinDetails || []
        },
        allSinsal: result.allSinsal || [],
        yongshin: {
            strengthText: result.yongshinData.strengthText,
            score: result.yongshinData.score,
            isStrong: result.yongshinData.isStrong,
            yongshin: result.yongshinData.yongshin,
            heeshin: result.yongshinData.heeshin,
            desc: result.yongshinData.desc
        },
        daewoon: {
            startAge: result.daewoon.startAge,
            direction: result.daewoon.direction,
            daewoons: result.daewoon.daewoons.map(d => ({
                index: d.index, ganji: d.ganji, ganjiKor: d.ganjiKor,
                startAge: d.startAge, endAge: d.endAge,
                startYear: d.startYear, endYear: d.endYear,
                title: d.title, desc: d.desc, isCurrent: d.isCurrent
            }))
        },
        wunseong: wunseongByPillar,
        sinsal: sinsalByPillar,
        character: {
            html: generateCharacterAnalysis(result.dayGan, result.ohaengCount, result.pillars)
        },
        yearlyFortunes: yearlyFortunes.map(f => ({
            year: f.year, age: f.age, ganji: f.ganji, ganjiKor: f.ganjiKor,
            sipseong: f.sipseong, total: f.total, wealth: f.wealth, love: f.love,
            health: f.health, career: f.career, academic: f.academic, money: f.money,
            luck: f.luck, advice: f.advice, elementNote: f.elementNote
        }))
    };
}

window.calculateSaju = calculateSaju;
window.calculateCompatibility = calculateCompatibility;
window.generateAllFortunes = generateAllFortunes;
window.generateCharacterAnalysis = generateCharacterAnalysis;
window.buildFortuneJSON = buildFortuneJSON;
window.getOhaengAdvice = getOhaengAdvice;
window.calcGyeokguk = calcGyeokguk;
window.findSolarTermTime = findSolarTermTime;
window.SIPSEONG_DETAIL = SIPSEONG_DETAIL;
window.OHAENG_KOR = OHAENG_KOR;
window.OHAENG_NAMES = OHAENG_NAMES;
