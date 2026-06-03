import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 

export default function Signup() {
  const navigate = useNavigate(); 

  const [nickname, setNickname] = useState(""); // 닉네임 상태
  const [loginId, setLoginId] = useState("");   // 아이디 상태
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCheck, setShowCheck] = useState(false);

  // 회원가입 처리
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 아이디 검사
    const idRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{5,13}$/;
    if (!idRegex.test(loginId)) {
      alert("아이디는 영문자 + 숫자를 포함한 5~13자여야 합니다.");
      return;
    }

    // 비밀번호 검사
    if (password.length < 8) {
      alert("비밀번호는 8자리 이상이어야 합니다.");
      return;
    }

    // 비밀번호 확인 검사
    if (password !== passwordCheck) {
      alert("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // ✅ loginId, password, nickname, skinType 전송
        body: JSON.stringify({
          loginId,
          password,
          nickname,
          skinType: "", // 회원가입 시에는 빈 값으로 전달
        }),
      });

      const data = await response.json();

      // 회원가입 성공
      if (data.success) {
        alert("🎉 회원가입 성공!");
        navigate("/login");
      } else {
        // 회원가입 실패
        alert(data.message || "회원가입 실패");
      }
    } catch (error) {
      console.error("회원가입 오류:", error);
      alert("백엔드 서버와 연결할 수 없습니다.");
    }
  };

  return (
    <div>
      <h2 style={{ color: "#3a7b7e", marginBottom: "20px" }}>회원가입</h2>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {/* 닉네임 */}
        <input
          type="text"
          placeholder="닉네임 입력"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          style={{ padding: "12px", borderRadius: "6px", border: "1px solid #ccc" }}
          required
        />

        {/* 아이디 */}
        <input
          type="text"
          placeholder="아이디 입력"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          style={{ padding: "12px", borderRadius: "6px", border: "1px solid #ccc" }}
          required
        />

        {/* 비밀번호 */}
        <div style={{ position: "relative" }}>
          <input
            type={showPw ? "text" : "password"}
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "12px", boxSizing: "border-box", borderRadius: "6px", border: "1px solid #ccc" }}
            required
          />
          <span
            onClick={() => setShowPw(!showPw)}
            style={{ position: "absolute", right: "12px", top: "14px", cursor: "pointer" }}
          >
            {showPw ? "🙈" : "👁️"}
          </span>
        </div>

        {/* 비밀번호 확인 */}
        <div style={{ position: "relative" }}>
          <input
            type={showCheck ? "text" : "password"}
            placeholder="비밀번호 확인"
            value={passwordCheck}
            onChange={(e) => setPasswordCheck(e.target.value)}
            style={{ width: "100%", padding: "12px", boxSizing: "border-box", borderRadius: "6px", border: "1px solid #ccc" }}
            required
          />
          <span
            onClick={() => setShowCheck(!showCheck)}
            style={{ position: "absolute", right: "12px", top: "14px", cursor: "pointer" }}
          >
            {showCheck ? "🙈" : "👁️"}
          </span>
        </div>

        {/* 회원가입 버튼 */}
        <button
          type="submit"
          style={{
            backgroundColor: "#3a7b7e", color: "white", padding: "12px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", marginTop: "10px",
          }}
        >
          회원가입 완료
        </button>

        {/* 취소 버튼 */}
        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{
            padding: "11px", border: "1px solid #ccc", background: "none", borderRadius: "6px", cursor: "pointer",
          }}
        >
          취소
        </button>
      </form>
    </div>
  );
}