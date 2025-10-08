'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CognitoUserPool, CognitoUser } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: 'ap-southeast-5_7fYn86Mn5',
  ClientId: '7jqp9vjf661kpqlcfmhi1ssn00'
};

const userPool = new CognitoUserPool(poolData);

export default function VerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(link);

    // Get email from sessionStorage
    const storedEmail = sessionStorage.getItem('pendingVerificationEmail');
    console.log('Retrieved email from sessionStorage:', storedEmail);
    
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      setShowEmailInput(true);
    }

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  const handleVerify = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!code) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);

    const userData = {
      Username: email,
      Pool: userPool
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.confirmRegistration(code, true, (err, result) => {
      setIsLoading(false);
      if (err) {
        setError(err.message || 'Verification failed');
        return;
      }
      setSuccess('Email verified successfully! Redirecting to login...');
      sessionStorage.removeItem('pendingVerificationEmail');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    });
  };

  const handleResendCode = () => {
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setResendLoading(true);

    const userData = {
      Username: email,
      Pool: userPool
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.resendConfirmationCode((err, result) => {
      setResendLoading(false);
      if (err) {
        setError(err.message || 'Failed to resend code');
        return;
      }
      setSuccess('Verification code resent! Check your email.');
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
            <i className="fas fa-envelope-open-text text-3xl text-white"></i>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Verify Your Email</h1>
          {email && !showEmailInput ? (
            <>
              <p className="text-gray-300">We've sent a verification code to</p>
              <p className="text-purple-400 font-semibold mt-1">{email}</p>
            </>
          ) : (
            <p className="text-gray-300">Enter your email and verification code</p>
          )}
        </div>

        {/* Verification Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-center gap-2">
                <i className="fas fa-exclamation-circle text-red-400"></i>
                <span className="text-red-300 text-sm">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3 flex items-center gap-2">
                <i className="fas fa-check-circle text-green-400"></i>
                <span className="text-green-300 text-sm">{success}</span>
              </div>
            )}

            {/* Email Input - show if no email in sessionStorage */}
            {showEmailInput && (
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
                  />
                </div>
              </div>
            )}

            {/* Verification Code Input */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Verification Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fas fa-key text-gray-400"></i>
                </div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleVerify(e)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Enter the 6-digit code from your email
              </p>
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fas fa-spinner fa-spin"></i>
                  Verifying...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <i className="fas fa-check"></i>
                  Verify Email
                </span>
              )}
            </button>

            {/* Resend Code */}
            <div className="text-center">
              <p className="text-gray-300 text-sm mb-2">Didn't receive the code?</p>
              <button
                onClick={handleResendCode}
                disabled={resendLoading}
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {resendLoading ? (
                  <span className="flex items-center gap-2">
                    <i className="fas fa-spinner fa-spin"></i>
                    Resending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <i className="fas fa-redo"></i>
                    Resend Code
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Back to Sign Up Link */}
        <div className="mt-6 text-center">
          <a
            href="/signup"
            className="text-gray-400 hover:text-gray-200 transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <i className="fas fa-arrow-left"></i>
            Back to Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}