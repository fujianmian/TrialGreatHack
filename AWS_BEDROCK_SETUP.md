# AWS Bedrock Setup Guide

## The Issue
Your application is trying to use AWS Bedrock AI models but failing with these errors:
- "You don't have access to the model with the specified model ID"
- "The provided model identifier is invalid"

## Solution Steps

### 1. Check AWS Bedrock Model Access
1. Go to [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. Navigate to "Model access" in the left sidebar
3. Look for Amazon Nova Pro models (primary choice) ✅ **ACCESS GRANTED**
4. Look for Amazon Nova Lite models (secondary choice)
5. Look for Anthropic models (Claude) as fallbacks
6. If you see "Request model access" buttons, click them to request access

### 2. Request Access to AI Models
You need to request access to:
- `amazon.nova-pro-v1:0` (Primary - Amazon Nova Pro) ✅ **PERMISSION GRANTED**
- `amazon.nova-lite-v1:0` (Secondary - Amazon Nova Lite)
- `amazon.nova-reel-v1:0` (Video Generation - Amazon Nova Reel) ⚠️ **REQUIRED FOR VIDEO**
- `anthropic.claude-3-haiku-20240307-v1:0` (Fallback)
- `anthropic.claude-3-sonnet-20240229-v1:0` (Fallback)

### 3. Verify AWS Credentials
Make sure your `.env.local` file has:
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-video-bucket-name
```

### 4. Check IAM Permissions
Your AWS user/role needs these permissions:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:ListFoundationModels"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your-video-bucket-name/*"
        }
    ]
}
```

### 5. Alternative: Use Different Region
If models aren't available in `us-east-1`, try:
- `us-west-2`
- `eu-west-1`
- `ap-southeast-1`

Update your `.env.local`:
```
AWS_REGION=us-west-2
```

## Current Status
- ✅ AI is being called (not the issue)
- ✅ AWS credentials are detected
- ✅ **Nova Pro access granted** (primary model)
- ✅ Fallback algorithm works when AI fails

## Why Nova Pro?
- **🚀 More Powerful**: Superior reasoning and generation capabilities
- **🎯 Better Quality**: Higher quality flashcard generation
- **⚡ Fast**: Optimized for AWS Bedrock infrastructure
- **💰 Cost-Effective**: Amazon's own model with competitive pricing

## Nova Reel for Video Generation
- **🎬 Studio Quality**: Generate realistic, high-quality videos from text
- **⏱️ Flexible Duration**: Create videos up to 2 minutes (multiple 6-second shots)
- **🎨 Consistent Style**: Maintain visual consistency across video shots
- **🖼️ Image Support**: Use reference images to guide video generation
- **📱 Easy Integration**: Simple API calls through AWS Bedrock

## Test the Fix
After requesting model access (can take a few minutes to hours), restart your dev server:
```bash
npm run dev
```

The application will now show better error messages and try multiple model variants.
