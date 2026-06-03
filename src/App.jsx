import React, { useContext, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Main from "./pages/Main";
import Survey from "./pages/Survey";
import Diary from "./pages/Diary";

import { UserContext } from "./context/UserContext";

// 스타일 계산 및 라우팅을 담당하는 컴포넌트
function AppContent({ diaryLogs, setDiaryLogs }) {
  const location = useLocation();

  // URL 경로에 따라 maxWidth 결정 (메인, 다이어리는 크게 / 나머지는 작게)
  const getMaxWidth = () => {
    switch (location.pathname) {
      case "/main":
      case "/diary":
        return "1200px";
      default:
        return "540px";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f1f5f9",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: getMaxWidth(),
          backgroundColor: "white",
          borderRadius: "28px",
          padding: "40px",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
          boxSizing: "border-box",
        }}
      >
        <Routes>
          {/* 주소창에 치는 대로 제한 없이 바로 이동하도록 수정 */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/survey" element={<Survey />} />
          <Route path="/main" element={<Main />} />
          <Route path="/diary" element={<Diary diaryLogs={diaryLogs} setDiaryLogs={setDiaryLogs} />} />
          
          {/* 기본 주소(localhost:5173/)로 들어오면 로그인으로 이동 */}
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [diaryLogs, setDiaryLogs] = useState({});

  useEffect(() => {
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontWeight: "bold", color: "#3a7b7e" }}>
        ⏳ 로딩 중...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppContent diaryLogs={diaryLogs} setDiaryLogs={setDiaryLogs} />
    </BrowserRouter>
  );
}