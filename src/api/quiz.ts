import axios from 'axios';
import { API_URL } from './config';

export interface QuestionData {
  text: string;
  type: 'mcq' | 'short_answer' | 'true_false';
  options?: string[];
  correct_answer?: string[];
  image?: File | null;
}

interface CreateQuizData {
  title: string;
  course_id: string;
  topic: string;
  difficulty: string;
  questions_per_student: number;
  questions: QuestionData[];
}

// Add error handling middleware
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
            refresh: refreshToken
          });
          localStorage.setItem('access_token', response.data.access);
          // Retry the original request
          error.config.headers['Authorization'] = `Bearer ${response.data.access}`;
          return axios(error.config);
        } catch (refreshError) {
          // Refresh token also expired
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(new Error('Session expired. Please login again.'));
        }
      }
    }
    return Promise.reject(error);
  }
);

// Faculty Quiz APIs
export const createQuiz = async (quizData: CreateQuizData) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  // Support image upload (multipart/form-data)
  const formData = new FormData();
  formData.append('title', quizData.title);
  formData.append('course_id', quizData.course_id);
  formData.append('topic', quizData.topic);
  formData.append('difficulty', quizData.difficulty);
  formData.append('questions_per_student', quizData.questions_per_student.toString());
  
  // Handle questions and their images
  const questionsWithoutImages = quizData.questions.map(q => ({
    ...q,
    image: null // Remove image from JSON to avoid circular reference
  }));
  formData.append('questions', JSON.stringify(questionsWithoutImages));
  
  // Append each image separately
  quizData.questions.forEach((question) => {
    if (question.image instanceof File) {
      formData.append('images', question.image);
    }
  });

  const response = await axios.post(`${API_URL}/quiz/create/`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    }
  });
  return response.data;
};

export const getFacultyQuizzes = async () => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  const response = await axios.get(`${API_URL}/quiz/faculty/quizzes/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getQuizById = async (quizId: string) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  const response = await axios.get(`${API_URL}/quiz/quiz/${quizId}/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateQuiz = async (quizId: string, quizData: CreateQuizData) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  // Send as multipart/form-data, but questions as a JSON string for backend compatibility
  const formData = new FormData();
  formData.append('title', quizData.title);
  formData.append('course_id', quizData.course_id);
  formData.append('topic', quizData.topic);
  formData.append('difficulty', quizData.difficulty);
  formData.append('questions_per_student', quizData.questions_per_student.toString());
  
  // Handle questions and their images
  const questionsWithoutImages = quizData.questions.map(q => ({
    ...q,
    image: null // Remove image from JSON to avoid circular reference
  }));
  formData.append('questions', JSON.stringify(questionsWithoutImages));
  
  // Append each image separately
  quizData.questions.forEach((question) => {
    if (question.image instanceof File) {
      formData.append('images', question.image);
    }
  });

  const response = await axios.put(`${API_URL}/quiz/quiz/${quizId}/`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    }
  });
  return response.data;
};

export const getFacultyQuizResults = async (quizId: string) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  const response = await axios.get(`${API_URL}/quiz/quiz/${quizId}/results/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteQuiz = async (quizId: string) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  const response = await axios.delete(`${API_URL}/quiz/quiz/${quizId}/delete/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Student Quiz APIs
export const getStudentQuizzes = async () => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  const response = await axios.get(`${API_URL}/quiz/student/quizzes/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getStudentQuizQuestions = async (quizId: string) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  const response = await axios.get(`${API_URL}/quiz/student/quiz/${quizId}/questions/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const submitQuizAnswer = async (assignmentId: string, answer: string) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  const response = await axios.post(
    `${API_URL}/quiz/student/assignment/${assignmentId}/submit/`,
    { answer },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const getStudentQuizResults = async (quizId: string) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  const response = await axios.get(`${API_URL}/quiz/quiz/${quizId}/results/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
