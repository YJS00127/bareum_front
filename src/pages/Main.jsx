import React, { useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

export default function Main({ users, setUsers }) {
  const navigate = useNavigate();

  // 전역 전용 데이터 창고(Context)에서 로그인 유저 정보 로드
  const { currentUser, setCurrentUser } = useContext(UserContext);

  const [subPage, setSubPage] = useState("MAIN_HOME");
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

  const [productStatus, setProductStatus] = useState("");
  const [finalExplain, setFinalExplain] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [backendError, setBackendError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setProductStatus("");
      setFinalExplain("");
    }
  };

  const onAttachButtonClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleGoogleVisionAnalysis = async () => {
    if (!selectedFile) {
      alert("먼저 성분표 사진을 첨부해 주세요!");
      return;
    }

    setIsAnalysisLoading(true);
    setBackendError(null);

    try {
      const formData = new FormData();
      formData.append("userId", currentUser.userId);
      formData.append("image", selectedFile);

      const response = await fetch(
        "http://localhost:8080/api/ingredient/analyze",
        {
          method: "POST",
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error(`서버 오류 (${response.status})`);
      }

      const data = await response.json();
      
      setProductStatus(data.productStatus || "분석 완료");
      setFinalExplain(data.finalExplain || "분석 결과를 불러올 수 없습니다.");

      alert("성분 분석이 완료되었습니다.");
    } catch (error) {
      console.error(error);
      setBackendError(error.message);
      alert(`분석 실패 : ${error.message}`);
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("current_user");
    setCurrentUser(null);
    navigate("/login");
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
      navigate("/login");
    }
  };

  const renderMainHome = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "3px solid #4C9A8E", paddingBottom: "14px", marginBottom: "28px" }}>
        <h3 style={{ margin: 0, color: "#4C9A8E", fontSize: "22px", fontWeight: "800" }}>bareum</h3>
        {/* ✨ [수정] 클릭 이벤트(onClick)와 밑줄(textDecoration)을 지워 일반 텍스트로 변경했습니다. */}
        <span style={{ fontSize: "15px", fontWeight: "bold", color: "#1e293b" }}>
          {currentUser?.nickname}님 <span style={{ color: "#4C9A8E", fontSize: "13px" }}>({currentUser?.skinType ? `${currentUser.skinType} 피부` : "설문 전"})</span>
        </span>
      </div>

      {backendError && (
        <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", padding: "10px 16px", borderRadius: "12px", marginBottom: "20px", fontSize: "13px", color: "#ef4444", fontWeight: "600" }}>
          ⚠️ 시스템 통신 모드 확인 필요: {backendError}
        </div>
      )}

      <div style={{ backgroundColor: "#f8fafc", padding: "28px", borderRadius: "24px", border: "1px solid #e2e8f0", marginBottom: "32px" }}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: "26px", fontWeight: "800", color: "#1e293b" }}>
          {currentUser?.nickname}님의 피부 연구소
        </h2>
        <div style={{ backgroundColor: "#e2f5f1", border: "2px solid #4C9A8E", padding: "16px 20px", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#0f766e", fontSize: "15px", fontWeight: "700" }}>진단된 피부 타입</span>
          <span style={{ color: "#4C9A8E", fontSize: "20px", fontWeight: "900" }}>
            {currentUser?.skinType ? `${currentUser.skinType} 피부` : "설문 필요 📋"}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ backgroundColor: "white", border: "2px solid #e2e8f0", borderRadius: "20px", padding: "24px", cursor: "pointer" }} onClick={() => navigate("/diary")}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={{ fontSize: "32px", backgroundColor: "#f0fdf4", width: "60px", height: "60px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>📅</div>
            <div>
              <h3 style={{ margin: 0, fontSize: "19px", fontWeight: "700", color: "#1e293b" }}>피부 다이어리</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b", fontWeight: "500" }}>오늘의 유수분, 트러블, 화장품 기록하기</p>
            </div>
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

        <div style={{ backgroundColor: "white", border: "2px solid #e2e8f0", borderRadius: "20px", padding: "24px", cursor: "pointer" }} onClick={() => navigate("/survey")}>
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

  const renderAnalyzePage = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "3px solid #4C9A8E", paddingBottom: "14px", marginBottom: "28px" }}>
        <h3 style={{ margin: 0, color: "#4C9A8E", fontSize: "20px", fontWeight: "700" }}>🧪 성분 분석하기</h3>
        <span style={{ fontSize: "14px", fontWeight: "bold", color: "#1e293b" }}>
          {currentUser?.nickname}님 <span style={{ color: "#4C9A8E", fontSize: "12px" }}>({currentUser?.skinType ? `${currentUser.skinType} 피부` : "설문 전"})</span>
        </span>
      </div>
      <div style={{ marginBottom: "32px" }}>
        <h4 style={{ margin: "0 0 16px 0", color: "#475569", fontSize: "15px", fontWeight: "600" }}>화장품 성분 스캔</h4>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", backgroundColor: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <button type="button" onClick={onAttachButtonClick} disabled={isAnalysisLoading} style={{ padding: "10px 16px", backgroundColor: "#4C9A8E", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "bold", color: "white", cursor: "pointer" }}>
            📷 사진 첨부하기
          </button>
          <span style={{ fontSize: "13.5px", color: selectedFile ? "#1e293b" : "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            {selectedFile ? selectedFile.name : "선택된 파일이 없습니다."}
          </span>
        </div>
        <button onClick={handleGoogleVisionAnalysis} disabled={!selectedFile || isAnalysisLoading} style={{ width: "100%", padding: "16px", backgroundColor: (selectedFile && !isAnalysisLoading) ? "#4C9A8E" : "#cbd5e1", color: "white", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: (selectedFile && !isAnalysisLoading) ? "pointer" : "not-allowed", fontSize: "16px", transition: "all 0.2s" }}>
          {isAnalysisLoading ? "⏳ 성분 분석 중..." : "분석 결과 보기"}
        </button>
      </div>
      {productStatus && (
        <div style={{ padding: "20px", borderRadius: "16px", marginBottom: "24px", border: "1px solid #e2e8f0", backgroundColor: productStatus === "normal" ? "#ecfdf5" : "#fef2f2" }}>
          <h3 style={{ marginBottom: "10px", textTransform: "uppercase" }}>분석 결과 : {productStatus}</h3>
          <p style={{ margin: 0, lineHeight: "1.5" }}>{finalExplain}</p>
        </div>
      )}
      <div style={{ textAlign: "center", marginTop: "32px" }}>
        <button onClick={() => { setSelectedFile(null); setProductStatus(""); setFinalExplain(""); setSubPage("MAIN_HOME"); }}
          style={{ background: "none", border: "none", color: "#64748b", fontSize: "14px", fontWeight: "600", cursor: "pointer", textDecoration: "underline" }}>뒤로가기</button>
      </div>
    </div>
  );

  const renderMyInfoPage = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "3px solid #4C9A8E", paddingBottom: "14px", marginBottom: "28px" }}>
        <h3 style={{ margin: 0, color: "#4C9A8E", fontSize: "20px" }}>👤 내 정보 관리</h3>
      </div>
      <div style={{ backgroundColor: "#f8fafc", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", marginBottom: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ fontSize: "14px", color: "#475569" }}><b>아이디 :</b> {currentUser?.loginId}</div>
        <div style={{ fontSize: "14px", color: "#475569" }}><b>닉네임 :</b> {currentUser?.nickname}</div>
        <div style={{ fontSize: "14px", color: "#475569" }}><b>결정된 피부 타입 :</b> <span style={{ color: "#4C9A8E", fontWeight: "bold" }}>{currentUser?.skinType ? `${currentUser.skinType}` : "설문 전"}</span></div>
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
        <div style={{ flex: 2.2, backgroundColor: "#ffffff", padding: "28px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #f1f5f9" }}>
          {subPage === "MAIN_HOME" && renderMainHome()}
          {subPage === "ANALYZE_PAGE" && renderAnalyzePage()}
          {subPage === "MY_INFO_PAGE" && renderMyInfoPage()}
        </div>
        <div style={{ flex: 1, backgroundColor: "#ffffff", padding: "28px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #f1f5f9", position: "sticky", top: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "#e2f5f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>👤</div>
            <div>
              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>{currentUser?.nickname} 님</h4>
              <span style={{ fontSize: "12px", color: "#4C9A8E", fontWeight: "600" }}>
                {currentUser?.skinType ? `${currentUser.skinType} 피부` : "설문 전"}
              </span>
            </div>
          </div>
          <h4 style={{ fontSize: "13.5px", color: "#94a3b8", fontWeight: "600", margin: "0 0 14px 0", letterSpacing: "0.5px" }}>LAB 피부 통계 리포트</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f8fafc", padding: "12px 16px", borderRadius: "12px" }}>
              <span style={{ fontSize: "14px", color: "#475569" }}>🟢 피부 타입</span>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f766e" }}>
                {currentUser?.skinType ? `${currentUser.skinType} 피부` : "설문 전"}
              </span>
            </div>
          </div>
          {/* ✨ [수정] 우측 사이드바 최하단의 '맞춤 데이터 기반 분석 중' 안내 박스를 통째로 삭제했습니다. */}
        </div>
      </div>
    </div>
  );
}