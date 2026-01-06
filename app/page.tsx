"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if a user session exists in the browser
    const user = localStorage.getItem('user');
    
    if (!user) {
      // If no user is found, strictly open the login page first
      router.push('/login'); 
    } else {
      try {
        const parsedUser = JSON.parse(user);
        
        // If user exists, send them to their specific dashboard
        if (parsedUser.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/trip-form');
        }
      } catch (error) {
        // If data is corrupted, clear it and go to login
        localStorage.removeItem('user');
        router.push('/login');
      }
    }
  }, [router]);

  // This is what the user sees for a split second while the app decides where to go
  return (
    <div className="flex h-screen items-center justify-center bg-[#0f172a] text-white">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">GANESH ENT.</h2>
        <p className="text-gray-400 animate-pulse">Initializing system...</p>
      </div>
    </div>
  );
}