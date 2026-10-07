import { getStoredToken, removeStoredToken } from './auth';
import { router } from 'expo-router';

// Android emulator uses 10.0.2.2 to reach the host machine
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5001/api';

export class ApiError extends Error {
  public statusCode: number;
  public errors?: Record<string, string[]>;

  constructor(message: string, statusCode: number, errors?: Record<string, string[]>) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

interface RequestOptions {
  method?: string;
  body?: string;
  params?: Record<string, string | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export async function apiClient<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, body, method = 'GET', headers: extraHeaders, signal } = options;

  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const token = await getStoredToken();
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    const controller = signal ? undefined : new AbortController();
    const timeoutId = controller
      ? setTimeout(() => controller.abort(), 15000)
      : undefined;

    response = await fetch(url, {
      method,
      headers: { ...defaultHeaders, ...extraHeaders },
      body,
      signal: signal || controller?.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', 0);
    }
    throw new ApiError('Unable to connect to the server. Please check your internet connection and try again.', 0);
  }

  if (response.status === 401) {
    await removeStoredToken();
    // Navigate to login with expired flag
    router.replace('/(auth)/login?expired=true');
    throw new ApiError('Session expired. Please log in again.', 401);
  }

  let data: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorMessage = data?.message || `Request failed with status ${response.status}`;
    throw new ApiError(errorMessage, response.status, data?.errors);
  }

  return data as T;
}
