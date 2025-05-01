import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Award, User, Mail, LogOut, ChevronDown } from 'lucide-react';
import { getStudentDetails } from '../api';
import { getStudentQuizzes, submitQuizAnswer, QuestionData } from '../api/quiz';
import { API_BASE_URL } from '../config';

interface StudentDetails {
  id: number;
  username: string;
  roll_no: string;
  email: string;
  first_name: string;
  last_name: string;
  branch: string;
  year: string;
  is_active: boolean;
  is_faculty?: boolean;
}

interface Quiz {
  id: number;
  title: string;
  course_id: string;
  topic: string;
  difficulty: string;
  is_completed?: boolean;
  total_score?: number;
  max_possible_score?: number;
  rank?: number;
  percentile?: number;
  score?: number;
  total_questions?: number;
  completed_questions?: number;
  completed?: boolean;
  inProgress?: boolean;
  questions?: QuestionData[];
  scheduled_start_time?: string | null;
  scheduled_end_time?: string | null;
  time_limit_minutes?: number | null;
  is_scheduled?: boolean;
  questions_per_student?: number;
}

interface QuizQuestion {
  id: string;
  quiz_id: string;
  assignment_id: string;
  text: string;
  submitted: boolean;
  score?: number;
}

interface QuizPerformanceData {
  quizId: number;
  quizTitle: string;
  rank: number | null;
  percentile: number | null;
  score: string;
  maxScore: string;
  courseId: string;
}

