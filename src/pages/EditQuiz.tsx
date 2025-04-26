import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getQuizById, updateQuiz } from '../api/quiz';
import type { QuestionData } from '../api/quiz';

interface Quiz {
  id: string;
  title: string;
  course_id: string;
  topic: string;
  difficulty: string;
  questions_per_student: number;
  questions: QuestionData[];
}

export default function EditQuiz() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<QuestionData>>({ text: '', type: 'short_answer', correct_answer: [] });
  const [optionInput, setOptionInput] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [mcqCorrect, setMcqCorrect] = useState<string[]>([]); 
  const [tfCorrect, setTfCorrect] = useState<string>('');      
  const [shortCorrect, setShortCorrect] = useState<string>(''); 
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuiz() {
      try {
        if (!quizId) return;
        const data = await getQuizById(quizId);
        setQuiz(data);
      } catch (err: any) {
        setError('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [quizId]);

  const handleAddQuestion = () => {
    if (quiz && currentQuestion.text?.trim()) {
      let correct_answer: string[] = [];
      if (currentQuestion.type === 'mcq') {
        correct_answer = mcqCorrect;
      } else if (currentQuestion.type === 'true_false') {
        correct_answer = tfCorrect ? [tfCorrect] : [];
      } else {
        correct_answer = shortCorrect.split(',').map(s => s.trim()).filter(Boolean);
      }
      let questionToAdd: QuestionData = {
        text: currentQuestion.text?.trim() || '',
        type: currentQuestion.type || 'short_answer',
        options: currentQuestion.type === 'mcq' ? options : undefined,
        correct_answer,
        image: currentQuestion.image || null,
      };
      setQuiz({ ...quiz, questions: [...quiz.questions, questionToAdd] });
      setCurrentQuestion({ text: '', type: 'short_answer', correct_answer: [] });
      setOptions([]);
      setMcqCorrect([]);
      setTfCorrect('');
      setShortCorrect('');
    }
  };
  const handleRemoveQuestion = (idx: number) => {
    if (quiz) {
      setQuiz({ ...quiz, questions: quiz.questions.filter((_, i) => i !== idx) });
    }
  };
  const handleChange = (field: keyof Quiz, value: any) => {
    if (quiz) {
      setQuiz({ ...quiz, [field]: value });
    }
  };
  const handleOptionAdd = () => {
    if (optionInput.trim()) {
      setOptions([...options, optionInput.trim()]);
      setOptionInput('');
    }
  };
  const handleOptionRemove = (idx: number) => {
    setOptions(options.filter((_, i) => i !== idx));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz) return;
    if (quiz.questions.length < quiz.questions_per_student) {
      setError(`Please add at least ${quiz.questions_per_student} questions`);
      return;
    }
    try {
      await updateQuiz(quiz.id, quiz);
      navigate('/faculty-dashboard');
    } catch (err: any) {
      setError('Failed to update quiz.');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  if (!quiz) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 mt-10 mb-10">
        <button className="text-gray-500 hover:text-gray-900 mb-6" onClick={() => navigate('/faculty-dashboard')}>
          ← Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold mb-8 text-center">Edit Quiz</h1>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label className="block text-base font-medium text-gray-700">Title</label>
              <input type="text" value={quiz.title} onChange={e => handleChange('title', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg p-2" required />
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700">Course ID</label>
              <input type="text" value={quiz.course_id} onChange={e => handleChange('course_id', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg p-2" required />
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700">Topic</label>
              <input type="text" value={quiz.topic} onChange={e => handleChange('topic', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg p-2" required />
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700">Difficulty</label>
              <select value={quiz.difficulty} onChange={e => handleChange('difficulty', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg p-2">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700">Questions per Student</label>
              <input type="number" value={quiz.questions_per_student} onChange={e => handleChange('questions_per_student', parseInt(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg p-2" min="1" max="10" required />
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700">Questions</label>
              <div className="mt-1 space-y-2">
                <div className="flex gap-2 mb-2">
                  <input type="text" value={currentQuestion.text || ''} onChange={e => setCurrentQuestion({ ...currentQuestion, text: e.target.value })} placeholder="Enter a question" className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg p-2" />
                  <select value={currentQuestion.type || 'short_answer'} onChange={e => {
                    setCurrentQuestion({ ...currentQuestion, type: e.target.value as QuestionData['type'] });
                    setOptions([]);
                    setMcqCorrect([]);
                    setTfCorrect('');
                    setShortCorrect('');
                  }} className="rounded-md border-gray-300 text-lg p-2">
                    <option value="short_answer">Short Answer</option>
                    <option value="mcq">MCQ</option>
                    <option value="true_false">True/False</option>
                  </select>
                  <button type="button" onClick={handleAddQuestion} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-lg">Add</button>
                </div>
                {currentQuestion.type === 'mcq' && (
                  <>
                    <div className="flex gap-2 mb-2">
                      <input type="text" value={optionInput} onChange={e => setOptionInput(e.target.value)} placeholder="Option text" className="flex-1 rounded-md border-gray-300 text-lg p-2" />
                      <button type="button" onClick={handleOptionAdd} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Add Option</button>
                    </div>
                    {options.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {options.map((opt, idx) => (
                          <label key={idx} className="flex items-center gap-1 bg-gray-200 px-2 py-1 rounded">
                            <input
                              type="checkbox"
                              checked={mcqCorrect.includes(opt)}
                              onChange={e => {
                                if (e.target.checked) setMcqCorrect([...mcqCorrect, opt]);
                                else setMcqCorrect(mcqCorrect.filter(o => o !== opt));
                              }}
                            />
                            {opt}
                            <button type="button" onClick={() => handleOptionRemove(idx)} className="ml-1 text-red-600">x</button>
                          </label>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {currentQuestion.type === 'true_false' && (
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="tf-correct"
                        value="True"
                        checked={tfCorrect === 'True'}
                        onChange={() => setTfCorrect('True')}
                      />
                      True
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="tf-correct"
                        value="False"
                        checked={tfCorrect === 'False'}
                        onChange={() => setTfCorrect('False')}
                      />
                      False
                    </label>
                  </div>
                )}
                {currentQuestion.type === 'short_answer' && (
                  <div className="mb-2">
                    <input
                      type="text"
                      value={shortCorrect}
                      onChange={e => setShortCorrect(e.target.value)}
                      placeholder="Enter correct answer(s), comma separated"
                      className="flex-1 rounded-md border-gray-300 text-lg p-2"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  {quiz.questions.map((question, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                      <span className="flex-1">
                        {question.text} <span className="text-xs text-gray-400">({question.type})</span>
                        {question.type === 'mcq' && question.options && (
                          <span className="ml-2 text-xs text-gray-500">Options: {question.options.join(', ')}</span>
                        )}
                      </span>
                      <button type="button" onClick={() => handleRemoveQuestion(index)} className="text-red-600 hover:text-red-700">Remove</button>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500">Added {quiz.questions.length} questions. Need at least {quiz.questions_per_student}.</p>
              </div>
            </div>
          </div>
          <div className="mt-10 flex justify-end space-x-6">
            <button type="button" onClick={() => navigate('/faculty-dashboard')} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-lg">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-lg" disabled={quiz.questions.length < quiz.questions_per_student}>Save Changes</button>
          </div>
        </form>
        {error && <div className="text-red-600 mt-8 text-center text-lg">{error}</div>}
      </div>
    </div>
  );
}
