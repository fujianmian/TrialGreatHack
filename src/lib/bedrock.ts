import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

export function createBedrockClient() {
    console.log("ECS_CONTAINER_METADATA_URI", process.env.ECS_CONTAINER_METADATA_URI);
    console.log("ECS_CONTAINER_METADATA_URI_V4", process.env.ECS_CONTAINER_METADATA_URI_V4);
    console.log("region", process.env.REGION);

    if (process.env.ECS_CONTAINER_METADATA_URI || process.env.ECS_CONTAINER_METADATA_URI_V4) {
        // Running in ECS → rely on Task Role automatically
        console.log("Now is ECSSSSSSSSSSSSSSSSSSSSs");
        return new BedrockRuntimeClient({ region: "us-east-1" });
    } else {
        // Running locally → use env credentials
        console.log("Now is LOCALLLLLLLLLLLLLLLLLLLLLLLL");
        return new BedrockRuntimeClient({
            region: "us-east-1", // or your preferred region
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
            },
        });
    }
}
