import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

export default function Login() {
  const navigate = useNavigate();
  const { setCurrentUser } = useContext(UserContext);

  // ✅ userId 대신 loginId로 상태 변경
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ 백엔드에 loginId와 password 전송
        body: JSON.stringify({ loginId, password }),
      });

      // 서버 연결 자체는 성공했으나, 아이디/비번이 틀린 경우 체크
      if (!response.ok) {
        alert("아이디 또는 비밀번호가 올바르지 않습니다.");
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setCurrentUser(data.user);
        localStorage.setItem("current_user", JSON.stringify(data.user));

        // 여기서 경로를 정확히 입력하세요
        if (!data.user.skinType) {
          navigate("/survey"); 
        } else {
          navigate("/main");
        }
      } else {
        alert(data.message || "로그인 실패");
      }
    } catch (error) {
      // 서버가 아예 꺼져있거나 통신 에러가 났을 때
      alert("백엔드 서버와 연결할 수 없습니다. 서버 상태를 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ textAlign: "center", color: "#4C9A8E", marginBottom: "32px" }}>로그인</h2>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>🔄 로그인 중...</div>
      ) : (
        <>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* ✅ input의 value와 onChange도 loginId에 맞춰 변경 */}
            <input 
              type="text" placeholder="아이디 입력" value={loginId} 
              onChange={(e) => setLoginId(e.target.value)} required
              style={{ padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1" }}
            />
            <input 
              type={showPw ? "text" : "password"} placeholder="비밀번호" value={password} 
              onChange={(e) => setPassword(e.target.value)} required
              style={{ padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1" }}
            />
            <button type="submit" style={{ backgroundColor: "#4C9A8E", color: "white", padding: "14px", borderRadius: "12px", cursor: "pointer" }}>로그인</button>
          </form>

          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <span onClick={() => navigate("/signup")} style={{ cursor: "pointer", color: "#64748b" }}>
              회원가입
            </span>
          </div>
        </>
      )}
    </div>
  );
}
