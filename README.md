# TrialGreatHack

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)  
[![TypeScript](https://img.shields.io/badge/lang-TypeScript-yellow)](https://www.typescriptlang.org/)  
[![Next.js](https://img.shields.io/badge/framework-Next.js-000000)](https://nextjs.org/)

A web application to **[brief description of what it does]** — importing content (PDF, text files, DOC, images) and generating quizzes from it. Built with Next.js, TypeScript, and AI tools.

---

## 📦 Table of Contents

- [Features](#-features)  
- [Demo / Screenshots](#-demo--screenshots)  
- [Getting Started](#-getting-started)  
- [Usage](#-usage)  
- [Architecture](#-architecture)  
- [Configuration](#-configuration)  
- [Contributing](#-contributing)  
- [License](#-license)

---

## 🚀 Features

- Accept uploads of **PDF**, **DOC**, **TXT**, or **image** files.  
- Extract text using OCR (for images).  
- Analyze content to identify key facts, concepts, and important points.  
- Generate quizzes:  
  - Multiple-choice questions  
  - True/False questions  
  - (Optional) Short-answer questions  
- Balanced difficulty level (easy / medium / hard)  
- **AI Video Generation**: Create YouTube-style engaging videos from text using Amazon Nova Pro & Nova Reel
- **Mind Maps**: Generate interactive mind maps from content
- **Summaries**: AI-powered content summarization
- **Flashcards**: Create study cards from your content
- Easily deployable.  

---

## 🖼️ Demo / Screenshots

> *(Include screenshots of the app: upload page, quiz generation, result view etc.)*

---

## 🛠 Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing.

### Prerequisites

- Node.js (>= 16.x)  
- npm or yarn or pnpm  
- AWS Account with Bedrock access
- Amazon Nova Reel model access (request in AWS Bedrock console)
- S3 bucket for video storage
- Optional: setup for OCR (if using external service)  

### Installation

```bash
# clone the repository
git clone https://github.com/fujianmian/TrialGreatHack.git
cd TrialGreatHack

# install dependencies
npm install
# or
yarn install
# or
pnpm install

# create environment file
cp .env.example .env.local
# Edit .env.local with your AWS credentials and S3 bucket

# run the development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

### Configuration

Create a `.env.local` file with the following variables:

```env
# AWS Configuration for Nova Reel
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1

# S3 Bucket for video storage (required for Nova Reel)
AWS_S3_BUCKET=your-video-bucket-name

OPENAI_API_KEY=your-openai-key
```

**Important Setup Steps:**

1. **AWS Bedrock Access**: Request access to `amazon.nova-pro-v1:0` and `amazon.nova-reel-v1:0` in the [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. **S3 Bucket**: Create an S3 bucket for video storage and ensure your AWS user has proper permissions
3. **IAM Permissions**: Your AWS user needs `bedrock:InvokeModel` and S3 permissions

## 🎬 Enhanced Video Generation Features

The application now generates **YouTube-style engaging videos** with intelligent background fetching:

- **5 Video Styles**: Educational, Documentary, Cinematic, Modern, Corporate
- **Smart Background Analysis**: Nova Pro analyzes content to suggest specific, relevant backgrounds and environments
- **Content-Specific Visuals**: AI identifies key themes and suggests appropriate visual elements, props, and scenes
- **Dynamic Visual Storytelling**: Each video shot includes specific camera movements, lighting, and contextual environments
- **Intelligent Visual Metaphors**: AI creates visual representations for abstract concepts
- **High Quality**: 16:9 aspect ratio, professional-grade output with contextual backgrounds
- **Multi-Shot Videos**: Up to 2 minutes with consistent style and relevant visual elements

### 🧠 AI Content Analysis
- **Theme Detection**: Identifies key concepts and themes in your content
- **Visual Metaphor Generation**: Creates appropriate visual representations
- **Background Suggestions**: Recommends specific environments (labs, offices, nature, etc.)
- **Contextual Props**: Suggests relevant visual elements and scene details
- **Professional Cinematography**: Specifies camera movements, lighting, and composition

See [AWS_BEDROCK_SETUP.md](./AWS_BEDROCK_SETUP.md) for detailed setup instructions.
