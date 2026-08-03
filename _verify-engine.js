// 자체 검증용 테스트 하네스 (프로덕션 코드 아님)
global.window = global;

// saju-engine.js는 window.*에 할당하므로 require로 로드
const fs = require('fs');
const path = require('path');
eval(fs.readFileSync(path.join(__dirname, 'saju-engine.js'), 'utf8'));

const cases = [
    { label: 'A (1992-03-04 10시 남자 양력)', y: 1992, m: 3, d: 4, hour: '10', gender: 'male', cal: 'solar' },
    { label: 'B (1999-11-20 18시 여자 양력)', y: 1999, m: 11, d: 20, hour: '18', gender: 'female', cal: 'solar' },
    { label: 'C (2000-01-01 00시 남자 양력)', y: 2000, m: 1, d: 1, hour: '0', gender: 'male', cal: 'solar' },
    { label: 'D (2024-01-01 23시 남자 양력)', y: 2024, m: 1, d: 1, hour: '22', gender: 'male', cal: 'solar' },
    { label: 'E (1984-02-02 12시 여자 양력)', y: 1984, m: 2, d: 2, hour: '12', gender: 'female', cal: 'solar' },
];

for (const c of cases) {
    const r = window.calculateSaju(c.y, c.m, c.d, c.hour, c.gender, c.cal);
    const p = r.pillars.map(x => `${x.gan.name}${x.ji.hangul}`).join(' ');
    console.log(`[${c.label}]`);
    console.log(`  사주팔자 : ${p}`);
    console.log(`  일간     : ${r.dayGan.name}(${r.dayGan.hangul}) ${r.dayGan.ohaeng}`);
    console.log(`  오행     : ${JSON.stringify(r.ohaengCount)}`);
    console.log(`  십성     : ${r.sipseongs.join(', ')}`);
    console.log(`  신강/약  : ${r.yongshinData.strengthText} (${r.yongshinData.score}) 용신=${r.yongshinData.yongshin} 희신=${r.yongshinData.heeshin}`);
    console.log(`  대운     : ${r.daewoon.direction} ${r.daewoon.startAge}세기산 → ${r.daewoon.daewoons.slice(0,3).map(d => `${d.ganji}(${d.title})`).join(', ')}`);
    console.log(`  12운성   : ${r.wunseongs.join(', ')}`);
    console.log(`  12신살   : ${r.sinsals.join(', ')}`);
    console.log('');
}
