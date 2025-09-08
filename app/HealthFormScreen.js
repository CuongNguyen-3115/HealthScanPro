import { useRouter } from "expo-router";
import { useState } from "react";
import { Button, TextInput, View } from "react-native";
import { useHealth } from "../context/HealthContext";

export default function HealthFormScreen() {
  const router = useRouter();
  const { profile, setProfile } = useHealth();

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [activity, setActivity] = useState("");

  const handleNext = () => {
    setProfile({
      ...profile,
      age,
      gender,
      weight,
      height,
      activity,
    });
    router.push("/HealthConditionScreen");
  };

  return (
    <View>
      <TextInput placeholder="Tuổi" value={age} onChangeText={setAge} />
      <TextInput placeholder="Giới tính" value={gender} onChangeText={setGender} />
      <TextInput placeholder="Cân nặng" value={weight} onChangeText={setWeight} />
      <TextInput placeholder="Chiều cao" value={height} onChangeText={setHeight} />
      <TextInput placeholder="Mức độ vận động" value={activity} onChangeText={setActivity} />
      <Button title="Tiếp" onPress={handleNext} />
    </View>
  );
}
