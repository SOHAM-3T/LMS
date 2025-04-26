import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQuiz as apiCreateQuiz } from '../api/quiz';

interface Quiz {
  title: string;
  course_id: string;
  topic: string;
  difficulty: string;
  questions_per_student: number;
  questions: string[];
}

export default function CreateQuiz() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'details' | 'review' | 'confirm'>('details');
  const [quiz, setQuiz] = useState<Quiz>({
    title: '',
    course_id: '',
    topic: '',
    difficulty: 'medium',
    questions_per_student: 3,
    questions: []
  });
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddQuestion = () => {
    if (currentQuestion.trim()) {
      setQuiz({ ...quiz, questions: [...quiz.questions, currentQuestion.trim()] });
      setCurrentQuestion('');
    }
  };
  const handleRemoveQuestion = (idx: number) => {
    setQuiz({ ...quiz, questions: quiz.questions.filter((_, i) => i !== idx) });
  };
  const handleSubmit = async () => {
    if (quiz.questions.length < quiz.questions_per_student) {
      setError(`Please add at least ${quiz.questions_per_student} questions`);
      setStep('details');
      return;
    }
    try {
      await apiCreateQuiz(quiz); // Use the API utility for quiz creation
      navigate('/faculty-dashboard');
    } catch (err: any) {
      setError('Failed to create quiz.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 mt-10 mb-10">
        <button
          className="text-gray-500 hover:text-gray-900 mb-6"
          onClick={() => navigate('/faculty-dashboard')}
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold mb-8 text-center">Create New Quiz</h1>
        {step === 'details' && (
          <form
            onSubmit={e => {
              e.preventDefault();
              setStep('review');
            }}
          >
            <div className="space-y-6">
              <div>
                <label className="block text-base font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={quiz.title}
                  onChange={e => setQuiz({ ...quiz, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700">Course ID</label>
                <input
                  type="text"
                  value={quiz.course_id}
                  onChange={e => setQuiz({ ...quiz, course_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700">Topic</label>
                <input
                  type="text"
                  value={quiz.topic}
                  onChange={e => setQuiz({ ...quiz, topic: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700">Difficulty</label>
                <select
                  value={quiz.difficulty}
                  onChange={e => setQuiz({ ...quiz, difficulty: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg p-2"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700">Questions per Student</label>
                <input
                  type="number"
                  value={quiz.questions_per_student}
                  onChange={e => setQuiz({ ...quiz, questions_per_student: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg p-2"
                  min="1"
                  max="10"
                  required
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700">Questions</label>
                <div className="mt-1 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentQuestion}
                      onChange={e => setCurrentQuestion(e.target.value)}
                      placeholder="Enter a question"
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg p-2"
                    />
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-lg"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {quiz.questions.map((question, index) => (
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
                    Added {quiz.questions.length} questions. Need at least {quiz.questions_per_student}.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-10 flex justify-end space-x-6">
              <button
                type="button"
                onClick={() => navigate('/faculty-dashboard')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-lg"
                disabled={quiz.questions.length < quiz.questions_per_student}
              >
                Next
              </button>
            </div>
          </form>
        )}
        {step === 'review' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-center">Review Quiz Details</h3>
            <div className="border rounded p-6 bg-gray-50 text-lg">
              <p><strong>Title:</strong> {quiz.title}</p>
              <p><strong>Course ID:</strong> {quiz.course_id}</p>
              <p><strong>Topic:</strong> {quiz.topic}</p>
              <p><strong>Difficulty:</strong> {quiz.difficulty}</p>
              <p><strong>Questions per Student:</strong> {quiz.questions_per_student}</p>
            </div>
            <h4 className="font-semibold mt-4">Questions</h4>
            <ul className="list-decimal ml-8 text-lg">
              {quiz.questions.map((q, idx) => (
                <li key={idx} className="mb-2">{q}</li>
              ))}
            </ul>
            <div className="flex justify-between mt-8">
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-lg"
                onClick={() => setStep('details')}
              >
                Edit
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-lg"
                onClick={() => setStep('confirm')}
              >
                Confirm
              </button>
            </div>
          </div>
        )}
        {step === 'confirm' && (
          <div className="space-y-10 text-center">
            <h3 className="text-2xl font-semibold">Ready to create this quiz?</h3>
            <p className="text-gray-700 text-lg">Please confirm. You can review or edit before submitting.</p>
            <div className="flex justify-center space-x-8 mt-8">
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-lg"
                onClick={() => setStep('review')}
              >
                Back to Review
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-lg"
                onClick={handleSubmit}
              >
                Create Quiz
              </button>
            </div>
          </div>
        )}
        {error && <div className="text-red-600 mt-8 text-center text-lg">{error}</div>}
      </div>
    </div>
  );
}
