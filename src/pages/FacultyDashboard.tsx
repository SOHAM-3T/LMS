import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Clock, User, Mail, Award, Search, LogOut, ChevronDown, Plus, Pencil } from 'lucide-react';
import { getFacultyDetails, getAllStudents } from '../api';
import { getFacultyQuizzes, deleteQuiz, Quiz } from '../api/quiz';

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
}

const FacultyDashboard = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const [facultyDetails, setFacultyDetails] = useState<FacultyDetails | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [quizSearchTerm, setQuizSearchTerm] = useState('');

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

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.title.toLowerCase().includes(quizSearchTerm.toLowerCase()) ||
    quiz.course_id.toLowerCase().includes(quizSearchTerm.toLowerCase()) ||
    quiz.topic.toLowerCase().includes(quizSearchTerm.toLowerCase()) ||
    quiz.difficulty.toLowerCase().includes(quizSearchTerm.toLowerCase())
  );

  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) return;
    try {
      await deleteQuiz(quizId);
      setQuizzes((prev) => prev.filter((q) => q.id !== parseInt(quizId)));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete quiz.');
    }
  };

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
                  onClick={() => navigate('/create-quiz')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create Quiz</span>
                </button>
              </div>
              <div className="mb-4 flex items-center gap-2">
                <div className="relative w-full max-w-xs">
                  <input
                    type="text"
                    placeholder="Search quizzes (title, course, topic, difficulty)"
                    value={quizSearchTerm}
                    onChange={e => setQuizSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-4">
                {filteredQuizzes.map((quiz) => (
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
                      <button 
                        className="p-2 rounded-full hover:bg-blue-200 transition-colors"
                        title="Edit Quiz"
                        onClick={() => navigate(`/edit-quiz/${quiz.id}`)}
                      >
                        <Pencil className="h-5 w-5 text-blue-600" />
                      </button>
                      <button
                        className="p-2 rounded-full hover:bg-red-200 transition-colors"
                        title="Delete Quiz"
                        onClick={() => handleDeleteQuiz(quiz.id.toString())}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-red-600">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {filteredQuizzes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No quizzes found.
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
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => navigate('/faculty/quiz-performance')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                >
                  <Award className="h-5 w-5" />
                  <span>View Performance</span>
                </button>
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
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    students
                      .filter(student => 
                        student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        student.email.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map(student => (
                        <tr 
                          key={student.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => navigate(`/faculty/student/${student.id}/performance`)}
                        >
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
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FacultyDashboard;