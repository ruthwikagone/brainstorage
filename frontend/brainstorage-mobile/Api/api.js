import axios from "axios";
import { Platform } from "react-native";

const getBaseURL = () => {
  // ✅ Railway deployed backend from env
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  // ✅ Local development fallback
  if (__DEV__) {
    // 📱 Android Emulator
    if (Platform.OS === "android") {
      return "http://10.0.2.2:8080";
    }

    // 🌐 Web browser
    if (Platform.OS === "web") {
      return "http://127.0.0.1:8080";
    }

    // 🍎 iOS simulator OR real phone (replace with your laptop IP)
    return "http://192.168.29.115:8080";
  }

  // ✅ Production fallback
  return "https://your-backend.up.railway.app";
};

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // 30 sec timeout for Railway cold start
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Debug request URL
API.interceptors.request.use((req) => {
  console.log("API URL:", `${req.baseURL}${req.url}`);
  return req;
});

export default API;
