import React, { useState, useContext, useEffect } from "react"; // ✅ useEffect 추가
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

export default function Diary({ diaryLogs, setDiaryLogs }) {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useContext(UserContext);

  // 현재 날짜로 초기화
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  // 선택 날짜 및 상세창 상태
  const [selectedDate, setSelectedDate] = useState("");
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 폼 상태 (✨ 사용한 화장품 관련 state 2개 제거)
  const [weather, setWeather] = useState("맑음");
  const [trouble, setTrouble] = useState("없음");
  const [stress, setStress] = useState(1);
  const [rating, setRating] = useState(5);
  const [memo, setMemo] = useState(""); 

  // 저장 중 상태
  const [isSaving, setIsSaving] = useState(false);

  // 시그니처 컬러 정의
  const brandColor = "#4C9A8E";

  // ✅ 다이어리 조회 (데이터 불러오기)
  useEffect(() => {
    const fetchDiaries = async () => {
      if (!currentUser) return;
      try {
        const response = await fetch(`http://localhost:8080/api/diaries/${currentUser.userId}`);
        const result = await response.json();

        // 서버에서 받아온 데이터(배열)를 로컬 상태에 맞게 매핑
        if (result && Array.isArray(result)) {
          const loadedLogs = {};
          result.forEach((item) => {
            loadedLogs[item.date] = {
              weather: item.weather,
              // ✨ cosmetics 항목 매핑 제외
              trouble: item.hasTrouble ? "있음" : "없음",
              stress: item.stressScore,
              rating: item.skinScore,
              memo: item.memo,
              diaryId: item.diaryId // 조회 시 받아온 고유 ID 저장
            };
          });
          setDiaryLogs(loadedLogs);
        }
      } catch (error) {
        console.error("다이어리 조회 실패:", error);
      }
    };
    fetchDiaries();
  }, [currentUser, setDiaryLogs]);

  // 공통 스타일 정의
  const labelStyle = {
    fontSize: "14px", fontWeight: "600", color: "#475569",
    marginBottom: "6px", display: "block",
  };

  const inputStyle = {
    padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px",
    fontSize: "14px", outline: "none", width: "100%",
    boxSizing: "border-box", backgroundColor: "#f8fafc",
  };

  // 날짜 클릭
  const handleDateClick = (day) => {
    const formattedDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    setSelectedDate(formattedDate);

    if (diaryLogs && diaryLogs[formattedDate]) {
      const data = diaryLogs[formattedDate];

      setWeather(data.weather || "맑음");
      // ✨ !!data.trouble 대신 문자열을 그대로 넣어 라디오 버튼 깨짐 버그를 해결합니다.
      setTrouble(data.trouble || "없음");
      setStress(data.stress || 1);
      setRating(data.rating || 5);
      setMemo(data.memo || ""); 
    } else {
      setWeather("맑음");
      setTrouble("없음");
      setStress(1);
      setRating(5);
      setMemo(""); 
    }

    setIsDetailOpen(true);
  };

  // 저장
  const handleSave = async () => {
    if (!currentUser) {
      return alert("로그인이 필요합니다.");
    }

    setIsSaving(true);
    let isSuccess = false; // 백엔드 성공 여부 플래그

    try {
      // ✨ 주소 수정: 조회(GET) 주소 기반인 /api/diary 경로로 변경을 유도합니다. (백엔드 세팅에 맞춰 필요시 조정 가능)
      const response = await fetch("http://localhost:8080/api/diaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.userId,
          date: selectedDate,
          skinScore: rating,
          stressScore: stress,
          hasTrouble: trouble === "있음",
          weather: weather,
          memo: memo,
          // ✨ productNames 항목 완전히 제외
        }),
      });

      const data = await response.json();

      // if (!response.ok || !data.success) {
      //   throw new Error(data.message || "서버 저장 처리에 실패했습니다.");
      // }

      if (!response.ok) { 
  throw new Error("서버 응답 오류");
}

      console.log("백엔드 저장 성공");
      isSuccess = true; // 서버 저장 성공 시에만 true 플래그 달아줌
    } catch (error) {
      console.error("백엔드 저장 실패:", error);
      // 🚨 유저에게 에러 메시지를 명확히 경고창으로 표시합니다.
      alert(`⚠️ DB 저장 실패: ${error.message}\n백엔드 서버 상태나 매핑 URL 주소를 확인해보세요!`);
    } finally {
      setIsSaving(false);
    }

    // 🚨 백엔드 DB 저장에 실패했다면 이후 로컬 저장 단계를 실행하지 않고 중단시킵니다.
    if (!isSuccess) return;

    const isAlreadySaved = !!diaryLogs[selectedDate];

    // 로컬 상태 업데이트 (✨ 데이터에서 cosmetics 제외)
    const updatedLogs = {
      ...diaryLogs,
      [selectedDate]: { weather, trouble, stress, rating, memo },
    };

    setDiaryLogs(updatedLogs);

    if (!isAlreadySaved) {
      const updatedUser = {
        ...currentUser,
        diaryDays: (currentUser.diaryDays || 0) + 1,
      };

      setCurrentUser(updatedUser);

      localStorage.setItem(
        "current_user",
        JSON.stringify(updatedUser)
      );
    }

    alert("오늘의 일지가 성공적으로 저장되었습니다! 🎉");
    setIsDetailOpen(false);
  };

  // 달력 계산
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptySlots = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // 이전 달
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // 다음 달
  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "16px", fontFamily: "sans-serif" }}>

      {!isDetailOpen ? (
        <div>
          {/* 달력 헤더 */}
          <div
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: `2px solid ${brandColor}`, paddingBottom: "12px",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ margin: 0, color: brandColor, fontSize: "18px", fontWeight: "700" }}>
              📅 피부 기록 달력
            </h3>

            <button
              onClick={() => navigate("/main")}
              style={{
                padding: "6px 14px", border: "1px solid #cbd5e1", background: "white",
                borderRadius: "8px", cursor: "pointer", fontSize: "13px",
                fontWeight: "600", color: "#64748b"
              }}
            >
              메인으로
            </button>
          </div>

          {/* 월 이동 */}
          <div
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: "20px", padding: "0 10px",
            }}
          >
            <button onClick={handlePrevMonth} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}>◀</button>
            <span style={{ fontSize: "18px", fontWeight: "bold", color: "#1e293b" }}>{currentYear}년 {currentMonth}월</span>
            <button onClick={handleNextMonth} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}>▶</button>
          </div>

          {/* 요일 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontWeight: "bold", marginBottom: "12px", color: "#64748b", fontSize: "14px" }}>
            <span style={{ color: "#ef4444" }}>일</span>
            <span>월</span>
            <span>화</span>
            <span>수</span>
            <span>목</span>
            <span>금</span>
            <span style={{ color: "#3b82f6" }}>토</span>
          </div>

          {/* 달력 그리드 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: "10px", columnGap: "6px" }}>
            {emptySlots.map((num) => (
              <div key={num}></div>
            ))}

            {daysArray.map((day) => {
              const checkDateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const hasLog = !!diaryLogs[checkDateStr];

              return (
                <div
                  key={day}
                  onClick={() => handleDateClick(day)}
                  style={{
                    height: "56px", border: "1px solid #e2e8f0", borderRadius: "10px",
                    backgroundColor: hasLog ? "#e2f5f1" : "#f8fafc", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "space-between", padding: "6px 0", transition: "all 0.2s"
                  }}
                >
                  <span style={{ fontSize: "14px", fontWeight: "500", color: "#334155" }}>{day}</span>
                  {hasLog && <span style={{ fontSize: "10px" }}>🟢</span>}
                </div>
              );
            })}
          </div>
        </div>

      ) : (

        <div>
          {/* 상세 기록 헤더 */}
          <div
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: `2px solid ${brandColor}`, paddingBottom: "12px",
              marginBottom: "24px",
            }}
          >
            <h3 style={{ margin: 0, color: brandColor, fontSize: "18px", fontWeight: "700" }}>
              📝 {selectedDate} 피부 일지
            </h3>

            <button
              onClick={() => setIsDetailOpen(false)}
              style={{
                padding: "6px 14px", border: "1px solid #cbd5e1", background: "white",
                borderRadius: "8px", cursor: "pointer", fontSize: "13px",
                fontWeight: "600", color: "#64748b"
              }}
            >
              달력으로
            </button>
          </div>

          {/* 입력 폼 본문 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* 날씨 선택 */}
            <div>
              <label style={labelStyle}>오늘의 날씨</label>
              <select value={weather} onChange={(e) => setWeather(e.target.value)} style={inputStyle}>
                <option>맑음</option>
                <option>흐림</option>
                <option>비</option>
                <option>눈</option>
              </select>
            </div>

            {/* 오늘의 피부 메모 */}
            <div>
              <label style={labelStyle}>오늘의 피부 메모</label>
              <input 
                type="text" 
                placeholder="간단한 메모를 입력하세요" 
                value={memo} 
                onChange={(e) => setMemo(e.target.value)} 
                style={inputStyle} 
              />
            </div>

            {/* ✨ [삭제 완료] 사용한 화장품 추가 입력 필드 및 태그 리스트 컴포넌트 제거 */}

            {/* 트러블 여부 */}
            <div>
              <label style={labelStyle}>트러블 발생 여부</label>
              <div style={{ display: "flex", gap: "16px", padding: "4px 0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", cursor: "pointer", color: "#334155" }}>
                  <input
                    type="radio"
                    name="trouble"
                    checked={trouble === "있음"}
                    onChange={() => setTrouble("있음")}
                    style={{ accentColor: brandColor, width: "16px", height: "16px" }}
                  />
                  있음
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", cursor: "pointer", color: "#334155" }}>
                  <input
                    type="radio"
                    name="trouble"
                    checked={trouble === "없음"}
                    onChange={() => setTrouble("없음")}
                    style={{ accentColor: brandColor, width: "16px", height: "16px" }}
                  />
                  없음
                </label>
              </div>
            </div>

            {/* 스트레스 지수 */}
            <div>
              <label style={labelStyle}>스트레스 지수 (1-5)</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[1, 2, 3, 4, 5].map((v) => {
                  const isSelected = stress === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setStress(v)}
                      style={{
                        flex: 1, padding: "10px 0", backgroundColor: isSelected ? brandColor : "white",
                        color: isSelected ? "white" : "#64748b", border: isSelected ? `1px solid ${brandColor}` : "1px solid #e2e8f0",
                        borderRadius: "8px", fontWeight: "600", cursor: "pointer",
                        transition: "all 0.15s"
                      }}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 피부 만족도 */}
            <div>
              <label style={labelStyle}>종합 피부 만족도 (1-5)</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[1, 2, 3, 4, 5].map((v) => {
                  const isSelected = rating === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setRating(v)}
                      style={{
                        flex: 1, padding: "10px 0", backgroundColor: isSelected ? brandColor : "white",
                        color: isSelected ? "white" : "#64748b", border: isSelected ? `1px solid ${brandColor}` : "1px solid #e2e8f0",
                        borderRadius: "8px", fontWeight: "600", cursor: "pointer",
                        transition: "all 0.15s"
                      }}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 최종 저장 버튼 */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: "14px", backgroundColor: brandColor, color: "white", border: "none",
                borderRadius: "12px", cursor: "pointer", fontWeight: "700", fontSize: "16px",
                marginTop: "10px", boxShadow: "0 4px 6px -1px rgba(76, 154, 142, 0.2)",
                transition: "all 0.2s"
              }}
            >
              {isSaving ? "안전하게 저장 중..." : "오늘의 일지 저장하기"}
            </button>

          </div>
        </div>
      )}
    </div>
  );
}