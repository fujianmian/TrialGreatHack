# Study Hub - AI-Powered Learning Platform

This is a Next.js application that leverages AI to provide a suite of tools for students and educators. It uses AWS services for backend infrastructure and OpenAI for its AI-powered features.

## Features

*   **AI-Powered Content Generation:**
    *   **Exam Generation:** Automatically create exams from PDF documents.
    *   **Summarization:** Generate concise summaries of long texts.
    *   **Mind Maps:** Create mind maps to visualize complex topics.
    *   **Quizzes:** Generate quizzes from your study materials.
    *   **Text-to-Picture:** Convert text descriptions into images.
    *   **Video Generation:** Create videos from text or other content.
*   **Authentication:** Secure user authentication using AWS Cognito.
*   **PDF Processing:** Extract text from PDFs and generate new PDF documents.
*   **Database Integration:** Stores and retrieves data from a PostgreSQL database.
*   **File Storage:** Uses AWS S3 for secure file storage.
*   **Chatbot:** An interactive chatbot to assist users.

## Getting Started

### Prerequisites

*   Node.js (v20 or later)
*   npm
*   An AWS account
*   An OpenAI account
*   A PostgreSQL database

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/fujianmian/TrialGreatHack.git
    cd TrialGreatHack
    ```

2.  Install the dependencies:
    ```bash
    npm install
    ```

3.  Set up the environment variables. Create a `.env.local` file in the root of the project and add the following environment variables:

    ```
    # AWS Credentials
    AWS_ACCESS_KEY_ID=your_aws_access_key_id
    AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
    AWS_REGION=your_aws_region
    AWS_S3_BUCKET=your_s3_bucket_name

    # AWS Cognito
    NEXT_PUBLIC_COGNITO_DOMAIN=your_cognito_domain
    NEXT_PUBLIC_COGNITO_CLIENT_ID=your_cognito_client_id
    NEXT_PUBLIC_COGNITO_USER_POOL_ID=your_cognito_user_pool_id
    NEXT_PUBLIC_AWS_REGION=your_aws_region
    COGNITO_CLIENT_ID=your_cognito_client_id

    # Database
    DATABASE_URL=your_database_url
    DB_SSL=true

    # OpenAI
    OPENAI_API_KEY=your_openai_api_key

    # Application
    NEXT_PUBLIC_BASE_URL=http://localhost:3000
    ```

4.  Initialize the database:
    ```bash
    npm run db:init
    ```

5.  Run the development server:
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:3000`.

## Scripts

*   `npm run dev`: Starts the development server.
*   `npm run build`: Builds the application for production.
*   `npm run start`: Starts the production server.
*   `npm run lint`: Lints the codebase.
*   `npm run db:init`: Initializes the database.
