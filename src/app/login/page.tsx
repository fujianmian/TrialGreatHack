'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// AWS Cognito Configuration
const COGNITO_CONFIG = {
  userPoolId: 'YOUR_USER_POOL_ID', // e.g., 'us-east-1_XXXXXXXXX'
  clientId: 'YOUR_CLIENT_ID', // e.g., '1234567890abcdefghijklmnop'
  region: 'YOUR_REGION' // e.g., 'us-east-1'
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Font Awesome
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(link);
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const session = getStoredSession();
      if (session && session.idToken) {
        // Verify the token is still valid
        const isValid = await verifyToken(session.idToken);
        if (isValid) {
          router.push('/');
          return;
        } else {
          clearSession();
        }
      }
    } catch (err) {
      console.error('Session check error:', err);
      clearSession();
    } finally {
      setIsLoading(false);
    }
  };

  const getStoredSession = () => {
    if (typeof window === 'undefined') return null;
    const sessionData = sessionStorage.getItem('cognitoSession');
    const localData = localStorage.getItem('cognitoSession');
    
    if (sessionData) return JSON.parse(sessionData);
    if (localData) return JSON.parse(localData);
    return null;
  };

  const storeSession = (tokens: any, remember: boolean) => {
    const sessionData = JSON.stringify(tokens);
    sessionStorage.setItem('cognitoSession', sessionData);
    if (remember) {
      localStorage.setItem('cognitoSession', sessionData);
    }
    sessionStorage.setItem('authToken', tokens.idToken);
    localStorage.setItem('userData', JSON.stringify({ email: tokens.email }));
  };

  const clearSession = () => {
    sessionStorage.removeItem('cognitoSession');
    localStorage.removeItem('cognitoSession');
  };

  const verifyToken = async (idToken: string) => {
    try {
      // Decode the JWT token (basic check)
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if token is expired
      if (payload.exp && payload.exp > currentTime) {
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const authenticateWithCognito = async (username: string, password: string) => {
    // Call your backend API endpoint that handles Cognito authentication
    const apiUrl = '/api/auth/login'; // Your backend API endpoint
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Authentication failed');
      }

      // Expecting backend to return: { idToken, accessToken, refreshToken, expiresIn }
      return data;
    } catch (err: any) {
      throw new Error(err.message || 'Network error occurred');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      // Authenticate with AWS Cognito via backend
      const authResult = await authenticateWithCognito(email, password);

      if (authResult && authResult.idToken) {
        // Store the session
        const tokens = {
          idToken: authResult.idToken,
          accessToken: authResult.accessToken,
          refreshToken: authResult.refreshToken,
          expiresIn: authResult.expiresIn,
          email: email
        };

        storeSession(tokens, rememberMe);

        // Redirect to dashboard
        router.push('/');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle specific Cognito errors
      const errorMessage = err.message || 'An error occurred';
      if (errorMessage.includes('NotAuthorizedException')) {
        setError('Invalid email or password');
      } else if (errorMessage.includes('UserNotFoundException')) {
        setError('User not found');
      } else if (errorMessage.includes('UserNotConfirmedException')) {
        setError('Please verify your email before logging in');
      } else if (errorMessage.includes('PasswordResetRequiredException')) {
        setError('Password reset required');
      } else if (errorMessage.includes('TooManyRequestsException')) {
        setError('Too many attempts. Please try again later');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading spinner while checking session
  if (isLoading && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-white text-4xl mb-4"></i>
          <p className="text-gray-300">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl mb-4 shadow-2xl">
            <i className="fas fa-graduation-cap text-3xl text-white"></i>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-300">Sign in to continue your learning journey</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-center gap-2">
                <i className="fas fa-exclamation-circle text-red-400"></i>
                <span className="text-red-300 text-sm">{error}</span>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fas fa-envelope text-gray-400"></i>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fas fa-lock text-gray-400"></i>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                />
                <span className="text-sm text-gray-300">Remember me</span>
              </label>
              <a href="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fas fa-spinner fa-spin"></i>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <i className="fas fa-sign-in-alt"></i>
                  Sign In
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-gray-400">Or continue with</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  // Handle Google login via Cognito
                  console.log('Google login clicked');
                }}
                className="py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <i className="fab fa-google"></i>
                Google
              </button>
              <button
                type="button"
                onClick={() => {
                  // Handle GitHub login via Cognito
                  console.log('GitHub login clicked');
                }}
                className="py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <i className="fab fa-github"></i>
                GitHub
              </button>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-300">
              Don't have an account?{' '}
              <a
                href="/signup"
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
              >
                Sign up
              </a>
            </p>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-gray-400 hover:text-gray-200 transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <i className="fas fa-arrow-left"></i>
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}