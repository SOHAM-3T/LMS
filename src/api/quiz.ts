import axios from 'axios';
import { API_URL } from './config';

export interface QuestionData {
  id?: number;
  text: string;
  type: 'mcq' | 'short_answer' | 'true_false';
  options?: string[];
  correct_answer: string[];
  max_score: number;
  image?: File | null;
}

// Base quiz interface with common properties
interface BaseQuiz {
  id: number;
  title: string;
  course_id: string;
  topic: string;
  difficulty: string;
}

// Interface for quiz list responses
export interface Quiz extends BaseQuiz {
  created_at: string;
  total_students: number;
  completed_students: number;
}

// Interface for quiz creation/update
export interface QuizWithQuestions extends BaseQuiz {
  questions: QuestionData[];
  scheduled_start_time: string | null;
  scheduled_end_time: string | null;
  time_limit_minutes: number | null;
  is_scheduled: boolean;
  questions_per_student: number;
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
export const createQuiz = async (quizData: Omit<QuizWithQuestions, 'id'>): Promise<Quiz> => {
  try {
    // Support image upload (multipart/form-data)
    const formData = new FormData();
    formData.append('title', quizData.title);
    formData.append('course_id', quizData.course_id);
    formData.append('topic', quizData.topic);
    formData.append('difficulty', quizData.difficulty);
    formData.append('questions_per_student', quizData.questions_per_student.toString());
    
    // Handle questions and their images
    const questionsWithoutImages = quizData.questions.map((q: QuestionData) => ({
      ...q,
      image: null // Remove image from JSON to avoid circular reference
    }));
    formData.append('questions', JSON.stringify(questionsWithoutImages));
    
    // Append each image separately
    quizData.questions.forEach((question: QuestionData) => {
      if (question.image instanceof File) {
        formData.append('images', question.image);
      }
    });

    const response = await axios.post(`${API_URL}/quiz/create/`, formData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating quiz:', error);
    throw error;
  }
};

export const getFacultyQuizzes = async (): Promise<Quiz[]> => {
  try {
    const response = await axios.get(`${API_URL}/quiz/faculty/quizzes/`, {
      headers: { 
        Authorization: `Bearer ${localStorage.getItem('access_token')}` 
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching faculty quizzes:', error);
    throw error;
  }
};

export const getQuizDetails = async (quizId: string): Promise<Quiz> => {
  try {
    const response = await axios.get(`${API_URL}/quiz/quiz/${quizId}/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching quiz details:', error);
    throw error;
  }
};

export const updateQuizDetails = async (quizId: string, quizData: QuizWithQuestions): Promise<Quiz> => {
  try {
    // Send as multipart/form-data, but questions as a JSON string for backend compatibility
    const formData = new FormData();
    formData.append('title', quizData.title);
    formData.append('course_id', quizData.course_id);
    formData.append('topic', quizData.topic);
    formData.append('difficulty', quizData.difficulty);
    formData.append('questions_per_student', quizData.questions_per_student.toString());
    
    // Handle questions and their images
    const questionsWithoutImages = quizData.questions.map((q: QuestionData) => ({
      ...q,
      image: null // Remove image from JSON to avoid circular reference
    }));
    formData.append('questions', JSON.stringify(questionsWithoutImages));
    
    // Append each image separately
    quizData.questions.forEach((question: QuestionData) => {
      if (question.image instanceof File) {
        formData.append('images', question.image);
      }
    });

    const response = await axios.put(`${API_URL}/quiz/quiz/${quizId}/`, formData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating quiz:', error);
    throw error;
  }
};

export const getFacultyQuizResults = async (quizId: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_URL}/quiz/quiz/${quizId}/results/`, {
      headers: { 
        Authorization: `Bearer ${localStorage.getItem('access_token')}` 
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    throw error;
  }
};

export const deleteQuiz = async (quizId: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/quiz/quiz/${quizId}/delete/`, {
      headers: { 
        Authorization: `Bearer ${localStorage.getItem('access_token')}` 
      }
    });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    throw error;
  }
};

// Student Quiz APIs
export const getStudentQuizzes = async (): Promise<Quiz[]> => {
  try {
    const response = await axios.get(`${API_URL}/quiz/student/quizzes/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching student quizzes:', error);
    throw error;
  }
};

export const getStudentQuizQuestions = async (quizId: string): Promise<QuestionData[]> => {
  try {
    const response = await axios.get(`${API_URL}/student/quiz/${quizId}/questions/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    throw error;
  }
};

export const submitQuizAnswer = async (assignmentId: string, answer: string): Promise<void> => {
  try {
    await axios.post(
      `${API_URL}/student/assignment/${assignmentId}/submit/`,
      { answer },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
};

export const getStudentQuizResults = async (quizId: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_URL}/quiz/quiz/${quizId}/results/`, {
      headers: { 
        Authorization: `Bearer ${localStorage.getItem('access_token')}` 
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching student quiz results:', error);
    throw error;
  }
};

export const getStudentQuizPerformance = async (quizId: string) => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(`${API_URL}/quiz/${quizId}/performance/`, {
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
    throw error.response?.data?.error || "Failed to fetch student performance data";
  }
};