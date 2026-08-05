/* ═══════════════════════════════════════════════════
   이성효의 명리학 - 안드로이드 모바일 UI 스크립트 v4.2
   (직접 텍스트 타이핑 + 노란색 달력 버튼 듀얼 기능)
   ═══════════════════════════════════════════════════ */

const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];

const YEAR_COUNT = 15;

let selectedGender = 'male';
let selectedCal = 'solar';
let selectedHour = '';

let isCompatibilityMode = false;
let selectedGender2 = 'male';
let selectedHour2 = '';

// ★ v5.2: 자시 기준 (야자시분일 기본 - 표준 만세력과 동일)
let selectedJasi = 'yajasi';

let _lastResult = null;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Pinch Zoom Engine
    const pinchEngine = new window.PinchZoomEngine('#pinchContainer', {
        minScale: 0.8,
        maxScale: 3.5
    });

    // Toolbar Buttons
    $('#btnZoomIn').addEventListener('click', () => pinchEngine.zoomIn(0.25));
    $('#btnZoomOut').addEventListener('click', () => pinchEngine.zoomOut(0.25));
    $('#btnZoomReset').addEventListener('click', () => pinchEngine.resetZoom());
    $('#btnFontInc').addEventListener('click', () => pinchEngine.changeFontSize(0.1));
    $('#btnFontDec').addEventListener('click', () => pinchEngine.changeFontSize(-0.1));

    createParticles();
    setupFormEvents();
    setupDualDatePickers();
    checkSavedData();
});

function createParticles() {
    const container = $('#bgParticles');
    if (!container) return;
    for (let i = 0; i < 25; i++) {
        const p = document.createElement('div');
        p.className = 'bg-particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.top = Math.random() * 100 + '%';
        p.style.width = (Math.random() * 2 + 1) + 'px';
        p.style.height = p.style.width;
        p.style.opacity = Math.random() * 0.3 + 0.1;
        container.appendChild(p);
    }
}

/* ═══════════════════════════════════════════
   생년월일 직접입력 & 노란색 달력 버튼 듀얼 연동
   ═══════════════════════════════════════════ */

function setupDualDatePickers() {
    setupSingleDualPicker('#birthDateInput', '#btnOpenCalPicker', '#birthDateHidden');
    setupSingleDualPicker('#birthDateInput2', '#btnOpenCalPicker2', '#birthDateHidden2');
}

function setupSingleDualPicker(textInputSel, btnCalSel, hiddenPickerSel) {
    const textInput = $(textInputSel);
    const btnCal = $(btnCalSel);
    const hiddenPicker = $(hiddenPickerSel);

    if (!textInput || !hiddenPicker) return;

    // 1. Direct Typing Auto Formatting (e.g. 19950515 -> 1995-05-15)
    textInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        if (val.length >= 8) {
            val = val.substring(0, 8);
            const formatted = `${val.substring(0, 4)}-${val.substring(4, 6)}-${val.substring(6, 8)}`;
            textInput.value = formatted;
            hiddenPicker.value = formatted;
        }
    });

    // 2. Yellow Calendar Button Click Handler
    if (btnCal) {
        btnCal.addEventListener('click', () => {
            try {
                if (hiddenPicker.showPicker) {
                    hiddenPicker.showPicker();
                } else {
                    hiddenPicker.focus();
                    hiddenPicker.click();
                }
            } catch (err) {
                hiddenPicker.focus();
                hiddenPicker.click();
            }
        });
    }

    // 3. Hidden Date Picker Selection Sync
    hiddenPicker.addEventListener('change', () => {
        if (hiddenPicker.value) {
            textInput.value = hiddenPicker.value;
        }
    });
}

