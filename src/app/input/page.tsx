"use client";
import { useState } from "react";

export default function InputPage() {
  const [text, setText] = useState("");
  const [cards, setCards] = useState<{ word: string; meaning: string }[]>([]);
  const [loading, setLoading] = useState(false);


  async function handleSubmit() {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setCards(data.result || []);
  }

  return (
    <div className="p-6">
      <h1 className="text-xl mb-4">AI 分析文章</h1>

      <textarea
        placeholder="请输入文章..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="border p-3 rounded w-full h-32 mb-3"
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? "分析中..." : "Submit"}
      </button>

      <div className="mt-6">
        {cards.map((c, i) => (
          <div key={i} className="border rounded p-4 mb-3">
            <h2 className="font-bold mb-2">{c.word}</h2>
            <p>{c.meaning}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
