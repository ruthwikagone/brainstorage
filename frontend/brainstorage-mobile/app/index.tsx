import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  StatusBar,
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

  return "Could not sign in. Check the backend and try again.";
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

export default function Index() {
  const router = useRouter();
  const { message: incomingMessage } = useLocalSearchParams<{ message?: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(incomingMessage || "");

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage("Enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const response = await API.post("/auth/login", { email, password });
      const successMessage = getSuccessMessage(response.data, "Login successful.");
      const userId =
        response?.data?.userId ??
        response?.data?.id ??
        response?.data?.user?.id;

      if (userId === undefined || userId === null || userId === "") {
        setMessage("Login worked, but /auth/login did not return a user id. Please update the backend response.");
        return;
      }

      router.replace(
        `/dashboard?email=${encodeURIComponent(email)}&message=${encodeURIComponent(successMessage)}&userId=${encodeURIComponent(String(userId))}`
      );
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.backgroundOrbTop} />
      <View style={styles.backgroundOrbBottom} />
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>BS</Text>
          </View>
          <Text style={styles.eyebrow}>BrainStorage</Text>
          <Text style={styles.title}>Keep your ideas, notes, links, expenses, and documents in one place.</Text>
          <Text style={styles.subtitle}>
            A cleaner workspace for personal knowledge, quick finance tracking, and organized references.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in</Text>

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

          <Pressable style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>{loading ? "Signing in..." : "Login"}</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.push("/register")}>
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f3ec",
  },
  backgroundOrbTop: {
    position: "absolute",
    top: -40,
    left: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#d8e2f1",
  },
  backgroundOrbBottom: {
    position: "absolute",
    bottom: -60,
    right: -20,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#ead9bc",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: "#f6f3ec",
  },
  hero: {
    marginBottom: 24,
    width: "100%",
    maxWidth: 560,
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
  eyebrow: {
    marginBottom: 8,
    color: "#8b5e34",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: "#1f2937",
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 40,
    marginBottom: 12,
  },
  subtitle: {
    color: "#4b5563",
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    width: "100%",
    maxWidth: 560,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  cardTitle: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
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
    backgroundColor: "#f9fafb",
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
    marginTop: 4,
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
