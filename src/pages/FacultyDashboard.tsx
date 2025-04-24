import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Clock, User, Mail, Award, Search, LogOut, ChevronDown, Plus } from 'lucide-react';
import { getFacultyDetails, getAllStudents } from '../api';
import { createQuiz, getFacultyQuizzes } from '../api/quiz';

interface FacultyDetails {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  branch: string;
  status: string;
}

interface Student {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  average_score: number;
  attendance: number;
  class_rank: number;
  percentile: number;
}

interface Quiz {
  id: string;
  title: string;
  course_id: string;
  topic: string;
  difficulty: string;
  created_at: string;
  total_students: number;
  completed_students: number;
}

const FacultyDashboard = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateQuizModal, setShowCreateQuizModal] = useState(false);
  const navigate = useNavigate();
  const [facultyDetails, setFacultyDetails] = useState<FacultyDetails | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    course_id: '',
    topic: '',
    difficulty: 'medium',
    questions_per_student: 3,
    questions: [] as string[]
  });
  const [currentQuestion, setCurrentQuestion] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }

        const [facultyData, studentsData, quizzesData] = await Promise.all([
          getFacultyDetails(),
          getAllStudents(),
          getFacultyQuizzes()
        ]);

        if (facultyData) {
          setFacultyDetails({
            username: facultyData.username || '',
            first_name: facultyData.first_name || '',
            last_name: facultyData.last_name || '',
            email: facultyData.email || '',
            branch: facultyData.branch || '',
            status: facultyData.status || 'Admin'
          });
        }

        if (studentsData) {
          setStudents(studentsData);
        }

        if (quizzesData) {
          setQuizzes(quizzesData);
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message);
        if (err.message === 'Session expired. Please login again.' || err.message === 'No authentication token found') {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (newQuiz.questions.length < newQuiz.questions_per_student) {
        setError(`Please add at least ${newQuiz.questions_per_student} questions`);
        return;
      }
      const response = await createQuiz(newQuiz);
      // Add the new quiz to the state with proper date formatting
      setQuizzes([{
        ...response,
        created_at: new Date(response.created_at).toISOString()
      }, ...quizzes]);
      setShowCreateQuizModal(false);
      setNewQuiz({
        title: '',
        course_id: '',
        topic: '',
        difficulty: 'medium',
        questions_per_student: 3,
        questions: [] as string[]
      });
      setCurrentQuestion('');
      setError(null); // Clear any existing errors
    } catch (err: any) {
      console.error('Error creating quiz:', err);
      setError(err.message || 'Failed to create quiz. Please try again.');
    }
  };

  const handleAddQuestion = () => {
    if (currentQuestion.trim()) {
      setNewQuiz({
        ...newQuiz,
        questions: [...newQuiz.questions, currentQuestion.trim()]
      });
      setCurrentQuestion('');
    }
  };

  const handleRemoveQuestion = (index: number) => {
    setNewQuiz({
      ...newQuiz,
      questions: newQuiz.questions.filter((_, i) => i !== index)
    });
  };

  const filteredStudents = students.filter(student => 
    student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
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
          <p className="text-lg font-semibold">Error loading data</p>
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

  const fullName = facultyDetails ? `${facultyDetails.first_name} ${facultyDetails.last_name}` : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {fullName}!</h1>
              <p className="text-gray-600 mt-1">Here's an overview of your classes</p>
            </div>
            <div className="flex items-center space-x-4 relative">
              <div className="flex items-center">
                <button 
                  className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold hover:bg-blue-700 transition-colors duration-200"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  {facultyDetails?.first_name.charAt(0)}
                </button>
                <ChevronDown 
                  className={`h-4 w-4 ml-1 text-gray-600 transition-transform duration-200 ${showDropdown ? 'transform rotate-180' : ''}`}
                  onClick={() => setShowDropdown(!showDropdown)}
                />
              </div>
              {showDropdown && (
                <div className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="font-medium text-gray-800">{facultyDetails?.first_name} {facultyDetails?.last_name}</div>
                    <div className="text-sm text-gray-500">{facultyDetails?.username}</div>
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
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-purple-600">Total Students</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{students.length}</h3>
              <p className="text-gray-600">Enrolled Students</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-green-600">Upcoming</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{quizzes.length}</h3>
              <p className="text-gray-600">Total Quizzes</p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Quiz Management Section */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Quiz Management</h2>
                <button 
                  onClick={() => setShowCreateQuizModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create Quiz</span>
                </button>
              </div>
              <div className="space-y-4">
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{quiz.title}</h3>
                        <p className="text-sm text-gray-500">
                          {quiz.course_id} • {quiz.topic} • 
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                            ${quiz.difficulty === 'easy' ? 'bg-green-100 text-green-800' : 
                              quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'}`}>
                            {quiz.difficulty}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {quiz.completed_students}/{quiz.total_students} completed
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(quiz.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="h-2 w-24 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-blue-600 rounded-full" 
                          style={{ 
                            width: `${(quiz.completed_students / quiz.total_students) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
                {quizzes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No quizzes created yet. Click "Create Quiz" to get started.
                  </div>
                )}
              </div>
            </div>

            {/* Profile Section */}
            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Faculty Profile</h2>
                <div className="space-y-4">
                  {/* Full Name */}
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-medium text-gray-900">
                        {facultyDetails ? `${facultyDetails.first_name} ${facultyDetails.last_name}` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Faculty ID */}
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Faculty ID</p>
                      <p className="font-medium text-gray-900">{facultyDetails?.username || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Mail className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{facultyDetails?.email || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Branch */}
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Award className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Branch</p>
                      <p className="font-medium text-gray-900">{facultyDetails?.branch || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Award className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-medium text-gray-900">{facultyDetails?.status || 'Admin'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Performance Overview */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Student Performance</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Class Average</h3>
                      <p className="text-sm text-gray-600">Mathematics</p>
                    </div>
                    <span className="text-lg font-bold text-purple-600">78%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Highest Score</h3>
                      <p className="text-sm text-gray-600">Physics</p>
                    </div>
                    <span className="text-lg font-bold text-blue-600">95%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Student List Section */}
          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">All Students</h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentile</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {student.first_name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{student.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.average_score}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-blue-600">#{student.class_rank}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.percentile}th</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create Quiz Modal */}
          {showCreateQuizModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-6">Create New Quiz</h2>
                <form onSubmit={handleCreateQuiz}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        value={newQuiz.title}
                        onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Course ID</label>
                      <input
                        type="text"
                        value={newQuiz.course_id}
                        onChange={(e) => setNewQuiz({ ...newQuiz, course_id: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Topic</label>
                      <input
                        type="text"
                        value={newQuiz.topic}
                        onChange={(e) => setNewQuiz({ ...newQuiz, topic: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                      <select
                        value={newQuiz.difficulty}
                        onChange={(e) => setNewQuiz({ ...newQuiz, difficulty: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Questions per Student</label>
                      <input
                        type="number"
                        value={newQuiz.questions_per_student}
                        onChange={(e) => setNewQuiz({ ...newQuiz, questions_per_student: parseInt(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        min="1"
                        max="10"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Questions</label>
                      <div className="mt-1 space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={currentQuestion}
                            onChange={(e) => setCurrentQuestion(e.target.value)}
                            placeholder="Enter a question"
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddQuestion}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            Add
                          </button>
                        </div>
                        <div className="space-y-2">
                          {newQuiz.questions.map((question, index) => (
                            <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                              <span className="flex-1">{question}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveQuestion(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-gray-500">
                          Added {newQuiz.questions.length} questions. Need at least {newQuiz.questions_per_student}.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateQuizModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Create Quiz
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default FacultyDashboard;