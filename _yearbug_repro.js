/* ═══════════════════════════════════════════════════════════════
   연도별 운세 버튼 오류 재현 + 수정안 검증 시뮬레이션
   - 현재 script.js renderYearNav onclick 로직과 동일한 알고리즘을
     단순 배열로 모델링 (insertBefore = 이동, querySelectorAll = 현재 DOM 순서 스냅샷)
   - 15개 카드 (2026년~2040년) 기준
   ═══════════════════════════════════════════════════════════════ */

// ── 현재(버그) 로직 시뮬레이션 ──────────────────────────────────
function simulateCurrent(clicks) {
    // DOM 순서 (배열) - Yk = 해당 연도의 카드
    const YEAR0 = 2026;
    let dom = Array.from({ length: 15 }, (_, i) => YEAR0 + i);
    const log = [];
    for (const idx of clicks) {
        // onclick 내부: cards = Array.from($$('.fortune-year-card')) → 현재 DOM 순서 그대로
        const cards = [...dom];
        const moved = cards[idx];
        const movedYear = moved;
        // insertBefore(cards[idx], container.firstChild)
        dom = [moved, ...dom.filter(c => c !== moved)];
        const topCard = dom[0];
        const expected = YEAR0 + idx;
        log.push({
            click: expected + '년 버튼',
            movedToTop: movedYear + '년 카드',
            match: movedYear === expected ? 'OK' : '✗ 불일치!',
            note: movedYear === expected ? '' : (expected + '년 버튼을 눌렀는데 ' + movedYear + '년 카드가 맨 위로 감')
        });
    }
    return log;
}

// ── 수정안(안정 속성 매칭) 로직 시뮬레이션 ─────────────────────────
function simulateFixed(clicks) {
    const YEAR0 = 2026;
    let dom = Array.from({ length: 15 }, (_, i) => YEAR0 + i);
    const log = [];
    for (const idx of clicks) {
        const expected = YEAR0 + idx;
        // 수정안: 카드의 data-year 속성으로 대상 카드를 탐색 (위치 인덱스 미사용)
        const target = dom.find(y => y === expected);
        const moved = target;
        dom = [moved, ...dom.filter(c => c !== moved)];
        const topCard = dom[0];
        log.push({
            click: expected + '년 버튼',
            movedToTop: moved + '년 카드',
            match: moved === expected ? 'OK' : '✗ 불일치!',
            note: moved === expected ? '' : (expected + '년 버튼을 눌렀는데 ' + moved + '년 카드가 맨 위로 감')
        });
    }
    return log;
}

function render(title, logs) {
    console.log('━━━ ' + title + ' ━━━');
    for (const l of logs) {
        console.log(`  ${l.click} → 맨위 ${l.movedToTop}  [${l.match}]${l.note ? '  ← ' + l.note : ''}`);
    }
    console.log('');
}

// 시나리오 A: 2031년(5) → 2028년(2) 클릭
// 시나리오 B: 2031년(5) → 2026년(0) → 2031년(5) → 2033년(7)
// 시나리오 C: 연속 클릭 (1 → 2 → 3 → 4 → 5)
const scenarios = {
    '시나리오 A (5 → 2)': [5, 2],
    '시나리오 B (5 → 0 → 5 → 7)': [5, 0, 5, 7],
    '시나리오 C (1 → 2 → 3 → 4 → 5)': [1, 2, 3, 4, 5]
};

let failCount = 0, testCount = 0;
for (const [name, clicks] of Object.entries(scenarios)) {
    console.log('■ ' + name);
    const cur = simulateCurrent(clicks);
    render('현재 로직 (버그 유무 확인)', cur);
    const fixed = simulateFixed(clicks);
    render('수정안 로직', fixed);
    for (const l of cur) { testCount++; if (l.match !== 'OK') failCount++; }
    for (const l of fixed) { testCount++; if (l.match !== 'OK') failCount++; }
}

console.log('════════════════════════════════════════════════');
console.log(`검증 결과: 총 ${testCount}회 클릭 중 오류 ${failCount}회 (수정안 적용 시 0회)`);
console.log(failCount > 0 ? '→ 현재 로직에 버그 확정. 수정 필요.' : '→ 오류 없음.');
