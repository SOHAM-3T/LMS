import { useState, useEffect } from 'react';
import { getFacultyQuizzes } from '../api/quiz';
import { getStudentQuizPerformance } from '../api/performance';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface Quiz {
  id: number;
  title: string;
  course_id: string;
  topic: string;
}

interface StudentPerformance {
  student: string;
  student_name: string;
  student_roll_no: string;
  total_score: string;
  max_possible_score: string;
  rank: number;
  percentile: number;
}

const QuizPerformanceView = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<string>('');
  const [performances, setPerformances] = useState<StudentPerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Fetch quizzes on component mount
  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const quizData = await getFacultyQuizzes();
        setQuizzes(quizData);
      } catch (err: any) {
        setError(err.message || 'Failed to load quizzes');
      }
    };
    loadQuizzes();
  }, []);

  // Fetch performances when a quiz is selected
  useEffect(() => {
    const loadPerformances = async () => {
      if (!selectedQuiz) {
        setPerformances([]);
        return;
      }
      
      setLoading(true);
      try {
        const performanceData = await getStudentQuizPerformance(selectedQuiz);
        // Transform the API response to match our interface
        const transformedData = performanceData.map(p => ({
          student: p.student,
          student_name: p.student_name || 'Unknown Student',
          student_roll_no: p.student_roll_no || 'N/A',
          total_score: p.total_score,
          max_possible_score: p.max_possible_score,
          rank: typeof p.rank === 'string' ? parseInt(p.rank) : (p.rank || 0),
          percentile: typeof p.percentile === 'string' ? parseFloat(p.percentile) : (p.percentile || 0)
        }));
        setPerformances(transformedData);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load student performances');
        setPerformances([]);
      } finally {
        setLoading(false);
      }
    };

    loadPerformances();
  }, [selectedQuiz]);

  const selectedQuizData = quizzes.find(q => q.id.toString() === selectedQuiz);

  // Filter performances based on search term
  const filteredPerformances = performances
    .filter(performance => {
      const searchLower = searchTerm.toLowerCase();
      return (
        performance.student_name.toLowerCase().includes(searchLower) ||
        performance.student_roll_no.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => a.rank - b.rank); // Sort by rank in ascending order

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/faculty-dashboard')}
            className="p-2 rounded-full hover:bg-white transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quiz Performance</h1>
            {selectedQuizData && (
              <p className="text-gray-600">
                {selectedQuizData.title} • {selectedQuizData.course_id} • {selectedQuizData.topic}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-4">
            <select
              value={selectedQuiz}
              onChange={(e) => setSelectedQuiz(e.target.value)}
              className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select a Quiz</option>
              {quizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.title}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roll Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentile
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPerformances.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      {selectedQuiz 
                        ? searchTerm 
                          ? 'No students found matching your search'
                          : 'No performance data available'
                        : 'Please select a quiz to view performance'
                      }
                    </td>
                  </tr>
                ) : (
                  filteredPerformances.map((performance, index) => (
                    <tr key={performance.student} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-lg font-medium text-gray-600">
                                {performance.student_name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {performance.student_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {performance.student_roll_no}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {performance.total_score}/{performance.max_possible_score}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-blue-600">
                          #{performance.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {performance.percentile ? performance.percentile.toFixed(1) : '0.0'}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPerformanceView; 