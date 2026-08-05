import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

import { getToken } from "./auth";
import { API_URL } from "@/config/env";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds
});

/**
 * Request Interceptor
 * Automatically attaches JWT token to every request.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

/**
 * Response Interceptor
 * Handles common API errors globally.
 */
apiClient.interceptors.response.use(
  (response) => response,

  (error: AxiosError) => {
    if (error.response) {
      switch (error.response.status) {
        case 400:
          console.error("Bad Request");
          break;

        case 401:
          console.warn("Unauthorized. Please login again.");
          break;

        case 403:
          console.warn("Access Forbidden.");
          break;

        case 404:
          console.warn("Resource Not Found.");
          break;

        case 500:
          console.error("Internal Server Error.");
          break;

        default:
          console.error(
            `API Error: ${error.response.status}`
          );
      }
    } else if (error.request) {
      console.error(
        "Unable to connect to the server. Please check your internet connection."
      );
    } else {
      console.error(error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;