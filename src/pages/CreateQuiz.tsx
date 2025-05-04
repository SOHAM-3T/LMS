import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQuiz as apiCreateQuiz, QuestionData } from '../api/quiz';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TextField, Button, Box, Typography, Paper, Stepper, Step, StepLabel, FormControl, InputLabel, Select, MenuItem, Grid, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import './CreateQuiz.css';
import { SelectChangeEvent } from '@mui/material';

interface Quiz {
  title: string;
  course_id: string;
  topic: string;
  difficulty: string;
  questions_per_student: number;
  questions: QuestionData[];
  scheduled_start_time: Date | null;
  scheduled_end_time: Date | null;
  time_limit_minutes: number;
  is_scheduled: boolean;
}

interface QuestionFormData {
  text: string;
  type: 'mcq' | 'short_answer' | 'true_false';
  max_score: number;
  correct_answer: string[];
  options?: string[];
  image?: File | null;
}

const steps = [
  'Quiz Details',
  'Schedule',
  'Add Questions',
  'Review',
  'Confirm'
];

const CreateQuiz: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [quiz, setQuiz] = useState<Quiz>({
    title: '',
    course_id: '',
    topic: '',
    difficulty: 'medium',
    questions_per_student: 3,
    questions: [],
    scheduled_start_time: null,
    scheduled_end_time: null,
    time_limit_minutes: 30,
    is_scheduled: false
  });
  const [currentQuestion, setCurrentQuestion] = useState<QuestionFormData>({
    text: '',
    type: 'short_answer',
    max_score: 1.0,
    correct_answer: []
  });
  const [optionInput, setOptionInput] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Progress sidebar
  const ProgressSidebar = () => (
    <Paper elevation={3} className="progress-sidebar">
      <Stepper activeStep={step} orientation="vertical">
        {steps.map((label, index) => (
          <Step key={label} completed={step > index}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Paper>
  );

  // Add or edit a question
  const handleAddOrEditQuestion = () => {
    if (!currentQuestion.text?.trim()) return setError('Question text is required');
    if (currentQuestion.type === 'mcq' && options.length < 2) return setError('MCQ must have at least 2 options');
    if (!currentQuestion.max_score || currentQuestion.max_score <= 0) return setError('Score must be a positive number');
    
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
      max_score: currentQuestion.max_score || 1.0,
    };

    if (editingIdx !== null) {
      const newQuestions = [...quiz.questions];
      newQuestions[editingIdx] = questionToAdd;
      setQuiz({ ...quiz, questions: newQuestions });
      setEditingIdx(null);
    } else {
      setQuiz({ ...quiz, questions: [...quiz.questions, questionToAdd] });
    }
    setCurrentQuestion({ text: '', type: 'short_answer', max_score: 1.0, correct_answer: [] });
    setOptions([]);
    setError(null);
  };

  // Edit a question
  const handleEditQuestion = (idx: number) => {
    const q = quiz.questions[idx];
    const questionData: QuestionFormData = {
      text: q.text,
      type: q.type as 'mcq' | 'short_answer' | 'true_false',
      max_score: typeof q.max_score === 'number' ? q.max_score : 1.0,
      correct_answer: Array.isArray(q.correct_answer) ? q.correct_answer : [],
      options: Array.isArray(q.options) ? q.options : [],
      image: q.image || null
    };
    setCurrentQuestion(questionData);
    setOptions(Array.isArray(q.options) ? q.options : []);
    setEditingIdx(idx);
    setStep(2);
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

  // Update event handlers with proper types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setQuiz(prev => ({
      ...prev,
      [name]: name === 'questions_per_student' ? parseInt(value) || 0 : value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setQuiz(prev => ({ ...prev, [name as string]: value }));
  };

  const handleDateTimeChange = (field: 'scheduled_start_time' | 'scheduled_end_time') => 
    (newValue: Date | null) => {
      setQuiz(prev => ({ ...prev, [field]: newValue }));
    };

  const handleQuestionInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'max_score') {
      setCurrentQuestion(prev => ({ ...prev, [name]: parseFloat(value) || 1.0 }));
    } else {
      setCurrentQuestion(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleQuestionSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setCurrentQuestion(prev => ({ ...prev, [name]: value }));
  };

  const handleOptionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOptionInput(e.target.value);
  };

  const handleOptionKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && optionInput.trim()) {
      setOptions(prev => [...prev, optionInput.trim()]);
      setOptionInput('');
    }
  };

  const handleAddOption = () => {
    if (optionInput.trim()) {
      setOptions(prev => [...prev, optionInput.trim()]);
      setOptionInput('');
    }
  };

  // Submit
  const handleSubmit = async () => {
    if (quiz.questions.length < quiz.questions_per_student) {
      setError(`Please add at least ${quiz.questions_per_student} questions`);
      setStep(2);
      return;
    }
    setLoading(true);
    try {
      const quizData = {
        ...quiz,
        scheduled_start_time: quiz.scheduled_start_time?.toISOString() || null,
        scheduled_end_time: quiz.scheduled_end_time?.toISOString() || null
      };
      await apiCreateQuiz(quizData);
      setLoading(false);
      setStep(4);
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
          <Paper elevation={3} className="quiz-form">
            <Typography variant="h5" gutterBottom>Quiz Details</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={quiz.title}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Course ID"
                  name="course_id"
                  value={quiz.course_id}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Topic"
                  name="topic"
                  value={quiz.topic}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Difficulty</InputLabel>
                  <Select
                    value={quiz.difficulty}
                    name="difficulty"
                    onChange={handleSelectChange}
                    label="Difficulty"
                  >
                    <MenuItem value="easy">Easy</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="hard">Hard</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Questions per Student"
                  name="questions_per_student"
                  value={quiz.questions_per_student}
                  onChange={handleInputChange}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>
          </Paper>
        );
      case 1:
        return (
          <Paper elevation={3} className="quiz-form">
            <Typography variant="h5" gutterBottom>Quiz Schedule</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Quiz Type</InputLabel>
                  <Select
                    value={quiz.is_scheduled ? 'scheduled' : 'immediate'}
                    onChange={e => setQuiz({ ...quiz, is_scheduled: e.target.value === 'scheduled' })}
                    label="Quiz Type"
                  >
                    <MenuItem value="immediate">Immediate (Available Now)</MenuItem>
                    <MenuItem value="scheduled">Scheduled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {quiz.is_scheduled && (
                <>
                  <Grid item xs={12} sm={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DateTimePicker
                        label="Start Time"
                        value={quiz.scheduled_start_time}
                        onChange={handleDateTimeChange('scheduled_start_time')}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DateTimePicker
                        label="End Time"
                        value={quiz.scheduled_end_time}
                        onChange={handleDateTimeChange('scheduled_end_time')}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Time Limit (minutes)"
                      value={quiz.time_limit_minutes}
                      onChange={handleInputChange}
                      required
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Paper>
        );
      case 2:
        return (
          <Paper elevation={3} className="quiz-form">
            <Typography variant="h5" gutterBottom>Add Questions</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Question Text"
                  name="text"
                  value={currentQuestion.text}
                  onChange={handleQuestionInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Question Type</InputLabel>
                  <Select
                    value={currentQuestion.type}
                    name="type"
                    onChange={handleQuestionSelectChange}
                    label="Question Type"
                  >
                    <MenuItem value="mcq">Multiple Choice</MenuItem>
                    <MenuItem value="short_answer">Short Answer</MenuItem>
                    <MenuItem value="true_false">True/False</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Score"
                  name="max_score"
                  value={currentQuestion.max_score}
                  onChange={handleQuestionInputChange}
                  required
                  inputProps={{ min: 0.1, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="question-image-input"
                />
                <label htmlFor="question-image-input">
                  <Button variant="outlined" component="span">
                    {currentQuestion.image ? 'Change Image' : 'Add Image'}
                  </Button>
                </label>
                {currentQuestion.image && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Selected: {currentQuestion.image.name}
                  </Typography>
                )}
              </Grid>
              {currentQuestion.type === 'mcq' && (
                <Grid item xs={12}>
                  <Box className="mcq-options">
                    <TextField
                      fullWidth
                      label="Add Option"
                      value={optionInput}
                      onChange={handleOptionInputChange}
                      onKeyPress={handleOptionKeyPress}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddOption}
                      startIcon={<AddIcon />}
                      sx={{ mt: 1 }}
                    >
                      Add Option
                    </Button>
                    <Box className="options-list">
                      {options.map((opt, idx) => (
                        <Box key={idx} className="option-item">
                          <TextField
                            value={opt}
                            onChange={e => {
                              const newOptions = [...options];
                              newOptions[idx] = e.target.value;
                              setOptions(newOptions);
                            }}
                          />
                          <IconButton onClick={() => setOptions(options.filter((_, i) => i !== idx))}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Grid>
              )}
              <Grid item xs={12}>
                {currentQuestion.type === 'mcq' && (
                  <FormControl fullWidth>
                    <InputLabel>Correct Answer</InputLabel>
                    <Select
                      value={currentQuestion.correct_answer[0] || ''}
                      onChange={(e) => setCurrentQuestion(prev => ({
                        ...prev,
                        correct_answer: [e.target.value]
                      }))}
                      label="Correct Answer"
                    >
                      {options.map((opt, idx) => (
                        <MenuItem key={idx} value={opt}>{opt}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {currentQuestion.type === 'short_answer' && (
                  <TextField
                    fullWidth
                    label="Correct Answer"
                    value={currentQuestion.correct_answer[0] || ''}
                    onChange={(e) => setCurrentQuestion(prev => ({
                      ...prev,
                      correct_answer: [e.target.value]
                    }))}
                    required
                  />
                )}

                {currentQuestion.type === 'true_false' && (
                  <FormControl fullWidth>
                    <InputLabel>Correct Answer</InputLabel>
                    <Select
                      value={currentQuestion.correct_answer[0] || ''}
                      onChange={(e) => setCurrentQuestion(prev => ({
                        ...prev,
                        correct_answer: [e.target.value]
                      }))}
                      label="Correct Answer"
                    >
                      <MenuItem value="true">True</MenuItem>
                      <MenuItem value="false">False</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddOrEditQuestion}
                  startIcon={editingIdx !== null ? <EditIcon /> : <AddIcon />}
                >
                  {editingIdx !== null ? 'Update Question' : 'Add Question'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        );
      case 3:
        return (
          <Paper elevation={3} className="quiz-form">
            <Typography variant="h5" gutterBottom>Review Quiz</Typography>
            <Box className="quiz-review">
              <Typography variant="h6">Quiz Details</Typography>
              <Box className="quiz-details">
                <Typography><strong>Title:</strong> {quiz.title}</Typography>
                <Typography><strong>Course ID:</strong> {quiz.course_id}</Typography>
                <Typography><strong>Topic:</strong> {quiz.topic}</Typography>
                <Typography><strong>Difficulty:</strong> {quiz.difficulty}</Typography>
                <Typography><strong>Questions per Student:</strong> {quiz.questions_per_student}</Typography>
                {quiz.is_scheduled && (
                  <>
                    <Typography><strong>Start Time:</strong> {quiz.scheduled_start_time?.toLocaleString()}</Typography>
                    <Typography><strong>End Time:</strong> {quiz.scheduled_end_time?.toLocaleString()}</Typography>
                    <Typography><strong>Time Limit:</strong> {quiz.time_limit_minutes} minutes</Typography>
                  </>
                )}
              </Box>
              <Typography variant="h6" className="mt-4">Questions</Typography>
              <Box className="questions-list">
                {quiz.questions.map((q, idx) => (
                  <Paper key={idx} elevation={2} className="question-item">
                    <Box className="question-header">
                      <Typography variant="subtitle1">Question {idx + 1}</Typography>
                      <Box>
                        <IconButton onClick={() => handleEditQuestion(idx)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleRemoveQuestion(idx)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography>{q.text}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Type: {q.type} | Score: {q.max_score}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Box>
          </Paper>
        );
      case 4:
        return (
          <Paper elevation={3} className="quiz-form success-message">
            <CheckCircleIcon color="success" sx={{ fontSize: 60 }} />
            <Typography variant="h5">Quiz Created Successfully!</Typography>
            <Typography>Your quiz has been created. You can now assign it to students or view it in your dashboard.</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/faculty-dashboard')}
              startIcon={<ArrowForwardIcon />}
            >
              Go to Dashboard
            </Button>
          </Paper>
        );
      default:
        return null;
    }
  };

  return (
    <Box className="create-quiz-container">
      <Box className="back-button-container" style={{ marginBottom: '20px', zIndex: 1, display: 'flex', justifyContent: 'flex-start' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/faculty-dashboard')}
          className="back-button"
          variant="outlined"
        >
          Back to Dashboard
        </Button>
      </Box>
      <Box className="create-quiz-content">
        <ProgressSidebar />
        <Box className="main-content">
          {loading && (
            <Box className="loading-overlay">
              <Typography>Creating quiz...</Typography>
            </Box>
          )}
          {renderStep()}
          {error && (
            <Paper elevation={3} className="error-message">
              <Typography color="error">{error}</Typography>
            </Paper>
          )}
          {step < 4 && (
            <Box className="navigation-buttons">
              <Button
                variant="outlined"
                onClick={() => setStep(s => Math.max(s - 1, 0))}
                disabled={step === 0}
                startIcon={<ArrowBackIcon />}
              >
                Back
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  if (step === 3) {
                    handleSubmit();
                  } else {
                    setStep(s => Math.min(s + 1, steps.length - 1));
                  }
                }}
                endIcon={<ArrowForwardIcon />}
              >
                {step === 3 ? 'Create Quiz' : 'Next'}
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CreateQuiz;

// Add a utility class for input styling
if (!document.getElementById('quiz-input-style')) {
  const style = document.createElement('style');
  style.id = 'quiz-input-style';
  style.innerHTML = `.input{border-radius:0.375rem;border:1px solid #d1d5db;padding:0.5rem 0.75rem;width:100%;font-size:1.125rem;line-height:1.75rem;transition:border-color 0.2s;}:focus{outline:none;border-color:#3b82f6;box-shadow:0 0 0 1px #3b82f6;}`;
  document.head.appendChild(style);
}
