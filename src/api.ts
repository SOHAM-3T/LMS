import axios from "axios";
import { setSessionExpiredGlobal } from './SessionContext';

// Truly global session expired variable
let trulyGlobalSessionExpired = false;
export function setTrulyGlobalSessionExpired(val: boolean) {
  trulyGlobalSessionExpired = val;
}

// Create axios instance with base URL
const api = axios.create({
  baseURL: "http://localhost:8000",  // Remove /auth from baseURL
  headers: {
    "Content-Type": "application/json",
  },
});

export { api };

// Add request interceptor to attach Authorization header and block all requests after session expiry
api.interceptors.request.use(
  (config) => {
    console.log('[REQUEST] URL:', config.url, 'SessionExpired:', trulyGlobalSessionExpired, 'WindowExpired:', typeof window !== 'undefined' && (window as any).__SESSION_EXPIRED__);
    if (trulyGlobalSessionExpired || (typeof window !== 'undefined' && (window as any).__SESSION_EXPIRED__)) {
      return Promise.reject(new Error('SessionExpired'));
    }
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log('[RESPONSE] Error for URL:', error.config?.url, 'Status:', error.response?.status, 'SessionExpired:', trulyGlobalSessionExpired, 'WindowExpired:', typeof window !== 'undefined' && (window as any).__SESSION_EXPIRED__);
    if (trulyGlobalSessionExpired || (typeof window !== 'undefined' && (window as any).__SESSION_EXPIRED__)) {
      setSessionExpiredGlobal?.(true);
      throw new Error('SessionExpired');
    }
    const originalRequest = error.config;
    const refreshToken = localStorage.getItem('refreshToken') || localStorage.getItem('refresh_token');
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (!refreshToken) {
        // No refresh token: log out and stop loop
        trulyGlobalSessionExpired = true;
        if (typeof window !== 'undefined') (window as any).__SESSION_EXPIRED__ = true;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('refreshToken');
        setTrulyGlobalSessionExpired(true);
        setSessionExpiredGlobal?.(true);
        processQueue(new Error('SessionExpired'), null);
        console.log('[RESPONSE] Redirecting to login due to session expired (no refresh token)');
        window.location.href = '/login';
        throw new Error('SessionExpired');
      }
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
        .then((token) => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        })
        .catch(() => {
          trulyGlobalSessionExpired = true;
          if (typeof window !== 'undefined') (window as any).__SESSION_EXPIRED__ = true;
          setTrulyGlobalSessionExpired(true);
          setSessionExpiredGlobal?.(true);
          console.log('[RESPONSE] Redirecting to login due to session expired (refresh failed)');
          window.location.href = '/login';
          throw new Error('SessionExpired');
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const response = await axios.post('http://localhost:8000/auth/token/refresh/', {
          refresh: refreshToken
        });
        const { access } = response.data;
        localStorage.setItem('access_token', access);
        api.defaults.headers.common['Authorization'] = 'Bearer ' + access;
        processQueue(null, access);
        return api(originalRequest);
      } catch (refreshError) {
        trulyGlobalSessionExpired = true;
        if (typeof window !== 'undefined') (window as any).__SESSION_EXPIRED__ = true;
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('refreshToken');
        setTrulyGlobalSessionExpired(true);
        setSessionExpiredGlobal?.(true);
        console.log('[RESPONSE] Redirecting to login due to session expired (refresh failed)');
        window.location.href = '/login';
        throw new Error('SessionExpired');
      } finally {
        isRefreshing = false;
      }
    }
    if (setSessionExpiredGlobal && setSessionExpiredGlobal.toString() !== '() => {}') {
      // If session is expired, immediately reject
      if (window.localStorage.getItem('access_token') === null && window.localStorage.getItem('refresh_token') === null) {
        trulyGlobalSessionExpired = true;
        if (typeof window !== 'undefined') (window as any).__SESSION_EXPIRED__ = true;
        setTrulyGlobalSessionExpired(true);
        setSessionExpiredGlobal(true);
        console.log('[RESPONSE] Redirecting to login due to session expired (tokens missing)');
        window.location.href = '/login';
        throw new Error('SessionExpired');
      }
    }
    return Promise.reject(error);
  }
);

