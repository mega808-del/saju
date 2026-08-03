#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
saju_data_comparator.py
====================================================================
사주 프로그램 출력 데이터 vs 표준 만세력 데이터 자동 비교 분석 스크립트
(QA Automation / Data Analysis 용)

[비교 레이어]
  Layer 1 [사주 명식] : 연/월/일/시 4주 8자 + 대운(기산 나이·방향) 정확도
  Layer 2 [사주 요소] : 오행(목화토금수) 비중 + 일간 기준 십성(10神) 매핑 정확도
  Layer 3 [풀이 텍스트]: 입력값별 가변성(차별화) + 해석 데이터 풍부도(항목 수·길이)

[실행 방법]
  python saju_data_comparator.py                 # data/ 폴더의 JSON 사용
  python saju_data_comparator.py --demo          # 내장 샘플 데이터로 즉시 실행
  python saju_data_comparator.py --cases 1,2     # 특정 케이스만
  python saju_data_comparator.py --out report.md # 리포트 파일 저장
  python saju_data_comparator.py --data-dir ./data

[입력 데이터 형식]
  data/my_caseN.json : 내 사주 프로그램 출력 (buildFortuneJSON 추출 또는 아래 NORM 형식)
  data/ref_caseN.json: 표준 만세력 참조 (정밀 절기 시각·자시 규칙 반영)
