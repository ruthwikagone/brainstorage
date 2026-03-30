import axios from "axios";
import { Platform } from "react-native";

const getBaseURL = () => {
  // ✅ Production URL from Vercel env
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  if (envUrl) {
    return envUrl.replace(/\/$/, ""); // remove trailing slash
  }

  // ✅ Local development fallbacks
  if (__DEV__) {
    if (Platform.OS === "android") {
      return "http://10.0.2.2:8080";
    }

    if (Platform.OS === "web") {
      return "http://127.0.0.1:8080";
    }

    return "http://localhost:8080";
  }

  // ✅ Safe fallback
  return "";
};

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;
