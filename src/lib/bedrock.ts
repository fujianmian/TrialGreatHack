import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

export function createBedrockClient() {
    console.log("🔧 Creating Bedrock client...");
    console.log("ECS_CONTAINER_METADATA_URI", process.env.ECS_CONTAINER_METADATA_URI);
    console.log("ECS_CONTAINER_METADATA_URI_V4", process.env.ECS_CONTAINER_METADATA_URI_V4);
    console.log("AWS_REGION", process.env.AWS_REGION);
    console.log("AWS_ACCESS_KEY_ID", process.env.AWS_ACCESS_KEY_ID ? `${process.env.AWS_ACCESS_KEY_ID.substring(0, 8)}...` : "NOT SET");
    console.log("AWS_SECRET_ACCESS_KEY", process.env.AWS_SECRET_ACCESS_KEY ? `${process.env.AWS_SECRET_ACCESS_KEY.substring(0, 8)}...` : "NOT SET");

    const region = process.env.AWS_REGION || "us-east-1";
    
    if (process.env.ECS_CONTAINER_METADATA_URI || process.env.ECS_CONTAINER_METADATA_URI_V4) {
        // Running in ECS → rely on Task Role automatically
        console.log("✅ Using ECS Task Role for AWS credentials");
        return new BedrockRuntimeClient({ region });
    } else {
        // Running locally → use env credentials
        console.log("🏠 Using local environment credentials");
        
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
        
        if (!accessKeyId || !secretAccessKey) {
            throw new Error("AWS credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env.local file");
        }
        
        return new BedrockRuntimeClient({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
    }
}
