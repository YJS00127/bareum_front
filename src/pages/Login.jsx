import React, {useState, useEffect, useContext,} from "react";
import {useGoogleLogin,} from "@react-oauth/google";

import {UserContext,} from "../context/UserContext";

export default function Login({
  navigate,
}) {
  const {
    setCurrentUser,
  } = useContext(UserContext);

  const [userId, setUserId] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPw, setShowPw] =
    useState(false);

  const [
    isSocialLoading,
    setIsSocialLoading,
  ] = useState(false);

  // 카카오 SDK 로드
  useEffect(() => {
    if (
      window.Kakao &&
      window.Kakao.isInitialized()
    ) {
      return;
    }

    const script =
      document.createElement(
        "script"
      );

    script.src =
      "https://t1.kakaocdn.net/kakao_js_sdk/2.7.1/kakao.min.js";

    script.async = true;

    script.onload = () => {
      if (
        window.Kakao &&
        !window.Kakao.isInitialized()
      ) {
        window.Kakao.init(
          "0bd32bdeae94672e48d2c72b23559536"
        );

        console.log(
          "카카오 SDK 초기화 완료"
        );
      }
    };

    document.head.appendChild(
      script
    );

    // 카카오 인가코드 처리
    const urlParams =
      new URLSearchParams(
        window.location.search
      );

    const kakaoCode =
      urlParams.get("code");

    if (kakaoCode) {
      handleSocialBackendLogin(
        kakaoCode,
        "Kakao"
      );
    }
  }, []);

  // 일반 로그인
  const handleLogin = async (
    e
  ) => {
    e.preventDefault();

    try {
      const response =
        await fetch(
          "http://localhost:8080/api/auth/login",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              userId:
                userId,
              password:
                password,
            }),
          }
        );

      const data =
        await response.json();

      if (data.success) {
        // Context 저장
        setCurrentUser(
          data.user
        );

        // localStorage 저장
        localStorage.setItem(
          "current_user",
          JSON.stringify(
            data.user
          )
        );

        // 페이지 이동
        if (
          !data.user.skinType
        ) {
          navigate(
            "SURVEY"
          );
        } else {
          navigate(
            "MAIN"
          );
        }
      } else {
        alert(
          data.message ||
            "아이디 또는 비밀번호가 올바르지 않습니다."
        );
      }
    } catch (error) {
      alert(
        "백엔드 서버와 연결할 수 없습니다."
      );
    }
  };

  // 구글 로그인
  const googleLogin =
    useGoogleLogin({
      onSuccess:
        async (
          tokenResponse
        ) => {
          setIsSocialLoading(
            true
          );

          try {
            handleSocialBackendLogin(
              tokenResponse.access_token,
              "Google"
            );
          } catch (error) {
            alert(
              "구글 로그인 오류"
            );

            setIsSocialLoading(
              false
            );
          }
        },

      onError: () =>
        setIsSocialLoading(
          false
        ),
    });

  // 카카오 로그인
  const handleKakaoLogin =
    () => {
      if (
        !window.Kakao ||
        !window.Kakao.isInitialized()
      ) {
        return alert(
          "카카오 서버 준비 중입니다."
        );
      }

      window.Kakao.Auth.authorize(
        {
          redirectUri:
            "http://localhost:5173",
        }
      );
    };

  // 소셜 로그인 처리
  const handleSocialBackendLogin =
    async (
      socialTokenOrCode,
      platform
    ) => {
      setIsSocialLoading(
        true
      );

      if (
        window.location.search
      ) {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }

      try {
        const response =
          await fetch(
            `/api/auth/social-${platform.toLowerCase()}`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                {
                  token:
                    socialTokenOrCode,
                }
              ),
            }
          );

        const data =
          await response.json();

        if (
          data.success
        ) {
          setCurrentUser(
            data.user
          );

          localStorage.setItem(
            "current_user",
            JSON.stringify(
              data.user
            )
          );

          alert(
            `🔓 ${platform} 로그인 성공!`
          );

          if (
            !data.user
              .skinType
          ) {
            navigate(
              "SURVEY"
            );
          } else {
            navigate(
              "MAIN"
            );
          }
        } else {
          alert(
            `${platform} 로그인 실패`
          );
        }
      } catch (error) {
        alert(
          "소셜 로그인 서버 오류"
        );
      } finally {
        setIsSocialLoading(
          false
        );
      }
    };

  return (
  <div>
    <h2
      style={{
        textAlign: "center", color: "#4C9A8E", marginBottom: "32px",
        fontSize: "24px", fontWeight: "700",
      }}
    >
      로그인
    </h2>

    {isSocialLoading ? (
      <div
        style={{
          textAlign: "center", padding: "40px 0",
        }}
      >
        <div
          style={{
            fontSize: "32px", marginBottom: "16px",
          }}
        >
          🔄
        </div>

        <p
          style={{
            color: "#64748b", fontSize: "14px", fontWeight: "500",
          }}
        >
          소셜 로그인 처리 중...
        </p>
      </div>
    ) : (
      <>
        {/* 일반 로그인 */}
        <form
          onSubmit={handleLogin}
          style={{
            display: "flex", flexDirection: "column", gap: "14px",
          }}
        >
          <input
            type="text"
            placeholder="아이디 입력"
            value={userId}
            onChange={(e) =>
              setUserId(e.target.value)
            }
            style={{
              padding: "14px 16px", borderRadius: "12px",
              border: "1px solid #cbd5e1", fontSize: "15px", outline: "none",
            }}
            required
          />

          <div
            style={{
              position: "relative",
            }}
          >
            <input
              type={
                showPw
                  ? "text"
                  : "password"
              }
              placeholder="비밀번호"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              style={{
                width: "100%", padding: "14px 16px", boxSizing: "border-box",
                borderRadius: "12px", border: "1px solid #cbd5e1",
                fontSize: "15px", outline: "none",
              }}
              required
            />

            <span
              onClick={() =>
                setShowPw(!showPw)
              }
              style={{
                position: "absolute", right: "16px", top: "16px",
                cursor: "pointer", color: "#64748b", fontSize: "18px",
              }}
            >
              {showPw ? "🙈" : "👁️"}
            </span>
          </div>

          <button
            type="submit"
            style={{
              backgroundColor: "#4C9A8E", color: "white", padding: "14px",
              border: "none", borderRadius: "12px", cursor: "pointer",
              fontWeight: "bold", fontSize: "16px", marginTop: "8px",
            }}
          >
            로그인
          </button>
        </form>

        {/* 회원가입 버튼 */}
        <div
          style={{
            display: "flex", justifyContent: "center",
            marginTop: "20px", fontSize: "13px", color: "#64748b",
          }}
        >
          <span
            onClick={() =>
              navigate("SIGNUP")
            }
            style={{
              cursor: "pointer",
            }}
          >
            회원가입
          </span>
        </div>

        {/* 구분선 */}
        <div
          style={{display: "flex", alignItems: "center", margin: "28px 0",
          }}
        >
          <div
            style={{flex: 1,height: "1px", backgroundColor:"#e2e8f0",
            }}
          ></div>

          <span
            style={{padding: "0 12px", color: "#94a3b8", fontSize: "12px",
            }}
          >
            또는 소셜 계정으로 시작
          </span>

          <div
            style={{flex: 1,height: "1px", backgroundColor:"#e2e8f0",
            }}
          ></div>
        </div>

        {/* 구글 로그인 */}
        <button
          onClick={() =>
            googleLogin()
          }
          style={{width: "100%", padding: "13px", border:"1px solid #cbd5e1",
            backgroundColor:"white", borderRadius: "12px",
            display: "flex", alignItems: "center", justifyContent:"center",
            gap: "10px", cursor: "pointer", marginBottom: "12px",
            fontSize: "14px", fontWeight: "600", color: "#334155",
          }}
        >
          <span
            style={{color: "#4285F4", fontWeight: "bold", fontSize: "16px",
            }}
          >
            G
          </span>

          구글 계정으로 로그인
        </button>

        {/* 카카오 로그인 */}
        <button
          onClick={
            handleKakaoLogin
          }
          style={{
            width: "100%", padding: "14px", border: "none",
            backgroundColor:"#FEE500", color: "#191919", borderRadius: "12px",
            fontWeight: "bold", cursor: "pointer", fontSize: "14px",
          }}
        >
          💬 카카오 로그인
        </button>
      </>
    )}
  </div>
);
}