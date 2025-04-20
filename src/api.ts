import axios from "axios";

// Create axios instance with base URL
const api = axios.create({
  baseURL: "http://localhost:8000",  // Remove /auth from baseURL
  headers: {
    "Content-Type": "application/json",
  },
});

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
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
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
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
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
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
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
