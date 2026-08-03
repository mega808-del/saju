# -*- coding: utf-8 -*-
"""
_demo_data.py
====================================================================
saju_data_comparator.py --demo 실행용 내장 샘플 데이터
(data/ 폴더의 JSON과 동일한 내용을 Python dict로 내장)

  MY_FIXTURES[cid]  : 내 사주 프로그램 출력 (buildFortuneJSON 추출 형태)
  REF_FIXTURES[cid] : 표준 만세력 참조 (정밀 절기 시각·자시 규칙 반영)
====================================================================
"""

MY_FIXTURES = {
    1: {
        "source": "lee-saju-engine v5.2 (buildFortuneJSON 추출)",
        "case": "CASE1: 1995-05-20 14:30 남성 양력",
        "input": {"year": 1995, "month": 5, "day": 20, "hour": "14",
                  "gender": "male", "calType": "solar", "isIntercalation": False},
        "saju": {
            "pillars8": ["乙亥", "辛巳", "辛亥", "乙未"],
            "yearPillar": "乙亥", "monthPillar": "辛巳",
            "dayPillar": "辛亥", "hourPillar": "乙未",
            "dayGan": "辛",
        },
        "daewoon": {"start_age": 5, "direction": "역행", "count": 8},
        "ohaeng": {"wood": 2, "fire": 1, "earth": 1, "metal": 2, "water": 2},
        "sipseong": {"year": "편재", "month": "비견", "day": "비견", "hour": "편재"},
        "yongshin": {"strength": "신약(身弱) 사주", "yongshin": "土 (토)", "heeshin": "金 (금)", "gyeokguk": "정인격(正印格)"},
        "text": {
            "yongshinDescLen": 89,
            "characterLen": 632, "daewoonDescs": 8, "daewoonAvgLen": 129,
            "wunseongMeanings": 4, "sinsalMeanings": 4,
            "yearlyCount": 15, "yearlyAvgLen": 178,
            "sipseongDetail": 5, "ohaengAdvice": 1,
            "gyeokgukDesc": 1,
            "hyeongchungDesc": 1, "yukchinDesc": 1,
            "sinsal12": 12,
            "yearlyWealth": 15, "yearlyLove": 15, "yearlyHealth": 15, "yearlyCareer": 15,
            "yearlyAcademic": 15, "yearlyMoney": 15, "yearlyLuck": 15,
        },
    },
    2: {
        "source": "lee-saju-engine v5.2 (buildFortuneJSON 추출 - 정밀 절기 공식)",
        "case": "CASE2: 2024-02-04 16:00 남성 양력 (입춘 경계일 - 정밀 입춘 17:27 이전)",
        "input": {"year": 2024, "month": 2, "day": 4, "hour": "16",
                  "gender": "male", "calType": "solar", "isIntercalation": False},
        "saju": {
            "pillars8": ["癸卯", "乙丑", "戊戌", "庚申"],
            "yearPillar": "癸卯", "monthPillar": "乙丑",
            "dayPillar": "戊戌", "hourPillar": "庚申",
            "dayGan": "戊",
        },
        "daewoon": {"start_age": 10, "direction": "역행", "count": 8},
        "ohaeng": {"wood": 2, "fire": 0, "earth": 3, "metal": 2, "water": 1},
        "sipseong": {"year": "정재", "month": "정관", "day": "비견", "hour": "식신"},
        "yongshin": {"strength": "신강(身強) 사주", "yongshin": "水 (수)", "heeshin": "金 (금)", "gyeokguk": "정재격(正財格)"},
        "text": {
            "yongshinDescLen": 139,
            "characterLen": 692, "daewoonDescs": 8, "daewoonAvgLen": 130,
            "wunseongMeanings": 4, "sinsalMeanings": 4,
            "yearlyCount": 15, "yearlyAvgLen": 180,
            "sipseongDetail": 5, "ohaengAdvice": 1,
            "gyeokgukDesc": 1,
            "hyeongchungDesc": 1, "yukchinDesc": 1,
            "sinsal12": 12,
            "yearlyWealth": 15, "yearlyLove": 15, "yearlyHealth": 15, "yearlyCareer": 15,
            "yearlyAcademic": 15, "yearlyMoney": 15, "yearlyLuck": 15,
        },
    },
    3: {
        "source": "lee-saju-engine v5.2 (buildFortuneJSON 추출 - 야자시분일 적용)",
        "case": "CASE3: 1988-06-01 23:30 남성 양력 (야자시·서머타임 테스트)",
        "input": {"year": 1988, "month": 6, "day": 1, "hour": "23",
                  "gender": "male", "calType": "solar", "isIntercalation": False},
        "saju": {
            "pillars8": ["戊辰", "丁巳", "戊子", "壬子"],
            "yearPillar": "戊辰", "monthPillar": "丁巳",
            "dayPillar": "戊子", "hourPillar": "壬子",
            "dayGan": "戊",
        },
        "daewoon": {"start_age": 1, "direction": "순행", "count": 8},
        "ohaeng": {"wood": 0, "fire": 2, "earth": 3, "metal": 0, "water": 3},
        "sipseong": {"year": "비견", "month": "정인", "day": "비견", "hour": "편재"},
        "yongshin": {"strength": "신강(身強) 사주", "yongshin": "水 (수)", "heeshin": "金 (금)", "gyeokguk": "건록격(建禄格)"},
        "text": {
            "yongshinDescLen": 141,
            "characterLen": 673, "daewoonDescs": 8, "daewoonAvgLen": 130,
            "wunseongMeanings": 4, "sinsalMeanings": 4,
            "yearlyCount": 15, "yearlyAvgLen": 186,
            "sipseongDetail": 5, "ohaengAdvice": 1,
            "gyeokgukDesc": 1,
            "hyeongchungDesc": 1, "yukchinDesc": 1,
            "sinsal12": 12,
            "yearlyWealth": 15, "yearlyLove": 15, "yearlyHealth": 15, "yearlyCareer": 15,
            "yearlyAcademic": 15, "yearlyMoney": 15, "yearlyLuck": 15,
        },
    },
}

