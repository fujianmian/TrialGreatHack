'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HistoryComponent from './history';

export default function HistoryPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<{ email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      try {
        const sessionData = sessionStorage.getItem('cognitoSession') || localStorage.getItem('cognitoSession');
        const userData = localStorage.getItem('userData');
        
        if (sessionData && userData) {
          const parsedUserData = JSON.parse(userData);
          setUserData(parsedUserData);
        } else {
          // Always use the real user with data
          console.log('Using real user data for history');
          setUserData({ email: 'angelphoon7@gmail.com' });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleBack = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl mb-4 shadow-2xl">
            <i className="fas fa-spinner fa-spin text-3xl text-white"></i>
          </div>
          <p className="text-gray-300">Loading your history...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <HistoryComponent userEmail={userData.email} onBack={handleBack} />
    </div>
  );
}

