import React, { useState, useContext } from "react";
import { UserContext } from "../context/UserContext";

export default function Survey({ navigate }) {

  const { currentUser, setCurrentUser } = useContext(UserContext);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [finalSkinType, setFinalSkinType] = useState("");

  const surveyQuestions = [
    {
      q: "세안 후 아무것도 바르지 않고 1시간이 지났을 때 피부 느낌은 어떤가요?",
      a: [
        "1. 얼굴 전체가 당기고 거칠다.",
        "2. T존은 번들거리고, U존은 당긴다.",
        "3. 당김은 없고, 얼굴 전체에 유분이 올라온다."
      ]
    },
    {
      q: "오후 3~4시쯤 거울을 봤을 때 내 얼굴은 어떤 상태인가요?",
      a: [
        "1. 푸석하고 화장이 갈라지거나 뜬다.",
        "2. 코와 이마 주변만 번들거린다.",
        "3. 얼굴 전체가 번들거린다."
      ]
    },
    {
      q: "내 얼굴의 모공 크기는 어떤가요?",
      a: [
        "1. 가까이서 봐도 거의 안 보일 정도로 작다.",
        "2. 코와 코 옆 볼 쪽에만 조금 보인다.",
        "3. 얼굴 전체적으로 모공이 넓고 눈에 띈다."
      ]
    },
    {
      q: "새로운 화장품으로 바꿨을 때 피부 반응은 어떤가요?",
      a: [
        "1. 별다른 문제 없이 잘 맞는다.",
        "2. 가끔 따갑거나 붉어질 때가 있다.",
        "3. 자주 뒤집어지고 트러블이 나서 바꾸기 무섭다."
      ]
    },
    {
      q: "평소 여드름이 얼마나 자주 나나요?",
      a: [
        "1. 거의 나지 않는다.",
        "2. 스트레스 받을 때만 가끔 한두 개 난다.",
        "3. 항상 좁쌀이나 화농성 여드름을 달고 산다."
      ]
    }
  ];

  const handleSelect = async (idx) => {

    const updatedAnswers = [...answers, idx];
    setAnswers(updatedAnswers);

    if (step < surveyQuestions.length - 1) {
      setStep(step + 1);
      return;
    }

    const counts = { 0: 0, 1: 0, 2: 0 };

    updatedAnswers.forEach((ans) => {
      counts[ans]++;
    });

    // -------------------------------------------------------------
    // ✨ [수정 구간] '중성' 제거 및 백엔드 호환용 [건성, 지성, 복합성] 매칭 로직
    // -------------------------------------------------------------
    let calculatedType = "복합성"; // 기본값 세팅 (점수가 완전히 동점일 때를 대비한 예외 처리)

    if (counts[0] > counts[1] && counts[0] > counts[2]) {
      calculatedType = "건성";
    } 
    else if (counts[2] > counts[0] && counts[2] > counts[1]) {
      calculatedType = "지성";
    } 
    else {
      // 2번 선택지(복합성)가 가장 많거나, 모든 점수가 똑같이 비기는 경우 '복합성'으로 결정
      calculatedType = "복합성";
    }

    setFinalSkinType(calculatedType);

    try {

      const response = await fetch(
        "http://localhost:8080/api/users/${currentUser.userId}/skin-type",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            skinType: calculatedType, // 백엔드로 "건성", "지성", "복합성" 중 하나가 날아갑니다.
          }),
        }
      );

      const data = await response.json();

      if (data.success) {

        const updatedUser = {
          ...currentUser,
          skinType: calculatedType,
        };

        setCurrentUser(updatedUser);

        localStorage.setItem(
          "current_user",
          JSON.stringify(updatedUser)
        );

        setStep(5);

      } else {

        alert(
          data.message ||
          "피부 타입 저장 실패"
        );

      }

    } catch (error) {

      console.error(error);

      alert(
        "서버와 연결할 수 없습니다."
      );
    }
  };

  const handlePrev = () => {

    if (step > 0 && step < 5) {

      setStep(step - 1);

      setAnswers(
        answers.slice(0, -1)
      );
    }
  };

  const renderSurveyForm = () => (
    <div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "3px solid #3a7b7e",
          paddingBottom: "14px",
          marginBottom: "28px"
        }}
      >

        <h4
          style={{
            margin: 0,
            color: "#3a7b7e",
            fontSize: "20px"
          }}
        >
          📋 피부 분석 설문
        </h4>
        <span
          style={{
            fontSize: "15px",
            fontWeight: "bold",
            color: "#64748b"
          }}
        >
          {currentUser?.nickname}님
        </span>
      </div>
      <div
        style={{
          backgroundColor: "#f8fafc",
          padding: "28px",
          borderRadius: "20px",
          border: "1px solid #e2e8f0"
        }}
      >

        <div
          style={{
            backgroundColor: "#ff7675",
            color: "white",
            textAlign: "center",
            padding: "6px 16px",
            fontWeight: "bold",
            borderRadius: "30px",
            fontSize: "13px",
            width: "fit-content",
            margin: "0 auto 20px auto"
          }}
        >
          Q.0{step + 1}
        </div>

        <h3
          style={{
            fontSize: "20px",
            fontWeight: "700",
            textAlign: "center",
            marginBottom: "32px",
            lineHeight: "1.6",
            color: "#1e293b"
          }}
        >
          {surveyQuestions[step].q}
        </h3>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}
        >

          {surveyQuestions[step].a.map((item, index) => (

            <button
              key={index}
              onClick={() => handleSelect(index)}
              style={{
                textAlign: "left",
                padding: "18px 22px",
                backgroundColor: "white",
                border: "1px solid #cbd5e1",
                borderRadius: "16px",
                cursor: "pointer",
                fontSize: "16px",
                color: "#334155",
                fontWeight: "600"
              }}
            >
              {item}
            </button>
          ))}
        </div>

        {step > 0 && (

          <button
            onClick={handlePrev}
            style={{
              marginTop: "24px",
              width: "100%",
              padding: "14px",
              border: "1px solid #cbd5e1",
              background: "white",
              borderRadius: "14px",
              cursor: "pointer",
              fontSize: "15px",
              color: "#64748b",
              fontWeight: "500"
            }}
          >
            이전 단계로
          </button>
        )}
      </div>
    </div>
  );

  const renderResultForm = () => (
    <div
      style={{
        textAlign: "center",
        padding: "20px 0"
      }}
    >

      <h2
        style={{
          color: "#2c5e61",
          fontSize: "28px",
          fontWeight: "800",
          marginBottom: "12px",
          marginTop: "16px"
        }}
      >
        설문 완료!
      </h2>

      <p
        style={{
          color: "#64748b",
          fontSize: "16px",
          margin: "0 0 32px 0"
        }}
      >
        분석 결과 결정된 회원님의 피부 타입입니다.
      </p>

      <div
        style={{
          backgroundColor: "#eff6ff",
          border: "3px solid #bfdbfe",
          padding: "28px 0",
          borderRadius: "20px",
          marginBottom: "32px"
        }}
      >

        <span
          style={{
            display: "block",
            color: "#1e40af",
            fontSize: "34px",
            fontWeight: "900"
          }}
        >
          {finalSkinType}
        </span>

      </div>

      <button
        onClick={() => navigate("MAIN")}
        style={{
          width: "100%",
          padding: "18px",
          backgroundColor: "#3a7b7e",
          color: "white",
          border: "none",
          borderRadius: "16px",
          fontSize: "18px",
          fontWeight: "bold",
          cursor: "pointer"
        }}
      >
        확인하고 시작하기
      </button>

    </div>
  );

  return (
    <div>
      {step < 5
        ? renderSurveyForm()
        : renderResultForm()}
    </div>
  );
}
