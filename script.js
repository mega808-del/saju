/* ═══════════════════════════════════════════════════
   이성효의 명리학 - 안드로이드 모바일 UI 스크립트 v4.1 (오류 완전 수정)
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

let _lastResult = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Pinch Zoom Engine
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

function setupFormEvents() {
    const form = $('#fortuneForm');
    const birthInput = $('#birthDate');

    // Calendar Toggle
    $('#calendarToggle').addEventListener('click', (e) => {
        const btn = e.target.closest('.cal-btn');
        if (!btn) return;
        $$('#calendarToggle .cal-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedCal = btn.dataset.cal;
        const calHint = $('#calHint');
        if (calHint) {
            calHint.textContent = selectedCal === 'solar' ? '※ 양력 기준으로 입력해주세요 (예: 1995-05-15)' : '※ 음력 기준으로 입력해주세요 (동일 사주로 양력 자동 변환)';
        }
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

    // Form Submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = $('#userName').value.trim();
        if (!name) { showToast('이름을 입력해주세요.', '⚠️'); return; }
        if (!birthInput.value) { showToast('생년월일을 선택 혹은 입력해주세요.', '⚠️'); return; }

        const [y, m, d] = birthInput.value.split('-').map(Number);

        // 1. Calculate Saju (Lunar to Solar converted automatically inside calculateSaju if selectedCal === 'lunar')
        const result = window.calculateSaju(y, m, d, selectedHour, selectedGender, selectedCal);
        _lastResult = { name, year: y, month: m, day: d, gender: selectedGender, cal: selectedCal, hour: selectedHour, result };

        displayResults(name, y, m, d, result);

        // 2. Compatibility Mode if enabled
        if (isCompatibilityMode) {
            const name2 = $('#userName2').value.trim();
            const birth2 = $('#birthDate2').value;
            if (name2 && birth2) {
                const [y2, m2, d2] = birth2.split('-').map(Number);
                const result2 = window.calculateSaju(y2, m2, d2, selectedHour2, selectedGender2, selectedCal);
                const compat = window.calculateCompatibility(result, result2);
                _lastResult.compat = { name2, result: result2, compat };
                renderCompatibility(name, result, name2, result2, compat);
                showToast(`${name}님과 ${name2}님의 궁합을 분석했습니다!`, '💑');
            } else {
                showToast('궁합 모드입니다. 상대방 정보도 입력해주세요.', '⚠️');
                return;
            }
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
        birthStr += ` (음력 ${lunarDate.year}년 ${lunarDate.month}월 ${lunarDate.day}일)`;
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

    // 2. 용신 및 격국 분석
    const yd = result.yongshinData;
    $('#yongshinSection').innerHTML = `
        <div style="font-size: 1.05rem; font-weight: 800; color: var(--gold-bright); margin-bottom: 6px;">
            ${yd.strengthText} (${yd.score}점)
        </div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 12px;">
            일간 <strong>${dayGan.hangul}(${dayGan.name})</strong>의 기운 상태를 종합한 처방 오행입니다.
        </div>
        <div class="sipseong-detail-grid">
            <div class="sipseong-detail-item">
                <span class="sipseong-detail-label">🔑 용신</span>
                <span class="sipseong-detail-text">${yd.yongshin}</span>
            </div>
            <div class="sipseong-detail-item">
                <span class="sipseong-detail-label">✨ 희신</span>
                <span class="sipseong-detail-text">${yd.heeshin}</span>
            </div>
        </div>
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

/* ─── 12운성 / 12신살 렌더링 ─── */
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
    $('#extraAnalysisSection').innerHTML = html;
}

/* ─── 궁합 표시 (원본 100% 동일 복원) ─── */
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

    nav.addEventListener('click', (e) => {
        const btn = e.target.closest('.year-nav-btn');
        if (!btn) return;
        $$('.year-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const index = parseInt(btn.dataset.index);
        const container = $('#yearlyFortune');
        const cards = Array.from($$('.fortune-year-card'));

        if (cards[index]) {
            container.insertBefore(cards[index], container.firstChild);
            cards.forEach(c => c.classList.remove('highlight-card'));
            cards[index].classList.add('highlight-card');
            cards[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
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

function loadSavedData() {
    const raw = localStorage.getItem('lee_saju_data');
    if (!raw) return;
    const data = JSON.parse(raw);
    $('#userName').value = data.name || '';
    showToast(`${data.name}님의 저장된 정보를 불러왔습니다.`, '📂');
}
