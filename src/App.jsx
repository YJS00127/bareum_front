import React, { useState, useContext, useEffect } from "react";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Main from "./pages/Main";
import Survey from "./pages/Survey";
import Diary from "./pages/Diary";

import { UserContext } from "./context/UserContext";

export default function App() {
  const [currentPage, setCurrentPage] = useState("LOGIN");
  const [isLoading, setIsLoading] = useState(true);

  const { currentUser } = useContext(UserContext);

  const [diaryLogs, setDiaryLogs] = useState({});

  useEffect(() => {
    const initializeApp = async () => {
      if (currentUser) {
        if (!currentUser.skinType) {
          setCurrentPage("SURVEY");
        } else {
          setCurrentPage("MAIN");
        }
      } else {
        setCurrentPage("LOGIN");
      }

      setIsLoading(false);
    };

    initializeApp();
  }, [currentUser]);

  const navigate = (pageName) => {
    setCurrentPage(pageName);
  };

  const getMaxWidth = () => {
    switch (currentPage) {
      case "MAIN":
      case "DIARY":
        return "1200px";

      default:
        return "540px";
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          fontWeight: "bold",
          color: "#3a7b7e",
        }}
      >
        ⏳ 로딩 중...
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <button onClick={() => navigate("LOGIN")}>로그인</button>
        <button onClick={() => navigate("SIGNUP")}>회원가입</button>
        <button onClick={() => navigate("SURVEY")}>설문조사</button>
        <button onClick={() => navigate("MAIN")}>메인</button>
        <button onClick={() => navigate("DIARY")}>다이어리</button>
      </div>
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
          {currentPage === "LOGIN" && <Login navigate={navigate} />}

          {currentPage === "SIGNUP" && <Signup navigate={navigate} />}

          {currentPage === "SURVEY" && <Survey navigate={navigate} />}

          {currentPage === "MAIN" && <Main navigate={navigate} />}

          {currentPage === "DIARY" && (
            <Diary
              navigate={navigate}
              diaryLogs={diaryLogs}
              setDiaryLogs={setDiaryLogs}
            />
          )}
        </div>
      </div>
    </>
  );
}