import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)

EXCEL_FILE_NAME = "ingredient_skinType.xlsx"

def load_ingredients_excel():
    if os.path.exists(EXCEL_FILE_NAME):
        try:
            print(f"🔄 {EXCEL_FILE_NAME} 파일을 성공적으로 불러오는 중입니다...")
            return pd.read_excel(EXCEL_FILE_NAME)
        except Exception as e:
            print(f"❌ 엑셀 파일을 읽는 중 오류가 발생했습니다: {e}")
            return None
    else:
        print(f"⚠️ 경고: {EXCEL_FILE_NAME} 파일이 같은 폴더에 없습니다!")
        return None

df_ingredients = load_ingredients_excel()


@app.route('/api/python/analyze', methods=['POST'])
def analyze_ingredients():
    try:
        data = request.get_json()
        
        skin_type = data.get('skinType', '건성')
        ingredient_names = data.get('ingredientNames', [])

        recommend_score = 0
        ingredients_list = []  # 🔬 개별 성분 판독 리스트를 담을 상자

        if df_ingredients is not None and ingredient_names:
            for ing in ingredient_names:
                # 엑셀의 '성분명' 컬럼에서 일치하는 성분 찾기
                match = df_ingredients[df_ingredients['성분명'].astype(str).apply(lambda x: x in ing or ing in x)]
                
                if not match.empty:
                    # 엑셀에 적힌 라벨 그대로 가져오기 (GOOD / CAUTION / NORMAL)
                    csv_label = match.iloc[0].get(skin_type, "NORMAL")
                    
                    if csv_label == "GOOD":
                        recommend_score += 1
                    elif csv_label == "CAUTION":
                        recommend_score -= 1
                    
                    # 개별 성분 결과 추가
                    ingredients_list.append({
                        "ingredient": ing,
                        "label": str(csv_label).upper()  # 확실하게 대문자로 변환
                    })
                else:
                    # 엑셀 데이터에 없는 성분은 기본적으로 무난한 NORMAL 처리
                    ingredients_list.append({
                        "ingredient": ing,
                        "label": "NORMAL"
                    })

        # 🏆 종합 진단 도출 (리액트가 인식하는 대문자 스펙으로 통일)
        if recommend_score > 0:
            total_analysis = "RECOMMEND"
            ai_message = f"선택하신 성분 중 {skin_type} 피부에 도움이 되는 성분이 많아 추천합니다!"
        elif recommend_score < 0:
            total_analysis = "CAUTION"
            ai_message = f"선택하신 성분 중 {skin_type} 피부에 주의해야 할 성분이 포함되어 있으니 확인해 보세요."
        else:
            total_analysis = "NORMAL"
            ai_message = f"{skin_type} 피부에 무난하게 사용할 수 있는 성분 조합입니다."

        # 📦 리액트(Main.jsx)가 요구하는 key 이름 그대로 맵핑하여 반환
        return jsonify({
            "totalAnalysis": total_analysis,
            "aiMessage": ai_message,
            "ingredientsList": ingredients_list
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)