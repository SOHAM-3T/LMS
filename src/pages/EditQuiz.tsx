import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizDetails, updateQuizDetails, QuestionData, Quiz } from '../api/quiz';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Switch,
  Alert,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface Question extends QuestionData {}

const EditQuiz: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        if (!quizId) return;
        const data = await getQuizDetails(quizId);
        setQuiz(data);
        if (data.scheduled_start_time) {
          setStartTime(new Date(data.scheduled_start_time));
        }
        if (data.scheduled_end_time) {
          setEndTime(new Date(data.scheduled_end_time));
        }
      } catch (err) {
        setError('Failed to fetch quiz details');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleQuestionChange = (index: number, field: keyof Question, value: string | number) => {
    if (!quiz) return;
    const updatedQuestions = [...quiz.questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value,
    };
    setQuiz({ ...quiz, questions: updatedQuestions });
  };

  const handleQuizUpdate = async () => {
    if (!quiz || !quizId) return;
    try {
      const updatedQuiz = {
        ...quiz,
        scheduled_start_time: startTime?.toISOString() || null,
        scheduled_end_time: endTime?.toISOString() || null,
      };
      await updateQuizDetails(quizId, updatedQuiz);
      navigate('/faculty-dashboard');
    } catch (err) {
      setError('Failed to update quiz');
    }
  };

  const steps = ['Basic Information', 'Questions', 'Scheduling'];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!quiz) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Quiz not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', pt: 3 }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, ml: 2 }}>
          <Button
            onClick={() => navigate('/faculty-dashboard')}
            sx={{
              color: '#1976d2',
              bgcolor: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              px: 3,
              py: 1,
              textTransform: 'none',
              fontSize: '1rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              '&:hover': {
                bgcolor: '#f5f5f5',
                border: '1px solid #1976d2',
              }
            }}
            startIcon={<ArrowBackIcon />}
          >
            Back to Dashboard
          </Button>
        </Box>

        <Paper elevation={3} sx={{ p: 4, borderRadius: '12px' }}>
          <Typography variant="h4" gutterBottom>
            Edit Quiz
          </Typography>
          
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {activeStep === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Quiz Title"
                  value={quiz.title}
                  onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Course ID"
                  value={quiz.course_id}
                  onChange={(e) => setQuiz({ ...quiz, course_id: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Topic"
                  value={quiz.topic}
                  onChange={(e) => setQuiz({ ...quiz, topic: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Difficulty"
                  value={quiz.difficulty}
                  onChange={(e) => setQuiz({ ...quiz, difficulty: e.target.value })}
                />
              </Grid>
            </Grid>
          )}

          {activeStep === 1 && (
            <Grid container spacing={3}>
              {quiz.questions.map((question, index) => (
                <Grid item xs={12} key={question.id}>
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Question {index + 1}
                    </Typography>
                    <TextField
                      fullWidth
                      label="Question Text"
                      value={question.text}
                      onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Correct Answer"
                      value={question.correct_answer}
                      onChange={(e) => handleQuestionChange(index, 'correct_answer', e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Max Score"
                      type="number"
                      value={question.max_score}
                      onChange={(e) => handleQuestionChange(index, 'max_score', Number(e.target.value))}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}

          {activeStep === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={quiz.is_scheduled}
                      onChange={(e) => setQuiz({ ...quiz, is_scheduled: e.target.checked })}
                    />
                  }
                  label="Schedule Quiz"
                />
              </Grid>
              {quiz.is_scheduled && (
                <>
                  <Grid item xs={12} sm={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DateTimePicker
                        label="Start Time"
                        value={startTime}
                        onChange={(newValue) => setStartTime(newValue)}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DateTimePicker
                        label="End Time"
                        value={endTime}
                        onChange={(newValue) => setEndTime(newValue)}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Time Limit (minutes)"
                      type="number"
                      value={quiz.time_limit_minutes || ''}
                      onChange={(e) => setQuiz({ ...quiz, time_limit_minutes: Number(e.target.value) })}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="contained"
              onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
              disabled={activeStep === 0}
            >
              Back
            </Button>
            {activeStep === steps.length - 1 ? (
              <Button variant="contained" color="primary" onClick={handleQuizUpdate}>
                Update Quiz
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
              >
                Next
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default EditQuiz;
