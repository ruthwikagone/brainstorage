import { View, Text, Alert } from "react-native";
import { useState } from "react";
import API from "../Api/api";
import Button from "../components/CustomButton";
import InputField from "../components/InputField";

export default function Login({ navigation }) {
  const [data, setData] = useState({
    email: "",
    password: "",
  });

  const login = async () => {
    if (!data.email || !data.password) {
      return Alert.alert("Error", "Enter email and password");
    }

    try {
      const res = await API.post("/auth/login", data);

      const userId = res.data.user.id; // ✅ dynamic id from backend

      Alert.alert("Success", "Login successful");

      navigation.navigate("Dashboard", { userId });

    } catch (err) {
      console.log(err.response?.data || err.message);
      Alert.alert(
        "Login Failed",
        err.response?.data?.message || "Invalid credentials"
      );
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Login</Text>

      <InputField
        placeholder="Email"
        onChange={(v) => setData({ ...data, email: v })}
      />

      <InputField
        placeholder="Password"
        secure
        onChange={(v) => setData({ ...data, password: v })}
      />

      <Button title="Login" onPress={login} />

      <Text onPress={() => navigation.navigate("Register")}>
        Create Account
      </Text>
    </View>
  );
}
