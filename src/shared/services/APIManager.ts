import axios, { AxiosHeaders, InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENV } from "../../config/env";

const API = axios.create({ baseURL: ENV.API_URL, timeout: 10000 });

API.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await AsyncStorage.getItem("authToken");
  const kodeKantor = await AsyncStorage.getItem("kodeKantor");

  const headers = (config.headers ?? new AxiosHeaders()) as AxiosHeaders;

  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (kodeKantor && !headers.has("X-Tenant-Id")) headers.set("X-Tenant-Id", kodeKantor);

  config.headers = headers;
  return config;
});

export default API;
