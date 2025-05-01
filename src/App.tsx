import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import CreateQuiz from './pages/CreateQuiz';
import EditQuiz from './pages/EditQuiz';
import TakeQuiz from './pages/TakeQuiz';
import StudentPerformanceDetail from './pages/StudentPerformanceDetail';
import QuizPerformanceView from './pages/QuizPerformanceView';
import { SessionProvider } from './SessionContext';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Global auth check: redirect to login if tokens are missing
  useEffect(() => {
    const access = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    const unprotected = ['/', '/login', '/signup', '/forgot-password'];
    if (!unprotected.includes(location.pathname)) {
      if (!access || !refresh) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setSessionExpired(true);
        setAuthChecked(false);
        return;
      }
    }
    setSessionExpired(false);
    setAuthChecked(true);
  }, [location]);

  if (sessionExpired) {
    return (
      <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f1f5f9'}}>
        <div style={{background:'#fee2e2', color:'#b91c1c', borderRadius:8, padding:32, fontSize:'1.2rem', textAlign:'center'}}>
          <p><b>Session expired</b></p>
          <p>Your login session has expired. Please log in again.</p>
          <button onClick={() => navigate('/login')} style={{marginTop:16, padding:'8px 20px', background:'#3b82f6', color:'#fff', border:'none', borderRadius:6, fontSize:'1rem', cursor:'pointer'}}>Go to Login</button>
        </div>
      </div>
    );
  }

  // Only render children after auth check
  if (!authChecked && !['/', '/login', '/signup', '/forgot-password'].includes(location.pathname)) {
    return null; // or a spinner/loading UI
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {![
        '/login',
        '/signup',
        '/forgot-password',
        '/create-quiz',
        '/edit-quiz/' + location.pathname.split('/edit-quiz/')[1],
        '/faculty/quiz-performance'
      ].includes(location.pathname) &&
      !/^\/student\/quiz\/[^/]+\/attempt$/.test(location.pathname) && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
        <Route path="/create-quiz" element={<CreateQuiz />} />
        <Route path="/edit-quiz/:quizId" element={<EditQuiz />} />
        <Route path="/student/quiz/:quizId/attempt" element={<TakeQuiz />} />
        <Route path="/faculty/student/:studentId/performance" element={<StudentPerformanceDetail />} />
        <Route path="/faculty/quiz/:quizId/performance" element={<StudentPerformanceDetail />} />
        <Route path="/faculty/quiz-performance" element={<QuizPerformanceView />} />
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
              <p className="text-gray-600">The page you're looking for doesn't exist.</p>
              <p className="text-gray-600">Current path: {location.pathname}</p>
            </div>
          </div>
        } />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <SessionProvider>
      <Router>
        <AppContent />
      </Router>
    </SessionProvider>
  );
}

export default App;