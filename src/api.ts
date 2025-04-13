import axios from "axios";

// Create axios instance with base URL
const api = axios.create({
  baseURL: "http://localhost:8000/auth",  // Update this to match your Django backend URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Function to register a new user
export const registerUser = async (
  username: string,
  email: string,
  password: string,
  first_name: string,
  last_name: string,
  user_type: string
) => {
  try {
    const response = await api.post("/signup/", {
      username,
      email,
      password,
      first_name,
      last_name,
      user_type
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.error || "Registration failed";
  }
};

// Function to login user
export const loginUser = async (username: string, password: string) => {
  try {
    const response = await api.post("/login/", {
      username,
      password
    });
    
    console.log('API Response:', response.data);
    
    // Store the tokens and user type in localStorage
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    localStorage.setItem('user_type', response.data.is_faculty ? 'faculty' : 'student');
    
    return response.data;
  } catch (error: any) {
    console.error('Login API error:', error.response?.data || error);
    throw error.response?.data?.error || "Login failed";
  }
};

// Function to get student details
export const getStudentDetails = async () => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await api.get("/student/details/", {
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

    const response = await api.get("/faculty/details/", {
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

    const response = await api.get("/students/", {
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
