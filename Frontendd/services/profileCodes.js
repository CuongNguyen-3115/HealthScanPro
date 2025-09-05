// app/services/profileCodes.js

export const GENDER_LABEL_TO_CODE = { 'Nam': 'male', 'Nữ': 'female' };

/** PHẢI trùng y chang label trong Picker của HealthFormScreen */
export const ACTIVITY_LABEL_TO_CODE = {
  'Ít vận động (làm việc văn phòng)': 'sedentary',
  'Vận động nhẹ (1–3 ngày/tuần)': 'light',
  'Vận động trung bình (3–5 ngày/tuần)': 'moderate',
  'Vận động nhiều (6–7 ngày/tuần)': 'high',
  'Vận động rất nhiều (2 lần/ngày)': 'athlete',
};

/** Điều kiện sức khoẻ: bao đủ các mục đang có trong HealthConditionScreen */
export const CONDITION_CODES = {
  'Tiểu đường': 'diabetes',
  'Huyết áp cao': 'hypertension',
  'Bệnh tim mạch': 'cardiovascular',
  'Rối loạn mỡ máu': 'lipid_disorder',
  'Bệnh thận mạn': 'ckd',
  'Bệnh gan': 'liver_disease',
  'Gút': 'gout',
  'Rối loạn tuyến giáp': 'thyroid_disorder',
  'Celiac/nhạy gluten': 'celiac',
  'Không dung nạp Lactose': 'lactose_intolerance',
  'Hội chứng ruột kích thích (IBS)': 'ibs',
  'GERD/Trào ngược dạ dày': 'gerd',
  'Hen phế quản': 'asthma',
  'COPD': 'copd',
  'Bệnh phổi mãn tính': 'copd',            // đồng nhất với COPD
  'Thiếu máu/Thiếu sắt': 'anemia',
  'Loãng xương': 'osteoporosis',
  'PCOS': 'pcos',
  'Mang thai/Cho con bú': 'pregnancy',
  'Thừa cân/Béo phì': 'obesity',
  'Thiếu cân': 'underweight',

  // (tùy chọn) hỗ trợ thêm nhãn bạn từng dùng trong ví dụ khác:
  'Suy hô hấp': 'respiratory_disorder',
};

export const ALLERGY_CODES = {
  'Gluten': 'gluten',
  'Lactose': 'lactose',
  'Đậu phộng': 'peanut',
  'Tôm cua': 'shellfish',
  'Trứng': 'egg',
  'Đậu nành': 'soy',
  'Hạt phỉ': 'tree_nuts',
  'Cá': 'fish',
  'Dâu tây': 'strawberry',
  'Chocolate': 'chocolate',
  'Phô mai': 'cheese',
};

export const GOAL_CODES = {
  'Giảm cân': 'lose_weight',
  'Duy trì cân nặng': 'maintain_weight',
  'Tăng năng lượng': 'energy_up',
  'Tăng cân': 'gain_weight',
  'Tăng cơ bắp': 'muscle_gain',
  'Cải thiện tim mạch': 'cardio_health',
  'Cải thiện tiêu hóa': 'digestion',
  'Kiểm soát đường huyết': 'glycemic_control',
  'Ngủ ngon hơn': 'better_sleep',
  'Giảm stress': 'stress_down',
};
