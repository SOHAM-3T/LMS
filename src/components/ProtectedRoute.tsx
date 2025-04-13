import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserType: 'student' | 'faculty';
}

const ProtectedRoute = ({ children, allowedUserType }: ProtectedRouteProps) => {
  const location = useLocation();
  const token = localStorage.getItem('access_token');
  const userType = localStorage.getItem('user_type');

  // If no token or user type, redirect to login
  if (!token || !userType) {
    console.log('No token or user type found, redirecting to login');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_type');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle specific access cases
  if (allowedUserType === 'faculty' && userType !== 'faculty') {
    console.log('Access denied: Student trying to access faculty dashboard');
    return <Navigate to="/student-dashboard" replace />;
  }

  if (allowedUserType === 'student' && userType !== 'student') {
    console.log('Access denied: Faculty trying to access student dashboard');
    return <Navigate to="/faculty-dashboard" replace />;
  }

  console.log(`Access granted: ${userType} accessing ${allowedUserType} dashboard`);
  return <>{children}</>;
};

export default ProtectedRoute; 