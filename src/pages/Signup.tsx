import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { registerUser, generateOTP, verifyOTP } from "../api";
import { Eye, EyeOff } from "lucide-react";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [userType, setUserType] = useState<"student" | "faculty">("student");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [formData, setFormData] = useState({
    rollNo: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    branch: "CS",
    year: "I",
    otp: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const BRANCHES = [
    { value: "BT", label: "Biotechnology" },
    { value: "CH", label: "Chemical Engineering" },
    { value: "CE", label: "Civil Engineering" },
    { value: "CS", label: "Computer Science & Engg." },
    { value: "EE", label: "Electrical Engineering" },
    { value: "EC", label: "Electronics & Communication Engineering" },
    { value: "ME", label: "Mechanical Engineering" },
    { value: "MT", label: "Metallurgical & Materials Engineering" },
    { value: "SC", label: "School of Sciences" },
    { value: "HM", label: "School of Humanities & Management" },
  ];

  const YEARS = [
    { value: "I", label: "First Year" },
    { value: "II", label: "Second Year" },
    { value: "III", label: "Third Year" },
    { value: "IV", label: "Fourth Year" },
  ];

  useEffect(() => {
    if (searchParams.get("type") === "faculty") {
      setUserType("faculty");
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // For roll number, only allow numbers and limit to 6 digits
    if (name === "rollNo") {
      if (value.length > 6) return;
      if (value && !/^\d+$/.test(value)) return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.rollNo || !formData.email || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }

    // Validate roll number format (6 digits)
    if (!/^\d{6}$/.test(formData.rollNo)) {
      setError("Roll number must be exactly 6 digits");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      // First, register the user
      await registerUser({
        rollNo: formData.rollNo,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        branch: formData.branch,
        year: formData.year,
        userType: userType
      });
      
      // Then send OTP
      await generateOTP(formData.email, "signup");
      setOtpSent(true);
      setShowOTP(true);
      setSuccess("OTP sent to your email");
    } catch (err) {
      setError(err as string);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp) {
      setError("Please enter the OTP");
      return;
    }

    if (formData.otp.length !== 6) {
      setError("OTP must be 6 digits");
      return;
    }

    setIsLoading(true);
    try {
      await verifyOTP(formData.email, formData.otp, "signup");
      setSuccess("Email verified successfully! Redirecting to login...");
      setShowOTP(false);
      setTimeout(() => navigate(`/login?type=${userType}`), 2000);
    } catch (err) {
      setError(err as string);
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
            Create {userType === "student" ? "Student" : "Faculty"} Account
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Join our learning community and start your educational journey today
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
      <div className="w-1/2 bg-white p-12 overflow-y-auto">
        <div className="max-w-md mx-auto">
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

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {userType === "student" ? "Roll Number" : "Faculty ID"}
              </label>
              <input
                name="rollNo"
                type="text"
                required
                pattern="\d{6}"
                title={userType === "student" ? "Roll number must be exactly 6 digits" : "Faculty ID must be exactly 6 digits"}
                value={formData.rollNo}
                onChange={handleChange}
                maxLength={6}
                className="mt-1 block w-full border border-gray-300 rounded-lg py-3 px-4 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                placeholder={userType === "student" ? "22CS001" : "FAC001"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg py-3 px-4 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg py-3 px-4 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Branch</label>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg py-3 px-4 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                >
                  {BRANCHES.map((branch) => (
                    <option key={branch.value} value={branch.value}>
                      {branch.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Year</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg py-3 px-4 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                >
                  {YEARS.map((year) => (
                    <option key={year.value} value={year.value}>
                      {year.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg py-3 px-4 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                placeholder="john.doe@student.nitandhra.ac.in"
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
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg py-3 px-4 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 pr-10 bg-white/50 backdrop-blur-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center mt-1"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {!otpSent && (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing up...
                  </div>
                ) : (
                  'Sign up'
                )}
              </button>
            )}

            {showOTP && (
              <div>
                <label className="block text-sm font-medium text-gray-700">OTP</label>
                <div className="flex space-x-2">
                  <input
                    name="otp"
                    type="text"
                    required
                    value={formData.otp}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-lg py-3 px-4 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={isLoading}
                    className="mt-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    Verify
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;