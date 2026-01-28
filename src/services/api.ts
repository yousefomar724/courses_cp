/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError,
} from "axios"
import type { ApiResponse, PaginatedResponse } from "../types/api"

// API Configuration
// const API_BASE_URL =
//   import.meta.env.VITE_API_URL || "https://courses-api.alef-team.com/api/v1/"
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:6060/api/v1/';

// Token expiration handler
let tokenExpirationHandler: (() => void) | null = null

export const setTokenExpirationHandler = (handler: () => void) => {
  tokenExpirationHandler = handler
}

// Create axios instance
export const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": "all",
    },
  })

  // Request interceptor for adding auth token
  instance.interceptors.request.use(
    (config: any) => {
      const token = localStorage.getItem("admin_token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error: any) => Promise.reject(error)
  )

  // Response interceptor for handling errors
  instance.interceptors.response.use(
    (response: any) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Token expired or invalid - clear auth state and redirect
        localStorage.removeItem("admin_token")

        // Call the token expiration handler if set
        if (tokenExpirationHandler) {
          tokenExpirationHandler()
        }

        // Redirect to login page
        window.location.href = "/login"
      }
      return Promise.reject(error)
    }
  )

  return instance
}

// Create singleton instance
const apiInstance = createApiInstance()

// Generic API functions
export const apiGet = async <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  const response = await apiInstance.get(url, config)
  return response.data
}

export const apiPost = async <T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  const response = await apiInstance.post(url, data, config)
  return response.data
}

export const apiPut = async <T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  const response = await apiInstance.put(url, data, config)
  return response.data
}

export const apiPatch = async <T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  const response = await apiInstance.patch(url, data, config)
  return response.data
}

export const apiDelete = async <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  const response = await apiInstance.delete(url, config)
  return response.data
}

export const apiGetPaginated = async <T>(
  url: string,
  params?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<PaginatedResponse<T>> => {
  const response = await apiInstance.get(url, {
    ...config,
    params,
  })

  const responseData = response.data

  // Transform mongoose-paginate response to our PaginatedResponse format
  if (responseData.data && responseData.data.docs) {
    return {
      success: responseData.success,
      message: responseData.message || 'Success',
      data: {
        items: responseData.data.docs,
        pagination: {
          currentPage: responseData.data.page,
          totalPages: responseData.data.totalPages,
          totalItems: responseData.data.totalDocs,
          itemsPerPage: responseData.data.limit,
          hasNext: responseData.data.hasNextPage,
          hasPrev: responseData.data.hasPrevPage,
          nextPage: responseData.data.nextPage,
          prevPage: responseData.data.prevPage,
        },
        meta: responseData.data.meta
      }
    }
  }

  // Handle already transformed response or nested data structure
  if (responseData.data && responseData.data.data) {
    return {
      success: responseData.success,
      message: responseData.message,
      data: responseData.data.data
    }
  }

  return responseData
}

// Export instance for direct use if needed
export const getApiInstance = (): AxiosInstance => apiInstance
