'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CognitoUserPool, CognitoUserAttribute } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: 'ap-southeast-5_7fYn86Mn5', // e.g., ap-southeast-1_xxxxxxx
  ClientId: '7jqp9vjf661kpqlcfmhi1ssn00'   // e.g., 6j1example4abcd...
};

const userPool = new CognitoUserPool(poolData);


export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
// meet supervisor before 12 November, end of Nov second meetings

    // Basic validation as before...
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all fields');
        return;
    }

    if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
    }

    setIsLoading(true);

    const attributeList = [
        new CognitoUserAttribute({ Name: 'nickname', Value: formData.name }),
        new CognitoUserAttribute({ Name: 'email', Value: formData.email })
    ];

    userPool.signUp(formData.email, formData.password, attributeList, [], (err, result) => {
        setIsLoading(false);
        if (err) {
        setError(err.message || 'Sign up failed');
        return;
        }
        console.log('User signed up:', result);
        alert('Account created successfully! Please check your email for verification code.');
        router.push('/verify');
    });
    };


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
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-300">Start your learning journey today</p>
        </div>

        {/* Sign Up Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-center gap-2">
                <i className="fas fa-exclamation-circle text-red-400"></i>
                <span className="text-red-300 text-sm">{error}</span>
              </div>
            )}

            {/* Full Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fas fa-user text-gray-400"></i>
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

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
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
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
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">At least 8 characters</p>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fas fa-lock text-gray-400"></i>
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {/* Terms & Conditions Checkbox */}
            <div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                />
                <span className="text-sm text-gray-300">
                  I agree to the{' '}
                  <a href="/terms" className="text-purple-400 hover:text-purple-300">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-purple-400 hover:text-purple-300">
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>

            {/* Sign Up Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fas fa-spinner fa-spin"></i>
                  Creating Account...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <i className="fas fa-user-plus"></i>
                  Create Account
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-gray-400">Or sign up with</span>
              </div>
            </div>

            {/* Social Sign Up Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  // Handle Google signup
                  console.log('Google signup clicked');
                }}
                className="py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <i className="fab fa-google"></i>
                Google
              </button>
              <button
                type="button"
                onClick={() => {
                  // Handle GitHub signup
                  console.log('GitHub signup clicked');
                }}
                className="py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <i className="fab fa-github"></i>
                GitHub
              </button>
            </div>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-300">
              Already have an account?{' '}
              <a
                href="/login"
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
              >
                Sign in
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