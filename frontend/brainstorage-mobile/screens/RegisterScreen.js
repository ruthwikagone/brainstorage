import { View, Text } from "react-native";
import { useState } from "react";
import API from "../Api/api";
import Button from "../components/CustomButton";
import InputField from "../components/InputField";

export default function Register({ navigation }) {
  const [data, setData] = useState({ name: "", email: "", password: "" });

  const register = async () => {
    await API.post("/auth/register", data);
    alert("Registered Successfully");
    navigation.navigate("Login");
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Register</Text>

      <InputField placeholder="Name" onChange={(v) => setData({ ...data, name: v })} />
      <InputField placeholder="Email" onChange={(v) => setData({ ...data, email: v })} />
      <InputField placeholder="Password" secure onChange={(v) => setData({ ...data, password: v })} />

      <Button title="Register" onPress={register} />
    </View>
  );
}
