import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Pill } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";

export default function NotFoundAnimated() {
  const navigate = useNavigate();

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 overflow-hidden relative">
        {/* Floating Pills Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`,
              }}
            >
              <Pill
                className="text-primary/10 dark:text-primary/5"
                size={20 + Math.random() * 30}
              />
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="relative z-10 text-center max-w-2xl w-full">
          {/* Animated 404 */}
          <div className="mb-8">
            <h1 className="text-9xl md:text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient mb-4">
              404
            </h1>
            
            {/* Prescription Pad Style Message */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 mb-8 border-t-4 border-blue-500 transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-center mb-4">
                <Pill className="h-12 w-12 text-blue-500 animate-bounce" />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                 Not Found
              </h2>
              
              <div className="border-l-4 border-blue-500 pl-4 mb-6 text-left">
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
                  <span className="font-semibold">Diagnosis:</span> Page Missing
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
                  <span className="font-semibold">Symptoms:</span> 404 Error
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  <span className="font-semibold">Treatment:</span> Navigate to a valid page
                </p>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The page you're looking for has been discontinued . 
                Let's get you back to the pharmacy!
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => navigate(-1)}
                  variant="outline"
                  className="gap-2 shadow-md hover:shadow-lg transition-shadow"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Go Back
                </Button>
                
                <Button
                  size="lg"
                  onClick={() => navigate("/")}
                  className="gap-2 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Home className="h-4 w-4" />
                  Return Home
                </Button>
              </div>
            </div>

   
          </div>
        </div>

        {/* CSS Animation for Floating Pills */}
        <style jsx>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0) rotate(0deg);
              opacity: 0.1;
            }
            50% {
              transform: translateY(-20px) rotate(180deg);
              opacity: 0.3;
            }
          }
          
          @keyframes gradient {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
          
          .animate-float {
            animation: float linear infinite;
          }
          
          .animate-gradient {
            background-size: 200% 200%;
            animation: gradient 3s ease infinite;
          }
        `}</style>
      </div>
    </ThemeProvider>
  );
}