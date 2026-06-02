import React, { useState, useContext } from "react";
import { UserContext } from "../context/UserContext";

export default function Login({ navigate }) {
  const { setCurrentUser } = useContext(UserContext);

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 일반 로그인 처리
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Context 및 localStorage 저장
        setCurrentUser(data.user);
        localStorage.setItem("current_user", JSON.stringify(data.user));

        // 페이지 이동
        if (!data.user.skinType) {
          navigate("SURVEY");
        } else {
          navigate("MAIN");
        }
      } else {
        alert(data.message || "아이디 또는 비밀번호가 올바르지 않습니다.");
      }
    } catch (error) {
      alert("백엔드 서버와 연결할 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2
        style={{
          textAlign: "center",
          color: "#4C9A8E",
          marginBottom: "32px",
          fontSize: "24px",
          fontWeight: "700",
        }}
      >
        로그인
      </h2>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: "32px", marginBottom: "16px" }}>🔄</div>
          <p style={{ color: "#64748b", fontSize: "14px", fontWeight: "500" }}>
            로그인 중...
          </p>
        </div>
      ) : (
        <>
          {/* 일반 로그인 폼 */}
          <form
            onSubmit={handleLogin}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <input
              type="text"
              placeholder="아이디 입력"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                fontSize: "15px",
                outline: "none",
              }}
              required
            />

            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  boxSizing: "border-box",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  fontSize: "15px",
                  outline: "none",
                }}
                required
              />
              <span
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: "absolute",
                  right: "16px",
                  top: "16px",
                  cursor: "pointer",
                  color: "#64748b",
                  fontSize: "18px",
                }}
              >
                {showPw ? "🙈" : "👁️"}
              </span>
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: "#4C9A8E",
                color: "white",
                padding: "14px",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "16px",
                marginTop: "8px",
              }}
            >
              로그인
            </button>
          </form>

          {/* 회원가입 버튼 */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "20px",
              fontSize: "13px",
              color: "#64748b",
            }}
          >
            <span
              onClick={() => navigate("SIGNUP")}
              style={{ cursor: "pointer" }}
            >
              회원가입
            </span>
          </div>
        </>
      )}
    </div>
  );
}