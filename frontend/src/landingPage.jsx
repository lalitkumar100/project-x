import React, { useState, useEffect } from 'react';
import {
  Scan,
  TrendingUp,
  Cloud,
  CheckSquare,
  Shield,
  Phone,
  ChevronRight,
  Lock,
  Eye,
  X,
  Mail,
  User,
  Link as LinkIcon
} from 'lucide-react';

import video from './video3.mp4';

const TradeCoreLanding = () => {
  const logo = '/assets/log1.png';
  const tcgLogo = '/PROJECT-X/TCG_logo.png';
  const [scrollY, setScrollY] = useState(0);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', contact: '' });
  const [submitted, setSubmitted] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

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
      description: "Automatically add stock by uploading your invoices. Our AI extracts item names, batches, and prices instantly to streamline operations."
    },
    {
      icon: <LinkIcon className="w-8 h-8" />,
      title: "TCG Integration",
      description: "Natively integrated with TradeChain Guardian for secure, verifiable, and immutable cross-party transactions and order requests."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "FinTrack & Billing",
      description: "A dedicated financial section to track cash flow, profit, and wholesale expenses. Visualize your trading growth with clean charts."
    },
    {
      icon: <Cloud className="w-8 h-8" />,
      title: "Cloud Sync & Security",
      description: "100% automated cloud storage. Your data is always backed up and accessible from anywhere, ensuring business continuity."
    },
    {
      icon: <CheckSquare className="w-8 h-8" />,
      title: "Smart Order Routing",
      description: "Advanced order requests processing integrated directly with suppliers and wholesalers via the TradeChain network."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="tradeCore Logo"
              className="w-10 h-10 object-contain"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
              tradeCore
            </span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
            <a href="#home" className="hover:text-green-600 transition-colors">Home</a>
            <a href="#features" className="hover:text-green-600 transition-colors">Features</a>
            <a href="#security" className="hover:text-green-600 transition-colors">Security</a>
            <a href="#contact" className="hover:text-green-600 transition-colors">Contact</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
        {/* Background Video */}
        <video
          src={video}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Fallback Animated Glow Background */}
        <div
          className={`absolute w-[800px] h-[800px] rounded-full transition-opacity duration-1000 ${videoLoaded ? 'opacity-0' : 'opacity-30'}`}
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(16, 185, 129, 0) 70%)',
            animation: 'pulse 8s ease-in-out infinite',
            transform: `scale(${1 + scrollY * 0.0002})`
          }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[3px]" />

        {/* Content */}
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="flex justify-center items-center gap-8 mb-8" style={{ animation: 'float 6s ease-in-out infinite' }}>
            <div className="relative">
              <img
                src={logo}
                alt="tradeCore"
                className="w-28 h-28 drop-shadow-2xl object-contain"
              />
              <div className="absolute inset-0 bg-green-400/20 blur-3xl rounded-full" />
            </div>
            <div className="text-gray-400 font-bold text-3xl">+</div>
            <div className="relative">
              <img
                src={tcgLogo}
                alt="TradeChain Guardian"
                className="w-28 h-28 drop-shadow-2xl object-contain"
              />
              <div className="absolute inset-0 bg-emerald-400/20 blur-3xl rounded-full" />
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Supply Chain & Trading,<br />
            <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
              Secured by TCG.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-800 font-medium mb-12 max-w-3xl mx-auto">
            Smart inventory, automated wholesale billing, and zero-trust B2B transactions. The ultimate trading core for modern businesses.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/login"
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-green-500/50 transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              Enter Application
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <button
              onClick={() => setShowContactDialog(true)}
              className="px-8 py-4 border-2 border-green-600 text-green-700 rounded-full font-semibold text-lg hover:bg-green-50 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Contact Sales
            </button>
          </div>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
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
                <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                  Get in Touch
                </h3>
                <p className="text-gray-600 mb-8">Ready to revolutionize your supply chain?</p>

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
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300"
                  >
                    Submit
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h4>
                <p className="text-gray-600">Our sales team will contact you soon.</p>
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
              Integrated <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">Power</span>
            </h2>
            <p className="text-xl text-gray-600">Enterprise-grade features for wholesale trading</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 hover:border-green-200 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-500 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300">
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
      </section>

      {/* Role-Based Access Section */}
      <section id="security" className="py-32 px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full text-green-700 font-semibold mb-6">
              <Shield className="w-5 h-5" />
              TCG Secured
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Zero-Trust Architecture
            </h2>
            <p className="text-xl text-gray-600">Role-based access with blockchain-level security</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Admin Mode */}
            <div className="relative bg-gradient-to-br from-green-600 to-emerald-500 rounded-3xl p-8 text-white overflow-hidden group hover:scale-105 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold mb-4">Admin Hub</h3>
                <p className="text-green-50 mb-6">
                  Full control over TCG keys, wholesale billing, user roles, and advanced analytics.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full" />
                    <span className="text-sm">Cryptographic TCG Session Management</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full" />
                    <span className="text-sm">Wholesaler Network Approvals</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full" />
                    <span className="text-sm">Profit & Loss Visibility</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Worker Mode */}
            <div className="relative bg-white border-2 border-gray-200 rounded-3xl p-8 overflow-hidden group hover:scale-105 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-40 h-40 bg-green-50 rounded-full -mr-20 -mt-20" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-gray-900">Operator Hub</h3>
                <p className="text-gray-600 mb-6">
                  A focused interface for handling incoming shipments, stock counts, and daily tasks without exposing sensitive financials.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full" />
                    <span className="text-sm text-gray-700">Stock ingestion & CSV imports</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full" />
                    <span className="text-sm text-gray-700">Order Request drafting</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full" />
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
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src={logo} alt="tradeCore" className="w-10 h-10 object-contain" />
                <span className="text-2xl font-bold text-white">tradeCore</span>
              </div>
              <p className="text-gray-400 mb-6">
                Next-generation trading and supply chain ecosystem powered by TradeChain Guardian.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <a href="#home" className="block hover:text-green-400 transition-colors">Home</a>
                <a href="#features" className="block hover:text-green-400 transition-colors">Features</a>
                <a href="#security" className="block hover:text-green-400 transition-colors">Security</a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <div className="space-y-3">
                <a href="tel:+1234567890" className="flex items-center gap-2 hover:text-green-400 transition-colors">
                  <Phone className="w-4 h-4" />
                  <span>+91 XXXXX XXXXX</span>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>© 2026 tradeCore by TCG Networks. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TradeCoreLanding;