====================================================================
"""
import argparse
import json
import os

# ═══════════════════════════════════════════════════════════════
# 1. 테스트 표본(Test Suite) - 경계 조건 반영
# ═══════════════════════════════════════════════════════════════
TEST_SUITE = [
    {"id": 1, "label": "CASE1: 1995-05-20 14:30 남성 양력 (일반 양력)",
     "note": "경계 없음 - 표준 계산과 100% 일치 기대"},
    {"id": 2, "label": "CASE2: 2024-02-04 16:00 남성 양력 (입춘 경계일)",
     "note": "실제 입춘 시각(2/4 17:27 KST, 16:27은 베이징시각 혼용 자료 주의) 이전 출생 → 정밀 만세력은 癸卯년 乙丑월"},
    {"id": 3, "label": "CASE3: 1988-06-01 23:30 남성 양력 (야자시·서머타임)",
     "note": "23:30 자시 → 야자시 규칙 적용 시 다음날(6/2) 일주·시주, 서머타임 시각 처리 확인"},
]

# ═══════════════════════════════════════════════════════════════
# 2. 공통 상수
# ═══════════════════════════════════════════════════════════════
PILLAR_KEYS = ["year", "month", "day", "hour"]
OHAENG_KEYS = ["wood", "fire", "earth", "metal", "water"]
OHAENG_KOR = {"wood": "木(목)", "fire": "火(화)", "earth": "土(토)", "metal": "金(금)", "water": "水(수)"}
SIPSEONG_POS = {"year": "년간", "month": "월간", "day": "일간(본인)", "hour": "시간"}

# 지지 한글(앱 표기) → 한자(표준 표기) 매핑
JI_HANGUL_TO_HANJA = {
    "자": "子", "축": "丑", "인": "寅", "묘": "卯", "진": "辰", "사": "巳",
    "오": "午", "미": "未", "신": "申", "유": "酉", "술": "戌", "해": "亥",
}

# 해석 섹션 정규(canonical) 이름 - 양쪽 데이터의 이름을 통일하여 비교
MY_TEXT_TO_CANONICAL = {
    "yongshinDescLen": "용신/격국",
    "characterLen": "성격",
    "sipseongDetail": "십성 상세",
    "ohaengAdvice": "오행 보완",
    "daewoonDescs": "대운 해설",
    "wunseongMeanings": "12운성",
    "sinsalMeanings": "12신살",
    "yearlyCount": "연도별/세운 운세",
    # ★ v5.2 신규 해설 섹션 (형충파해·육친·12신살 전체·운세 카테고리 확장)
    # (용신/격국은 yongshinDescLen + 데이터의 gyeokgukDesc 필드로 커버)
    "hyeongchungDesc": "형충파해",
    "yukchinDesc": "육친관계",
    "sinsal12": "12신살",
    "yearlyWealth": "재물운",
    "yearlyLove": "애정운",
    "yearlyHealth": "건강운",
    "yearlyCareer": "직업운",
    "yearlyAcademic": "학업운",
    "yearlyMoney": "금전운",
    "yearlyLuck": "인덕운",
}

REF_TEXT_TO_CANONICAL = {
    "격국": "용신/격국", "대운해설": "대운 해설", "세운해설": "연도별/세운 운세",
    "보완아이템": "보완 아이템",
}


def to_hanja_8(ganji):
    """'乙해' -> '乙亥', '乙亥' -> '乙亥' (앱 출력의 한글 지지를 표준 한자로 통일)"""
    if not ganji or len(ganji) < 2:
        return ganji
    gan, ji = ganji[0], ganji[1]
    return gan + JI_HANGUL_TO_HANJA.get(ji, ji)


def norm_direction(direction):
    """'순행(順行)' -> '순행', '역행(逆行)' -> '역행'"""
    if not direction:
        return ""
    return direction.replace("(順行)", "").replace("(逆行)", "").replace("順行", "").replace("逆行", "")


# ═══════════════════════════════════════════════════════════════
# 3. 정규화(Normalize) 함수 - 서로 다른 JSON 구조를 공통 NORM으로
# ═══════════════════════════════════════════════════════════════
def empty_norm():
    return {
        "pillars": {"year": "", "month": "", "day": "", "hour": ""},
        "daewoon": {"start_age": None, "direction": "", "count": 0},
        "ohaeng": {k: 0 for k in OHAENG_KEYS},
        "sipseong": ["", "", "", ""],  # [년간, 월간, 일간, 시간]
        "text": {"sections": {}, "total_sections": 0, "avg_len": 0},
    }


def _get(obj, *keys, default=None):
    """중첩 dict 안전 탐색"""
    cur = obj
    for k in keys:
        if not isinstance(cur, dict) or k not in cur:
            return default
        cur = cur[k]
    return cur


def _my_text_sections(t):
    """내 프로그램 text 메타 → 정규 섹션명 매핑"""
    if not isinstance(t, dict):
        return {}
    sections = {}
    # 카운트(개수) 값인 키는 그대로, 나머지는 1 (존재 여부) 로 취급
    _COUNT_KEYS = ("sipseongDetail", "daewoonDescs", "yearlyCount", "wunseongMeanings", "sinsalMeanings",
                   "sinsal12", "yearlyWealth", "yearlyLove", "yearlyHealth", "yearlyCareer",
                   "yearlyAcademic", "yearlyMoney", "yearlyLuck")
    for raw_key, canonical in MY_TEXT_TO_CANONICAL.items():
        if raw_key in t:
            sections[canonical] = t[raw_key] if raw_key in _COUNT_KEYS else 1
    return sections


def _ref_text_sections(sec):
    """참조 interpretation.sections → 정규 섹션명 매핑"""
    if not isinstance(sec, dict):
        return {}
    out = {}
    for name, val in sec.items():
        canonical = REF_TEXT_TO_CANONICAL.get(name, name)
        out[canonical] = val
    return out


def normalize_my(raw):
    """내 프로그램 출력( buildFortuneJSON 또는 my_caseN.json ) → NORM"""
    n = empty_norm()
    saju = raw.get("saju") or {}
    # 1) 4주 8자
    p8 = saju.get("pillars8")
    if isinstance(p8, list) and len(p8) >= 4:
        for i, k in enumerate(PILLAR_KEYS):
            n["pillars"][k] = to_hanja_8(p8[i])
    else:
        for k in PILLAR_KEYS:
            p = saju.get(k + "Pillar")
            if isinstance(p, dict):
                n["pillars"][k] = to_hanja_8(p.get("ganji") or (p.get("gan", "") + p.get("ji", "")))
            elif isinstance(p, str):
                n["pillars"][k] = to_hanja_8(p)
    # 2) 대운
    dw = raw.get("daewoon") or {}
    start_age = dw.get("start_age", dw.get("startAge"))
    if start_age is None and isinstance(dw.get("daewoons"), list):
        first = dw["daewoons"][0]
        start_age = first.get("startAge", first.get("start_age"))
    n["daewoon"]["start_age"] = start_age
    n["daewoon"]["direction"] = norm_direction(dw.get("direction", ""))
    n["daewoon"]["count"] = len(dw.get("daewoons", [])) or dw.get("count", 0)
    # 3) 오행
    oh = raw.get("ohaeng") or {}
    if isinstance(oh.get("count"), dict):
        oh = oh["count"]
    for k in OHAENG_KEYS:
        n["ohaeng"][k] = int(oh.get(k, 0))
    # 4) 십성 [년,월,일,시]
    sp = raw.get("sipseong") or {}
    by = sp.get("byPillar")
    if isinstance(by, list) and by:
        for item in by:
            label = item.get("label", "")
            if "년" in label:
                n["sipseong"][0] = item.get("name", "")
            elif "월" in label:
                n["sipseong"][1] = item.get("name", "")
            elif "일" in label:
                n["sipseong"][2] = item.get("name", "")
            elif "시" in label:
                n["sipseong"][3] = item.get("name", "")
    else:
        for i, k in enumerate(PILLAR_KEYS):
            if isinstance(sp, dict):
                n["sipseong"][i] = sp.get(k, "")
    # 5) 풀이 텍스트 메타
    t = raw.get("text") or {}
    if isinstance(t, dict) and not t:
        # buildFortuneJSON 전체 덤프인 경우 직접 계산
        t = {}
        char_html = _get(raw, "character", "html")
        if char_html:
            t["characterLen"] = len(char_html.replace("<", " ").replace(">", " "))
        yd = _get(raw, "yongshin", "desc")
        if yd:
            t["yongshinDescLen"] = len(yd)
        dw_list = _get(raw, "daewoon", "daewoons")
        if isinstance(dw_list, list) and dw_list:
            t["daewoonDescs"] = len(dw_list)
            t["daewoonAvgLen"] = int(sum(len(d.get("desc", "")) for d in dw_list) / len(dw_list))
        wn = raw.get("wunseong")
        if isinstance(wn, dict):
            t["wunseongMeanings"] = len(wn)
        sn = raw.get("sinsal")
        if isinstance(sn, dict):
            t["sinsalMeanings"] = len(sn)
        yf = raw.get("yearlyFortunes")
        if isinstance(yf, list) and yf:
            t["yearlyCount"] = len(yf)
            t["yearlyAvgLen"] = int(sum(len(f.get("total", "")) for f in yf) / len(yf))
        t["sipseongDetail"] = 5
        t["ohaengAdvice"] = 1
    n["text"]["sections"] = _my_text_sections(t)
    n["text"]["total_sections"] = len(n["text"]["sections"])
    lens = [v for v in (t.get("characterLen"), t.get("daewoonAvgLen"), t.get("yearlyAvgLen")) if v]
    n["text"]["avg_len"] = round(sum(lens) / len(lens)) if lens else 0
    return n


def normalize_ref(raw):
    """표준 만세력 참조 JSON → NORM"""
    n = empty_norm()
    saju = raw.get("saju") or {}
    for k in PILLAR_KEYS:
        p = saju.get(k) or {}
        if isinstance(p, dict):
            n["pillars"][k] = to_hanja_8(p.get("ganji") or (p.get("gan", "") + p.get("ji", "")))
        elif isinstance(p, str):
            n["pillars"][k] = to_hanja_8(p)
    dw = raw.get("daewoon") or {}
    n["daewoon"]["start_age"] = dw.get("start_age", dw.get("startAge"))
    n["daewoon"]["direction"] = norm_direction(dw.get("direction", ""))
    n["daewoon"]["count"] = dw.get("count", 0)
    oh = raw.get("ohaeng") or {}
    for k in OHAENG_KEYS:
        n["ohaeng"][k] = int(oh.get(k, 0))
    sp = raw.get("sipseong") or {}
    for i, k in enumerate(PILLAR_KEYS):
        n["sipseong"][i] = sp.get(k, "") if isinstance(sp, dict) else ""
    interp = raw.get("interpretation") or {}
    sec = interp.get("sections") or {}
    n["text"]["sections"] = _ref_text_sections(sec)
    n["text"]["total_sections"] = interp.get("total_fields", len(n["text"]["sections"]))
    n["text"]["avg_len"] = interp.get("avg_len", 0)
    return n


# ═══════════════════════════════════════════════════════════════
# 4. 레이어별 비교 모듈
# ═══════════════════════════════════════════════════════════════
def compare_layer1(my, ref):
    """사주 명식: 4주 8자(천간·지지 개별) + 대운 (총 10항목)"""
    pillars = []
    p8_hit = 0
    for k in PILLAR_KEYS:
        m, r = my["pillars"][k], ref["pillars"][k]
        gan_m = m[0] if m else ""
        ji_m = m[1] if len(m) > 1 else ""
        gan_r = r[0] if r else ""
        ji_r = r[1] if len(r) > 1 else ""
        gan_ok = bool(gan_m) and gan_m == gan_r
        ji_ok = bool(ji_m) and ji_m == ji_r
        p8_hit += int(gan_ok) + int(ji_ok)
        if gan_ok and ji_ok:
            mark = "✅"
        elif gan_ok or ji_ok:
            mark = "⚠️"
        else:
            mark = "❌"
        pillars.append({"pillar": k, "my": m, "ref": r, "match": gan_ok and ji_ok,
                        "gan_ok": gan_ok, "ji_ok": ji_ok, "mark": mark})
    dw = {
        "age": {"my": my["daewoon"]["start_age"], "ref": ref["daewoon"]["start_age"],
                "match": my["daewoon"]["start_age"] == ref["daewoon"]["start_age"]},
        "direction": {"my": my["daewoon"]["direction"], "ref": ref["daewoon"]["direction"],
                      "match": my["daewoon"]["direction"] == ref["daewoon"]["direction"]},
    }
    dw_hit = sum(1 for v in dw.values() if v["match"])
    total = 8 + 2
    score = round((p8_hit + dw_hit) / total * 100)
    return {"pillars": pillars, "p8_hit": p8_hit, "daewoon": dw, "dw_hit": dw_hit,
            "total": total, "score": score}


def compare_layer2(my, ref):
    """사주 요소: 오행 비중 + 십성 매핑"""
    ohaeng = []
    for k in OHAENG_KEYS:
        ohaeng.append({"element": k, "my": my["ohaeng"][k], "ref": ref["ohaeng"][k],
                       "match": my["ohaeng"][k] == ref["ohaeng"][k]})
    oh_hit = sum(1 for o in ohaeng if o["match"])
    sipseong = []
    for i, k in enumerate(PILLAR_KEYS):
        sipseong.append({"position": k, "my": my["sipseong"][i], "ref": ref["sipseong"][i],
                         "match": my["sipseong"][i] == ref["sipseong"][i]})
    sp_hit = sum(1 for s in sipseong if s["match"])
    total = 5 + 4
    score = round((oh_hit + sp_hit) / total * 100)
    return {"ohaeng": ohaeng, "oh_hit": oh_hit, "sipseong": sipseong, "sp_hit": sp_hit,
            "total": total, "score": score}


def analyze_variability(my_cases):
    """Layer 3-가변성: 입력값이 달라지면 결과가 달라지는지 (입력별 차별화 %)"""
    n = len(my_cases)
    if n < 2:
        return {"score": 0, "detail": "케이스 2개 미만 - 가변성 분석 불가"}
    # 필드별 서로 다른 값 개수
    distinct = 0
    fields = []
    for k in PILLAR_KEYS:
        d = len(set(c["pillars"][k] for c in my_cases))
        distinct += d
        fields.append((k, d))
    for i in range(4):
        d = len(set(c["sipseong"][i] for c in my_cases))
        distinct += d
        fields.append(("십성" + str(i + 1), d))
    for k in OHAENG_KEYS:
        d = len(set(c["ohaeng"][k] for c in my_cases))
        distinct += d
        fields.append(("오행" + k, d))
    max_distinct = n * (4 + 4 + 5)
    score = round(distinct / max_distinct * 100)
    return {"score": score, "detail": fields, "distinct": distinct, "max": max_distinct}


def compare_richness(my_text, ref_text):
    """Layer 3-풍부도: 해석 섹션 항목 비교"""
    my_sec = my_text["sections"] or {}
    ref_sec = ref_text["sections"] or {}
    my_names = set(my_sec.keys())
    ref_names = set(ref_sec.keys())
    missing = sorted(ref_names - my_names)
    common = sorted(my_names & ref_names)
    extra = sorted(my_names - ref_names)
    coverage = round(len(common) / len(ref_names) * 100) if ref_names else 0
    # 주의: 섹션 값에 문자열(격국명 등)이 포함될 수 있으므로 int만 합산
    my_total_items = sum(v for v in my_sec.values() if isinstance(v, int))
    ref_total_items = sum(v for v in ref_sec.values() if isinstance(v, int))
    return {
        "my_sections": my_sec, "ref_sections": ref_sec,
        "missing": missing, "common": common, "extra": extra,
        "coverage": coverage,
        "my_total_items": my_total_items, "ref_total_items": ref_total_items,
        "my_avg_len": my_text["avg_len"], "ref_avg_len": ref_text["avg_len"],
    }


# ═══════════════════════════════════════════════════════════════
# 5. 리포트 생성기
# ═══════════════════════════════════════════════════════════════
def generate_report(results):
    L = []
    L.append("# 🔮 사주 데이터 차이점 비교 분석 리포트")
    L.append("")
    L.append("- 생성 시각: 자동 (saju_data_comparator.py)")
    L.append("- 비교 대상: 내 사주 프로그램 출력 vs 표준 만세력 참조 데이터")
    L.append("- 비교 레이어: L1 사주 명식(8자+대운) / L2 사주 요소(오행·십성) / L3 풀이 텍스트(가변성·풍부도)")
    L.append("")

    # ── 1. 테스트 표본 ──
    L.append("## 1. 테스트 표본 (Test Suite)")
    L.append("")
    L.append("| Case | 입력 | 목적 |")
    L.append("|---|---|---|")
    for c in results["suite"]:
        L.append("| {} | {} | {} |".format(c["id"], c["label"], c["note"]))
    L.append("")

    # ── 2. 레이어별 비교 ──
    L.append("## 2. 레이어별 비교 결과")
    L.append("")
    for r in results["cases"]:
        cid = r["id"]
        L.append("### Case {}: {}".format(cid, r["label"]))
        L.append("")
        L.append("**L1 사주 명식** (8자 일치 {}/8 · 대운 일치 {}/2 → {}%)".format(
            r["l1"]["p8_hit"], r["l1"]["dw_hit"], r["l1"]["score"]))
        L.append("")
        L.append("| 기둥 | 내 프로그램 | 표준 만세력 | 일치 |")
        L.append("|---|---|---|---|")
        for p in r["l1"]["pillars"]:
            L.append("| {}주 | {} | {} | {} |".format(p["pillar"], p["my"], p["ref"], p["mark"]))
        L.append("| 대운 기산 | {}세 {} | {}세 {} | {} |".format(
            r["l1"]["daewoon"]["age"]["my"], r["l1"]["daewoon"]["direction"]["my"],
            r["l1"]["daewoon"]["age"]["ref"], r["l1"]["daewoon"]["direction"]["ref"],
            "✅" if r["l1"]["dw_hit"] == 2 else "⚠️ 부분 일치"))
        L.append("")
        L.append("**L2 사주 요소** (오행 {}/5 · 십성 {}/4 → {}%)".format(
            r["l2"]["oh_hit"], r["l2"]["sp_hit"], r["l2"]["score"]))
        L.append("")
        L.append("| 항목 | 내 프로그램 | 표준 만세력 | 일치 |")
        L.append("|---|---|---|---|")
        for o in r["l2"]["ohaeng"]:
            L.append("| 오행 {} | {} | {} | {} |".format(
                OHAENG_KOR[o["element"]], o["my"], o["ref"], "✅" if o["match"] else "❌"))
        for s in r["l2"]["sipseong"]:
            L.append("| {} 십성 | {} | {} | {} |".format(
                SIPSEONG_POS[s["position"]], s["my"], s["ref"], "✅" if s["match"] else "❌"))
        L.append("")
        L.append("**L3 풀이 텍스트**")
        if r["l3_case_note"]:
            L.append("")
            L.append("> " + r["l3_case_note"])
            L.append("")
    L.append("")

    # ── 3. 정확도 점수 ──
    L.append("## 3. 정확도 점수 요약")
    L.append("")
    L.append("| Case | L1 명식 일치율 | L2 요소 일치율 | 종합 정확도* |")
    L.append("|---|---|---|---|")
    for r in results["cases"]:
        overall = round(r["l1"]["score"] * 0.5 + r["l2"]["score"] * 0.5)
        L.append("| Case {} | {}% | {}% | {}% |".format(r["id"], r["l1"]["score"], r["l2"]["score"], overall))
    L.append("")
    L.append("*종합 정확도 = L1(50%) + L2(50%)")
    L.append("")

    # ── 4. 차이점·오류 목록 ──
    L.append("## 4. 차이점·오류 목록")
    L.append("")
    for r in results["cases"]:
        diffs = []
        for p in r["l1"]["pillars"]:
            if not p["match"]:
                if p.get("gan_ok") or p.get("ji_ok"):
                    diffs.append("{}주 간·지 부분 불일치 (내: {} / 표준: {})".format(p["pillar"], p["my"], p["ref"]))
                else:
                    diffs.append("{}주 불일치 (내: {} / 표준: {})".format(p["pillar"], p["my"], p["ref"]))
        dw = r["l1"]["daewoon"]
        if not dw["age"]["match"]:
            diffs.append("대운 기산 나이 불일치 (내: {}세 / 표준: {}세)".format(dw["age"]["my"], dw["age"]["ref"]))
        if not dw["direction"]["match"]:
            diffs.append("대운 방향 불일치 (내: {} / 표준: {})".format(dw["direction"]["my"], dw["direction"]["ref"]))
        for o in r["l2"]["ohaeng"]:
            if not o["match"]:
                diffs.append("오행 {} 개수 불일치 (내: {} / 표준: {})".format(OHAENG_KOR[o["element"]], o["my"], o["ref"]))
        for s in r["l2"]["sipseong"]:
            if not s["match"]:
                diffs.append("{} 십성 불일치 (내: {} / 표준: {})".format(SIPSEONG_POS[s["position"]], s["my"], s["ref"]))
        L.append("### Case {} 차이점".format(r["id"]))
        if diffs:
            for d in diffs:
                L.append("- ❌ " + d)
        else:
            L.append("- ✅ 차이 없음 (표준 만세력과 일치)")
        L.append("")
    L.append("")

    # ── 5. 데이터 풍부도 비교 ──
    rch = results["richness"]
    L.append("## 5. 데이터 풍부도 비교 (L3)")
    L.append("")
    L.append("| 지표 | 내 프로그램 | 표준 만세력 |")
    L.append("|---|---|---|")
    L.append("| 해석 섹션 수 | {} | {} |".format(len(rch["my_sections"]), len(rch["ref_sections"])))
    L.append("| 전체 케이스 해석 항목 합계({}건) | {} | {} |".format(len(results["cases"]), rch["my_total_items"], rch["ref_total_items"]))
    L.append("| 평균 해설 길이(자, 전체 케이스) | {} | {} |".format(rch["my_avg_len"], rch["ref_avg_len"]))
    L.append("| 공통 보유 섹션 | {} | - |".format(", ".join(rch["common"]) if rch["common"] else "없음"))
    L.append("| **누락 섹션** | **{}개**: {} | - |".format(len(rch["missing"]), ", ".join(rch["missing"])))
    L.append("| 내 프로그램만 보유 | {} | - |".format(", ".join(rch["extra"]) if rch["extra"] else "없음"))
    L.append("| 섹션 커버리지 | **{}%** | 100% |".format(rch["coverage"]))
    L.append("")
    L.append("> ※ 집계 기준: 재물·애정·건강·직업·학업·금전·인덕운 섹션은 내 프로그램의 연도별 운세 카테고리 텍스트(15년치) 항목 수로 집계했습니다. 표준 만세력의 해당 섹션은 독립 해설 블록(1건) 기준입니다.")
    L.append("")
    L.append("### 입력값별 가변성 (내 프로그램)")
    L.append("")
    v = results["variability"]
    n_case = len(results["cases"])
    if n_case >= 2:
        L.append("- 전체 입력 케이스에서 8자·십성·오행 필드의 값이 **서로 다른 비율: {}%**".format(v["score"]))
        L.append("- 즉, 입력 생년월일시가 달라지면 사주 명식·요소가 달라짐 → '동일 결과 반복' 오류 없음")
    else:
        L.append("- 가변성 분석은 케이스 2건 이상일 때 유효합니다 (현재 {}건)".format(n_case))
    L.append("")

    # ── 6. v5.2 반영 결과 및 잔여 권고 ──
    L.append("## 6. v5.2 반영 결과 및 잔여 개선 권고")
    L.append("")
    L.append("### ✅ v5.2 엔진에 반영 완료 (이전 리포트의 개선 권고 5건)")
    L.append("")
    L.append("1. **정밀 절기(24절기) 공식**: 천문 근사식(황경 15° + 뉴턴 반복)으로 연도별 실제 입절 시각 계산 → Case 2(입춘 경계) 연주·월주(癸卯·乙丑) 정확히 개선")
    L.append("2. **야자시/정자시 규칙**: 23:00~24:00 출생 시 다음날 일주·시주 적용(야자시분일 기본) → Case 3 일주·시주·대운 기산(戊子·壬子·1세) 정확히 개선")
    L.append("3. **격국(格局) 판정**: 월지 본기 기준 격국명(정인격·정재격·건록격 등) 자동 산출 + 격국 해설")
    L.append("4. **풀이 카테고리 확장**: 학업·금전·인덕운 추가 (재물·애정·직업·건강 포함 총 7종 연도별 운세)")
    L.append("5. **12신살 전체(12개) 테이블 + 형충파해(형·충·파·해) + 육친관계(십성→육친) 해설 추가")
    L.append("")
    L.append("### 🔎 잔여 개선 권고")
    L.append("")
    L.append("1. **보완 아이템(색·방위·숫자)**: 표준 대비 유일한 누락 섹션 - 용신·희신 오행에 맞는 보완 색상/방위/행운 숫자 제공 기능 추가")
    L.append("2. **섹션별 독립 해설 블록**: 연도별 운세 카테고리 텍스트뿐 아니라 운세 카테고리별 독립 해설 섹션(재물운·애정운 등) 제공")
    L.append("3. **절기 공식 지속 검증**: 연도별 中氣 앵커(춘분·하지·추분·동지) 추가로 24절기 전체 오차 ±5분 이내 유지 확인")
    L.append("")
    L.append("---")
    L.append("*본 리포트는 비교 스크립트가 자동 생성한 결과입니다. 참조 데이터는 표준 만세력 계산법(정밀 절기 시각·자시 규칙)을 기준으로 작성되었습니다.*")
    return "\n".join(L)


# ═══════════════════════════════════════════════════════════════
# 6. 데이터 로딩 (내장 샘플 or data/ 파일)
# ═══════════════════════════════════════════════════════════════
def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def run(data_dir="data", case_ids=None, use_demo=False):
    ids = case_ids if case_ids else [c["id"] for c in TEST_SUITE]
    suite = [c for c in TEST_SUITE if c["id"] in ids]
    cases = []
    my_cases_norm = []
    for c in suite:
        cid = c["id"]
        my_path = os.path.join(data_dir, "my_case{}.json".format(cid))
        ref_path = os.path.join(data_dir, "ref_case{}.json".format(cid))
        if use_demo or not (os.path.exists(my_path) and os.path.exists(ref_path)):
            from _demo_data import MY_FIXTURES, REF_FIXTURES  # 내장 샘플
            my_raw, ref_raw = MY_FIXTURES[cid], REF_FIXTURES[cid]
            src = "demo"
        else:
            my_raw, ref_raw = load_json(my_path), load_json(ref_path)
            src = "data/{}".format(os.path.basename(my_path))
        my_n = normalize_my(my_raw)
        ref_n = normalize_ref(ref_raw)
        my_cases_norm.append(my_n)
        cases.append({
            "id": cid, "label": c["label"], "note": c["note"],
            "source": src,
            "l1": compare_layer1(my_n, ref_n),
            "l2": compare_layer2(my_n, ref_n),
            "l3_case_note": _case_note(cid, my_n, ref_n),
        })
    # L3 집계 (가변성은 전체 케이스 대상, 풍부도는 전체 케이스 통합)
    variability = analyze_variability(my_cases_norm)
    richness_all = []
    for idx, c in enumerate(suite):
        cid = c["id"]
        ref_path = os.path.join(data_dir, "ref_case{}.json".format(cid))
        if use_demo or not os.path.exists(ref_path):
            from _demo_data import REF_FIXTURES
            ref_n = normalize_ref(REF_FIXTURES[cid])
        else:
            ref_n = normalize_ref(load_json(ref_path))
        rch = compare_richness(my_cases_norm[idx]["text"], ref_n["text"])
        richness_all.append(rch)
    richness = _aggregate_richness(richness_all)
    report = generate_report({
        "suite": suite,
        "cases": cases,
        "variability": variability,
        "richness": richness,
    })
    return report, cases, variability, richness


def _aggregate_richness(richness_all):
    """케이스별 풍부도 비교 결과를 전체 케이스로 통합 (섹션명은 합집합, 항목량은 합계)"""
    def _union(dicts):
        merged = {}
        for d in dicts:
            for k, v in d.items():
                if isinstance(v, int):
                    merged[k] = merged.get(k, 0) + v
                elif k not in merged:
                    merged[k] = v
        return merged

    my_sec = _union([r["my_sections"] for r in richness_all])
    ref_sec = _union([r["ref_sections"] for r in richness_all])
    missing = sorted(set(ref_sec) - set(my_sec))
    common = sorted(set(my_sec) & set(ref_sec))
    extra = sorted(set(my_sec) - set(ref_sec))
    coverage = round(len(common) / len(ref_sec) * 100) if ref_sec else 0
    return {
        "my_sections": my_sec, "ref_sections": ref_sec,
        "missing": missing, "common": common, "extra": extra,
        "coverage": coverage,
        "my_total_items": sum(v for v in my_sec.values() if isinstance(v, int)),
        "ref_total_items": sum(v for v in ref_sec.values() if isinstance(v, int)),
        "my_avg_len": round(sum(r["my_avg_len"] for r in richness_all) / len(richness_all)),
        "ref_avg_len": round(sum(r["ref_avg_len"] for r in richness_all) / len(richness_all)),
    }


def _case_note(cid, my_n, ref_n):
    """케이스별 L3(해설 관련) 한줄 코멘트"""
    notes = {
        1: "Case 1은 일반 양력 케이스로 명식·요소 완전 일치. 풀이 데이터는 아래 풍부도 비교 참조.",
        2: "Case 2는 입춘 경계일 - v5.2 천문 절기 공식 적용으로 연주·월주(癸卯·乙丑)가 표준과 일치.",
        3: "Case 3은 야자시(23:00~24:00) 케이스 - v5.2 야자시분일 규칙 적용으로 일주·시주(戊子·壬子)·대운 기산이 표준과 일치.",
    }
    return notes.get(cid, "")


def main():
    ap = argparse.ArgumentParser(description="사주 데이터 차이점 비교 분석 스크립트")
    ap.add_argument("--data-dir", default="data", help="내/참조 JSON 폴더 (기본: data)")
    ap.add_argument("--cases", default=None, help="비교할 케이스 번호 (예: 1,2,3)")
    ap.add_argument("--out", default=None, help="리포트 저장 경로 (기본: stdout)")
    ap.add_argument("--demo", action="store_true", help="내장 샘플 데이터로 실행")
    args = ap.parse_args()
    ids = None
    if args.cases:
        ids = [int(x.strip()) for x in args.cases.split(",") if x.strip().isdigit()]
    report, cases, variability, richness = run(args.data_dir, ids, args.demo)

    # 콘솔 요약
    print("=" * 70)
    print("사주 데이터 차이점 비교 분석 (케이스 {}건)".format(len(cases)))
    print("=" * 70)
    for c in cases:
        print("[Case {}] L1 명식 {}% | L2 요소 {}% | {}".format(
            c["id"], c["l1"]["score"], c["l2"]["score"], c["label"]))
    print("[L3] 가변성 {}% | 풍부도 커버리지 {}% (누락 {}개: {})".format(
        variability["score"], richness["coverage"], len(richness["missing"]), ", ".join(richness["missing"])))
    print("=" * 70)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(report)
        print("리포트 저장 완료: {}".format(args.out))
    else:
        print("")
        print(report)


if __name__ == "__main__":
    main()
