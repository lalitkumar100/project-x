import React, { useState, useEffect } from 'react';
import {
  Scan,
  MessageSquare,
  TrendingUp,
  Cloud,
  CheckSquare,
  Shield,
  Users,
  BarChart3,
  Github,
  Linkedin,
  Phone,
  ChevronRight,
  Sparkles,
  Lock,
  Eye,
  X,
  Mail,
  User
} from 'lucide-react';

import video from './video2.mp4'

const MedicudeLanding = () => {
  const logo = '/assets/favicon.svg';
  const [scrollY, setScrollY] = useState(0);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', contact: '' });
  const [submitted, setSubmitted] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  console.log(video);
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setShowContactDialog(false);
      setSubmitted(false);
      setFormData({ name: '', email: '', contact: '' });
    }, 2000);
  };

  const features = [
    {
      icon: <Scan className="w-8 h-8" />,
      title: "AI Invoice Vision",
      description: "Automatically add stock by uploading a PDF or a photo of your invoice. No manual typing; our AI extracts medicine names, batch numbers, and expiry dates instantly."
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "AI Pharmacy Assistant",
      description: "A built-in chat interface. Ask \"What is my stock status?\" or \"Give me a hint on improving operations,\" and get real-time data-driven answers."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "FinTrack (Money Management)",
      description: "A dedicated financial section to track cash flow, daily profit, and expenses. Visualize your growth with clean, minimalist charts."
    },
    {
      icon: <Cloud className="w-8 h-8" />,
      title: "Cloud Sync & Security",
      description: "100% automated cloud storage. Your data is always backed up and accessible from anywhere, anytime."
    },
    {
      icon: <CheckSquare className="w-8 h-8" />,
      title: "Smart To-Do & Reminders",
      description: "An integrated task manager to keep your pharmacy daily operations organized and on schedule."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src='/assets/favicon.svg'
              alt="Medicude Logo"
              className="w-10 h-10"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
              MediCude
            </span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
            <a href="#home" className="hover:text-teal-500 transition-colors">Home</a>
            <a href="#features" className="hover:text-teal-500 transition-colors">Features</a>
            <a href="#security" className="hover:text-teal-500 transition-colors">Security</a>
            <a href="#contact" className="hover:text-teal-500 transition-colors">Contact</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
        {/* Video Background */}
        {/* Background Video */}
        <video
          src={video}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
        />

        {/* Fallback Animated Glow Background */}
        <div
          className={`absolute w-[800px] h-[800px] rounded-full transition-opacity duration-1000 ${videoLoaded ? 'opacity-0' : 'opacity-30'
            }`}
          style={{
            background: 'radial-gradient(circle, rgba(64, 224, 208, 0.35) 0%, rgba(64, 224, 208, 0) 70%)',
            animation: 'pulse 8s ease-in-out infinite',
            transform: `scale(${1 + scrollY * 0.0002})`
          }}
        />

        {/* Softer Overlay (FIXED — was hiding video) */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />

        {/* Content */}
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          {/* Floating Logo */}
          <div
            className="mb-8 inline-block"
            style={{ animation: 'float 6s ease-in-out infinite' }}
          >
            <div className="relative">
              <img
                src={logo}
                alt="Medicude"
                className="w-32 h-32 drop-shadow-2xl"
              />
              <div className="absolute inset-0 bg-teal-400/20 blur-3xl rounded-full" />
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Pharmacy Management,<br />
            <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
              Reimagined by AI.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto font-light">
            Smart inventory, automated finances, and role-based control. One platform to rule your entire pharmacy operations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/login"
              className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-teal-500/50 transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              Get Demo
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <button
              onClick={() => setShowContactDialog(true)}
              className="px-8 py-4 border-2 border-teal-500 text-teal-500 rounded-full font-semibold text-lg hover:bg-teal-50 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Contact Us
            </button>
          </div>
        </div>

        <style>{`
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.3; }
    50% { transform: scale(1.1); opacity: 0.5; }
  }
`}</style>

      </section>

      {/* Contact Dialog */}
      {showContactDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 relative animate-slideUp">
            <button
              onClick={() => setShowContactDialog(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {!submitted ? (
              <>
                <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                  Get in Touch
                </h3>
                <p className="text-gray-600 mb-8">Fill out the form and we'll reach out to you soon!</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                        placeholder="Your name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        required
                        value={formData.contact}
                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-teal-500/30 transition-all duration-300"
                  >
                    Submit
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">Thank you for your interest!</h4>
                <p className="text-gray-600">We will contact you soon.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Features Section */}
      <section id="features" className="py-32 px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              The <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">AI-First</span> Experience
            </h2>
            <p className="text-xl text-gray-600">Powerful features designed for modern pharmacies</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 hover:border-teal-200 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/10"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>

                  <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                    {feature.title}
                  </h3>

                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          .animate-slideUp {
            animation: slideUp 0.3s ease-out;
          }
        `}</style>
      </section>

      {/* Reviews Section */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What Our <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">Clients Say</span>
            </h2>
            <p className="text-xl text-gray-600">Trusted by pharmacy owners across the country</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Review 1 */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 hover:border-teal-200 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/10">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">
                "Medicude has transformed how we manage our pharmacy. The AI invoice feature alone saves us hours every week. Highly recommended!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                  RS
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Rajesh Sharma</p>
                  <p className="text-sm text-gray-500">Sharma Medical Store, Delhi</p>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 hover:border-teal-200 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/10">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">
                "The FinTrack feature gives me complete visibility into my business finances. The AI assistant is like having an expert advisor 24/7."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                  PK
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Priya Kapoor</p>
                  <p className="text-sm text-gray-500">HealthCare Pharmacy, Mumbai</p>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 hover:border-teal-200 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/10">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">
                "Amazing software! The role-based access keeps our data secure while my staff can easily manage daily operations. Game changer!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                  AM
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Amit Mehta</p>
                  <p className="text-sm text-gray-500">MediPlus Pharmacy, Bangalore</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Access Section */}
      <section id="security" className="py-32 px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-full text-teal-600 font-semibold mb-6">
              <Shield className="w-5 h-5" />
              Security Feature
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Dual-Dashboard System
            </h2>
            <p className="text-xl text-gray-600">Role-based access control for complete security</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Admin Mode */}
            <div className="relative bg-gradient-to-br from-teal-500 to-cyan-500 rounded-3xl p-8 text-white overflow-hidden group hover:scale-105 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold mb-4">Admin Mode</h3>
                <p className="text-teal-50 mb-6">
                  Full access to FinTrack, staff management, and sensitive pharmacy analytics.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full" />
                    <span className="text-sm">Complete financial oversight</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full" />
                    <span className="text-sm">Staff management tools</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full" />
                    <span className="text-sm">Advanced analytics dashboard</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Worker Mode */}
            <div className="relative bg-white border-2 border-gray-200 rounded-3xl p-8 overflow-hidden group hover:scale-105 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-40 h-40 bg-teal-50 rounded-full -mr-20 -mt-20" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-gray-900">Worker Mode</h3>
                <p className="text-gray-600 mb-6">
                  A simplified, focused interface for employees to manage billing and stock checks without seeing sensitive financial data.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-teal-500 rounded-full" />
                    <span className="text-sm text-gray-700">Streamlined billing interface</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-teal-500 rounded-full" />
                    <span className="text-sm text-gray-700">Stock management access</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-teal-500 rounded-full" />
                    <span className="text-sm text-gray-700">Limited data visibility</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-gray-300 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src={logo} alt="Medicude" className="w-10 h-10" />
                <span className="text-2xl font-bold text-white">MediCude</span>
              </div>

              <p className="text-gray-400 mb-6">
                AI-powered pharmacy management ecosystem for the modern world.
              </p>

              {/* 👨‍💻 Developer Credit with Image */}
              <div className="flex items-center gap-3 mt-4">
                <img
                  src="/assets/developer.png"
                  alt="Lalit Kumar"
                  className="w-12 h-12 rounded-full object-cover border-2 border-teal-400 shadow-md"
                />
                <div>
                  <p className="text-sm text-gray-400">Developed with ❤️ by</p>
                  <p className="text-teal-400 font-semibold">Lalit Kumar Choudhary</p>
                </div>
              </div>
            </div>


            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <a href="#home" className="block hover:text-teal-400 transition-colors">Home</a>
                <a href="#features" className="block hover:text-teal-400 transition-colors">Features</a>
                <a href="#security" className="block hover:text-teal-400 transition-colors">Security</a>
                
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <div className="space-y-3">
                <a href="tel:+1234567890" className="flex items-center gap-2 hover:text-teal-400 transition-colors">
                  <Phone className="w-4 h-4" />
                  <span>+91 63602 11440</span>
                </a>
                <a href="https://www.linkedin.com/in/lalitkumar-choudhary-90b012321/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-teal-400 transition-colors">
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                </a>
                <a href="https://github.com/lalitkumar100" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-teal-400 transition-colors">
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>© 2026 Medicude AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MedicudeLanding;