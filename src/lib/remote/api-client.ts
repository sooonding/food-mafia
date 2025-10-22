import axios, { isAxiosError, type AxiosInstance, type AxiosRequestConfig } from "axios";
import type { ApiResponse } from '@/types/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: '네트워크 연결을 확인해주세요',
        },
      });
    }

    if (error.response.status >= 500) {
      return Promise.reject({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요',
        },
      });
    }

    return Promise.reject(error.response.data);
  }
);

export async function apiRequest<T>(
  config: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.request<ApiResponse<T>>(config);
  return response.data;
}

export async function apiGet<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return apiRequest<T>({ ...config, method: 'GET', url });
}

export async function apiPost<T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return apiRequest<T>({ ...config, method: 'POST', url, data });
}

export async function apiPatch<T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return apiRequest<T>({ ...config, method: 'PATCH', url, data });
}

export async function apiDelete<T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return apiRequest<T>({ ...config, method: 'DELETE', url, data });
}

type ErrorPayload = {
  error?: {
    message?: string;
  };
  message?: string;
};

export const extractApiErrorMessage = (
  error: unknown,
  fallbackMessage = "API request failed."
) => {
  if (isAxiosError(error)) {
    const payload = error.response?.data as ErrorPayload | undefined;

    if (typeof payload?.error?.message === "string") {
      return payload.error.message;
    }

    if (typeof payload?.message === "string") {
      return payload.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

export { apiClient, isAxiosError };
export default apiClient;
