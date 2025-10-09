'use client';
export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');

    if (code) {
      exchangeCodeForToken(code);
    } else {
      setError('Authorization code not found.');
    }
  }, [searchParams]);

  const exchangeCodeForToken = async (code: string) => {
    try {
      const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
      const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
      const redirectUri = window.location.origin + '/auth/callback';

      if (!cognitoDomain || !clientId) {
        throw new Error('Cognito domain or client ID is not configured.');
      }

      const response = await fetch(`https://${cognitoDomain}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          redirect_uri: redirectUri,
          code: code,
        }),
      });

      const tokens = await response.json();

      if (!response.ok) {
        throw new Error(tokens.error_description || 'Failed to exchange code for tokens.');
      }

      // Extract user info from the ID token
      const idTokenPayload = JSON.parse(atob(tokens.id_token.split('.')[1]));
      const session = {
        idToken: tokens.id_token,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        email: idTokenPayload.email,
      };

      // Store the session
      sessionStorage.setItem('cognitoSession', JSON.stringify(session));
      localStorage.setItem('cognitoSession', JSON.stringify(session));

      // Redirect to the home page
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <i className="fas fa-exclamation-circle text-red-400 text-4xl mb-4"></i>
            <p className="text-red-300">{error}</p>
          </>
        ) : (
          <>
            <i className="fas fa-spinner fa-spin text-white text-4xl mb-4"></i>
            <p className="text-gray-300">Authenticating...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-white text-4xl mb-4"></i>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}