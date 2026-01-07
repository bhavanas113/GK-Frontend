"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  const [rememberMe, setRememberMe] = useState(false); // New state for Remember Me
  const router = useRouter();

  // Load saved username on page open
  useEffect(() => {
    const savedUser = localStorage.getItem('rememberedUsername');
    if (savedUser) {
      setUsername(savedUser);
      setRememberMe(true);
      // Timeout ensures the DOM is ready for the focus call
      const timer = setTimeout(() => {
        document.getElementById('password-input')?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`https://gk-backend-two.vercel.app/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Handle Remember Me logic
        if (rememberMe) {
          localStorage.setItem('rememberedUsername', username);
        } else {
          localStorage.removeItem('rememberedUsername');
        }

        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (data.user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/trip-form');
        }
      } else {
        alert(data.message || "Invalid Login Credentials");
      }
    } catch (err) {
      alert("Cannot connect to Backend at 192.168.31.247. Is your server.js running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-orange-600 bg-cover bg-center bg-no-repeat p-4 font-sans"
      style={{ backgroundImage: "url('/bg-truck.png')" }} 
    >
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm">
        <h1 className="text-3xl font-bold text-orange-600 mb-2 text-center uppercase tracking-tighter">Ganesh Enterprises</h1>
        <p className="text-gray-500 text-center mb-8 font-medium text-xs uppercase tracking-widest">Logistics Management</p>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Username</label>
            <input 
              type="text" 
              required
              value={username}
              className="w-full border border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition text-base bg-gray-50"
              placeholder="Enter username" 
              onChange={(e) => setUsername(e.target.value)} 
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Password</label>
            <div className="relative">
              <input 
                id="password-input"
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                className="w-full border border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition text-base bg-gray-50"
                placeholder="Enter password" 
                onChange={(e) => setPassword(e.target.value)} 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-600"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center space-x-2 py-1">
            <input 
              type="checkbox" 
              id="remember" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 accent-orange-600 rounded"
            />
            <label htmlFor="remember" className="text-sm font-bold text-gray-500 cursor-pointer select-none">Remember Me</label>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-xl active:scale-95 disabled:bg-gray-400"
          >
            {loading ? "Verifying..." : "LOGIN"}
          </button>
        </form>
      </div>
    </div>
  );
}