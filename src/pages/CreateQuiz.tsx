import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQuiz as apiCreateQuiz, QuestionData } from '../api/quiz';

interface Quiz {
  title: string;
  course_id: string;
  topic: string;
  difficulty: string;
  questions_per_student: number;
  questions: QuestionData[];
}

const steps = [
  'Quiz Details',
  'Add Questions',
  'Review',
  'Confirm'
];

export default function CreateQuiz() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0: Details, 1: Questions, 2: Review, 3: Confirm
  const [quiz, setQuiz] = useState<Quiz>({
    title: '',
    course_id: '',
    topic: '',
    difficulty: 'medium',
    questions_per_student: 3,
    questions: []
  });
  const [currentQuestion, setCurrentQuestion] = useState<Partial<QuestionData>>({ text: '', type: 'short_answer' });
  const [optionInput, setOptionInput] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Progress sidebar
  const ProgressSidebar = () => (
    <div className="w-1/4 min-w-[180px] pr-6 hidden md:block">
      <ul className="space-y-0 mt-8 flex flex-col items-center">
        {steps.map((s, idx) => (
          <li key={s} className="flex flex-col items-center">
            <div className="flex items-center">
              <span className={`w-8 h-8 flex items-center justify-center rounded-full border-2 text-lg font-semibold ${step === idx ? 'border-blue-600 bg-blue-100 text-blue-600' : 'border-gray-300 bg-white text-gray-500'} ${step > idx ? 'opacity-60' : ''}`}>{idx + 1}</span>
              <span className={`ml-3 ${step === idx ? 'font-bold text-blue-600' : 'text-gray-500'} ${step > idx ? 'opacity-60' : ''}`}>{s}</span>
            </div>
            {idx < steps.length - 1 && (
              <span className="my-2 text-gray-400 text-2xl" aria-hidden="true">↓</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  // Add or edit a question
  const handleAddOrEditQuestion = () => {
    if (!currentQuestion.text?.trim()) return setError('Question text is required');
    if (currentQuestion.type === 'mcq' && options.length < 2) return setError('MCQ must have at least 2 options');
    let correctAnswerArr: string[] = [];
    if (currentQuestion.type === 'mcq') {
      correctAnswerArr = Array.isArray(currentQuestion.correct_answer) ? currentQuestion.correct_answer : [];
    } else if (currentQuestion.type === 'true_false') {
      correctAnswerArr = Array.isArray(currentQuestion.correct_answer) ? currentQuestion.correct_answer : [];
    } else if (currentQuestion.type === 'short_answer') {
      correctAnswerArr = Array.isArray(currentQuestion.correct_answer) ? [currentQuestion.correct_answer[0] || ''] : [(currentQuestion.correct_answer as any) || ''];
    }
    let questionToAdd: QuestionData = {
      text: currentQuestion.text.trim() || '',
      type: currentQuestion.type || 'short_answer',
      options: currentQuestion.type === 'mcq' ? options : undefined,
      correct_answer: correctAnswerArr,
      image: currentQuestion.image || null,
    };
    if (editingIdx !== null) {
      const newQuestions = [...quiz.questions];
      newQuestions[editingIdx] = questionToAdd;
      setQuiz({ ...quiz, questions: newQuestions });
      setEditingIdx(null);
    } else {
      setQuiz({ ...quiz, questions: [...quiz.questions, questionToAdd] });
    }
    setCurrentQuestion({ text: '', type: 'short_answer' });
    setOptions([]);
    setError(null);
  };

  // Edit a question
  const handleEditQuestion = (idx: number) => {
    const q = quiz.questions[idx];
    setCurrentQuestion({ ...q });
    setOptions(q.options || []);
    setEditingIdx(idx);
    setStep(1);
  };

  // Remove a question
  const handleRemoveQuestion = (idx: number) => {
    setQuiz({ ...quiz, questions: quiz.questions.filter((_, i) => i !== idx) });
    setError(null);
  };

  // File/image handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCurrentQuestion({ ...currentQuestion, image: e.target.files[0] });
    }
  };

  // Step navigation
  const nextStep = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  // Submit
  const handleSubmit = async () => {
    if (quiz.questions.length < quiz.questions_per_student) {
      setError(`Please add at least ${quiz.questions_per_student} questions`);
      setStep(1);
      return;
    }
    setLoading(true);
    try {
      await apiCreateQuiz(quiz);
      setLoading(false);
      setStep(3);
    } catch (err: any) {
      let message = 'Failed to create quiz.';
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') {
          message = err.response.data;
        } else if (err.response.data.detail) {
          message = err.response.data.detail;
        } else if (typeof err.response.data === 'object') {
          message = Object.entries(err.response.data)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
            .join(' | ');
        }
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      setLoading(false);
    }
  };

  // Main content for each step
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <form
            onSubmit={e => {
              e.preventDefault();
              nextStep();
            }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold mb-4">Quiz Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-medium">Title</label>
                <input type="text" value={quiz.title} onChange={e => setQuiz({ ...quiz, title: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="block font-medium">Course ID</label>
                <input type="text" value={quiz.course_id} onChange={e => setQuiz({ ...quiz, course_id: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="block font-medium">Topic</label>
                <input type="text" value={quiz.topic} onChange={e => setQuiz({ ...quiz, topic: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="block font-medium">Difficulty</label>
                <select value={quiz.difficulty} onChange={e => setQuiz({ ...quiz, difficulty: e.target.value })} className="input">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block font-medium">Questions per Student</label>
                <input type="number" min={1} value={quiz.questions_per_student} onChange={e => setQuiz({ ...quiz, questions_per_student: Number(e.target.value) })} className="input" required />
              </div>
            </div>
            <div className="flex justify-end mt-8">
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-lg">Next</button>
            </div>
          </form>
        );
      case 1:
        const questionsLeft = quiz.questions_per_student - quiz.questions.length;
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Add Questions</h2>
            {questionsLeft > 0 ? (
              <div className="mb-4 text-blue-700 bg-blue-100 px-4 py-2 rounded text-lg font-medium">
                You need to add {questionsLeft} more question{questionsLeft > 1 ? 's' : ''} to reach the required total of {quiz.questions_per_student}.
              </div>
            ) : (
              <div className="mb-4 text-green-700 bg-green-100 px-4 py-2 rounded text-lg font-medium">
                You have added enough questions! You can add more or proceed to the next step.
              </div>
            )}
            <div className="mb-6">
              <label className="block font-medium">Question Text</label>
              <input type="text" value={currentQuestion.text || ''} onChange={e => setCurrentQuestion({ ...currentQuestion, text: e.target.value })} className="input" required />
            </div>
            <div className="mb-6">
              <label className="block font-medium">Type</label>
              <select value={currentQuestion.type} onChange={e => setCurrentQuestion({ ...currentQuestion, type: e.target.value as any })} className="input">
                <option value="mcq">Multiple Choice</option>
                <option value="short_answer">Short Answer</option>
                <option value="true_false">True/False</option>
              </select>
            </div>
            {currentQuestion.type === 'mcq' && (
              <div className="mb-6">
                <label className="block font-medium">Options</label>
                <div className="flex items-center gap-2 mb-2">
                  <input type="text" value={optionInput} onChange={e => setOptionInput(e.target.value)} className="input flex-1" />
                  <button type="button" onClick={() => {
                    if (optionInput.trim()) {
                      setOptions([...options, optionInput.trim()]);
                      setOptionInput('');
                    }
                  }} className="px-3 py-1 bg-blue-500 text-white rounded">Add</button>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {options.map((opt, idx) => (
                    <li key={idx} className="bg-gray-200 px-3 py-1 rounded flex items-center gap-1">
                      {opt}
                      <button type="button" onClick={() => setOptions(options.filter((_, i) => i !== idx))} className="text-red-600 ml-1">&times;</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {currentQuestion.type === 'mcq' && (
              <div className="flex flex-col gap-1">
                {options.map((opt, idx) => (
                  <label key={idx} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Array.isArray(currentQuestion.correct_answer) && currentQuestion.correct_answer.includes(opt)}
                      onChange={() => {
                        let updated = Array.isArray(currentQuestion.correct_answer) ? [...currentQuestion.correct_answer] : [];
                        if (updated.includes(opt)) {
                          updated = updated.filter(o => o !== opt);
                        } else {
                          updated.push(opt);
                        }
                        setCurrentQuestion({ ...currentQuestion, correct_answer: updated });
                      }}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
            {currentQuestion.type === 'true_false' && (
              <div className="flex gap-4">
                {['True', 'False'].map(val => (
                  <label key={val} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="true_false_answer"
                      checked={Array.isArray(currentQuestion.correct_answer) && currentQuestion.correct_answer[0] === val}
                      onChange={() => setCurrentQuestion({ ...currentQuestion, correct_answer: [val] })}
                    />
                    {val}
                  </label>
                ))}
              </div>
            )}
            {currentQuestion.type === 'short_answer' && (
              <input
                type="text"
                value={Array.isArray(currentQuestion.correct_answer) ? currentQuestion.correct_answer[0] || '' : (currentQuestion.correct_answer || '')}
                onChange={e => setCurrentQuestion({ ...currentQuestion, correct_answer: [e.target.value] })}
                className="input"
              />
            )}
            <div className="mb-6">
              <label className="block font-medium">Image (optional)</label>
              <input type="file" accept="image/*" onChange={handleFileChange} className="input" />
              {currentQuestion.image && (
                <div className="mt-2">
                  <span className="text-sm text-gray-600">Selected: {(currentQuestion.image as File).name}</span>
                </div>
              )}
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-lg" onClick={handleAddOrEditQuestion}>
                {editingIdx !== null ? 'Update Question' : 'Add Question'}
              </button>
              <button type="button" className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-lg" onClick={prevStep}>
                Back
              </button>
              <button type="button" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-lg" onClick={nextStep} disabled={quiz.questions.length < quiz.questions_per_student}>
                Next
              </button>
            </div>
            <div className="mt-10">
              <h3 className="text-xl font-semibold mb-4">Current Questions</h3>
              <div className="space-y-4">
                {quiz.questions.map((q, idx) => (
                  <div key={idx} className="bg-gray-50 border rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-semibold">{q.text}</div>
                      <div className="text-sm text-gray-600">Type: {q.type}</div>
                      {q.options && <div className="text-sm">Options: {q.options.join(', ')}</div>}
                      {q.correct_answer && <div className="text-sm">Correct: {q.correct_answer.join(', ')}</div>}
                      {q.image && <div className="text-sm">Image: {(q.image as File).name}</div>}
                    </div>
                    <div className="flex gap-2 mt-2 md:mt-0">
                      <button className="text-blue-600" onClick={() => handleEditQuestion(idx)}>Edit</button>
                      <button className="text-red-600" onClick={() => handleRemoveQuestion(idx)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Review Quiz</h2>
            <div className="border rounded p-6 bg-gray-50 text-lg mb-6">
              <p><strong>Title:</strong> {quiz.title}</p>
              <p><strong>Course ID:</strong> {quiz.course_id}</p>
              <p><strong>Topic:</strong> {quiz.topic}</p>
              <p><strong>Difficulty:</strong> {quiz.difficulty}</p>
              <p><strong>Questions per Student:</strong> {quiz.questions_per_student}</p>
            </div>
            <h4 className="font-semibold mt-4 mb-2">Questions</h4>
            <ul className="space-y-4">
              {quiz.questions.map((q, idx) => (
                <li key={idx} className="bg-white shadow rounded p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Q{idx + 1}:</span>
                    <button className="text-blue-600" onClick={() => handleEditQuestion(idx)}>Edit</button>
                  </div>
                  <div className="ml-4">
                    <div><strong>Text:</strong> {q.text}</div>
                    <div><strong>Type:</strong> {q.type}</div>
                    {q.options && <div><strong>Options:</strong> {q.options.join(', ')}</div>}
                    {q.correct_answer && <div><strong>Correct Answer:</strong> {q.correct_answer.join(', ')}</div>}
                    {q.image && <div><strong>Image:</strong> {(q.image as File).name}</div>}
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-between mt-8">
              <button type="button" className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-lg" onClick={prevStep}>Back</button>
              <button type="button" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-lg" onClick={handleSubmit}>Submit</button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-10 text-center">
            <h3 className="text-2xl font-semibold">Quiz Created Successfully!</h3>
            <p className="text-gray-700 text-lg">Your quiz has been created. You can now assign it to students or view it in your dashboard.</p>
            <button
              type="button"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-lg"
              onClick={() => navigate('/faculty-dashboard')}
            >
              Go to Dashboard
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Back to Dashboard button OUTSIDE the modal */}
      <button
        type="button"
        className="absolute left-8 top-8 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors z-50"
        onClick={() => navigate('/faculty-dashboard')}
      >
        ← Back to Dashboard
      </button>
      <div className="flex flex-col md:flex-row w-full max-w-5xl items-center justify-center">
        {/* <NavBar /> Removed as per user request */}
        <ProgressSidebar />
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 my-10 mx-auto flex flex-col justify-center items-center">
          {loading && <div className="text-blue-600 mb-4 text-center text-lg">Creating quiz...</div>}
          <div className="w-full flex flex-col items-center">
            {renderStep()}
            {error && <div className="text-red-600 mt-8 text-center text-lg">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Add a utility class for input styling
if (!document.getElementById('quiz-input-style')) {
  const style = document.createElement('style');
  style.id = 'quiz-input-style';
  style.innerHTML = `.input{border-radius:0.375rem;border:1px solid #d1d5db;padding:0.5rem 0.75rem;width:100%;font-size:1.125rem;line-height:1.75rem;transition:border-color 0.2s;}:focus{outline:none;border-color:#3b82f6;box-shadow:0 0 0 1px #3b82f6;}`;
  document.head.appendChild(style);
}
