// Dữ liệu dinh dưỡng từ CSV
export const nutritionData = [
  {
    id: 1,
    name: "Vitamin A",
    description: "Vitamin tan trong dầu gồm retinol và provitamin (beta-caroten). Cần cho thị lực, phân chia tế bào và miễn dịch.",
    benefits: "Hỗ trợ thị lực, tăng miễn dịch, duy trì da niêm mạc.",
    effects: "Thiếu gây quáng gà; thừa (retinol) độc gan, gây dị tật thai; nguồn: gan, sữa, rau màu cam/đỏ.",
    contraindications: "Tránh liều cao khi đang mang thai; thận trọng với thuốc retinoid.",
    usage: "Bổ sung theo khuyến nghị; ưu tiên qua thực phẩm; dùng beta‑caroten cho bổ sung dài‑hạn.",
    icon: "eye",
    category: "vitamin"
  },
  {
    id: 2,
    name: "Vitamin D",
    description: "Vitamin/hormone tan trong dầu điều hoà canxi-phốt pho, cần cho xương.",
    benefits: "Hỗ trợ hấp thu canxi, phòng còi xương và loãng xương, hỗ trợ miễn dịch.",
    effects: "Thiếu giảm khoáng hoá xương; thừa gây tăng calci huyết; nguồn: ánh nắng, cá béo.",
    contraindications: "Thận trọng nếu rối loạn granulomatous (sarcoidosis) và tăng calci huyết.",
    usage: "Kiểm tra 25(OH)D trước khi bổ sung liều cao; dùng liều khuyến nghị.",
    icon: "sunny",
    category: "vitamin"
  },
  {
    id: 3,
    name: "Vitamin C",
    description: "Vitamin tan trong nước, chống oxy hoá và tham gia tổng hợp collagen.",
    benefits: "Tăng hấp thu sắt, hỗ trợ miễn dịch, góp phần lành vết thương.",
    effects: "Dễ phân huỷ khi đun nấu; nguồn: trái cây họ cam quýt, ổi.",
    contraindications: "Thận trọng ở người có tiền sử sỏi oxalat; rất hiếm chống chỉ định.",
    usage: "Tiêu thụ từ thực phẩm; bổ sung khi cần thiết, tránh liều rất cao.",
    icon: "leaf",
    category: "vitamin"
  },
  {
    id: 4,
    name: "Vitamin E",
    description: "Chất chống oxy hoá tan trong dầu bảo vệ màng tế bào.",
    benefits: "Bảo vệ cấu trúc lipid, hỗ trợ miễn dịch.",
    effects: "Liều cao có thể tăng nguy cơ chảy máu; nguồn: dầu thực vật, hạt.",
    contraindications: "Không dùng liều cao cùng thuốc chống đông mà không theo dõi.",
    usage: "Dùng qua chế độ ăn; tránh viên uống liều lớn lâu dài nếu không có chỉ định.",
    icon: "shield",
    category: "vitamin"
  },
  {
    id: 5,
    name: "Vitamin K",
    description: "Cần cho tổng hợp yếu tố đông máu và chuyển hoá xương.",
    benefits: "Hỗ trợ đông máu bình thường và sức khoẻ xương.",
    effects: "Tương tác với thuốc chống đông warfarin; nguồn: rau lá xanh.",
    contraindications: "Người dùng warfarin cần duy trì lượng ổn định; thận trọng trẻ sơ sinh.",
    usage: "Đảm bảo khẩu phần đều; bổ sung theo chỉ định bác sĩ.",
    icon: "heart",
    category: "vitamin"
  },
  {
    id: 6,
    name: "Vitamin B1 (Thiamin)",
    description: "Coenzyme trong chuyển hoá carbohydrate và chức năng thần kinh.",
    benefits: "Hỗ trợ chuyển hoá năng lượng, chức năng thần kinh và tim.",
    effects: "Thiếu gây beriberi; nguồn: ngũ cốc nguyên cám, thịt lợn.",
    contraindications: "Ít chống chỉ định; rượu làm giảm hấp thu.",
    usage: "Bảo đảm đủ qua chế độ ăn; bổ sung cho người thiếu.",
    icon: "flash",
    category: "vitamin"
  },
  {
    id: 7,
    name: "Vitamin B2 (Riboflavin)",
    description: "Coenzyme trong phản ứng oxy hoá-khử, cần cho da và mắt.",
    benefits: "Hỗ trợ chuyển hoá năng lượng và duy trì niêm mạc, mắt.",
    effects: "Nước tiểu đổi màu vàng khi thừa; nguồn: sữa, trứng, nội tạng.",
    contraindications: "An toàn ở liều khuyến nghị.",
    usage: "Bổ sung qua thực phẩm hoặc vitamin nhóm B nếu cần.",
    icon: "eye",
    category: "vitamin"
  },
  {
    id: 8,
    name: "Vitamin B3 (Niacin)",
    description: "Tiền chất của NAD/NADP, cần cho các phản ứng chuyển hoá.",
    benefits: "Hỗ trợ chuyển hoá; liều dược lý giúp hạ lipid máu.",
    effects: "Liều cao có thể gây flushing và độc gan; nguồn: thịt, cá, đậu.",
    contraindications: "Bệnh gan nặng; theo dõi men gan khi dùng liều điều trị.",
    usage: "Nên dùng theo chỉ định khi dùng liều dược lý; ưu tiên thực phẩm.",
    icon: "flame",
    category: "vitamin"
  },
  {
    id: 9,
    name: "Vitamin B6 (Pyridoxine)",
    description: "Coenzyme trong chuyển hoá amino acid và tạo máu.",
    benefits: "Hỗ trợ chuyển hoá, giảm buồn nôn thai kỳ ở mức an toàn.",
    effects: "Liều cao kéo dài gây độc thần kinh ngoại biên; nguồn: thịt, cá, khoai tây.",
    contraindications: "Tránh liều cao kéo dài; thận trọng khi dùng thuốc tương tác.",
    usage: "Dùng theo liều khuyến nghị; kiểm tra nếu bổ sung lâu dài.",
    icon: "brain",
    category: "vitamin"
  },
  {
    id: 10,
    name: "Folate (B9)",
    description: "Tham gia tổng hợp DNA và tạo hồng cầu.",
    benefits: "Giảm nguy cơ dị tật ống thần kinh khi bổ sung cho phụ nữ trước khi mang thai.",
    effects: "Liều cao có thể che lấp thiếu B12; nguồn: rau lá xanh, đậu.",
    contraindications: "Thận trọng nếu thiếu B12 chưa được chẩn đoán.",
    usage: "Phụ nữ chuẩn bị mang thai nên bổ sung 400–800 µg/ngày.",
    icon: "female",
    category: "vitamin"
  },
  {
    id: 11,
    name: "Vitamin B12 (Cobalamin)",
    description: "Cần cho tạo máu và chức năng thần kinh, hấp thu phụ thuộc nội tiết tố dạ dày.",
    benefits: "Phòng thiếu máu hồng cầu to và tổn thương thần kinh.",
    effects: "Thiếu gặp ở người ăn chay nghiêm ngặt, người cao tuổi; nguồn: thực phẩm động vật.",
    contraindications: "An toàn, thận trọng khi dùng metformin (giảm hấp thu).",
    usage: "Bổ sung đường uống hoặc tiêm cho người thiếu; kiểm tra nồng độ.",
    icon: "medical",
    category: "vitamin"
  },
  {
    id: 12,
    name: "Canxi",
    description: "Khoáng chính của xương, tham gia co cơ và dẫn truyền thần kinh.",
    benefits: "Hỗ trợ sức khoẻ xương và chức năng thần kinh-cơ.",
    effects: "Thừa có thể gây sỏi thận; tương tác hấp thu với sắt và một số thuốc; nguồn: sữa, cá nhỏ.",
    contraindications: "Tránh bổ sung quá mức nếu đã có tăng calci huyết.",
    usage: "Uống chia liều; kết hợp vitamin D để hấp thu tốt.",
    icon: "fitness",
    category: "mineral"
  },
  {
    id: 13,
    name: "Sắt",
    description: "Vi khoáng cần cho tổng hợp hemoglobin và vận chuyển oxy.",
    benefits: "Phòng và điều trị thiếu máu thiếu sắt.",
    effects: "Bổ sung có thể gây táo bón, buồn nôn; thừa gây quá tải sắt; nguồn: thịt đỏ, phủ tạng, đậu.",
    contraindications: "Người bệnh ứ sắt (hemochromatosis) tránh bổ sung không kiểm soát.",
    usage: "Uống với vitamin C để tăng hấp thu; tránh cùng sữa hoặc thuốc kháng acid.",
    icon: "blood",
    category: "mineral"
  },
  {
    id: 14,
    name: "I-ốt",
    description: "Cần cho tổng hợp hormone tuyến giáp và phát triển não bộ thai nhi.",
    benefits: "Phòng bướu cổ và suy giáp do thiếu iốt.",
    effects: "Thừa có thể gây rối loạn chức năng tuyến giáp; nguồn: muối i-ốt, hải sản.",
    contraindications: "Tránh bổ sung liều cao không có chỉ định, thận trọng bệnh tự miễn tuyến giáp.",
    usage: "Đảm bảo dùng muối i-ốt theo khuyến nghị; không quá liều.",
    icon: "radio",
    category: "mineral"
  },
  {
    id: 15,
    name: "Kẽm",
    description: "Vi khoáng tham gia hơn 300 enzym, quan trọng cho miễn dịch và lành vết thương.",
    benefits: "Tăng miễn dịch, giúp lành vết thương và tăng trưởng.",
    effects: "Liều cao gây thiếu đồng; nguồn: hàu, thịt, đậu.",
    contraindications: "Tránh bổ sung kéo dài liều cao mà không theo dõi.",
    usage: "Dùng theo khuyến nghị; tránh dùng liên tục liều cao >40 mg/ngày.",
    icon: "shield-checkmark",
    category: "mineral"
  },
  {
    id: 16,
    name: "Magie",
    description: "Khoáng tham gia chức năng thần kinh, co cơ và hơn 300 phản ứng enzym.",
    benefits: "Hỗ trợ cơ, thần kinh và sức khoẻ tim mạch.",
    effects: "Thừa gây tiêu chảy; nguồn: hạt, đậu, rau lá xanh.",
    contraindications: "Thận trọng suy thận nặng.",
    usage: "Bổ sung theo chỉ định; chia liều nếu dùng viên lớn.",
    icon: "muscle",
    category: "mineral"
  },
  {
    id: 17,
    name: "Phospho",
    description: "Khoáng cấu tạo xương, ATP và tham gia nhiều quá trình sinh học.",
    benefits: "Cần cho cấu trúc xương và chuyển hoá năng lượng.",
    effects: "Quá nhiều có thể ảnh hưởng cân bằng canxi; nguồn: thực phẩm giàu protein, đồ đóng gói.",
    contraindications: "Thận trọng ở bệnh nhân suy thận.",
    usage: "Đảm bảo cân bằng với canxi; tránh lạm dụng thực phẩm chế biến nhiều phosphat.",
    icon: "battery-charging",
    category: "mineral"
  },
  {
    id: 18,
    name: "Selen (Selenium)",
    description: "Vi khoáng với vai trò chống oxy hoá và trong enzym peroxidase.",
    benefits: "Hỗ trợ chức năng tuyến giáp và chống oxy hoá.",
    effects: "Thừa gây độc (rụng tóc, thay móng); nguồn: hạt brazil, hải sản.",
    contraindications: "Không dùng liều cao lâu dài mà không theo dõi.",
    usage: "Dùng theo khuyến nghị; không vượt quá UL.",
    icon: "shield",
    category: "mineral"
  },
  {
    id: 19,
    name: "Đường (Sucrose)",
    description: "Carbohydrate đơn giản cung cấp năng lượng nhanh.",
    benefits: "Cung cấp năng lượng nhanh; làm tăng vị ngọt và hấp thụ nhanh.",
    effects: "Tiêu thụ nhiều gây tăng cân, sâu răng, nguy cơ chuyển hoá (tiểu đường).",
    contraindications: "Hạn chế ở người tiểu đường, béo phì.",
    usage: "Hạn chế lượng, ưu tiên nguồn carbohydrate phức tạp và trái cây.",
    icon: "candy",
    category: "carbohydrate"
  },
  {
    id: 20,
    name: "Tinh bột (Starch)",
    description: "Carbohydrate phức tạp trong ngũ cốc, khoai củ, là nguồn năng lượng lâu dài.",
    benefits: "Cung cấp năng lượng bền vững và cảm giác no.",
    effects: "Chế biến quá mức có thể tăng chỉ số đường huyết; nguồn: gạo, khoai, ngô.",
    contraindications: "Hạn chế tinh bột tinh chế ở người cần kiểm soát đường huyết.",
    usage: "Ưu tiên ngũ cốc nguyên cám, chế biến ít tinh chế.",
    icon: "leaf",
    category: "carbohydrate"
  },
  {
    id: 21,
    name: "Chất xơ (Fiber)",
    description: "Chất không tiêu hoá trong thực phẩm thực vật, gồm hoà tan và không hoà tan.",
    benefits: "Hỗ trợ tiêu hoá, giảm cholesterol, ổn định đường huyết.",
    effects: "Quá nhiều đột ngột gây đầy hơi; nguồn: rau, trái cây, ngũ cốc nguyên cám.",
    contraindications: "Người tắc ruột hoặc cần hạn chế theo chỉ định y tế thận trọng.",
    usage: "Tăng dần lượng, uống đủ nước, ưu tiên từ thực phẩm.",
    icon: "nutrition",
    category: "carbohydrate"
  },
  {
    id: 22,
    name: "Trứng",
    description: "Thực phẩm giàu protein chất lượng cao, nhiều vitamin và khoáng chất.",
    benefits: "Cung cấp protein, choline, vitamin D, B12; hỗ trợ phát triển cơ và chức năng thần kinh.",
    effects: "Trứng chứa cholesterol; ăn quá nhiều có thể ảnh hưởng lipid ở một số người; nguồn: trứng gà, vịt.",
    contraindications: "Người dị ứng trứng tránh; cẩn trọng ở người tăng cholesterol cá nhân.",
    usage: "Ăn vừa phải (ví dụ <=1 trứng/ngày) tùy tình trạng cá nhân; nấu chín kỹ.",
    icon: "egg",
    category: "protein"
  },
  {
    id: 23,
    name: "Sữa và sản phẩm sữa",
    description: "Nguồn protein, canxi và vitamin nhóm B; bao gồm sữa tươi, sữa chua, phô mai.",
    benefits: "Hỗ trợ phát triển xương, cung cấp protein và canxi.",
    effects: "Người không dung nạp lactose có thể đau bụng; nguồn: sữa bò, dê.",
    contraindications: "Không dùng ở người dị ứng protein sữa; hạn chế nếu không dung nạp lactose nặng.",
    usage: "Chọn sản phẩm lên men (sữa chua) giúp tiêu hoá; dùng sữa tách béo nếu cần kiểm soát năng lượng.",
    icon: "water",
    category: "protein"
  },
  {
    id: 24,
    name: "Protein (chung)",
    description: "Chuỗi acid amin cấu thành mô và enzym; nguồn: thực phẩm động vật và thực vật.",
    benefits: "Xây dựng và sửa chữa mô, enzyme và hormone.",
    effects: "Thiếu protein gây suy dinh dưỡng; thừa lâu dài có thể ảnh hưởng thận ở người có bệnh thận.",
    contraindications: "Thận trọng nếu suy thận nặng.",
    usage: "Phân bổ đều trong ngày, kết hợp nguồn thực vật và động vật.",
    icon: "fitness",
    category: "protein"
  },
  {
    id: 25,
    name: "Cholesterol",
    description: "Lipid cấu tạo màng tế bào và tiền chất hormone; cơ thể tự tổng hợp một phần.",
    benefits: "Cần cho chức năng sinh lý nhưng dư thừa liên quan bệnh tim mạch.",
    effects: "Mức LDL cao tăng nguy cơ xơ vữa; nguồn: thực phẩm chứa mỡ động vật, lòng đỏ trứng.",
    contraindications: "Người rối loạn lipid hạn chế thực phẩm giàu cholesterol và bão hòa.",
    usage: "Kiểm soát lượng chất béo bão hòa; ưu tiên chất béo không bão hòa.",
    icon: "heart",
    category: "lipid"
  },
  {
    id: 26,
    name: "Chất béo bão hòa",
    description: "Acid béo thường ở dạng rắn ở nhiệt độ phòng, có trong mỡ động vật và dầu cọ.",
    benefits: "Cung cấp năng lượng và cấu trúc màng tế bào.",
    effects: "Tiêu thụ nhiều làm tăng LDL và nguy cơ tim mạch.",
    contraindications: "Hạn chế ở người có nguy cơ tim mạch.",
    usage: "Giảm lượng, thay bằng dầu thực vật chứa không bão hòa.",
    icon: "flame",
    category: "lipid"
  }
];

// Hàm để lấy chất dinh dưỡng ngẫu nhiên
export const getRandomNutrition = () => {
  const randomIndex = Math.floor(Math.random() * nutritionData.length);
  return nutritionData[randomIndex];
};

// Hàm để lấy chất dinh dưỡng theo category
export const getNutritionByCategory = (category) => {
  return nutritionData.filter(item => item.category === category);
};

// Hàm để tìm chất dinh dưỡng theo tên
export const findNutritionByName = (name) => {
  return nutritionData.find(item => 
    item.name.toLowerCase().includes(name.toLowerCase())
  );
};
