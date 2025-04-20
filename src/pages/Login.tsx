import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { loginUser, generateOTP, verifyOTP } from "../api";
import { Eye, EyeOff } from "lucide-react";

interface LoginFormData {
  rollNumber: string;
  password: string;
}

const Login = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [userType, setUserType] = useState<"student" | "faculty">("student");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    rollNumber: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [showOtpForm, setShowOtpForm] = useState(false);

  useEffect(() => {
    if (searchParams.get("type") === "faculty") {
      setUserType("faculty");
    }
  }, [searchParams]);

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // For roll number, only allow numbers and limit to 6 digits
    if (name === "rollNumber") {
      if (value.length > 6) return;
      if (value && !/^\d+$/.test(value)) return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setNeedsVerification(false);
    setShowOtpForm(false);

    try {
      const response = await loginUser(formData.rollNumber, formData.password);
      console.log('Login response:', response); // Debug log
      
      if (response.access && response.refresh) {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        setSuccess('Login successful! Redirecting...');
        
        // Debug log for redirection
        console.log('Redirecting to dashboard, is_faculty:', response.is_faculty);
        
        // Redirect based on user type
        if (response.is_faculty) {
          console.log('Redirecting to faculty dashboard');
          setTimeout(() => navigate('/faculty-dashboard'), 1500);
        } else {
          console.log('Redirecting to student dashboard');
          setTimeout(() => navigate('/student-dashboard'), 1500);
        }
      } else {
        console.error('Invalid response format:', response);
        setError('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.data?.needs_verification) {
        setNeedsVerification(true);
        setVerificationEmail(err.response.data.email);
        setShowOtpForm(true);
        setError('Please verify your email with OTP to activate your account');
      } else {
        setError(err.response?.data?.detail || err.message || 'Invalid credentials');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!verificationEmail) return;
    
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    
    try {
      await generateOTP(verificationEmail, 'signup');
      setSuccess("New OTP has been sent to your email");
      setShowOtpForm(true);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationEmail || !otp) return;
    
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    
    try {
      await verifyOTP(verificationEmail, otp, 'signup');
      setSuccess("Email verified successfully! You can now login");
      setNeedsVerification(false);
      setShowOtpForm(false);
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Section */}
      <div className="w-1/2 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-12 flex flex-col justify-center relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center text-center">
          <div onClick={handleLogoClick} className="cursor-pointer mb-8">
            <img src="/src/assets/nit_ap.png" alt="NIT AP Logo" className="h-64 w-auto transform hover:scale-105 transition-transform duration-300" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {userType === "student" ? "Student" : "Faculty"} Login
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Welcome back! Please enter your credentials to continue
          </p>
          <div className="flex space-x-4">
            <button
              className={`px-6 py-2 rounded-full transition-all duration-300 ${
                userType === "student" 
                  ? "bg-blue-600 text-white shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setUserType("student")}
            >
              Student
            </button>
            <button
              className={`px-6 py-2 rounded-full transition-all duration-300 ${
                userType === "faculty" 
                  ? "bg-blue-600 text-white shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setUserType("faculty")}
            >
              Faculty
            </button>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-1/2 bg-white p-12 overflow-y-auto flex items-center justify-center">
        <div className="w-full max-w-md">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}

          {!needsVerification ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {userType === "student" ? "Roll Number" : "Faculty ID"}
                </label>
                <input
                  name="rollNumber"
                  type="text"
                  required
                  pattern="\d{6}"
                  title={userType === "student" ? "Roll number must be exactly 6 digits" : "Faculty ID must be exactly 6 digits"}
                  value={formData.rollNumber}
                  onChange={handleChange}
                  maxLength={6}
                  className="mt-1 block w-full border border-gray-300 rounded-lg py-3 px-4 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder={userType === "student" ? "22CS001" : "FAC001"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-lg py-3 px-4 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 pr-10 bg-white/50 backdrop-blur-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center mt-1"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link to="/forgot-password" className="text-blue-600 hover:text-blue-500 font-medium">
                    Forgot your password?
                  </Link>
                </div>
                <div className="text-sm">
                  <Link to="/signup" className="text-blue-600 hover:text-blue-500 font-medium">
                    Don't have an account? Sign up
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ${
                  isLoading ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
                <p className="text-gray-600 mb-4">
                  Please enter the OTP sent to {verificationEmail}
                </p>
              </div>

              {showOtpForm ? (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-lg py-3 px-4 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    {isLoading ? "Verifying..." : "Verify OTP"}
                  </button>
                </form>
              ) : (
                <button
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                >
                  {isLoading ? "Sending..." : "Resend OTP"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
