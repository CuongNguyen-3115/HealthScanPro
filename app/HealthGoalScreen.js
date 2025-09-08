import { useRouter } from "expo-router";
import { useState } from "react";
import { Button, Text, TouchableOpacity, View } from "react-native";
import { useHealth } from "../context/HealthContext";

const goalsList = ["Giảm cân", "Tăng cơ", "Cải thiện tim mạch"];

export default function HealthGoalScreen() {
  const router = useRouter();
  const { profile, setProfile } = useHealth();
  const [selected, setSelected] = useState([]);

  const toggleGoal = (g) => {
    setSelected((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const handleNext = () => {
    setProfile({
      ...profile,
      goals: selected,
    });
    router.push("/AllergyScreen");
  };

  return (
    <View>
      {goalsList.map((g) => (
        <TouchableOpacity key={g} onPress={() => toggleGoal(g)}>
          <Text style={{ color: selected.includes(g) ? "green" : "black" }}>
            {g}
          </Text>
        </TouchableOpacity>
      ))}
      <Button title="Tiếp" onPress={handleNext} />
    </View>
  );
}
