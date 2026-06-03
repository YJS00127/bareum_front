import math

def analyze_ingredients_with_ai(skin_type, ingredient_names):
    # 이제 skin_type은 무조건 값이 들어있으므로 바로 사용합니다.
    current_skin_type = skin_type
    
    # 2. 분석 점수 (로지스틱 회귀 로직)
    good_count = 0
    caution_count = 0
    
    # 여기서 CSV 파일을 읽어서 처리하는 로직을 넣습니다
    # 일단 간단한 예시 데이터로 매칭 로직을 구현합니다
    # (실제 CSV 파일이 있다면 csv 모듈로 불러와서 처리하세요)
    
    # 3. 로지스틱 회귀 수식 계산
    weights = {'GOOD': [2.5, -2.5], 'NORMAL': [-1.0, -1.0], 'CAUTION': [-2.5, 2.5]}
    biases = {'GOOD': 0.5, 'NORMAL': 2.0, 'CAUTION': 0.5}

    logit_rec = weights['GOOD'][0] * good_count + weights['GOOD'][1] * caution_count + biases['GOOD']
    logit_norm = weights['NORMAL'][0] * good_count + weights['NORMAL'][1] * caution_count + biases['NORMAL']
    logit_caut = weights['CAUTION'][0] * good_count + weights['CAUTION'][1] * caution_count + biases['CAUTION']

    # 4. 확률 계산 (Softmax)
    exp_rec = math.exp(logit_rec)
    exp_norm = math.exp(logit_norm)
    exp_caut = math.exp(logit_caut)
    sum_exp = exp_rec + exp_norm + exp_caut

    prob_rec = exp_rec / sum_exp
    prob_norm = exp_norm / sum_exp
    prob_caut = exp_caut / sum_exp

    # 5. 결과 판정
    if prob_rec > prob_norm and prob_rec > prob_caut:
        total_analysis = "GOOD"
    elif prob_caut > prob_rec and prob_caut > prob_norm:
        total_analysis = "CAUTION"
    else:
        total_analysis = "NORMAL"

    return total_analysis