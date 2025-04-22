import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Calendar, Award, ChevronRight, User, Mail, LogOut, ChevronDown } from 'lucide-react';
import { getStudentDetails } from '../api';

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

const StudentDashboard = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is faculty and redirect if needed
    const checkUserType = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Try to get student details
        const data = await getStudentDetails();
        console.log('Student Details Response:', {
          data,
          roll_no: data.roll_no,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email
        });
        if (data.is_faculty) {
          // If user is faculty, redirect to faculty dashboard
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
      } catch (err: any) {
        console.error('Error fetching student details:', err);
        setError(err.message);
        if (err.message === 'Session expired. Please login again.' || err.message === 'No authentication token found') {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkUserType();
  }, [navigate]);

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
                <span className="text-sm font-medium text-purple-600">Today</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">2</h3>
              <p className="text-gray-600">Upcoming Exams</p>
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
            {/* Upcoming Exams */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Upcoming Exams</h2>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                  View All <ChevronDown className="h-4 w-4 ml-1" />
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Mathematics Final</h3>
                      <p className="text-sm text-gray-600">March 15, 2024 • 10:00 AM</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                    Start
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Physics Quiz</h3>
                      <p className="text-sm text-gray-600">March 20, 2024 • 2:00 PM</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200">
                    Start
                  </button>
                </div>
              </div>
            </div>

            {/* Profile and Performance Section */}
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
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600">Class Rank</span>
                      <span className="text-lg font-bold text-purple-600">#3</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600">Percentile</span>
                      <span className="text-lg font-bold text-blue-600">95th</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '95%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;