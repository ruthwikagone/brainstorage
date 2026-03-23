import axios from "axios";
import { Platform } from "react-native";

const getBaseURL = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:8080";
  }

  if (Platform.OS === "web") {
    return "http://127.0.0.1:8080";
  }

  return "http://localhost:8080";
};

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
});

export default API;
