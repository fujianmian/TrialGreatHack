import { NextResponse } from 'next/server';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'ap-southeast-5',
});

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validate environment variables
    if (!process.env.COGNITO_CLIENT_ID) {
      console.error('Missing COGNITO_CLIENT_ID environment variable');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    console.log('Attempting authentication for:', email);
    console.log('Using region:', process.env.AWS_REGION || 'ap-southeast-5');
    console.log('Client ID:', process.env.COGNITO_CLIENT_ID);

    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const response = await client.send(command);

    return NextResponse.json({
      idToken: response.AuthenticationResult?.IdToken,
      accessToken: response.AuthenticationResult?.AccessToken,
      refreshToken: response.AuthenticationResult?.RefreshToken,
      expiresIn: response.AuthenticationResult?.ExpiresIn,
      email: email,
    });
  } catch (error: any) {
    console.error('Cognito error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    let message = 'Authentication failed';
    if (error.name === 'NotAuthorizedException') {
      message = 'Invalid email or password';
    } else if (error.name === 'UserNotFoundException') {
      message = 'User not found';
    } else if (error.name === 'UserNotConfirmedException') {
      message = 'Please verify your email';
    } else if (error.name === 'InvalidParameterException') {
      message = 'Invalid request parameters';
    } else if (error.name === 'TooManyRequestsException') {
      message = 'Too many login attempts. Please try again later';
    } else if (error.name === 'ResourceNotFoundException') {
      message = 'User pool not found. Please contact support';
    }

    return NextResponse.json(
      { error: message },
      { status: 401 }
    );
  }
}