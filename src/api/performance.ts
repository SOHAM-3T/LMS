import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// The response from the API
interface APIStudentPerformance {
  id: number;
  student: string;
  quiz: number;
  total_score: string;
  max_possible_score: string;
  rank?: number;
  percentile?: number;
  student_name?: string;
  student_roll_no?: string;
}

// The transformed data we use in our components
export interface StudentPerformance {
  student_id: string;
  username: string;
  first_name: string;
  last_name: string;
  score: number;
  max_score: number;
  rank: number;
  percentile: number;
  completed: boolean;
}

export const getStudentQuizPerformance = async (quizId: string | number): Promise<APIStudentPerformance[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/quiz/quiz/${quizId}/rankings/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching student quiz performance:', error);
    throw error;
  }
};

export const getStudentPerformance = async (studentId: string) => {
  try {
    // Get the quiz rankings directly
    const response = await api.get(`/quiz/quiz/59/rankings/`);
    const studentPerformances = response.data;
    
    // Find this student's performances
    const studentPerformance = studentPerformances.find((p: any) => p.student === studentId);
    if (!studentPerformance) {
      return {
        student: {
          id: studentId,
          first_name: 'Student',
          last_name: '',
          email: '',
          username: ''
        },
        quiz_performances: [],
        average_score: 0,
        total_quizzes: 0,
        highest_score: 0,
        lowest_score: 0,
        percentile: 0,
        rank: 0
      };
    }

    // Transform the performance data
    const validPerformances = [{
      quiz_id: studentPerformance.quiz,
      quiz_title: studentPerformance.quiz_title,
      score: parseFloat(studentPerformance.total_score),
      total_questions: parseFloat(studentPerformance.max_possible_score),
      correct_answers: parseFloat(studentPerformance.total_score),
      time_taken: studentPerformance.time_taken || 0,
      submitted_at: studentPerformance.created_at,
      percentile: parseFloat(studentPerformance.percentile),
      rank: studentPerformance.rank,
      topic: studentPerformance.topic,
      course_id: studentPerformance.course_id
    }];

    // Calculate metrics
    const scores = validPerformances.map(p => p.score);
    const average = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const highest = scores.length > 0 ? Math.max(...scores) : 0;
    const lowest = scores.length > 0 ? Math.min(...scores) : 0;

    return {
      student: {
        id: studentId,
        first_name: studentPerformance.student_name?.split(' ')[0] || 'Student',
        last_name: studentPerformance.student_name?.split(' ').slice(1).join(' ') || '',
        email: '',
        username: studentPerformance.student_roll_no || ''
      },
      quiz_performances: validPerformances,
      average_score: Number(average.toFixed(2)),
      total_quizzes: validPerformances.length,
      highest_score: Number(highest.toFixed(2)),
      lowest_score: Number(lowest.toFixed(2)),
      percentile: parseFloat(studentPerformance.percentile),
      rank: studentPerformance.rank
    };
  } catch (error) {
    console.error('Error fetching student performance:', error);
    throw error;
  }
}; 