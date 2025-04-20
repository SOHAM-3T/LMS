import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles, Shield, ArrowRight, ChevronRight } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleLogoClick();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Base gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-blue-500/10"></div>
        
        {/* Subtle radial gradients */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-blue-200/30 to-transparent rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-purple-200/30 to-transparent rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-indigo-200/30 to-transparent rounded-full mix-blend-multiply filter blur-3xl"></div>
        
        {/* Subtle noise texture */}
        <div 
          className="absolute inset-0 opacity-5 mix-blend-overlay"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
          }}
        ></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div 
              onClick={handleLogoClick}
              onKeyDown={handleKeyPress}
              className="cursor-pointer inline-block mb-8 relative"
              role="button"
              tabIndex={0}
              aria-label="Go to home page"
            >
              <div className="absolute inset-0 bg-blue-500/20 rounded-full filter blur-2xl transform scale-150"></div>
              <img
                src="/src/assets/nit_ap.png"
                alt="NIT AP Logo"
                className="relative h-48 w-auto transform hover:scale-105 transition-transform duration-300"
                width={192}
                height={192}
                loading="eager"
              />
            </div>
            
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-6">
              Welcome to NIT AP LMS
            </h1>
            <p className="text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Your gateway to excellence in education through technology and innovation
            </p>
            
            <div className="flex justify-center space-x-6 mb-16">
              <Link
                to="/signup"
                className="px-8 py-4 rounded-full text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 rounded-full text-lg font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-100 transform hover:scale-105 transition-all duration-300 group">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="h-8 w-8 text-blue-600" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Smart Learning</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Experience personalized learning paths with interactive quizzes and real-time feedback to enhance your educational journey.
              </p>
              <Link 
                to="/signup" 
                className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center group-hover:translate-x-2 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
              >
                Start Learning <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-100 transform hover:scale-105 transition-all duration-300 group">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="h-8 w-8 text-purple-600" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Live Interaction</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Engage in real-time with faculty and peers through our collaborative platform designed for maximum interaction.
              </p>
              <Link 
                to="/signup" 
                className="text-purple-600 hover:text-purple-700 font-medium inline-flex items-center group-hover:translate-x-2 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-md"
              >
                Join Community <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-100 transform hover:scale-105 transition-all duration-300 group">
              <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-indigo-600" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Secure Testing</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Take exams with confidence using our advanced anti-cheating system and real-time proctoring technology.
              </p>
              <Link 
                to="/signup" 
                className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center group-hover:translate-x-2 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md"
              >
                Learn More <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
