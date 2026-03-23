import { View, Text } from "react-native";
import { useState } from "react";
import API from "../Api/api";
import Button from "../components/CustomButton";
import InputField from "../components/InputField";

export default function Login({ navigation }) {
  const [data, setData] = useState({ email: "", password: "" });

  const login = async () => {
    try {
      const res = await API.post("/auth/login", data);

      alert(res.data);

      // ⭐ IMPORTANT: manually set userId (backend doesn't return user yet)
      const userId = 1; // TEMP (later we improve)

      navigation.navigate("Dashboard", { userId });

    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Login</Text>

      <InputField placeholder="Email" onChange={(v) => setData({ ...data, email: v })} />
      <InputField placeholder="Password" secure onChange={(v) => setData({ ...data, password: v })} />

      <Button title="Login" onPress={login} />

      <Text onPress={() => navigation.navigate("Register")}>
        Create Account
      </Text>
    </View>
  );
}
