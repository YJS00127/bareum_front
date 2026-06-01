import React, { useState, useEffect, useRef } from "react";

export default function Main({ navigate, currentUser, setCurrentUser, users, setUsers }) {
  // 서브 페이지 관리: "MAIN_HOME", "ANALYZE_PAGE", "MY_INFO_PAGE"
  const [subPage, setSubPage] = useState("MAIN_HOME");
  
  // 파일 상태 및 레퍼런스 (성분 분석용)
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // 🔗 백엔드로부터 실시간 데이터 개수를 연동해 올 상자
  const [diaryRecords, setDiaryRecords] = useState([]);
  const [isDiaryLoading, setIsDiaryLoading] = useState(false);

  // 구글 비전 AI 및 백엔드 AI 분류 모델 연동 상태
  const [isVisionLoading, setIsVisionLoading] = useState(false);
  const [visionDetectedText, setVisionDetectedText] = useState("");
  
  // 🔮 백엔드 AI 분류 모델의 종합 결과를 담을 상태창
  const [aiTotalAnalysis, setAiTotalAnalysis] = useState(""); // "RECOMMEND" 또는 "NOT_RECOMMEND"
  const [aiMessage, setAiMessage] = useState("");             // AI가 조합을 보고 판단한 피드백 문구
  const [visionAnalysisResult, setVisionAnalysisResult] = useState([]); // 분류가 완료된 성분별 개별 리스트

  // 내 정보 관리용 비밀번호 수정 상태
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // 🔌 [백엔드 통신 에러 방어] 서버가 꺼져있을 때 화면이 멈추는 것을 막기 위한 상태
  const [backendError, setBackendError] = useState(null);

  // 🔑 구글 클라우드 API 키
  const GOOGLE_VISION_API_KEY = "AIzaSyBNnbyvLvxbirR4f4CFPkLebVr5thz7ipg";

  // 🔗 [백엔드 다이어리 기록 동기화]
  useEffect(() => {
    const fetchDiaryCount = async () => {
      if (!currentUser || !currentUser.userId) return;
      
      setIsDiaryLoading(true);
      setBackendError(null);

      try {
        const response = await fetch(`http://localhost:8080/api/auth/Main?userId=${encodeURIComponent(currentUser.userId)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error(`서버 응답 오류 (Status: ${response.status})`);
        }

        const data = await response.json();
        if (data && data.success) {
          setDiaryRecords(Array.isArray(data.records) ? data.records : []);
        } else {
          console.warn("백엔드 반환 실패:", data.message);
        }
      } catch (error) {
        console.error("다이어리 데이터를 가져오는 데 실패했습니다:", error);
        setBackendError(error.message);
        
        if (currentUser && Array.isArray(currentUser.records)) {
          setDiaryRecords(currentUser.records);
        }
      } finally {
        setIsDiaryLoading(false);
      }
    };
    
    fetchDiaryCount();
  }, [currentUser, subPage]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setVisionDetectedText("");
      setAiTotalAnalysis("");
      setAiMessage("");
      setVisionAnalysisResult([]);
    }
  };

  const onAttachButtonClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // 🧪 [AI 연동] 구글 클라우드 비전 텍스트 추출 후 우리 백엔드 AI 분류 모델 연동 함수
  const handleGoogleVisionAnalysis = async () => {
    if (!selectedFile) return alert("먼저 성분표 사진을 첨부해 주세요!");
    setIsVisionLoading(true);
    setBackendError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      
      reader.onloadend = async () => {
        const base64Image = reader.result.split(",")[1];
        const requestBody = {
          requests: [
            {
              image: { content: base64Image },
              features: [{ type: "TEXT_DETECTION" }]
            }
          ]
        };

        // Step 1: 구글 비전 API 통신 수행
        const visionResponse = await fetch(
          `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
          }
        );

        const visionData = await visionResponse.json();

        if (!visionResponse.ok || visionData.error) {
          throw new Error(visionData.error?.message || "구글 플랫폼 통신 오류");
        }

        const detectedText = visionData.responses[0]?.textAnnotations[0]?.description || "";
        if (!detectedText) {
          alert("사진에서 글자를 읽어내지 못했습니다. 다시 테스트해 주세요.");
          setIsVisionLoading(false);
          return;
        }

        setVisionDetectedText(detectedText);

        // 🔌 Step 2: 추출한 전체 텍스트와 로그인한 유저의 피부 타입을 우리 백엔드 AI 분류 API로 전송
        const backendAiResponse = await fetch("http://localhost:8080/api/analysis/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            detectedText: detectedText,
            skinType: currentUser?.skinType || "복합성"
          })
        });

        if (!backendAiResponse.ok) {
          throw new Error("우리 백엔드 AI 모델 서버가 응답하지 않거나 꺼져 있습니다.");
        }

        const aiResult = await backendAiResponse.json();
        
        // 백엔드 머신러닝 모델이 계산하여 보내준 원본 데이터를 리액트 상태창에 주입
        if (aiResult && aiResult.success) {
          setAiTotalAnalysis(aiResult.total_analysis);       // "RECOMMEND" / "NOT_RECOMMEND" / "WARN"
          setAiMessage(aiResult.ai_message);                 // AI의 친절한 종합 조언 요약 문구
          setVisionAnalysisResult(aiResult.ingredients_results); // 개별 성분 분석 데이터 리스트 구조
          
          // 🔗 분석 횟수 카운트 상태 업데이트 호환성 유지
          const currentCount = currentUser?.analysisCount !== undefined ? currentUser.analysisCount : 0;
          const updatedUser = { ...currentUser, analysisCount: currentCount + 1 };
          setCurrentUser(updatedUser);
          if (Array.isArray(users)) {
            setUsers(users.map(u => u.email === currentUser.email ? updatedUser : u));
          }
          alert("🎉 자체 AI 분류 모델 종합 진단이 완료되었습니다!");
        } else {
          alert(`분석 실패: ${aiResult.message}`);
        }
        
        setIsVisionLoading(false);
      };
    } catch (error) {
      console.error(error);
      setBackendError(error.message);
      alert(`에러 발생: ${error.message}`);
      setIsVisionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("current_user");
    setCurrentUser(null);
    navigate("LOGIN");
  };

  const handleChangePassword = () => {
    if (!newPassword || !confirmNewPassword) return alert("변경할 비밀번호를 모두 입력해주세요.");
    if (newPassword.length < 8) return alert("비밀번호는 8자리 이상이어야 합니다.");
    if (newPassword !== confirmNewPassword) return alert("새 비밀번호가 서로 일치하지 않습니다.");

    const updatedUser = { ...currentUser, password: newPassword };
    setCurrentUser(updatedUser);
    if (Array.isArray(users)) {
      setUsers(users.map(u => u.email === currentUser.email ? updatedUser : u));
    }

    alert("비밀번호가 안전하게 변경되었습니다!");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const handleWithdrawal = () => {
    const confirmWithdrawal = window.confirm("정말로 탈퇴하시겠습니까?");
    if (confirmWithdrawal) {
      if (Array.isArray(users)) {
        const updatedUsers = users.filter((u) => u.email !== currentUser.email);
        setUsers(updatedUsers);
      }
      localStorage.removeItem("current_user");
      setCurrentUser(null);
      alert("회원 탈퇴가 완료되었습니다.");
      navigate("LOGIN");
    }
  };

  // ==========================================
  // 1. 메인 첫 화면 (MAIN_HOME)
  // ==========================================
  const renderMainHome = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "3px solid #4C9A8E", paddingBottom: "14px", marginBottom: "28px" }}>
        <h3 style={{ margin: 0, color: "#4C9A8E", fontSize: "22px", fontWeight: "800" }}>🍀 My Skin Lab 메인</h3>
        <span 
          onClick={() => setSubPage("MY_INFO_PAGE")} 
          style={{ fontSize: "15px", fontWeight: "bold", color: "#1e293b", cursor: "pointer", textDecoration: "underline" }}
        >
          {currentUser?.nickname || "사용자"}님 <span style={{ color: "#4C9A8E", fontSize: "13px" }}>({currentUser?.skinType || "복합성 피부"})</span>
        </span>
      </div>

      {backendError && (
        <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", padding: "10px 16px", borderRadius: "12px", marginBottom: "20px", fontSize: "13px", color: "#ef4444", fontWeight: "600" }}>
          ⚠️ 시스템 통신 모드 확인 필요: {backendError}
        </div>
      )}

      <div style={{ backgroundColor: "#f8fafc", padding: "28px", borderRadius: "24px", border: "1px solid #e2e8f0", marginBottom: "32px" }}>
        <span style={{ fontSize: "15px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "6px" }}></span>
        <h2 style={{ margin: "0 0 16px 0", fontSize: "26px", fontWeight: "800", color: "#1e293b" }}>
          {currentUser?.nickname || "사용자"}님의 피부 연구소
        </h2>
        <div style={{ backgroundColor: "#e2f5f1", border: "2px solid #4C9A8E", padding: "16px 20px", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#0f766e", fontSize: "15px", fontWeight: "700" }}>진단된 피부 타입</span>
          <span style={{ color: "#4C9A8E", fontSize: "20px", fontWeight: "900" }}>{currentUser?.skinType || "복합성 피부"}</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        <div style={{ backgroundColor: "white", border: "2px solid #e2e8f0", borderRadius: "20px", padding: "24px", cursor: "pointer" }} onClick={() => navigate("DIARY")}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px", marginBottom: "12px" }}>
            <div style={{ fontSize: "32px", backgroundColor: "#f0fdf4", width: "60px", height: "60px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>📅</div>
            <div>
              <h3 style={{ margin: 0, fontSize: "19px", fontWeight: "700", color: "#1e293b" }}>매일 피부 다이어리</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b", fontWeight: "500" }}>오늘의 유수분, 트러블, 화장품 기록하기</p>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px", marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", color: "#475569" }}>
            <span>작성된 총 다이어리 수</span>
            <span style={{ fontWeight: "700", color: "#4C9A8E", fontSize: "16px" }}>
              {isDiaryLoading ? "로딩 중..." : `${diaryRecords ? diaryRecords.length : 0}개`}
            </span>
          </div>
        </div>

        <div style={{ backgroundColor: "white", border: "2px solid #e2e8f0", borderRadius: "20px", padding: "24px", cursor: "pointer" }} onClick={() => setSubPage("ANALYZE_PAGE")}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={{ fontSize: "32px", backgroundColor: "#fbf2ff", width: "60px", height: "60px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>🧪</div>
            <div>
              <h3 style={{ margin: 0, fontSize: "19px", fontWeight: "700", color: "#1e293b" }}>화장품 성분 분석 스캐너</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b", fontWeight: "500" }}>성분표 사진 찍어 분석하기</p>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: "white", border: "2px solid #e2e8f0", borderRadius: "20px", padding: "24px", cursor: "pointer" }} onClick={() => navigate("SURVEY")}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={{ fontSize: "32px", backgroundColor: "#fff7ed", width: "60px", height: "60px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>📋</div>
            <div>
              <h3 style={{ margin: 0, fontSize: "19px", fontWeight: "700", color: "#1e293b" }}>피부 타입 재설문</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b", fontWeight: "500" }}>설문조사를 통해 나의 피부 타입 다시 정의하기</p>
            </div>
          </div>
        </div>

      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "44px", borderTop: "1px solid #f1f5f9", paddingTop: "20px" }}>
        <span onClick={() => setSubPage("MY_INFO_PAGE")} style={{ fontSize: "14px", color: "#475569", cursor: "pointer", textDecoration: "underline", fontWeight: "600" }}>👤 내 정보 관리</span>
        <span onClick={handleLogout} style={{ fontSize: "14px", color: "#94a3b8", cursor: "pointer", textDecoration: "underline" }}>로그아웃</span>
      </div>
    </div>
  );

  // ==========================================
  // 2. 성분 분석 화면 (ANALYZE_PAGE)
  // ==========================================
  const renderAnalyzePage = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "3px solid #4C9A8E", paddingBottom: "14px", marginBottom: "28px" }}>
        <h3 style={{ margin: 0, color: "#4C9A8E", fontSize: "20px", fontWeight: "700" }}>🧪 성분 분석하기</h3>
        <span style={{ fontSize: "14px", fontWeight: "bold", color: "#1e293b" }}>
          {currentUser?.nickname || "사용자"}님 <span style={{ color: "#4C9A8E", fontSize: "12px" }}>({currentUser?.skinType || "미정"})</span>
        </span>
      </div>

      <div style={{ marginBottom: "32px" }}>
        <h4 style={{ margin: "0 0 16px 0", color: "#475569", fontSize: "15px", fontWeight: "600" }}>화장품 성분 스캔</h4>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
        
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", backgroundColor: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <button type="button" onClick={onAttachButtonClick} disabled={isVisionLoading} style={{ padding: "10px 16px", backgroundColor: "#4C9A8E", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "bold", color: "white", cursor: "pointer" }}>
            📷 사진 첨부하기
          </button>
          <span style={{ fontSize: "13.5px", color: selectedFile ? "#1e293b" : "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            {selectedFile ? selectedFile.name : "선택된 파일이 없습니다."}
          </span>
        </div>

        <button onClick={handleGoogleVisionAnalysis} disabled={!selectedFile || isVisionLoading} style={{ width: "100%", padding: "16px", backgroundColor: (selectedFile && !isVisionLoading) ? "#4C9A8E" : "#cbd5e1", color: "white", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: (selectedFile && !isVisionLoading) ? "pointer" : "not-allowed", fontSize: "16px", transition: "all 0.2s" }}>
          {isVisionLoading ? "⏳ AI 모델이 조합 분석 및 분류 중..." : "분석 결과 보기"}
        </button>
      </div>

      {/* 🟢 AI 분류 학습 결과 배너 카드 */}
      {aiTotalAnalysis && (
        <div style={{
          padding: "20px",
          borderRadius: "16px",
          marginBottom: "24px",
          border: "1px solid",
          backgroundColor: aiTotalAnalysis === "RECOMMEND" ? "rgba(76, 154, 142, 0.1)" : "#fff5f5",
          borderColor: aiTotalAnalysis === "RECOMMEND" ? "rgba(76, 154, 142, 0.3)" : "#fecaca",
          color: aiTotalAnalysis === "RECOMMEND" ? "#1b4d47" : "#991b1b"
        }}>
          <span style={{ fontSize: "11px", fontWeight: "bold", color: "#94a3b8", display: "block", marginBottom: "4px", letterSpacing: "1px" }}>MY SKIN LAB 자체 AI 종합 진단</span>
          <h3 style={{ margin: "0 0 6px 0", fontSize: "18px", fontWeight: "800" }}>
            {aiTotalAnalysis === "RECOMMEND" ? "👍 이 화장품을 추천합니다!" : "⚠️ 사용 전 주의가 필요합니다"}
          </h3>
          <p style={{ margin: 0, fontSize: "13.5px", color: "#475569", lineHeight: "1.5" }}>{aiMessage}</p>
        </div>
      )}

      {/* 성분별 개별 라벨 매칭 결과 출력 영역 */}
      {visionAnalysisResult.length > 0 && (
        <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <h4 style={{ color: "#4C9A8E", fontSize: "15px", fontWeight: "700" }}>🔬 검출된 성분 정밀 판독 결과</h4>
          {visionAnalysisResult.map((res, index) => (
            <div key={index} style={{ padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", borderLeft: `5px solid ${res.label === "GOOD" ? "#4C9A8E" : res.label === "CAUTION" ? "#ef4444" : "#64748b"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "14.5px", color: "#1e293b" }}>포함 성분 확인: [{res.ingredient}]</strong>
                <span style={{ fontSize: "12px", fontWeight: "bold", color: res.label === "GOOD" ? "#0f766e" : res.label === "CAUTION" ? "#b91c1c" : "#475569" }}>
                  [{res.label === "GOOD" ? "추천" : res.label === "CAUTION" ? "주의" : "보통"}]
                </span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: "12px", backgroundColor: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "bold" }}>[참고] OCR 추출 원본 데이터 요약</span>
            <p style={{ margin: "6px 0 0 0", fontSize: "12.5px", color: "#64748b", whiteSpace: "pre-wrap", lineHeight: "1.4" }}>{visionDetectedText}</p>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: "32px" }}>
        <button onClick={() => { setSelectedFile(null); setVisionDetectedText(""); setAiTotalAnalysis(""); setAiMessage(""); setVisionAnalysisResult([]); setSubPage("MAIN_HOME"); }} style={{ background: "none", border: "none", color: "#64748b", fontSize: "14px", fontWeight: "600", cursor: "pointer", textDecoration: "underline" }}>뒤로가기</button>
      </div>
    </div>
  );

  // ==========================================
  // 3. 내 정보 관리 화면 (MY_INFO_PAGE)
  // ==========================================
  const renderMyInfoPage = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "3px solid #4C9A8E", paddingBottom: "14px", marginBottom: "28px" }}>
        <h3 style={{ margin: 0, color: "#4C9A8E", fontSize: "20px" }}>👤 내 정보 관리</h3>
      </div>

      <div style={{ backgroundColor: "#f8fafc", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", marginBottom: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ fontSize: "14px", color: "#475569" }}><b>아이디 :</b> {currentUser?.userId}</div>
        <div style={{ fontSize: "14px", color: "#475569" }}><b>닉네임 :</b> {currentUser?.nickname}</div>
        <div style={{ fontSize: "14px", color: "#475569" }}><b>결정된 피부 타입 :</b> <span style={{ color: "#4C9A8E", fontWeight: "bold" }}>{currentUser?.skinType || "복합성 피부"}</span></div>
      </div>

      <div style={{ border: "1px solid #e2e8f0", padding: "16px", borderRadius: "12px", marginBottom: "24px" }}>
        <h4 style={{ margin: "0 0 12px 0", color: "#334155", fontSize: "14px" }}>🔒 비밀번호 바꾸기</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input type="password" placeholder="새로운 비밀번호 입력" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }} />
          <input type="password" placeholder="새 비밀번호 재확인 입력" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }} />
          <button onClick={handleChangePassword} style={{ padding: "10px", backgroundColor: "#4C9A8E", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}> 비밀번호 수정 적용</button>
        </div>
      </div>

      <div style={{ border: "1px solid #fecaca", backgroundColor: "#fff5f5", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
        <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#991b1b" }}>더 이상 서비스를 사용하지 않으시나요?</p>
        <button onClick={handleWithdrawal} style={{ padding: "8px 16px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}>
          🚨 계정 영구 탈퇴하기
        </button>
      </div>

      <div style={{ textAlign: "center", marginTop: "28px" }}>
        <button onClick={() => { setNewPassword(""); setConfirmNewPassword(""); setSubPage("MAIN_HOME"); }} style={{ padding: "10px 20px", border: "1px solid #cbd5e1", background: "white", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>
          메인 화면으로 복귀
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: "1200px", margin: "40px auto", padding: "0 24px", boxSizing: "border-box" }}>
      <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
        
        {/* [왼쪽 본문 영역] */}
        <div style={{ flex: 2.2, backgroundColor: "#ffffff", padding: "28px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #f1f5f9" }}>
          {subPage === "MAIN_HOME" && renderMainHome()}
          {subPage === "ANALYZE_PAGE" && renderAnalyzePage()}
          {subPage === "MY_INFO_PAGE" && renderMyInfoPage()}
        </div>

        {/* [우측 사이드바] */}
        <div style={{ flex: 1, backgroundColor: "#ffffff", padding: "28px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #f1f5f9", position: "sticky", top: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "#e2f5f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>👤</div>
            <div>
              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>{currentUser?.nickname || "사용자"} 님</h4>
              <span style={{ fontSize: "12px", color: "#4C9A8E", fontWeight: "600" }}>{currentUser?.skinType || "복합성 피부"}</span>
            </div>
          </div>

          <h4 style={{ fontSize: "13.5px", color: "#94a3b8", fontWeight: "600", margin: "0 0 14px 0", letterSpacing: "0.5px" }}>LAB 피부 통계 리포트</h4>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f8fafc", padding: "12px 16px", borderRadius: "12px" }}>
              <span style={{ fontSize: "14px", color: "#475569" }}>🟢 피부 타입</span>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f766e" }}>{currentUser?.skinType || "미정"}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f8fafc", padding: "12px 16px", borderRadius: "12px" }}>
              <span style={{ fontSize: "14px", color: "#475569" }}>📊 성분 분석 횟수</span>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                {currentUser?.analysisCount !== undefined ? currentUser.analysisCount : 0}회
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f8fafc", padding: "12px 16px", borderRadius: "12px" }}>
              <span style={{ fontSize: "14px", color: "#475569" }}>🎨 피부 기록 일차</span>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                {isDiaryLoading ? "..." : `${diaryRecords ? diaryRecords.length : 0}일차`}
              </span>
            </div>
          </div>

          <div style={{ marginTop: "20px", backgroundColor: "#e2f5f1", padding: "14px", borderRadius: "12px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "12.5px", color: "#0f766e", fontWeight: "600", lineHeight: "1.4", whiteSpace: "pre-wrap" }}>
              {backendError ? "💡 서버 연결 대기 중입니다.\n기존 일지를 관리하세요!" : "💡 맞춤 데이터 기반으로\n화장품 성분을 분석 중입니다!"}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

