import React, { useEffect, useRef, useState } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  ArrowLeft, 
  Home, 
  Terminal,
  AlertTriangle 
} from 'lucide-react';

// Simplified Shadcn-like components for the single-file environment
const Card = ({ children, className = "" }) => (
  <div className={`bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl ${className}`}>
    {children}
  </div>
);

const Button = ({ children, variant = "primary", className = "", ...props }) => {
  const variants = {
    primary: "bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-500/20",
    outline: "bg-transparent border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300",
    ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
  };
  return (
    <button 
      className={`px-4 py-2.5 rounded-lg font-medium transition-all active:scale-95 flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, className = "" }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wider uppercase border border-red-200 bg-red-50 text-red-600 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 ${className}`}>
    {children}
  </span>
);

const App = () => {
  const canvasRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    // Matrix/Security Grid Particles
    const particles = [];
    const particleCount = 40;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random()
      });
    }

    let frame = 0;

    const render = () => {
      frame++;
      
      // Clear with deep theme-aware color
      ctx.fillStyle = '#020617'; // slate-950
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.3)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Animated Particles (Digital Dust)
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;

        ctx.fillStyle = `rgba(239, 68, 68, ${p.opacity * (0.3 + Math.sin(frame * 0.02) * 0.2)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Perimeter Alert Glow
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width
      );
      const intensity = 0.1 + Math.sin(frame * 0.03) * 0.05;
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0)');
      gradient.addColorStop(1, `rgba(239, 68, 68, ${intensity})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Center Scan Line
      const scanY = (frame * 2) % canvas.height;
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.05)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(canvas.width, scanY);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center font-sans overflow-hidden bg-slate-950">
      {/* Canvas Background */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-0 pointer-events-none" 
      />

      {/* Content Layer */}
      <div className={`relative z-10 w-full max-w-lg p-6 transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
        <Card className="p-8 md:p-10">
          <div className="flex flex-col items-center text-center">
            
            {/* Animated Header Icon */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-red-500 blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative bg-red-50 dark:bg-red-950/40 p-5 rounded-2xl border border-red-100 dark:border-red-900/50">
                <ShieldAlert className="w-12 h-12 text-red-600 dark:text-red-500" />
              </div>
            </div>

            <Badge className="mb-4">
              Error 403: Forbidden
            </Badge>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
              Access Restricted
            </h1>
            
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8 max-w-[280px] md:max-w-xs">
              This terminal is restricted to authorized personnel. Your authentication level is insufficient to access this protocol.
            </p>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <Button 
                variant="primary" 
                onClick={() => window.location.href = '/'}
              >
                
                Go Login
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
              >
                <ArrowLeft size={18} />
                Return Back
              </Button>
            </div>

            {/* Technical Detail Footer */}
            <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 w-full flex flex-col items-center gap-4">
              <div className="flex items-center gap-6 text-slate-400 dark:text-slate-500">
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <Lock size={12} />
                  ENCRYPTED
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <Terminal size={12} />
                  LOGGED
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <AlertTriangle size={12} />
                  TRACED
                </div>
              </div>
              
              <button className="text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-red-500 transition-colors font-semibold">
                Report Identification Conflict
              </button>
            </div>
          </div>
        </Card>

        {/* Support Link */}
        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-600">
          Need higher clearance? <a href="#" className="underline underline-offset-4 hover:text-slate-300 transition-colors">Contact System Administrator</a>
        </p>
      </div>
    </div>
  );
};

export default App;