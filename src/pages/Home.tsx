import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Users, Award, ArrowRight } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="text-center">
          <div 
            onClick={handleLogoClick}
            className="cursor-pointer inline-block"
          >
            <img
              src="nit_ap.png"
              alt="NIT AP Logo"
              className="mx-auto h-24 w-auto transform hover:scale-105 transition-transform duration-300"
            />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 mt-8">
            Welcome to NIT AP Learning Management System
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Empowering education through technology and innovation
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-12">
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-xl border border-gray-100 transform hover:scale-105 transition-all duration-300">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-900">Online Learning</h3>
            <p className="text-gray-600 mb-6">
              Start Learning by attending Quizes and Exams. Enhance your Learning Experience.
            </p>
            <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-xl border border-gray-100 transform hover:scale-105 transition-all duration-300">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-900">Interactive Platform</h3>
            <p className="text-gray-600 mb-6">
              Engage with faculty and peers through our collaborative platform.
            </p>
            <Link to="/signup" className="text-purple-600 hover:text-purple-700 font-medium inline-flex items-center">
              Join Now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-xl border border-gray-100 transform hover:scale-105 transition-all duration-300">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <Award className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-900">Track Progress</h3>
            <p className="text-gray-600 mb-6">
              Monitor your academic performance and growth in real-time.
            </p>
            <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center">
              Start Tracking <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link
            to="/signup"
            className="inline-flex items-center px-8 py-4 rounded-full text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Get Started Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;