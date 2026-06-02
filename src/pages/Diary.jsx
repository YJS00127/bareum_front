import React, { useState, useContext } from "react";
import { UserContext } from "../context/UserContext";

// ✅ Context API 적용 및 스타일 복구 버전
export default function Diary({ navigate, diaryLogs, setDiaryLogs }) {

  // ✅ 전역 유저 상태 가져오기
  const { currentUser, setCurrentUser } = useContext(UserContext);

  // 현재 달력의 연도와 월 상태
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5);

  // 선택 날짜 및 상세창 상태
  const [selectedDate, setSelectedDate] = useState("");
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 폼 상태
  const [weather, setWeather] = useState("맑음");
  const [cosmetics, setCosmetics] = useState([]);
  const [trouble, setTrouble] = useState(false);
  const [stress, setStress] = useState(1);
  const [rating, setRating] = useState(5);
  const [inputCosmetic, setInputCosmetic] = useState("");

  // 저장 중 상태
  const [isSaving, setIsSaving] = useState(false);

  // 시그니처 컬러 정의
  const brandColor = "#4C9A8E";

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
      setCosmetics(data.cosmetics || []);
      setTrouble(!!data.trouble);
      setStress(data.stress || 1);
      setRating(data.rating || 5);
    } else {
      setWeather("맑음");
      setCosmetics([]);
      setTrouble("없음");
      setStress(1);
      setRating(5);
    }

    setIsDetailOpen(true);
  };

  // 저장
  const handleSave = async () => {
    if (!currentUser) {
      return alert("로그인이 필요합니다.");
    }

    const logData = { weather, cosmetics, trouble, stress, rating };

    setIsSaving(true);

    try {
      // ✅ 백엔드 저장
      const response = await fetch("http://localhost:8080/api/auth/Diary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.userId,
          date: selectedDate,
          record: logData,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message);
      }

      console.log("백엔드 저장 성공");
    } catch (error) {
      console.log("백엔드 저장 실패 → 로컬 저장 유지");
    } finally {
      setIsSaving(false);
    }

    // ✅ 프론트 상태 저장
    const isAlreadySaved = !!diaryLogs[selectedDate];

    const updatedLogs = {
      ...diaryLogs,
      [selectedDate]: logData,
    };

    setDiaryLogs(updatedLogs);

    // ✅ 최초 작성이면 기록 수 증가
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

    alert("일지가 저장되었습니다.");
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
            <h3
              style={{
                margin: 0, color: brandColor, fontSize: "18px", fontWeight: "700",
              }}
            >
              📅 피부 기록 달력
            </h3>

            <button
              onClick={() => navigate("MAIN")}
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

            {/* 사용한 화장품 추가 */}
            <div>
              <label style={labelStyle}>사용한 화장품</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="화장품명을 입력하세요"
                  value={inputCosmetic}
                  onChange={(e) => setInputCosmetic(e.target.value)}
                  style={inputStyle}
                />
                <button
                  onClick={() => {
                    if (!inputCosmetic.trim()) return;
                    setCosmetics([...cosmetics, inputCosmetic.trim()]);
                    setInputCosmetic("");
                  }}
                  style={{
                    padding: "0 16px", backgroundColor: brandColor, color: "white",
                    border: "none", borderRadius: "8px", cursor: "pointer",
                    fontWeight: "600", fontSize: "14px", whiteSpace: "nowrap"
                  }}
                >
                  추가
                </button>
              </div>

              {/* 화장품 태그 리스트 */}
              {cosmetics.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px", padding: "10px", backgroundColor: "#f1f5f9", borderRadius: "8px" }}>
                  {cosmetics.map((item, index) => (
                    <span
                      key={index}
                      style={{
                        padding: "4px 10px", backgroundColor: "#e2f5f1", color: brandColor,
                        borderRadius: "20px", fontSize: "13px", fontWeight: "500",
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        border: `1px solid #cdc`
                      }}
                    >
                      {item}
                      <b
                        onClick={() => setCosmetics(cosmetics.filter((_, idx) => idx !== index))}
                        style={{ cursor: "pointer", color: "#ef4444", fontSize: "14px" }}
                      >
                        ✕
                      </b>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 트러블 여부 (라디오 스타일 데코) */}
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

            {/* 스트레스 지수 (5개 선택형 버튼 형태로 복구) */}
            <div>
              <label style={labelStyle}>스트레스 지수 (1-5)</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[1, 2, 3, 4, 5].map((v) => {
                  const isSelected = stress === v;
                  return (
                    <button
                      key={v}
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

            {/* 피부 만족도 (5개 선택형 버튼 형태로 복구) */}
            <div>
              <label style={labelStyle}>종합 피부 만족도 (1-5)</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[1, 2, 3, 4, 5].map((v) => {
                  const isSelected = rating === v;
                  return (
                    <button
                      key={v}
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