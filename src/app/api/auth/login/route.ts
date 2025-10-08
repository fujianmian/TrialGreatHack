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
    
    let message = 'Authentication failed';
    if (error.name === 'NotAuthorizedException') {
      message = 'Invalid email or password';
    } else if (error.name === 'UserNotFoundException') {
      message = 'User not found';
    } else if (error.name === 'UserNotConfirmedException') {
      message = 'Please verify your email';
    }

    return NextResponse.json(
      { error: message },
      { status: 401 }
    );
  }
}