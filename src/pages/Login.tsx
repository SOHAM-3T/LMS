import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api";
import { Eye, EyeOff } from "lucide-react";


const Login = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<"student" | "faculty">("student");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    studentId: "",
    facultyId: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const identifier = userType === "student" ? formData.studentId : formData.facultyId;
      const response = await loginUser(identifier, formData.password);
      
      if (!response || typeof response.is_faculty === 'undefined' || typeof response.is_student === 'undefined') {
        setError("Invalid response from server");
        return;
      }

      localStorage.setItem('user_type', response.is_faculty ? 'faculty' : 'student');

      if (response.is_faculty) {
        navigate('/faculty-dashboard', { replace: true });
      } else if (response.is_student) {
        navigate('/student-dashboard', { replace: true });
      } else {
        setError("Invalid user type");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Section */}
      <div className="w-1/2 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-12 flex flex-col justify-center relative animate-gradient">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center text-center">
          <div onClick={handleLogoClick} className="cursor-pointer mb-8">
            <img src="nit_ap.png" alt="NIT AP Logo" className="h-64 w-auto transform hover:scale-105 transition-transform duration-300" />
          </div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-4 animate-fade-in">
            Welcome Back
          </h1>
          <p className="text-xl text-gray-600 mb-8 animate-fade-in-delayed">
            Continue your journey of excellence at NIT AP
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
      <div className="w-1/2 bg-gradient-to-br from-indigo-100 via-blue-50 to-purple-100 p-12 flex items-center justify-center relative">
  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm"></div>

  <div className="max-w-md w-full relative z-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                name={userType === "student" ? "studentId" : "facultyId"}
                type="text"
                required
                value={userType === "student" ? formData.studentId : formData.facultyId}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg py-3 px-4 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                placeholder={userType === "student" ? "Enter your Student ID" : "Enter your Faculty ID"}
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

            <div>
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
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to={`/signup${userType === "faculty" ? "?type=faculty" : ""}`} className="text-blue-600 hover:text-blue-500 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
