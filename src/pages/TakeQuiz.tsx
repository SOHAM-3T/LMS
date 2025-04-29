import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { api } from '../api';
import { useSession } from '../SessionContext';
import './TakeQuiz.css';

interface Question {
  id: number;
  question_text: string;
  type: string;
  options?: string[];
  image?: string;
  assignment_id: number;
}

interface Quiz {
  id: number;
  title: string;
  questions: Question[];
}

const TakeQuiz: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<{ [assignmentId: number]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [current, setCurrent] = useState(0);
  const [success, setSuccess] = useState(false);
  const [review, setReview] = useState(false);
  const { sessionExpired } = useSession();

  useEffect(() => {
    if (sessionExpired) return;
    async function fetchQuiz() {
      setLoading(true);
      setError('');
      try {
        // Always fetch quiz metadata (title)
        const metaRes = await api.get(`/quiz/quiz/${quizId}/`);
        const title = metaRes.data.title || `Quiz ${quizId}`;
        // Fetch questions as before
        const response = await axios.get(`http://127.0.0.1:8000/quiz/student/quiz/${quizId}/questions/`);
        const data = response.data;
        console.log('Quiz questions response:', data); // Debug log
        if (Array.isArray(data)) {
          console.log('Question images:', data.map(q => q.image)); // Debug image URLs
          setQuiz({
            id: Number(quizId),
            title,
            questions: data,
          });
        } else if (data && Array.isArray(data.questions)) {
          setQuiz({ ...data, title });
        } else {
          setQuiz(null);
        }
      } catch (err: any) {
        console.error('Error fetching quiz:', err); // Debug error
        if (err?.message === 'SessionExpired') {
          setError('Your session has expired. Please log in again.');
          setLoading(false);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        setError('Failed to load quiz.');
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [quizId, sessionExpired]);

  // --- Enhanced answer state for multiple correct ---
  const handleChange = (assignmentId: number, value: string | string[], type?: string) => {
    setAnswers((prev) => {
      if (type === 'multiple_correct') {
        // value is an array
        return { ...prev, [assignmentId]: JSON.stringify(value) };
      }
      // Ensure value is always a string for single-answer questions
      if (typeof value !== 'string') {
        throw new Error('Expected value to be a string for single-answer questions');
      }
      return { ...prev, [assignmentId]: value };
    });
  };

  const handleCheckboxChange = (assignmentId: number, option: string) => {
    let selected = [];
    try {
      selected = JSON.parse(answers[assignmentId] || '[]');
    } catch {
      selected = [];
    }
    const idx = selected.indexOf(option);
    if (idx > -1) {
      selected.splice(idx, 1);
    } else {
      selected.push(option);
    }
    handleChange(assignmentId, selected, 'multiple_correct');
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    setSubmitting(true);
    setError('');
    try {
      await Promise.all(
        quiz.questions.map((q) => {
          let answer = answers[q.assignment_id] || '';
          if (q.type === 'multiple_correct') {
            // Ensure answer is an array string
            if (!answer) answer = '[]';
          } else if (q.type === 'true_false') {
            answer = answer === 'true' ? 'true' : 'false';
          }
          return api.post(`/quiz/student/assignment/${q.assignment_id}/submit/`, {
            answer,
          });
        })
      );
      setSuccess(true);
      setTimeout(() => navigate('/student-dashboard'), 2000);
    } catch (err: any) {
      setError('Failed to submit quiz. ' + (err.response?.data?.error || ''));
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (quiz && current === quiz.questions.length - 1) {
      setReview(true);
    } else {
      setCurrent((c) => Math.min(c + 1, (quiz?.questions.length ?? 1) - 1));
    }
  };

  const handlePrev = () => {
    if (review) {
      setReview(false);
      setCurrent(quiz ? quiz.questions.length - 1 : 0);
    } else {
      setCurrent((c) => Math.max(c - 1, 0));
    }
  };

  const handleEdit = (idx: number) => {
    setCurrent(idx);
    setReview(false);
  };

  // --- Question Navigation Panel ---
  const renderNavigationPanel = () => {
    if (!quiz) return null;
    return (
      <div className="quiz-navigation-panel">
        {quiz.questions.map((q, idx) => {
          const answered = answers[q.assignment_id] && answers[q.assignment_id] !== '';
          return (
            <button
              key={q.assignment_id}
              className={`quiz-nav-btn${current === idx ? ' active' : ''}${answered ? ' answered' : ''}`}
              onClick={() => setCurrent(idx)}
              type="button"
              aria-label={`Go to question ${idx + 1}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    );
  };

  if (sessionExpired || error === 'Your session has expired. Please log in again.') {
    return <div>Your session has expired. Please log in again.</div>;
  }

  if (loading) return <div className="quiz-loading">Loading quiz...</div>;
  if (error) return <div className="quiz-error">{error}</div>;
  if (!quiz) return <div className="quiz-error">Quiz not found.</div>;
  if (success) return <div className="quiz-success">Quiz submitted successfully! Redirecting...</div>;

  if (review) {
    return (
      <div className="take-quiz-container">
        {renderNavigationPanel()}
        <div className="quiz-header">
          <h2>{quiz.title} - Review Answers</h2>
          <div className="quiz-progress">Review your answers before submitting</div>
        </div>
        <div className="quiz-review-list">
          {quiz.questions.map((q, idx) => (
            <div className="quiz-review-item" key={q.assignment_id}>
              <div className="quiz-review-question">
                <strong>Q{idx + 1}:</strong> {q.question_text}
              </div>
              {q.image && (
                <div className="quiz-image-container">
                  <img 
                    src={q.image}
                    alt="Question" 
                    className="quiz-question-image"
                    style={{ maxWidth: '100%', height: 'auto', marginTop: '1rem', marginBottom: '1rem' }}
                    onError={(e) => {
                      console.error('Image failed to load:', q.image);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="quiz-review-answer">
                <span>Your Answer:</span> {answers[q.assignment_id] || <span style={{color:'#b91c1c'}}>No answer</span>}
              </div>
              <button className="quiz-btn quiz-btn-secondary quiz-review-edit" onClick={() => handleEdit(idx)}>Edit</button>
            </div>
          ))}
        </div>
        <div className="quiz-nav-buttons">
          <button type="button" onClick={handlePrev} className="quiz-btn quiz-btn-secondary">Back</button>
          <button type="button" onClick={handleSubmit} disabled={submitting} className="quiz-btn quiz-btn-primary">
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
      </div>
    );
  }

  const q = quiz.questions[current];
  return (
    <div className="take-quiz-container">
      {renderNavigationPanel()}
      <div className="quiz-header">
        <h2>{quiz.title}</h2>
        <div className="quiz-progress">
          Question {current + 1} of {quiz.questions.length}
        </div>
      </div>
      <form
        className="quiz-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleNext();
        }}
      >
        <div className="quiz-card">
          <div className="quiz-question-text">{q.question_text}</div>
          {q.image && (
            <div className="quiz-image-container">
              <img 
                src={q.image} 
                alt="Question" 
                className="quiz-question-image"
                style={{ maxWidth: '100%', height: 'auto', marginTop: '1rem', marginBottom: '1rem' }}
                onError={(e) => {
                  console.error('Image failed to load:', q.image);
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          {/* Render based on question type */}
          {q.type === 'mcq' && q.options ? (
            <div className="quiz-options">
              {q.options.map((opt, idx) => (
                <label key={idx} className="quiz-option">
                  <input
                    type="radio"
                    name={`q_${q.assignment_id}`}
                    value={opt}
                    checked={answers[q.assignment_id] === opt}
                    onChange={() => handleChange(q.assignment_id, opt)}
                    required
                  />
                  {opt}
                </label>
              ))}
            </div>
          ) : q.type === 'multiple_correct' && q.options ? (
            <div className="quiz-options">
              {q.options.map((opt, idx) => {
                let selected = [];
                try {
                  selected = JSON.parse(answers[q.assignment_id] || '[]');
                } catch {
                  selected = [];
                }
                return (
                  <label key={idx} className="quiz-option">
                    <input
                      type="checkbox"
                      name={`q_${q.assignment_id}`}
                      value={opt}
                      checked={selected.includes(opt)}
                      onChange={() => handleCheckboxChange(q.assignment_id, opt)}
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
          ) : q.type === 'true_false' ? (
            <div className="quiz-options">
              <label className="quiz-option">
                <input
                  type="radio"
                  name={`q_${q.assignment_id}`}
                  value="true"
                  checked={answers[q.assignment_id] === 'true'}
                  onChange={() => handleChange(q.assignment_id, 'true')}
                  required
                />
                True
              </label>
              <label className="quiz-option">
                <input
                  type="radio"
                  name={`q_${q.assignment_id}`}
                  value="false"
                  checked={answers[q.assignment_id] === 'false'}
                  onChange={() => handleChange(q.assignment_id, 'false')}
                  required
                />
                False
              </label>
            </div>
          ) : (
            <input
              type="text"
              name={`q_${q.assignment_id}`}
              value={answers[q.assignment_id] || ''}
              onChange={e => handleChange(q.assignment_id, e.target.value)}
              placeholder="Type your answer..."
              className="quiz-answer-input"
              required
            />
          )}
        </div>
        <div className="quiz-nav-buttons">
          <button type="button" onClick={handlePrev} disabled={current === 0} className="quiz-btn quiz-btn-secondary">
            Previous
          </button>
          <button type="submit" className="quiz-btn quiz-btn-primary">
            {current === quiz.questions.length - 1 ? 'Review Answers' : 'Next'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TakeQuiz;
