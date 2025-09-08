import { useRouter } from "expo-router";
import { useState } from "react";
import { Button, Text, TouchableOpacity, View } from "react-native";
import { useHealth } from "../context/HealthContext";

const conditionsList = ["Tiểu đường", "Huyết áp cao", "Tim mạch"];

export default function HealthConditionScreen() {
  const router = useRouter();
  const { profile, setProfile } = useHealth();
  const [selected, setSelected] = useState([]);

  const toggleCondition = (c) => {
    setSelected((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const handleNext = () => {
    setProfile({
      ...profile,
      conditions: selected,
    });
    router.push("/HealthGoalScreen");
  };

  return (
    <View>
      {conditionsList.map((c) => (
        <TouchableOpacity key={c} onPress={() => toggleCondition(c)}>
          <Text style={{ color: selected.includes(c) ? "green" : "black" }}>
            {c}
          </Text>
        </TouchableOpacity>
      ))}
      <Button title="Tiếp" onPress={handleNext} />
    </View>
  );
}
