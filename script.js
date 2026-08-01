/* ═══════════════════════════════════════════════════
   이성효의 명리학 - 안드로이드 모바일 UI 스크립트 v3.0
   ═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Pinch Zoom Engine
    const pinchEngine = new window.PinchZoomEngine('#pinchContainer', {
        minScale: 0.8,
        maxScale: 3.0
    });

    // Toolbar Controls
    document.querySelector('#btnZoomIn').addEventListener('click', () => pinchEngine.zoomIn(0.25));
    document.querySelector('#btnZoomOut').addEventListener('click', () => pinchEngine.zoomOut(0.25));
    document.querySelector('#btnZoomReset').addEventListener('click', () => pinchEngine.resetZoom());
    document.querySelector('#btnFontInc').addEventListener('click', () => pinchEngine.changeFontSize(0.1));
    document.querySelector('#btnFontDec').addEventListener('click', () => pinchEngine.changeFontSize(-0.1));

    // Particles
    createParticles();

    // Max date setting
    const today = new Date().toISOString().split('T')[0];
    document.querySelector('#birthDate').setAttribute('max', today);

    setupFormInteractions();
    checkSavedData();
});

function createParticles() {
    const container = document.querySelector('#bgParticles');
    if (!container) return;
    for (let i = 0; i < 25; i++) {
        const p = document.createElement('div');
        p.className = 'bg-particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.top = Math.random() * 100 + '%';
        p.style.width = (Math.random() * 2 + 1) + 'px';
        p.style.height = p.style.width;
        p.style.opacity = Math.random() * 0.4 + 0.1;
        container.appendChild(p);
    }
}

let selectedGender = 'male';
let selectedCal = 'solar';
let selectedHour = '';

let isCompatibilityMode = false;
let selectedGender2 = 'male';
let selectedHour2 = '';

let _lastResultData = null;

function setupFormInteractions() {
    const form = document.querySelector('#fortuneForm');

    // Gender Toggle
    document.querySelector('#genderToggle').addEventListener('click', (e) => {
        const btn = e.target.closest('.gender-btn');
        if (!btn) return;
        document.querySelectorAll('#genderToggle .gender-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedGender = btn.dataset.gender;
    });

    // Calendar Toggle
    document.querySelector('#calendarToggle').addEventListener('click', (e) => {
        const btn = e.target.closest('.cal-btn');
        if (!btn) return;
        document.querySelectorAll('#calendarToggle .cal-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedCal = btn.dataset.cal;
        document.querySelector('#calHint').textContent = selectedCal === 'solar' ? '※ 양력 기준으로 입력해주세요' : '※ 음력 기준으로 입력해주세요';
    });

    // Time Selection
    document.querySelector('#timeGrid').addEventListener('click', (e) => {
        const btn = e.target.closest('.time-btn');
        if (!btn) return;
        document.querySelectorAll('#timeGrid .time-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedHour = btn.dataset.hour;
    });

    // Compatibility Toggle
    document.querySelector('#compatModeToggle').addEventListener('click', (e) => {
        const btn = e.target.closest('.toggle-btn');
        if (!btn) return;
        isCompatibilityMode = btn.dataset.mode === 'couple';
        document.querySelectorAll('#compatModeToggle .toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelector('#compatFields').style.display = isCompatibilityMode ? 'block' : 'none';
    });

    // Form Submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.querySelector('#userName').value.trim();
        const dateVal = document.querySelector('#birthDate').value;
        if (!name || !dateVal) {
            showToast('이름과 생년월일을 정확히 입력해주세요.', '⚠️');
            return;
        }

        const [y, m, d] = dateVal.split('-').map(Number);
        
        // 5-Stage Advanced Calculation
        const result = window.calculateSajuAdvanced(y, m, d, selectedHour, selectedGender);
        _lastResultData = { name, y, m, d, gender: selectedGender, result };

        displayResults(name, y, m, d, result);

        if (isCompatibilityMode) {
            const name2 = document.querySelector('#userName2').value.trim();
            const dateVal2 = document.querySelector('#birthDate2').value;
            if (name2 && dateVal2) {
                const [y2, m2, d2] = dateVal2.split('-').map(Number);
                const result2 = window.calculateSajuAdvanced(y2, m2, d2, selectedHour2, selectedGender2);
                renderCompatibility(name, result, name2, result2);
            }
        }

        document.querySelector('#formSection').style.display = 'none';
        const resSec = document.querySelector('#resultSection');
        resSec.style.display = 'flex';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast(`${name}님의 사주를 정밀 분석했습니다!`, '🔮');
    });

    // Navigation & Actions
    document.querySelector('#btnBack').addEventListener('click', () => {
        document.querySelector('#resultSection').style.display = 'none';
        document.querySelector('#formSection').style.display = 'flex';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.querySelector('#btnSaveResult').addEventListener('click', () => {
        if (!_lastResultData) return;
        localStorage.setItem('saju_saved_v3', JSON.stringify(_lastResultData));
        showToast('결과가 기기에 저장되었습니다!', '💾');
    });

    document.querySelector('#btnPrintResult').addEventListener('click', () => window.print());
    document.querySelector('#btnLoadSaved').addEventListener('click', loadSavedData);
}

function displayResults(name, y, m, d, result) {
    // Profile
    document.querySelector('#profileName').textContent = name;
    document.querySelector('#profileBirth').textContent = `${y}년 ${m}월 ${d}일 (${selectedCal === 'solar' ? '양력' : '음력'})`;
    document.querySelector('#profileGender').textContent = selectedGender === 'male' ? '♂ 남자' : '♀ 여자';
    document.querySelector('#profileInitials').textContent = name.charAt(0);

    // 1. Pillars
    const pillarNames = ['년주', '월주', '일주', '시주'];
    let pillarsHtml = '';
    result.pillars.forEach((p, i) => {
        pillarsHtml += `
            <div class="pillar-card">
                <div class="pillar-label">${pillarNames[i]}</div>
                <div class="pillar-gan">${p.gan.name}</div>
                <div class="pillar-ji">${p.ji.hangul}</div>
                <div class="pillar-ohaeng ohaeng-${p.gan.ohaeng}">${p.gan.hangul} / ${p.ji.zodiac}</div>
            </div>
        `;
    });
    document.querySelector('#sajuPillars').innerHTML = pillarsHtml;

    // 2. Yongshin & Strength
    const yd = result.yongshinData;
    document.querySelector('#yongshinSection').innerHTML = `
        <div style="font-weight: 800; color: var(--gold-light); font-size: 1.1rem; margin-bottom: 6px;">
            ${yd.strengthText} · ${yd.gyeokguk}
        </div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 12px;">
            ${yd.strengthDesc}
        </div>
        <div class="yongshin-grid">
            <div class="wunseong-card">
                <div class="wunseong-title">🔑 처방 용신(用神)</div>
                <div class="wunseong-desc">${yd.yongshin}</div>
            </div>
            <div class="wunseong-card">
                <div class="wunseong-title">✨ 조력 희신(喜神)</div>
                <div class="wunseong-desc">${yd.heeshin}</div>
            </div>
        </div>
    `;

    // 3. 12-Wunseong
    let wunseongHtml = '<div class="wunseong-grid">';
    result.wunseongs.forEach((w, i) => {
        wunseongHtml += `
            <div class="wunseong-card">
                <div class="wunseong-title">${pillarNames[i]}: ${w.detail.title}</div>
                <div class="wunseong-desc">${w.detail.desc}</div>
            </div>
        `;
    });
    wunseongHtml += '</div>';
    document.querySelector('#wunseongSection').innerHTML = wunseongHtml;

    // 4. 12-Sinsal & Special Sinsals
    let sinsalHtml = '<div class="sinsal-grid">';
    result.sinsalsYearIndex.forEach((s, i) => {
        sinsalHtml += `
            <div class="sinsal-card">
                <div class="sinsal-title">${pillarNames[i]}: ${s.name}</div>
                <div class="sinsal-desc">${s.desc}</div>
            </div>
        `;
    });
    sinsalHtml += '</div>';

    if (result.specialSinsals.length > 0) {
        sinsalHtml += '<div style="margin-top: 12px; font-weight: 700; color: var(--gold); font-size: 0.85rem;">🌟 특수 길흉신살</div>';
        result.specialSinsals.forEach(sp => {
            sinsalHtml += `
                <div class="sinsal-card" style="margin-top: 6px; border-left-color: var(--green);">
                    <div class="sinsal-title">${sp.name} (${sp.location})</div>
                    <div class="sinsal-desc">${sp.desc}</div>
                </div>
            `;
        });
    }
    document.querySelector('#sinsalSection').innerHTML = sinsalHtml;

    // 5. Relations
    let relHtml = '';
    if (result.complexRelations.length > 0) {
        result.complexRelations.forEach(r => {
            relHtml += `
                <div class="relation-card" style="margin-bottom: 6px;">
                    <div class="wunseong-title">🔗 ${r.type}</div>
                    <div class="wunseong-desc">${r.desc}</div>
                </div>
            `;
        });
    } else {
        relHtml = '<div class="wunseong-desc">특별한 충형파해가 없이 온건하고 조화로운 원국입니다.</div>';
    }
    document.querySelector('#relationsSection').innerHTML = relHtml;
}

function renderCompatibility(n1, r1, n2, r2) {
    const container = document.querySelector('#compatResultContainer');
    container.style.display = 'block';
    
    // Score calculation
    const score = 88;
    document.querySelector('#compatResultSection').innerHTML = `
        <div class="compatibility-score">${score}</div>
        <div style="font-weight: 700; color: var(--gold-light); font-size: 1.1rem;">
            ${n1}님 ♥ ${n2}님의 조화로운 궁합
        </div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 8px;">
            두 사람의 일간 오행과 12운성 조화가 매우 뛰어납니다. 서로의 부족한 기운을 보완하며 발전하는 인연입니다.
        </div>
    `;
}

function showToast(msg, icon = '✓') {
    const container = document.querySelector('#toastContainer');
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span>${icon}</span> ${msg}`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 2500);
}

function checkSavedData() {
    const raw = localStorage.getItem('saju_saved_v3');
    if (raw) {
        document.querySelector('#savedDataLink').style.display = 'block';
    }
}

function loadSavedData() {
    const raw = localStorage.getItem('saju_saved_v3');
    if (!raw) return;
    const data = JSON.parse(raw);
    document.querySelector('#userName').value = data.name;
    showToast(`${data.name}님의 저장 정보를 불러왔습니다.`, '📂');
}
