import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

export function createBedrockClient() {
    const region = "us-east-1";
    console.log("Forcing AWS Region:", region);

    // Check if running in an ECS environment
    if (process.env.ECS_CONTAINER_METADATA_URI || process.env.ECS_CONTAINER_METADATA_URI_V4) {
        console.log("Running in ECS. Using Task Role for credentials.");
        return new BedrockRuntimeClient({ region });
    } else {
        // Running locally, use credentials from .env.local
        console.log("Running locally. Using credentials from environment variables.");
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

        if (!accessKeyId || !secretAccessKey) {
            throw new Error("AWS credentials (AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY) are not defined in the environment.");
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
