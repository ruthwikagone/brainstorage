import { useState } from "react";
import { router } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import API from "../Api/api";

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      response?: { data?: unknown };
      message?: string;
    };

    if (typeof maybeError.response?.data === "string") {
      return maybeError.response.data;
    }

    if (typeof maybeError.message === "string") {
      return maybeError.message;
    }
  }

  return "Could not create your account.";
};

const getSuccessMessage = (data: any, fallback: string) => {
  if (typeof data === "string") {
    return data;
  }

  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }

  return fallback;
};

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setMessage("Fill in name, email, and password.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const response = await API.post("/auth/register", { name, email, password });
      const successMessage = getSuccessMessage(response.data, "Account created successfully.");
      const userId =
        response?.data?.userId ??
        response?.data?.id ??
        response?.data?.user?.id;

      if (userId !== undefined && userId !== null && userId !== "") {
        router.replace(
          `/dashboard?email=${encodeURIComponent(email)}&message=${encodeURIComponent(successMessage)}&userId=${encodeURIComponent(String(userId))}`
        );
        return;
      }

      router.replace(`/?message=${encodeURIComponent(successMessage)}`);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>BS</Text>
          </View>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Create your account and continue straight into your workspace when the backend returns a user id.</Text>

          <TextInput
            placeholder="Name"
            placeholderTextColor="#6b7280"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor="#6b7280"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#6b7280"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Pressable style={styles.primaryButton} onPress={handleRegister}>
            <Text style={styles.primaryButtonText}>{loading ? "Creating..." : "Register"}</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Back to login</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5efe6",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "#f5efe6",
  },
  card: {
    width: "100%",
    maxWidth: 560,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 22,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#10231c",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  logoText: {
    color: "#f7f5ef",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 1,
  },
  title: {
    color: "#111827",
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 10,
  },
  subtitle: {
    color: "#4b5563",
    fontSize: 16,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    marginBottom: 12,
    backgroundColor: "#ffffff",
  },
  message: {
    color: "#b42318",
    fontSize: 14,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: "#111827",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#efe4d3",
  },
  secondaryButtonText: {
    color: "#7c4a21",
    fontSize: 15,
    fontWeight: "700",
  },
});
