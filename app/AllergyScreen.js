import { useRouter } from "expo-router";
import { useState } from "react";
import { Button, Text, TouchableOpacity, View } from "react-native";
import { useHealth } from "../context/HealthContext";

const allergyList = ["Gluten", "Lactose", "Đậu phộng"];

export default function AllergyScreen() {
  const router = useRouter();
  const { profile, setProfile } = useHealth();
  const [selected, setSelected] = useState([]);

  const toggleAllergy = (a) => {
    setSelected((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const handleFinish = () => {
    setProfile({
      ...profile,
      allergies: selected,
    });
    router.push("/ChatBotScreen");
  };

  return (
    <View>
      {allergyList.map((a) => (
        <TouchableOpacity key={a} onPress={() => toggleAllergy(a)}>
          <Text style={{ color: selected.includes(a) ? "green" : "black" }}>
            {a}
          </Text>
        </TouchableOpacity>
      ))}
      <Button title="Hoàn tất hồ sơ" onPress={handleFinish} />
    </View>
  );
}
