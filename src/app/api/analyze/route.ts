import { NextResponse } from "next/server";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

// 初始化 Bedrock 客户端
const client = new BedrockRuntimeClient({
  region: "ap-southeast-1", // 记得改成支持的区域
});

export async function POST(req: Request) {
  const body = await req.json();
  const text = body.text || "";

  // 构建 prompt
  const prompt = `
  请阅读以下文章，并找出其中10个最深奥或不常见的词语。
  对每个词语，给出简明的解释。
  以JSON数组形式返回，格式如下：
  [
    {"word": "词1", "meaning": "解释1"},
    {"word": "词2", "meaning": "解释2"}
  ]

  文章内容：
  ${text}
  `;

  const command = new InvokeModelCommand({
    modelId: "arn:aws:bedrock:ap-southeast-1:268060978153:inference-profile/apac.amazon.nova-pro-v1:0",  // ✅ 用 model 短名
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      inputText: prompt,     // ✅ Nova 模型用 inputText
      textGenerationConfig: {
        maxTokenCount: 500,
        temperature: 0.7,
      },
    }),
  });

  try {
    const response = await client.send(command);

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const resultText = responseBody.outputText; // Claude 返回的文本

    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText); // 转成 JSON
    } catch {
      parsedResult = [{ word: "解析失败", meaning: resultText }];
    }

    return NextResponse.json({ result: parsedResult });
  } catch (error) {
    console.error("Bedrock error:", error);
    return NextResponse.json({ error: "调用失败" }, { status: 500 });
  }
}
