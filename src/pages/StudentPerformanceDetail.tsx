import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart2, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { getStudentPerformance } from '../api/performance';

interface QuizPerformance {
  quiz_id: number;
  quiz_title: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken: number;
  submitted_at: string;
  percentile: number;
  rank: number;
  topic: string;
  course_id: string;
}

interface StudentPerformance {
  student: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
  };
  quiz_performances: QuizPerformance[];
  average_score: number;
  total_quizzes: number;
  highest_score: number;
  lowest_score: number;
  percentile: number;
  rank: number;
}

const StudentPerformanceDetail = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [performance, setPerformance] = useState<StudentPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const data = await getStudentPerformance(studentId!);
        setPerformance(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPerformance();
  }, [studentId]);

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
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-semibold">Error loading performance data</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => navigate('/faculty-dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!performance) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/faculty-dashboard')}
                className="p-2 rounded-full hover:bg-white transition-colors"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {performance.student.first_name} {performance.student.last_name}
                </h1>
                <p className="text-gray-600">{performance.student.email}</p>
              </div>
            </div>
          </div>

          {/* Performance Overview */}
          <div className="grid md:grid-cols-6 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart2 className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-blue-600">Average Score</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{performance.average_score.toFixed(1)}</h3>
              <p className="text-gray-600">Across {performance.total_quizzes} quizzes</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-green-600">Highest Score</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{performance.highest_score.toFixed(1)}</h3>
              <p className="text-gray-600">Best Performance</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
                <span className="text-sm font-medium text-yellow-600">Lowest Score</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{performance.lowest_score.toFixed(1)}</h3>
              <p className="text-gray-600">Needs Improvement</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-purple-600">Total Quizzes</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{performance.total_quizzes}</h3>
              <p className="text-gray-600">Attempted</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Award className="h-6 w-6 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-indigo-600">Percentile</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{performance.percentile.toFixed(1)}%</h3>
              <p className="text-gray-600">Class Standing</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Award className="h-6 w-6 text-pink-600" />
                </div>
                <span className="text-sm font-medium text-pink-600">Rank</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">#{performance.rank}</h3>
              <p className="text-gray-600">In Class</p>
            </div>
          </div>

          {/* Quiz Performance Table */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quiz Performance History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentile</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {performance.quiz_performances.map((quiz) => (
                    <tr key={quiz.quiz_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{quiz.quiz_title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{quiz.course_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{quiz.topic}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{quiz.score.toFixed(1)}/{quiz.total_questions}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600">#{quiz.rank}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{quiz.percentile.toFixed(1)}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(quiz.submitted_at).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPerformanceDetail; 