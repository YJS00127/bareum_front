// src/utils/skinAnalysisModel.js
// 💡 같은 폴더에 있는 CSV 파일을 직접 소스코드로 가져옵니다!
import csvRawText from './ingredient_skinType.csv';

/**
 * 1. CSV 텍스트 데이터를 리액트가 다루기 좋은 객체(JSON) 구조로 파싱하는 함수
 */
const parseIngredientDataset = () => {
  try {
    const rows = csvRawText.split(/\r?\n/);
    const dataset = {};

    // 첫 줄(헤더: ingredient,skin_type,label)은 제외하고 2번째 줄부터 순회
    for (let i = 1; i < rows.length; i++) {
      const currentRow = rows[i].trim();
      if (!currentRow) continue; // 빈 줄 패스

      const tokens = currentRow.split(",");
      if (tokens.length < 3) continue;

      const ingredient = tokens[0].trim();
      const skinType = tokens[1].trim();
      const label = tokens[2].trim().toUpperCase(); // GOOD, NORMAL, CAUTION

      // 대소문자 매칭 실수를 방지하기 위해 성분명을 모두 소문자로 통일하여 저장
      const lowerIngredient = ingredient.toLowerCase();

      if (!dataset[lowerIngredient]) {
        dataset[lowerIngredient] = {};
      }
      dataset[lowerIngredient][skinType] = label;
    }
    return dataset;
  } catch (error) {
    console.error("❌ 성분 데이터 파싱 실패:", error);
    return null;
  }
};

// 파싱이 완료된 데이터셋 생성
const ingredientModelDataset = parseIngredientDataset();

/**
 * 🚀 [최종 AI 모델 예측 함수]
 * @param {string} userSkinType - 유저 피부 타입 ("건성", "지성", "복합성")
 * @param {string[]} detectedIngredients - 검출된 성분 배열
 */
export const predictSkinSuitability = (userSkinType, detectedIngredients) => {
  if (!ingredientModelDataset) {
    return { error: true, message: "성분 데이터베이스를 구축하지 못했습니다." };
  }

  let totalScore = 100; // 100점 만점 베이스 시스템 시작
  let cautionCount = 0;
  const detailedResults = [];

  detectedIngredients.forEach((ingredient) => {
    if (!ingredient) return;
    
    const trimmedIng = ingredient.trim();
    const lowerIng = trimmedIng.toLowerCase();
    
    const ingredientData = ingredientModelDataset[lowerIng];
    // 데이터셋에 있으면 해당 라벨을 쓰고, 없으면 기본 "NORMAL" 처리
    const label = ingredientData ? (ingredientData[userSkinType] || "NORMAL") : "NORMAL";

    let scoreChange = 1; // 기본 NORMAL은 +1점
    if (label === "GOOD") {
      scoreChange = 5;   // GOOD 성분 가중치 적용
    } else if (label === "CAUTION") {
      scoreChange = -10; // CAUTION 성분 가중치 적용
      cautionCount++;
    }

    totalScore += scoreChange;

    detailedResults.push({
      name: trimmedIng, // 화면에는 원래 이름 그대로 노출
      label: label, 
      impact: scoreChange
    });
  });

  // 종합 점수가 100점을 넘지 않도록 상한선 제한
  if (totalScore > 100) {
    totalScore = 100;
  }

  // 최종 결과 분류 알고리즘 (Threshold)
  let totalAnalysis = "RECOMMEND";
  let aiMessage = `${userSkinType} 피부에 안정적인 성분 조합입니다. 안심하고 사용하셔도 좋습니다.`;

  if (totalScore < 60 || cautionCount >= 3) {
    totalAnalysis = "NOT_RECOMMEND";
    aiMessage = `주의(CAUTION) 성분이 ${cautionCount}개 검출되었거나 피부 매칭 점수(${totalScore}점)가 낮아 이 제품을 추천하지 않습니다.`;
  } else if (totalScore >= 60 && totalScore < 80) {
    totalAnalysis = "WARN";
    aiMessage = "일부 피부 자극을 유발할 수 있는 성분이 포함되어 있습니다. 민감한 부위는 피해서 테스트 후 사용하세요.";
  }

  return {
    totalScore,
    totalAnalysis, // "RECOMMEND", "WARN", "NOT_RECOMMEND"
    aiMessage,
    ingredientsList: detailedResults
  };
};