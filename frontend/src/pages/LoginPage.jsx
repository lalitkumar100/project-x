import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, ArrowRight, Link } from "lucide-react";


const images = [
  "/img1.png", 
  "/img5.png", 
  "/img2.png", 
  "/img6.png", 
  "/img4.png", 
  "/img3.png"
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/login`, {
        email,
        password,
      });
      console.log("Login successful:", response.data);
      localStorage.setItem("token", response.data.token);
      if(response.data.role === "worker"){
        navigate("/worker");
      }
      else{
        navigate("/admin/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-teal-50">
      {/* Left Section - Enhanced Image Slideshow */}
      <div className="hidden md:block md:w-1/2 relative h-screen bg-gradient-to-br from-cyan-900 to-teal-800">
        {images.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Slide ${index}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        
        {/* Enhanced Overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/70 via-cyan-800/50 to-teal-900/70"></div>
        
        {/* Animated dots decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '700ms'}}></div>
        </div>
        
        {/* Enhanced Branding */}
        <div className="absolute bottom-12 left-12 text-white z-10 space-y-4">
          <div className="space-y-2">
            <h2 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
              MediCude
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full"></div>
          </div>
          <p className="text-xl text-cyan-100 font-light max-w-md">
            AI integrated Managing Tool for your Pharmacy
          </p>
          <div className="flex items-center gap-3 text-cyan-200 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" style={{animationDelay: '300ms'}}></div>
              <span>Efficient</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-cyan-300 rounded-full animate-pulse" style={{animationDelay: '500ms'}}></div>
              <span>Intelligent</span>
            </div>
          </div>
        </div>

        {/* Slideshow indicators */}
        <div className="absolute bottom-8 right-12 flex gap-2 z-10">
          {images.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentImageIndex 
                  ? "w-8 bg-cyan-400" 
                  : "w-1.5 bg-white/40"
              }`}
            ></div>
          ))}
        </div>
      </div>

      {/* Right Section - Enhanced Login Form */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-8 md:p-12 h-screen overflow-y-auto relative">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-100/50 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-teal-100/50 to-transparent rounded-full blur-3xl"></div>
        
        <div className="w-full max-w-md space-y-8 relative z-10">
          {/* Logo and Header */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20  ">
              <img
                src="/assets/favicon.svg"
                alt="Logo"
                className="w-16 h-16"
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-gray-500">Please enter your details to continue</p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6 mt-8">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="h-12 pl-11 border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-xl transition-all"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
            
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-12 pl-11 border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-xl transition-all"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] group"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Verifying...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>

            {error && (
              <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl text-center border border-red-100">
                {error}
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="space-y-4 pt-6 border-t border-gray-100">
           <p className="text-center text-sm text-gray-600">
  Need any Help?{" "}
  <a
  href="https://mail.google.com/mail/?view=cm&fs=1&to=lalitkumar709086@gmail.com&su=Support%20Request(MediCude)&body=Hello%20Admin,%20I%20need%20help%20with mediCude%20..."
  target="_blank"
  rel="noopener noreferrer"
  className="text-cyan-600 font-semibold hover:text-cyan-700 hover:underline transition-colors"
>
  Contact Developer
</a>
</p>

            
            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>worker :rohan.sharma@example.com<br/>password :123456</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
                <span>Admin :neha.patel@example.com
                  <br/>password :654321
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}