const StudentDashboard = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]); // Explicit type annotation added
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizPerformances, setQuizPerformances] = useState<QuizPerformanceData[]>([]);

  useEffect(() => {
    const checkUserType = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }

        const [data, quizData] = await Promise.all([
          getStudentDetails(),
          getStudentQuizzes()
        ]);

        console.log('Student Details Response:', {
          data,
          roll_no: data.roll_no,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email
        });

        if (data.is_faculty) {
          navigate('/faculty-dashboard');
          return;
        }

        if (data) {
          setStudentDetails({
            id: data.id,
            username: data.username || '',
            roll_no: data.roll_no || '',
            email: data.email || '',
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            branch: data.branch || '',
            year: data.year || '',
            is_active: data.is_active,
            is_faculty: data.is_faculty
          });
        }

        if (quizData) {
          setQuizzes(quizData.map((quiz: any) => ({
            ...quiz,
            id: String(quiz.id),
            completed: quiz.is_completed || false,
            inProgress: false
          })));
        }
      } catch (err: any) {
        console.error('Error fetching student details:', err);
        setError(err.message);
        if (
          err.message === 'Session expired. Please login again.' ||
          err.message === 'No authentication token found' ||
          err.message === 'SessionExpired'
        ) {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkUserType();
  }, [navigate]);

  useEffect(() => {
    const fetchQuizPerformances = async () => {
      const completedQuizzes = quizzes.filter(quiz => quiz.completed);
      
      const performancePromises = completedQuizzes.map(async quiz => {
        try {
          const response = await fetch(`${API_BASE_URL}/quiz/student/performance/${quiz.id}/`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          const data = await response.json();
          
          return {
            quizId: quiz.id,
            quizTitle: quiz.title,
            rank: data.rank || null,
            percentile: data.percentile || null,
            score: data.total_score || '0.00',
            maxScore: data.max_possible_score || '0.00',
            courseId: quiz.course_id
          };
        } catch (error) {
          console.error(`Error fetching performance for quiz ${quiz.id}:`, error);
          return null;
        }
      });

      const performances = (await Promise.all(performancePromises)).filter(p => p !== null) as QuizPerformanceData[];
      setQuizPerformances(performances);
    };

    if (quizzes.length > 0) {
      fetchQuizPerformances();
    }
  }, [quizzes]);

  const handleQuizClick = (quizId: number) => {
    navigate(`/student/quiz/${quizId.toString()}/attempt`);
  };

  const handleAnswerSubmit = async (assignmentId: string, quizId: string) => {
    try {
      // Submit the answer
      await submitQuizAnswer(assignmentId, currentAnswer);
      
      // Update the question status
      setQuizQuestions(prevQuestions =>
        prevQuestions.map(q =>
          q.assignment_id === assignmentId ? { ...q, submitted: true } : q
        )
      );

      // Clear the current answer
      setCurrentAnswer('');

      // Find next unanswered question
      const nextQuestion = quizQuestions.find(q => !q.submitted);
      if (nextQuestion) {
        // navigate(`/quiz/${quizId}/question/${nextQuestion.id}`);
      } else {
        // All questions answered, mark quiz as completed
        setQuizzes(prevQuizzes =>
          prevQuizzes.map(q =>
            q.id === Number(quizId) ? { ...q, completed: true, inProgress: false } : q
          )
        );
        // navigate('/student-dashboard');
      }
    } catch (err: any) {
      console.error('Error submitting answer:', err);
      setError(err.message);
    }
  };

  // Add this component for displaying quiz performance
  const QuizPerformanceCard: React.FC<{ quiz: Quiz }> = ({ quiz }) => {
    interface Performance {
      total_score: string;
      max_possible_score: string;
      rank?: number;
      percentile?: number;
    }

    const [performance, setPerformance] = useState<Performance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const fetchPerformance = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const response = await fetch(`${API_BASE_URL}/quiz/student/performance/${quiz.id}/`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          const data = await response.json();
          
          if (response.ok && data) {
            setPerformance({
              total_score: data.total_score || '0.00',
              max_possible_score: data.max_possible_score || quiz.total_score?.toFixed(2) || '0.00',
              rank: data.rank,
              percentile: data.percentile
            });
            setError(null);
          } else {
            throw new Error(data.error || 'Failed to fetch performance data');
          }
        } catch (error) {
          console.error('Error fetching performance:', error);
          setError('Error fetching score');
          // Set default performance with quiz total score
          setPerformance({
            total_score: '0.00',
            max_possible_score: quiz.total_score?.toFixed(2) || '0.00',
            rank: undefined,
            percentile: undefined
          });
        } finally {
          setLoading(false);
        }
      };

      if (quiz.completed) {
        fetchPerformance();
      } else {
        setLoading(false);
      }
    }, [quiz.id, quiz.completed, quiz.total_score]);

    if (!quiz.completed) return null;
    
    const displayScore = performance 
      ? `${performance.total_score}/${performance.max_possible_score}`
      : loading 
        ? 'Loading...' 
        : `0.00/${quiz.total_score?.toFixed(2) || '0.00'}`;

    return (
      <div className="performance-card bg-white rounded-lg shadow-md p-4 mt-4">
        <h4 className="text-lg font-semibold mb-2">Performance</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Score</p>
            {loading ? (
              <div className="text-center py-2">Loading score...</div>
            ) : (
              <p className="text-xl font-bold">{displayScore}</p>
            )}
          </div>
          {performance?.rank && (
            <div>
              <p className="text-sm text-gray-600">Rank</p>
              <p className="text-xl font-bold">{performance.rank}</p>
            </div>
          )}
          {performance?.percentile && (
            <div>
              <p className="text-sm text-gray-600">Percentile</p>
              <p className="text-xl font-bold">{performance.percentile.toFixed(1)}%</p>
            </div>
          )}
        </div>
        {error && (
          <div className="text-red-500 text-sm mt-2">
            {error}
          </div>
        )}
      </div>
    );
  };

  // Update the quiz card rendering to include performance metrics
  const renderQuizCard = (quiz: Quiz) => (
    <div key={quiz.id} className="quiz-card bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold">{quiz.title}</h3>
          <p className="text-gray-600 mt-1">{quiz.course_id} - {quiz.topic}</p>
          <div className="flex items-center mt-2">
            <span className={`px-2 py-1 rounded text-sm ${
              quiz.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
              quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {quiz.difficulty}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">
            {quiz.completed_questions || 0}/{quiz.total_questions || 0} questions
          </p>
          {quiz.completed && (
            <p className="text-sm font-medium text-green-600 mt-1">Completed</p>
          )}
        </div>
      </div>
      <QuizPerformanceCard quiz={quiz} />
      <div className="mt-4">
        <button
          onClick={() => handleQuizClick(quiz.id)}
          disabled={quiz.completed}
          className={`w-full py-2 rounded-md ${
            quiz.completed 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {quiz.completed ? 'Completed' : 'Start Quiz'}
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-red-600 text-center">
          <p className="text-lg font-semibold">Error loading student details</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const fullName = studentDetails ? `${studentDetails.first_name} ${studentDetails.last_name}` : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {fullName}!</h1>
              <p className="text-gray-600 mt-1">Here's what's happening with your studies</p>
            </div>
            <div className="flex items-center space-x-4 relative">
              <div className="flex items-center">
                <button
                  className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold hover:bg-blue-700 transition-colors duration-200"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  {fullName.charAt(0)}
                </button>
                <ChevronDown
                  className={`h-4 w-4 ml-1 text-gray-600 transition-transform duration-200 ${showDropdown ? 'transform rotate-180' : ''}`}
                  onClick={() => setShowDropdown(!showDropdown)}
                />
              </div>
              {showDropdown && (
                <div className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="font-medium text-gray-800">{studentDetails?.first_name} {studentDetails?.last_name}</div>
                    <div className="text-sm text-gray-500">{studentDetails?.roll_no}</div>
                  </div>
                  <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center">
                    <Award className="h-4 w-4 mr-2" />
                    Results
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem('access_token');
                      navigate('/login');
                    }}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-purple-600">Available</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {quizzes.filter(quiz => !quiz.completed).length}
              </h3>
              <p className="text-gray-600">Unattempted Quizzes</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-green-600">Overall</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">85%</h3>
              <p className="text-gray-600">Average Score</p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Upcoming Exams */}
            <div className="lg:col-span-2">
              {/* Upcoming Exams Section */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Quizzes</h2>
                <div className="space-y-4">
                  {quizzes.map((quiz) => renderQuizCard(quiz))}
                  {quizzes.length === 0 && (
                    <p className="text-gray-600 text-center py-4">No exams available at the moment.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Profile and Performance Section */}
            <div className="space-y-8">
              {/* Profile Section */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Student Profile</h2>
                <div className="space-y-4">
                  {/* Full Name */}
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-medium text-gray-900">
                        {studentDetails ? `${studentDetails.first_name} ${studentDetails.last_name}` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Roll Number */}
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Roll Number</p>
                      <p className="font-medium text-gray-900">{studentDetails?.roll_no || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Mail className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{studentDetails?.email || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Branch */}
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Award className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Branch</p>
                      <p className="font-medium text-gray-900">{studentDetails?.branch || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Year */}
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Year</p>
                      <p className="font-medium text-gray-900">{studentDetails?.year || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Overview */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Performance Overview</h2>
                {quizPerformances.length > 0 ? (
                  <div className="space-y-6">
                    {quizPerformances.map((performance) => (
                      <div key={performance.quizId} className="bg-gray-50 rounded-lg p-4">
                        <div className="mb-3">
                          <h3 className="text-lg font-semibold text-gray-800">{performance.quizTitle}</h3>
                          <p className="text-sm text-gray-600">{performance.courseId}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-600">Class Rank</span>
                              <span className="text-lg font-bold text-purple-600">
                                {performance.rank ? `#${performance.rank}` : 'N/A'}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${performance.rank ? Math.max(5, 100 - ((performance.rank - 1) * 10)) : 0}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-600">Percentile</span>
                              <span className="text-lg font-bold text-blue-600">
                                {performance.percentile ? `${performance.percentile.toFixed(1)}th` : 'N/A'}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${performance.percentile || 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-600">Score</span>
                            <span className="text-lg font-bold text-green-600">
                              {`${performance.score}/${performance.maxScore}`}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ 
                                width: `${(parseFloat(performance.score) / parseFloat(performance.maxScore)) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No quiz performances available yet. Complete a quiz to see your performance metrics.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Add Quiz Questions Section */}
          {quizzes.find((q: Quiz) => q.inProgress) && quizQuestions.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {quizzes.find((q: Quiz) => q.inProgress)?.title}
              </h2>
              <div className="mb-4 space-y-1">
                <p className="text-sm text-gray-600">Topic: {quizzes.find((q: Quiz) => q.inProgress)?.topic}</p>
                <p className="text-sm text-gray-600">Progress: {quizQuestions.filter(q => q.submitted).length} of {quizQuestions.length} questions completed</p>
              </div>
              {quizQuestions.map((question, index) => (
                <div key={question.id} className="mb-6 last:mb-0 p-4 border border-gray-200 rounded-lg">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Question {index + 1}</h3>
                    <p className="text-gray-800 whitespace-pre-wrap">{question.text}</p>
                  </div>
                  {!question.submitted && (
                    <div className="space-y-4">
                      <textarea
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Type your answer here..."
                        rows={4}
                      />
                      <button
                        onClick={() => handleAnswerSubmit(question.assignment_id, question.quiz_id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Submit Answer
                      </button>
                    </div>
                  )}
                  {question.submitted && (
                    <p className="text-green-600 font-medium">Answer submitted</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;