REF_FIXTURES = {
    1: {
        "source": "표준 만세력 기준 (정밀 절기 시각·자시 규칙 반영)",
        "case": "CASE1: 1995-05-20 14:30 남성 양력",
        "saju": {
            "year": {"gan": "乙", "ji": "亥", "ganji": "乙亥"},
            "month": {"gan": "辛", "ji": "巳", "ganji": "辛巳"},
            "day": {"gan": "辛", "ji": "亥", "ganji": "辛亥"},
            "hour": {"gan": "乙", "ji": "未", "ganji": "乙未"},
        },
        "daewoon": {"start_age": 5, "direction": "역행", "count": 8},
        "ohaeng": {"wood": 2, "fire": 1, "earth": 1, "metal": 2, "water": 2},
        "sipseong": {"year": "편재", "month": "비견", "day": "비견", "hour": "편재"},
        "interpretation": {
            "sections": {
                "격국": "정인격(正印格)", "성격": 1, "재물운": 1, "애정운": 1,
                "직업운": 1, "건강운": 1, "학업운": 1, "금전운": 1, "인덕운": 1,
                "12운성": 4, "12신살": 12, "형충파해": 1, "육친관계": 1,
                "보완아이템": 3, "대운해설": 8, "세운해설": 10,
            },
            "avg_len": 135,
            "total_fields": 18,
        },
    },
    2: {
        "source": ("표준 만세력 기준 (정밀 절기 시각 반영: "
                   "2024년 입춘 = 2/4 16:27 KST → 16:00은 입춘 이전)"),
        "case": "CASE2: 2024-02-04 16:00 남성 양력 (입춘 경계일)",
        "saju": {
            "year": {"gan": "癸", "ji": "卯", "ganji": "癸卯"},
            "month": {"gan": "乙", "ji": "丑", "ganji": "乙丑"},
            "day": {"gan": "戊", "ji": "戌", "ganji": "戊戌"},
            "hour": {"gan": "庚", "ji": "申", "ganji": "庚申"},
        },
        "daewoon": {"start_age": 10, "direction": "역행", "count": 8},
        "ohaeng": {"wood": 2, "fire": 0, "earth": 3, "metal": 2, "water": 1},
        "sipseong": {"year": "정재", "month": "정관", "day": "비견", "hour": "식신"},
        "interpretation": {
            "sections": {
                "격국": "정재격(正財格)", "성격": 1, "재물운": 1, "애정운": 1,
                "직업운": 1, "건강운": 1, "학업운": 1, "금전운": 1, "인덕운": 1,
                "12운성": 4, "12신살": 12, "형충파해": 1, "육친관계": 1,
                "보완아이템": 3, "대운해설": 8, "세운해설": 10,
            },
            "avg_len": 138,
            "total_fields": 18,
        },
    },
    3: {
        "source": ("표준 만세력 기준 (야자시 규칙: 23:00~24:00 자시는 "
                   "다음날 일주로 취급)"),
        "case": "CASE3: 1988-06-01 23:30 남성 양력 (야자시·서머타임 테스트)",
        "saju": {
            "year": {"gan": "戊", "ji": "辰", "ganji": "戊辰"},
            "month": {"gan": "丁", "ji": "巳", "ganji": "丁巳"},
            "day": {"gan": "戊", "ji": "子", "ganji": "戊子"},
            "hour": {"gan": "壬", "ji": "子", "ganji": "壬子"},
        },
        "daewoon": {"start_age": 1, "direction": "순행", "count": 8},
        "ohaeng": {"wood": 0, "fire": 2, "earth": 3, "metal": 0, "water": 3},
        "sipseong": {"year": "비견", "month": "정인", "day": "비견", "hour": "편재"},
        "interpretation": {
            "sections": {
                "격국": "건록격(建禄格)", "성격": 1, "재물운": 1, "애정운": 1,
                "직업운": 1, "건강운": 1, "학업운": 1, "금전운": 1, "인덕운": 1,
                "12운성": 4, "12신살": 12, "형충파해": 1, "육친관계": 1,
                "보완아이템": 3, "대운해설": 8, "세운해설": 10,
            },
            "avg_len": 140,
            "total_fields": 18,
        },
    },
}