// --- GLOBAL PATCH: Add interceptors to default axios instance ---
axios.interceptors.request.use(
  (config) => {
    console.log('[GLOBAL REQUEST] URL:', config.url, 'SessionExpired:', trulyGlobalSessionExpired, 'WindowExpired:', typeof window !== 'undefined' && (window as any).__SESSION_EXPIRED__);
    if (trulyGlobalSessionExpired || (typeof window !== 'undefined' && (window as any).__SESSION_EXPIRED__)) {
      return Promise.reject(new Error('SessionExpired'));
    }
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log('[GLOBAL RESPONSE] Error for URL:', error.config?.url, 'Status:', error.response?.status, 'SessionExpired:', trulyGlobalSessionExpired, 'WindowExpired:', typeof window !== 'undefined' && (window as any).__SESSION_EXPIRED__);
    if (trulyGlobalSessionExpired || (typeof window !== 'undefined' && (window as any).__SESSION_EXPIRED__)) {
      setSessionExpiredGlobal?.(true);
      throw new Error('SessionExpired');
    }
    const originalRequest = error.config;
    const refreshToken = localStorage.getItem('refreshToken') || localStorage.getItem('refresh_token');
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (!refreshToken) {
        trulyGlobalSessionExpired = true;
        if (typeof window !== 'undefined') (window as any).__SESSION_EXPIRED__ = true;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('refreshToken');
        setTrulyGlobalSessionExpired(true);
        setSessionExpiredGlobal?.(true);
        processQueue(new Error('SessionExpired'), null);
        console.log('[GLOBAL RESPONSE] Redirecting to login due to session expired (no refresh token)');
        window.location.href = '/login';
        throw new Error('SessionExpired');
      }
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
        .then((token) => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return axios(originalRequest);
        })
        .catch(() => {
          trulyGlobalSessionExpired = true;
          if (typeof window !== 'undefined') (window as any).__SESSION_EXPIRED__ = true;
          setTrulyGlobalSessionExpired(true);
          setSessionExpiredGlobal?.(true);
          console.log('[GLOBAL RESPONSE] Redirecting to login due to session expired (refresh failed)');
          window.location.href = '/login';
          throw new Error('SessionExpired');
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const response = await axios.post('http://localhost:8000/auth/token/refresh/', {
          refresh: refreshToken
        });
        const { access } = response.data;
        localStorage.setItem('access_token', access);
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + access;
        processQueue(null, access);
        return axios(originalRequest);
      } catch (refreshError) {
        trulyGlobalSessionExpired = true;
        if (typeof window !== 'undefined') (window as any).__SESSION_EXPIRED__ = true;
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('refreshToken');
        setTrulyGlobalSessionExpired(true);
        setSessionExpiredGlobal?.(true);
        console.log('[GLOBAL RESPONSE] Redirecting to login due to session expired (refresh failed)');
        window.location.href = '/login';
        throw new Error('SessionExpired');
      } finally {
        isRefreshing = false;
      }
    }
    if (setSessionExpiredGlobal && setSessionExpiredGlobal.toString() !== '() => {}') {
      if (window.localStorage.getItem('access_token') === null && window.localStorage.getItem('refresh_token') === null) {
        trulyGlobalSessionExpired = true;
        if (typeof window !== 'undefined') (window as any).__SESSION_EXPIRED__ = true;
        setTrulyGlobalSessionExpired(true);
        setSessionExpiredGlobal(true);
        console.log('[GLOBAL RESPONSE] Redirecting to login due to session expired (tokens missing)');
        window.location.href = '/login';
        throw new Error('SessionExpired');
      }
    }
    return Promise.reject(error);
  }
);
// --- END GLOBAL PATCH ---

// Function to register a new user
export const registerUser = async ({
  rollNo,
  email,
  password,
  firstName,
  lastName,
  branch,
  year,
  userType
}: {
  rollNo: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  branch: string;
  year: string;
  userType: 'student' | 'faculty';
}) => {
  try {
    const response = await api.post("/auth/signup/", {
      roll_no: rollNo,
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      branch,
      year,
      user_type: userType
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.error || "Registration failed";
  }
};

// Function to verify OTP
export const verifyOTP = async (email: string, otp: string, purpose: 'signup' | 'password_reset') => {
  try {
    const response = await api.post("/auth/verify-otp/", {
      email,
      otp,
      purpose
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.error || "OTP verification failed";
  }
};

// Function to request password reset
export const requestPasswordReset = async (email: string) => {
  try {
    const response = await api.post("/request-password-reset/", { email });
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.error || "Password reset request failed";
  }
};

// Function to reset password
export const resetPassword = async (email: string, otp: string, newPassword: string) => {
  try {
    console.log('Resetting password for:', { email });
    const response = await api.post("/reset-password/", {
      email,
      otp,
      new_password: newPassword
    });
    return response.data;
  } catch (error: any) {
    console.error('Reset password error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error.response?.data?.error || "Failed to reset password";
  }
};

// Function to login user
export const loginUser = async (rollNumber: string, password: string) => {
  try {
    const response = await api.post("/auth/login/", {
      roll_no: rollNumber,
      password: password,
    });
    return response.data;
  } catch (error: any) {
    // Check if the error is due to inactive account
    if (error.response?.data?.error?.includes("Account is not active")) {
      throw {
        response: {
          data: {
            needs_verification: true,
            email: error.response.data.email,
            error: "Please verify your email with OTP to activate your account"
          }
        }
      };
    }
    throw error.response?.data?.error || "Invalid credentials";
  }
};

// Function to get student details
export const getStudentDetails = async () => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await api.get("/auth/student/details/", {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      throw new Error('SessionExpired');
    }
    throw error.response?.data?.error || "Failed to fetch student details";
  }
};

// Function to get faculty details
export const getFacultyDetails = async () => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await api.get("/auth/faculty/details/", {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      throw new Error('SessionExpired');
    }
    throw error.response?.data?.error || "Failed to fetch faculty details";
  }
};

// Function to get all students
export const getAllStudents = async () => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await api.get("/auth/students/", {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      throw new Error('SessionExpired');
    }
    throw error.response?.data?.error || "Failed to fetch students";
  }
};

// Function to generate OTP
export const generateOTP = async (email: string, purpose: 'signup' | 'password_reset') => {
  try {
    const response = await api.post("/auth/otp/generate/", {
      email,
      purpose
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.error || "Failed to generate OTP";
  }
};