function setupFormEvents() {
    const form = $('#fortuneForm');

    // Calendar Toggle (v5.1: 음력 선택 시 윤달 입력란 표시)
    $('#calendarToggle').addEventListener('click', (e) => {
        const btn = e.target.closest('.cal-btn');
        if (!btn) return;
        $$('#calendarToggle .cal-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedCal = btn.dataset.cal;
        const calHint = $('#calHint');
        if (calHint) {
            calHint.textContent = selectedCal === 'solar' ? '※ 직접 타이핑(예: 19950515) 또는 달력 이미지 클릭 선택' : '※ 음력 생년월일 입력 (동일 사주로 양력 자동 변환)';
        }
        const leapGroup = $('#intercalationGroup');
        if (leapGroup) leapGroup.style.display = selectedCal === 'lunar' ? 'block' : 'none';
        const leapGroup2 = $('#intercalationGroup2');
        if (leapGroup2) leapGroup2.style.display = selectedCal === 'lunar' ? 'block' : 'none';
    });

    // Gender Toggle
    $('#genderToggle').addEventListener('click', (e) => {
        const btn = e.target.closest('.gender-btn');
        if (!btn) return;
        $$('#genderToggle .gender-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedGender = btn.dataset.gender;
    });

    // Time Grid
    $('#timeGrid').addEventListener('click', (e) => {
        const btn = e.target.closest('.time-btn');
        if (!btn) return;
        $$('#timeGrid .time-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedHour = btn.dataset.hour;
    });

    // ★ v5.2: 자시 기준 토글 (야자시분일 / 자정분일)
    if ($('#jasiToggle')) {
        $('#jasiToggle').addEventListener('click', (e) => {
            const btn = e.target.closest('.cal-btn');
            if (!btn) return;
            $$('#jasiToggle .cal-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedJasi = btn.dataset.jasi;
        });
    }

    // Compatibility Mode Toggle
    $('#compatModeToggle').addEventListener('click', (e) => {
        const btn = e.target.closest('.toggle-btn');
        if (!btn) return;
        isCompatibilityMode = btn.dataset.mode === 'couple';
        $$('#compatModeToggle .toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const compatFields = $('#compatFields');
        if (compatFields) {
            compatFields.style.display = isCompatibilityMode ? 'block' : 'none';
        }
        const submitText = $('#btnSubmit .btn-submit-text');
        if (submitText) {
            submitText.textContent = isCompatibilityMode ? '💑 궁합 보기' : '🔮 운세 보기';
        }
    });

    // Person 2 Events
    $('#genderToggle2').addEventListener('click', (e) => {
        const btn = e.target.closest('.gender-btn');
        if (!btn) return;
        $$('#genderToggle2 .gender-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedGender2 = btn.dataset.gender;
    });

    $('#timeGrid2').addEventListener('click', (e) => {
        const btn = e.target.closest('.time-btn');
        if (!btn) return;
        $$('#timeGrid2 .time-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedHour2 = btn.dataset.hour;
    });

    // 날짜 유효성 검사 (예: 2023-02-30 방지)
    function isValidDate(y, m, d) {
        if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
        const dt = new Date(y, m - 1, d);
        return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
    }

    // v5.1: 공통 사주 계산 헬퍼 (유효성 검사 + 오류 처리 단일화)
    // v5.2: jasiRule(야자시분일/자정분일) 8번째 파라미터 전달
    function computeSaju(y, m, d, hour, gender, cal, leap, jasiRule) {
        if (!isValidDate(y, m, d)) return { ok: false, reason: 'invalid-date' };
        if (cal === 'lunar' && typeof KoreanLunarCalendar === 'undefined') return { ok: false, reason: 'no-lunar-lib' };
        try {
            // ★ v5.2: 야자시분일 선택 시 자시 버튼(0)을 야자시(23)로 해석 (엔진은 원시 hour 그대로 사용)
            let effHour = hour;
            if (String(hour) === '0' && (jasiRule || 'yajasi') === 'yajasi') effHour = '23';
            return { ok: true, result: window.calculateSaju(y, m, d, effHour, gender, cal, !!leap, jasiRule || 'yajasi') };
        } catch (err) {
            console.error('사주 계산 오류:', err);
            return { ok: false, reason: 'calc-error' };
        }
    }

    function sajuErrorMessage(reason, who) {
        const prefix = who ? who + ' ' : '';
        if (reason === 'invalid-date') return prefix + '생년월일이 존재하지 않는 날짜입니다. 확인해주세요.';
        if (reason === 'no-lunar-lib') return '음력 변환 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인해주세요.';
        return prefix + '사주 계산 중 오류가 발생했습니다. 입력값을 확인해주세요.';
    }

    // Form Submit (v5.1: 사전 검증 후 계산 - 부분 상태 방지 + 윤달 연동)
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = $('#userName').value.trim();
        const birthVal = $('#birthDateInput').value.trim();

        if (!name) { showToast('이름을 입력해주세요.', '⚠️'); return; }
        if (!birthVal || birthVal.length < 10) { showToast('생년월일을 YYYY-MM-DD (예: 19950515) 형식으로 입력 혹은 달력에서 선택해주세요.', '⚠️'); return; }

        const [y, m, d] = birthVal.split('-').map(Number);
        const isIntercalation = !!(selectedCal === 'lunar' && $('#intercalationToggle') && $('#intercalationToggle').checked);

        // 1. 궁합 모드: 상대방 입력 사전 검증 (검증 통과 전에는 아무 상태도 변경하지 않음)
        let name2 = '', y2 = 0, m2 = 0, d2 = 0, isIntercalation2 = isIntercalation, c2 = null;
        if (isCompatibilityMode) {
            name2 = $('#userName2').value.trim();
            const birth2 = $('#birthDateInput2').value.trim();
            if (!name2 || !birth2 || birth2.length < 10) {
                showToast('궁합 모드입니다. 상대방 정보도 입력해주세요.', '⚠️');
                return;
            }
            [y2, m2, d2] = birth2.split('-').map(Number);
            isIntercalation2 = !!(selectedCal === 'lunar' && $('#intercalationToggle2') && $('#intercalationToggle2').checked);
            c2 = computeSaju(y2, m2, d2, selectedHour2, selectedGender2, selectedCal, isIntercalation2, selectedJasi);
            if (!c2.ok) {
                showToast(sajuErrorMessage(c2.reason, '상대방'), '⚠️');
                return;
            }
        }

        // 2. 본인 사주 계산
        const c1 = computeSaju(y, m, d, selectedHour, selectedGender, selectedCal, isIntercalation, selectedJasi);
        if (!c1.ok) {
            showToast(sajuErrorMessage(c1.reason, ''), '⚠️');
            return;
        }
        const result = c1.result;
        _lastResult = { name, year: y, month: m, day: d, gender: selectedGender, cal: selectedCal, hour: selectedHour, isIntercalation, jasi: selectedJasi, result };

        displayResults(name, y, m, d, result);

        // 3. 궁합 결과 표시
        if (isCompatibilityMode && c2) {
            const result2 = c2.result;
            const compat = window.calculateCompatibility(result, result2);
            _lastResult.compat = { name2, year: y2, month: m2, day: d2, gender: selectedGender2, hour: selectedHour2, isIntercalation: isIntercalation2, result: result2, compat };
            renderCompatibility(name, result, name2, result2, compat);
            showToast(`${name}님과 ${name2}님의 궁합을 분석했습니다!`, '💑');
        } else {
            $('#compatResultContainer').style.display = 'none';
        }

        $('#formSection').style.display = 'none';
        const resSec = $('#resultSection');
        resSec.style.display = 'flex';
        resSec.classList.add('visible');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        showToast(`${name}님의 사주를 분석했습니다!`, '🔮');
    });

    // Back, Save, Print
    $('#btnBack').addEventListener('click', () => {
        $('#resultSection').style.display = 'none';
        $('#formSection').style.display = 'flex';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    $('#btnSaveResult').addEventListener('click', () => {
        if (!_lastResult) return;
        localStorage.setItem('lee_saju_data', JSON.stringify(_lastResult));
        showToast('결과가 저장되었습니다!', '💾');
    });

    $('#btnPrintResult').addEventListener('click', () => window.print());
    $('#btnLoadSaved').addEventListener('click', loadSavedData);
}

/* ═══════════════════════════════════════════
   결과 표시 (순서 엄격 정렬 & 오류 방지 완료)
   ═══════════════════════════════════════════ */

function displayResults(name, year, month, day, result) {
    const { yearPillar, monthPillar, dayPillar, hourPillar, pillars, ohaengCount, sipseongs, dayGan, daewoon, solarDate, lunarDate } = result;

    // Profile Card
    $('#profileName').textContent = name;
    $('#profileGender').textContent = selectedGender === 'male' ? '♂ 남자' : '♀ 여자';
    
    let birthStr = `양력 ${solarDate.year}년 ${solarDate.month}월 ${solarDate.day}일`;
    if (lunarDate) {
        const leapMark = lunarDate.intercalation ? '(윤)' : '';
        birthStr += ` (음력 ${lunarDate.year}년 ${lunarDate.month}월${leapMark} ${lunarDate.day}일)`;
    }
    $('#profileBirth').textContent = birthStr;
    $('#profileInitials').textContent = name.charAt(0);

    // 1. 사주팔자 (Pillars)
    const pillarNames = ['년주', '월주', '일주', '시주'];
    const pillarsData = [yearPillar, monthPillar, dayPillar, hourPillar];
    let pillarsHtml = '';
    pillarsData.forEach((p, i) => {
        const ohaengClass = 'ohaeng-' + p.gan.ohaeng;
        pillarsHtml += `
            <div class="pillar-card">
                <div class="pillar-label">${pillarNames[i]}</div>
                <div class="pillar-gan">${p.gan.name}</div>
                <div class="pillar-ji">${p.ji.hangul}</div>
                <div class="pillar-ohaeng ${ohaengClass}">${window.OHAENG_NAMES[p.gan.ohaeng]}</div>
            </div>
        `;
    });
    $('#sajuPillars').innerHTML = pillarsHtml;

    // 2. 용신 및 격국 분석 (v5.0: 개인별 동적 해설 포함)
    const yd = result.yongshinData;
    $('#yongshinSection').innerHTML = `
        <div style="font-size: 1.05rem; font-weight: 800; color: var(--gold-bright); margin-bottom: 6px;">
            ${yd.strengthText} (${yd.score}점)
        </div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 12px;">
            일간 <strong>${dayGan.hangul}(${dayGan.name})</strong>의 기운 상태를 종합한 처방 오행입니다.
        </div>
        <div class="sipseong-detail-grid">
            ${result.gyeokguk ? `<div class="sipseong-detail-item">
                <span class="sipseong-detail-label">🎯 격국</span>
                <span class="sipseong-detail-text">${result.gyeokguk}</span>
            </div>` : ''}
            <div class="sipseong-detail-item">
                <span class="sipseong-detail-label">🔑 용신</span>
                <span class="sipseong-detail-text">${yd.yongshin}</span>
            </div>
            <div class="sipseong-detail-item">
                <span class="sipseong-detail-label">✨ 희신</span>
                <span class="sipseong-detail-text">${yd.heeshin}</span>
            </div>
        </div>
        ${result.gyeokgukDesc ? `<div style="margin-top:8px; font-size:0.82rem; color:var(--text-secondary); line-height:1.6;">🎯 ${result.gyeokguk} — ${result.gyeokgukDesc}</div>` : ''}
        ${yd.desc ? `<div style="margin-top:12px; padding:12px 14px; border-left:3px solid var(--gold-bright); background:rgba(241,196,15,0.06); border-radius:8px; font-size:0.85rem; line-height:1.7; color:var(--text-primary);">${yd.desc}</div>` : ''}
        ${result.isYajasi ? `<div style="margin-top:8px; font-size:0.78rem; color:#ec4899;">🌙 야자시(23시~24시) 출생으로 판정되어 다음날 일주를 기준으로 계산했습니다.</div>` : ''}
    `;

    // 3. 대운 (Daewoon)
    renderDaewoon(daewoon);

    // 4. 오행 분석 (Ohaeng)
    renderOhaeng(ohaengCount, dayGan);

    // 5. 십성 분석 (Sipseong)
    renderSipseong(pillarsData, sipseongs);

    // 6. 성격 및 특성 (Character)
    const characterText = window.generateCharacterAnalysis(dayGan, ohaengCount, pillarsData);
    $('#characterCard').innerHTML = `<div class="character-text">${characterText}</div>`;

    // 7. 12운성 & 12신살 & 형충파해 심화
    renderExtraAnalysis(result);

    // 8. 연도별 세운 (2026년부터 15년)
    const currentYear = new Date().getFullYear(); // 2026
    const fortunes = window.generateAllFortunes(pillarsData, dayPillar.ganIdx, dayPillar.jiIdx, solarDate.year, currentYear, YEAR_COUNT);
    renderYearNav(fortunes);
    renderYearlyFortune(fortunes);
}

/* ─── 대운 렌더링 ─── */
function renderDaewoon(daewoon) {
    const section = $('#daewoonSection');
    let html = `
        <div class="daewoon-header">
            <div class="daewoon-info">
                <span class="daewoon-badge">${daewoon.startAge}세 기산</span>
                <span class="daewoon-direction">${daewoon.direction}</span>
                <span class="daewoon-start">${daewoon.daewoons[0].startYear}년 ~ ${daewoon.daewoons[daewoon.daewoons.length - 1].startYear + 10}년</span>
            </div>
        </div>
        <div class="daewoon-timeline">
    `;

    daewoon.daewoons.forEach(dw => {
        const active = dw.isCurrent ? ' active' : '';
        html += `
            <div class="daewoon-item${active}">
                <div class="daewoon-age">
                    <div class="daewoon-age-dot"></div>
                    <span class="daewoon-age-num">${dw.startAge}~${dw.endAge}세</span>
                </div>
                <div class="daewoon-content">
                    <div class="daewoon-content-header">
                        <span class="daewoon-ganji">${dw.ganjiKor} (${dw.ganji})</span>
                        <span class="daewoon-range">${dw.startYear}년 ~ ${dw.endYear}년</span>
                    </div>
                    <div class="daewoon-title">${dw.index}대운 · ${dw.title}</div>
                    <div class="daewoon-desc">${dw.desc}</div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    section.innerHTML = html;
}

/* ─── 오행 렌더링 ─── */
function renderOhaeng(ohaengCount, dayGan) {
    const OHAENG_CYCLE = ['wood', 'fire', 'earth', 'metal', 'water'];
    let html = '<div class="ohaeng-bars">';
    OHAENG_CYCLE.forEach(oh => {
        const count = ohaengCount[oh] || 0;
        const percentage = (count / 8) * 100;
        html += `
            <div class="ohaeng-row">
                <span class="ohaeng-label ${oh}">${window.OHAENG_KOR[oh]}</span>
                <div class="ohaeng-bar-track">
                    <div class="ohaeng-bar ${oh}" style="width: ${percentage}%"></div>
                </div>
                <span class="ohaeng-count">${count}</span>
            </div>
        `;
    });
    html += '</div>';

    // v5.1: 오행 보충 조언 (입력값 기반 동적 문장)
    if (window.getOhaengAdvice) {
        const advice = window.getOhaengAdvice(ohaengCount, dayGan);
        html += `<div class="ohaeng-advice">💡 ${advice}</div>`;
    }

    $('#ohaengSection').innerHTML = html;

    setTimeout(() => {
        $$('.ohaeng-bar').forEach(bar => {
            const w = bar.style.width;
            bar.style.width = '0%';
            setTimeout(() => { bar.style.width = w; }, 100);
        });
    }, 200);
}

/* ─── 십성 렌더링 ─── */
function renderSipseong(pillarsData, sipseongs) {
    const sipseongNames = ['년간', '월간', '일간(본인)', '시간'];
    let html = '<div class="sipseong-grid">';
    pillarsData.forEach((p, i) => {
        const sipseong = sipseongs[i];
        const ohaengClass = p.gan.ohaeng;
        html += `
            <div class="sipseong-item">
                <div class="sipseong-icon ${ohaengClass}">${p.gan.hangul}</div>
                <div class="sipseong-info">
                    <div class="sipseong-name">${sipseongNames[i]}: ${sipseong}</div>
                    <div class="sipseong-detail">${p.gan.hangul}(${p.gan.name}) · ${window.OHAENG_KOR[p.gan.ohaeng]}</div>
                </div>
            </div>
        `;
    });
    html += '</div>';

    const mainSipseong = sipseongs[2];
    const detail = window.SIPSEONG_DETAIL[mainSipseong];
    if (detail) {
        html += `
            <div class="sipseong-detail-box">
                <div class="sipseong-detail-title">💡 ${mainSipseong}의 특징</div>
                <div class="sipseong-detail-grid">
                    <div class="sipseong-detail-item"><span class="sipseong-detail-label">🧠 성격</span><span class="sipseong-detail-text">${detail.personality}</span></div>
                    <div class="sipseong-detail-item"><span class="sipseong-detail-label">💰 재물</span><span class="sipseong-detail-text">${detail.wealth}</span></div>
                    <div class="sipseong-detail-item"><span class="sipseong-detail-label">💕 애정</span><span class="sipseong-detail-text">${detail.love}</span></div>
                    <div class="sipseong-detail-item"><span class="sipseong-detail-label">🏢 직업</span><span class="sipseong-detail-text">${detail.career}</span></div>
                    <div class="sipseong-detail-item"><span class="sipseong-detail-label">⚠️ 주의</span><span class="sipseong-detail-text">${detail.caution}</span></div>
                </div>
            </div>`;
    }
    $('#sipseongSection').innerHTML = html;
}

/* ─── 12운성 / 12신살 렌더링 (v5.0: 개인별 의미 해설 동적 조합) ─── */
function renderExtraAnalysis(result) {
    const pillarNames = ['년주', '월주', '일주', '시주'];
    let html = '<div class="sipseong-detail-grid">';

    result.wunseongs.forEach((w, i) => {
        html += `
            <div class="sipseong-detail-item">
                <span class="sipseong-detail-label">${pillarNames[i]}</span>
                <span class="sipseong-detail-text">12운성: <strong>${w}</strong> / 12신살: <strong>${result.sinsals[i]}</strong></span>
            </div>
        `;
    });
    html += '</div>';

    // 12운성 의미 해설
    if (result.wunseongDetails) {
        html += '<div class="sipseong-detail-box" style="margin-top:14px;">';
        html += '<div class="sipseong-detail-title">🌱 12운성 해설</div>';
        html += '<div class="sipseong-detail-grid">';
        result.wunseongDetails.forEach((w, i) => {
            html += `
                <div class="sipseong-detail-item">
                    <span class="sipseong-detail-label">${pillarNames[i]} · ${w.name}</span>
                    <span class="sipseong-detail-text">${w.meaning}</span>
                </div>
            `;
        });
        html += '</div></div>';
    }

    // 12신살 의미 해설
    if (result.sinsalDetails) {
        html += '<div class="sipseong-detail-box" style="margin-top:14px;">';
        html += '<div class="sipseong-detail-title">⚡ 12신살 해설</div>';
        html += '<div class="sipseong-detail-grid">';
        result.sinsalDetails.forEach((s, i) => {
            html += `
                <div class="sipseong-detail-item">
                    <span class="sipseong-detail-label">${pillarNames[i]} · ${s.name}</span>
                    <span class="sipseong-detail-text">${s.meaning}</span>
                </div>
            `;
        });
        html += '</div></div>';
    }

    // ★ v5.2: 12신살 전체표 (년지 기준 12지지)
    if (result.allSinsal) {
        html += '<div class="sipseong-detail-box" style="margin-top:14px;">';
        html += '<div class="sipseong-detail-title">🗺️ 12신살 전체표 (년지 기준)</div>';
        html += '<div class="sinsal-full-grid">';
        result.allSinsal.forEach(s => {
            html += `
                <div class="sinsal-full-item">
                    <div class="sinsal-full-ji">${s.jiHangul}(${s.ji})</div>
                    <div class="sinsal-full-name">${s.sal}</div>
                    <div class="sinsal-full-mean">${s.meaning}</div>
                </div>
            `;
        });
        html += '</div></div>';
    }

    // ★ v5.2: 형·충·파·해·합 상세
    if (result.hyeongchungDetails && result.hyeongchungDetails.length > 0) {
        html += '<div class="sipseong-detail-box" style="margin-top:14px;">';
        html += '<div class="sipseong-detail-title">⚔️ 형·충·파·해·합</div>';
        result.hyeongchungDetails.forEach(d => {
            html += `<div class="sipseong-detail-item" style="margin-top:8px;"><span class="sipseong-detail-label">${d.a} ↔ ${d.b}</span><span class="sipseong-detail-text">${d.text}</span></div>`;
        });
        html += '</div>';
    } else {
        html += '<div class="sipseong-detail-box" style="margin-top:14px;">';
        html += '<div class="sipseong-detail-title">⚔️ 형·충·파·해·합</div>';
        html += '<div class="sipseong-detail-text">명식 내부에 특별한 합·충·형·파·해 관계가 없습니다. 비교적 안정적인 구조입니다.</div></div>';
    }

    // ★ v5.2: 육친관계
    if (result.yukchinDetails) {
        html += '<div class="sipseong-detail-box" style="margin-top:14px;">';
        html += '<div class="sipseong-detail-title">👨‍👩‍👧‍👦 육친관계</div>';
        html += '<div class="sipseong-detail-grid">';
        result.yukchinDetails.forEach((y, i) => {
            html += `
                <div class="sipseong-detail-item">
                    <span class="sipseong-detail-label">${pillarNames[i]} · ${y.sipseong}</span>
                    <span class="sipseong-detail-text"><strong>${y.yukchin}</strong> — ${y.desc}</span>
                </div>
            `;
        });
        html += '</div></div>';
    }
    $('#extraAnalysisSection').innerHTML = html;
}

/* ─── 궁합 표시 ─── */
function renderCompatibility(name1, result1, name2, result2, compat) {
    const container = $('#compatResultContainer');
    const section = $('#compatResultSection');
    container.style.display = 'block';

    let jiDetailsHtml = '';
    if (compat.jiDetails.length > 0) {
        jiDetailsHtml = compat.jiDetails.map(d => `<div class="compatibility-item"><div class="compatibility-item-text">🔗 ${d}</div></div>`).join('');
    } else {
        jiDetailsHtml = '<div class="compatibility-item"><div class="compatibility-item-text">특별한 지지 관계가 없습니다. 무난한 조합입니다.</div></div>';
    }

    section.innerHTML = `
        <div class="compatibility-header">
            <div class="compatibility-score">${compat.totalScore}</div>
            <div class="compatibility-score-label">${compat.grade} · 100점 만점</div>
            <div class="compatibility-score-desc">${compat.desc}</div>
        </div>

        <div class="compatibility-compare">
            <div class="compared-person">
                <div class="compared-name" style="color: #5dade2;">${escHtml(name1)}</div>
                <div class="compared-title">일간: ${result1.dayGan.hangul}(${result1.dayGan.name}) · ${window.OHAENG_KOR[result1.dayGan.ohaeng]}</div>
            </div>
            <div class="compared-vs">♥</div>
            <div class="compared-person">
                <div class="compared-name" style="color: #ec4899;">${escHtml(name2)}</div>
                <div class="compared-title">일간: ${result2.dayGan.hangul}(${result2.dayGan.name}) · ${window.OHAENG_KOR[result2.dayGan.ohaeng]}</div>
            </div>
        </div>

        <div class="compatibility-bars">
            <div class="compatibility-bar-row">
                <span class="compatibility-bar-label">오행 조화</span>
                <div class="compatibility-bar-track">
                    <div class="compatibility-bar-fill" style="width: ${compat.ohaengScore}%"></div>
                </div>
                <span class="compatibility-bar-score">${compat.ohaengScore}</span>
            </div>
            <div class="compatibility-bar-row">
                <span class="compatibility-bar-label">지지 관계</span>
                <div class="compatibility-bar-track">
                    <div class="compatibility-bar-fill" style="width: ${compat.jiRelationScore}%"></div>
                </div>
                <span class="compatibility-bar-score">${compat.jiRelationScore}</span>
            </div>
            <div class="compatibility-bar-row">
                <span class="compatibility-bar-label">오행 상생</span>
                <div class="compatibility-bar-track">
                    <div class="compatibility-bar-fill" style="width: ${compat.elementCompat}%"></div>
                </div>
                <span class="compatibility-bar-score">${compat.elementCompat}</span>
            </div>
        </div>

        <div class="compatibility-items" style="margin-top: 16px;">
            <div class="compatibility-item" style="border-left-color: #ec4899;">
                <div class="compatibility-item-label">💕 일간 관계 (${compat.sipseongCompat})</div>
                <div class="compatibility-item-text">${compat.sipseongDesc}</div>
            </div>
            ${jiDetailsHtml}
        </div>
    `;

    setTimeout(() => {
        $$('.compatibility-bar-fill').forEach(bar => {
            const w = bar.style.width;
            bar.style.width = '0%';
            setTimeout(() => { bar.style.width = w; }, 100);
        });
    }, 300);
}

/* ─── 15년 세운 버튼 탭 및 최상단 배치 ─── */
function renderYearNav(fortunes) {
    const nav = $('#yearNav');
    let html = '';
    fortunes.forEach((f, i) => {
        const active = i === 0 ? ' active' : '';
        html += `<button type="button" class="year-nav-btn${active}" data-index="${i}">${f.year}년</button>`;
    });
    nav.innerHTML = html;

    // v5.1: onclick 재할당으로 중복 리스너 누적 방지 (재제출 시에도 1개만 동작)
    // ★ v5.3 수정: 위치 인덱스(cards[index]) 대신 카드의 data-year 속성으로 대상 카드 탐색
    //   - insertBefore로 카드 순서가 바뀐 뒤에도 클릭한 연도의 카드를 정확히 맨 위로 이동
    // ★ v5.3-3 수정: 스크롤 대상을 '연도별 운세' 라벨(nav 바로 위)로 지정
    //   - 고정 툴바(리셋/100% 바)에 라벨이 가려지지 않도록 툴바 높이를 실측해 아래 10px 간격으로 정렬
    //   - 화면에 '연도별 운세' 라벨 → 15개 연도 버튼 → 클릭한 연도 운세 순서로 모두 표시됨
    nav.onclick = (e) => {
        const btn = e.target.closest('.year-nav-btn');
        if (!btn) return;
        $$('.year-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const index = parseInt(btn.dataset.index);
        const container = $('#yearlyFortune');
        // 버튼은 항상 fortunes 배열에서 생성되므로 fortunes[index]는 항상 존재
        const targetYear = String(fortunes[index].year);
        const target = Array.from(container.querySelectorAll('.fortune-year-card'))
            .find(c => c.dataset.year === targetYear);

        if (target) {
            container.insertBefore(target, container.firstChild);
            $$('.fortune-year-card').forEach(c => c.classList.remove('highlight-card'));
            target.classList.add('highlight-card');
            // '연도별 운세' 라벨(연도 버튼 바로 위)을 툴바 아래 간격을 두고 보이도록 스크롤
            const toolbar = $('#zoomToolbar');
            const label = nav.previousElementSibling;
            if (label && label.classList.contains('section-label')) {
                const gap = 10;
                const offset = (toolbar ? toolbar.getBoundingClientRect().bottom : 50) + gap;
                label.style.scrollMarginTop = offset + 'px';
                label.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                nav.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };
}

function renderYearlyFortune(fortunes) {
    const container = $('#yearlyFortune');
    let html = '';
    fortunes.forEach((f, i) => {
        html += `
            <div class="fortune-year-card show" data-year="${f.year}">
                <div class="fortune-year-header">
                    <div class="fortune-year-title">
                        <span class="fortune-year-num">${f.year}년</span>
                        <span class="fortune-year-ganji">${f.ganjiKor}(${f.ganji}) · ${f.sipseong}</span>
                    </div>
                    <span class="fortune-age">만 ${f.age}세</span>
                </div>
                <div class="fortune-year-body">
                    <div class="fortune-categories">
                        <div class="fortune-cat" style="border-left-color: var(--gold-bright);">
                            <div class="fortune-cat-label">🔮 총운</div>
                            <div class="fortune-cat-text">${f.total}</div>
                        </div>
                        <div class="fortune-cat" style="border-left-color: #e74c3c;">
                            <div class="fortune-cat-label">💰 재물운</div>
                            <div class="fortune-cat-text">${f.wealth}</div>
                        </div>
                        <div class="fortune-cat" style="border-left-color: #ec4899;">
                            <div class="fortune-cat-label">💕 애정운</div>
                            <div class="fortune-cat-text">${f.love}</div>
                        </div>
                        <div class="fortune-cat" style="border-left-color: #27ae60;">
                            <div class="fortune-cat-label">💪 건강운</div>
                            <div class="fortune-cat-text">${f.health}</div>
                        </div>
                        <div class="fortune-cat" style="border-left-color: #5dade2;">
                            <div class="fortune-cat-label">🏢 직장운</div>
                            <div class="fortune-cat-text">${f.career}</div>
                        </div>
                        <div class="fortune-cat" style="border-left-color: #9b59b6;">
                            <div class="fortune-cat-label">📚 학업운</div>
                            <div class="fortune-cat-text">${f.academic}</div>
                        </div>
                        <div class="fortune-cat" style="border-left-color: #f39c12;">
                            <div class="fortune-cat-label">💵 금전운</div>
                            <div class="fortune-cat-text">${f.money}</div>
                        </div>
                        <div class="fortune-cat" style="border-left-color: #16a085;">
                            <div class="fortune-cat-label">🤝 인덕운</div>
                            <div class="fortune-cat-text">${f.luck}</div>
                        </div>
                        <div class="fortune-cat" style="border-left-color: var(--gold-light); background: rgba(241, 196, 15, 0.08);">
                            <div class="fortune-cat-label">📌 조언</div>
                            <div class="fortune-cat-text">${f.advice}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function showToast(msg, icon = '✓') {
    const container = $('#toastContainer');
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span>${icon}</span> ${escHtml(msg)}`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 2500);
}

function checkSavedData() {
    const raw = localStorage.getItem('lee_saju_data');
    if (raw) {
        $('#savedDataLink').style.display = 'block';
    }
}

function setActiveToggle(selector, value, dataKey) {
    $$(selector).forEach(b => {
        b.classList.toggle('active', String(b.dataset[dataKey]) === String(value));
    });
}

function loadSavedData() {
    const raw = localStorage.getItem('lee_saju_data');
    if (!raw) return;
    let data;
    try { data = JSON.parse(raw); } catch (e) { return; }

    $('#userName').value = data.name || '';
    if (data.year && data.month && data.day) {
        const formatted = `${data.year}-${String(data.month).padStart(2, '0')}-${String(data.day).padStart(2, '0')}`;
        $('#birthDateInput').value = formatted;
        $('#birthDateHidden').value = formatted;
    }

    // v5.1: 성별/달력/시간/윤달까지 저장된 값 그대로 복원 (재조회 결과 불일치 방지)
    if (data.gender) { selectedGender = data.gender; setActiveToggle('#genderToggle .gender-btn', data.gender, 'gender'); }
    if (data.cal) {
        selectedCal = data.cal;
        setActiveToggle('#calendarToggle .cal-btn', data.cal, 'cal');
        const leapGroup = $('#intercalationGroup');
        if (leapGroup) leapGroup.style.display = selectedCal === 'lunar' ? 'block' : 'none';
        const calHint = $('#calHint');
        if (calHint) calHint.textContent = selectedCal === 'solar' ? '※ 직접 타이핑(예: 19950515) 또는 달력 이미지 클릭 선택' : '※ 음력 생년월일 입력 (동일 사주로 양력 자동 변환)';
    }
    if (data.hour !== undefined && data.hour !== null) {
        selectedHour = String(data.hour);
        setActiveToggle('#timeGrid .time-btn', String(data.hour), 'hour');
    }
    if (data.isIntercalation && $('#intercalationToggle')) {
        $('#intercalationToggle').checked = !!data.isIntercalation;
    }
    // ★ v5.2: 자시 기준 복원
    if (data.jasi) {
        selectedJasi = data.jasi;
        if ($('#jasiToggle')) setActiveToggle('#jasiToggle .cal-btn', data.jasi, 'jasi');
    }

    // 궁합 모드 복원
    if (data.compat && data.compat.name2) {
        isCompatibilityMode = true;
        setActiveToggle('#compatModeToggle .toggle-btn', 'couple', 'mode');
        const compatFields = $('#compatFields');
        if (compatFields) compatFields.style.display = 'block';
        const submitText = $('#btnSubmit .btn-submit-text');
        if (submitText) submitText.textContent = '💑 궁합 보기';
        $('#userName2').value = data.compat.name2 || '';
        if (data.compat.year && data.compat.month && data.compat.day) {
            const f = `${data.compat.year}-${String(data.compat.month).padStart(2, '0')}-${String(data.compat.day).padStart(2, '0')}`;
            $('#birthDateInput2').value = f;
            $('#birthDateHidden2').value = f;
        }
        if (data.compat.gender) { selectedGender2 = data.compat.gender; setActiveToggle('#genderToggle2 .gender-btn', data.compat.gender, 'gender'); }
        if (data.compat.hour !== undefined && data.compat.hour !== null) {
            selectedHour2 = String(data.compat.hour);
            setActiveToggle('#timeGrid2 .time-btn', String(data.compat.hour), 'hour');
        }
        if (data.compat.isIntercalation && $('#intercalationToggle2')) {
            $('#intercalationToggle2').checked = !!data.compat.isIntercalation;
        }
        const leapGroup2 = $('#intercalationGroup2');
        if (leapGroup2) leapGroup2.style.display = selectedCal === 'lunar' ? 'block' : 'none';
    }

    showToast(`${data.name}님의 저장된 정보를 불러왔습니다.`, '📂');
}
