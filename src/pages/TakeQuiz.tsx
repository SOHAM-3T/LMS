import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useSession } from '../SessionContext';
import { ArrowLeft, ArrowRight, Check, Clock } from 'lucide-react';
import './TakeQuiz.css';

interface Question {
  id: number;
  question_text: string;
  type: string;
  options?: string[];
  image?: string;
  assignment_id: number;
  max_score: number;
  score?: number;
}

interface Quiz {
  id: number;
  title: string;
  questions: Question[];
  total_score?: number;
  rank?: number;
  percentile?: number;
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
  const { sessionExpired } = useSession();

  useEffect(() => {
    if (sessionExpired) return;
    async function fetchQuiz() {
      setLoading(true);
      setError('');
      try {
        const metaRes = await api.get(`/quiz/quiz/${quizId}/`);
        const title = metaRes.data.title || `Quiz ${quizId}`;
        const questionsRes = await api.get(`/quiz/student/quiz/${quizId}/questions/`);
        setQuiz({
          id: Number(quizId),
          title,
          questions: questionsRes.data,
        });
      } catch (err) {
        setError('Failed to load quiz. Please try again.');
        console.error('Error fetching quiz:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [quizId, sessionExpired]);

  const handleChange = (assignmentId: number, value: string | string[], type?: string) => {
    setAnswers(prev => ({
      ...prev,
      [assignmentId]: Array.isArray(value) ? value.join(',') : value as string
    }));
  };

  // FIX: Use 'mcq' for multi-select, not 'checkbox'
  const handleCheckboxChange = (assignmentId: number, option: string) => {
    const currentAnswer = answers[assignmentId]
      ? answers[assignmentId].split(',').filter(Boolean)
      : [];
    const newAnswer = currentAnswer.includes(option)
      ? currentAnswer.filter(a => a !== option)
      : [...currentAnswer, option];
    handleChange(assignmentId, newAnswer, 'mcq');
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    setSubmitting(true);
    try {
      const submissionPromises = quiz.questions.map(question => {
        if (answers[question.assignment_id]) {
          return api.post(`/quiz/student/assignment/${question.assignment_id}/submit/`, {
            answer: answers[question.assignment_id]
          });
        }
        return Promise.resolve();
      });

      await Promise.all(submissionPromises);
      setSuccess(true);
      setTimeout(() => {
        navigate('/student-dashboard');
      }, 2000);
    } catch (err) {
      setError('Failed to submit answers. Please try again.');
      console.error('Error submitting answers:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (quiz && current < quiz.questions.length - 1) {
      setCurrent(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (current > 0) {
      setCurrent(prev => prev - 1);
    }
  };

  const handleEdit = (idx: number) => {
    setCurrent(idx);
  };

  const renderNavigationPanel = () => {
    if (!quiz) return null;
    return (
      <div className="question-navigation">
        {quiz.questions.map((_, idx) => (
          <button
            key={idx}
            className={`question-nav-btn ${current === idx ? 'current' : ''} ${
              answers[quiz.questions[idx].assignment_id] ? 'answered' : ''
            }`}
            onClick={() => handleEdit(idx)}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    );
  };

  const PerformanceMetrics: React.FC<{ quiz: Quiz }> = ({ quiz }) => {
    if (!quiz.total_score && !quiz.rank && !quiz.percentile) return null;
    return (
      <div className="performance-metrics">
        {quiz.total_score !== undefined && (
          <div className="metric-card">
            <h4>Score</h4>
            <p>{quiz.total_score}</p>
          </div>
        )}
        {quiz.rank !== undefined && (
          <div className="metric-card">
            <h4>Rank</h4>
            <p>#{quiz.rank}</p>
          </div>
        )}
        {quiz.percentile !== undefined && (
          <div className="metric-card">
            <h4>Percentile</h4>
            <p>{quiz.percentile}%</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="take-quiz-container">
        <div className="quiz-loading">
          <div className="loading-spinner" />
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="take-quiz-container">
        <div className="quiz-error">
          <p>{error}</p>
          <button className="quiz-btn quiz-btn-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="take-quiz-container">
        <div className="quiz-success">
          <Check size={48} />
          <h2>Quiz Submitted Successfully!</h2>
          <p>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  const currentQuestion = quiz.questions[current];
  const progress = ((current + 1) / quiz.questions.length) * 100;

  return (
    <div className="take-quiz-container">
      <div className="quiz-header">
        <h2>{quiz.title}</h2>
        <div className="quiz-progress">
          <Clock size={20} />
          <span>Question {current + 1} of {quiz.questions.length}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {renderNavigationPanel()}

      <div className="quiz-card">
        <div className="quiz-question-text">{currentQuestion.question_text}</div>
        
        {currentQuestion.image && (
          <div className="quiz-image-container">
            <img
              src={currentQuestion.image}
              alt="Question illustration"
              className="quiz-question-image"
            />
          </div>
        )}

        {/* Single choice */}
        {currentQuestion.type === 'multiple_choice' && (
          <div className="quiz-options">
            {currentQuestion.options?.map((option, idx) => (
              <button
                key={idx}
                className={`quiz-option ${
                  answers[currentQuestion.assignment_id] === option ? 'selected' : ''
                }`}
                onClick={() => handleChange(currentQuestion.assignment_id, option)}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {/* Multiple correct answers (API sends type: 'mcq') */}
        {currentQuestion.type === 'mcq' && (
          <div className="quiz-options">
            {currentQuestion.options?.map((option, idx) => (
              <button
                key={idx}
                className={`quiz-option ${
                  answers[currentQuestion.assignment_id]?.split(',').includes(option) ? 'selected' : ''
                }`}
                onClick={() => handleCheckboxChange(currentQuestion.assignment_id, option)}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {/* Text/Short Answer */}
        {(currentQuestion.type === 'text' || currentQuestion.type === 'short_answer') && (
          <textarea
            className="quiz-answer-input"
            value={answers[currentQuestion.assignment_id] || ''}
            onChange={(e) => handleChange(currentQuestion.assignment_id, e.target.value)}
            placeholder="Type your answer here..."
          />
        )}
      </div>

      <div className="quiz-nav-buttons">
        <button
          className="quiz-btn quiz-btn-secondary"
          onClick={handlePrev}
          disabled={current === 0}
        >
          <ArrowLeft size={20} />
          Previous
        </button>
        {current === quiz.questions.length - 1 ? (
          <button
            className="quiz-btn quiz-btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        ) : (
          <button
            className="quiz-btn quiz-btn-primary"
            onClick={handleNext}
          >
            Next
            <ArrowRight size={20} />
          </button>
        )}
      </div>

      <PerformanceMetrics quiz={quiz} />
    </div>
  );
};

export default TakeQuiz;
