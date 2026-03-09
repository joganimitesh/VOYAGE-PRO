const express = require("express");
const axios = require("axios");
const router = express.Router();

// 🔑 OpenRouter API Key
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";

router.post("/chat", async (req, res) => {
    const { message, history, userData, replyTo } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    try {
        const userName = userData?.name || "traveler";
        const savedCount = userData?.savedPackages?.length || 0;

        const systemPrompt = `You are a warm, enthusiastic, and highly personalized AI travel assistant for Voyage Tour and Travel. 
        
        Your goal is to help ${userName} plan their perfect trip. 
        - Always address the user by their name (${userName}) to make it personal.
        - Be human-like, empathetic, and engaging. Avoid robotic responses. 
        - Use emojis 🌍✈️🌴 occasionally to keep the tone light and fun.
        - If the user asks for recommendations, ask about their preferences (budget, interests like adventure vs. relaxation) before giving a list.
        - You know that ${userName} has ${savedCount} saved packages. If relevant, encourage them to review their saved items.
        - Format your responses using Markdown (lists, bold text for emphasis).
        - Keep responses concise but helpful.`;

        // Construct messages array: System prompt + History + New Message
        const messages = [
            {
                role: "system",
                content: systemPrompt
            },
            ...history, // [{ role: 'user', content: '...' }, { role: 'assistant', content: '...' }]
            {
                role: "user", content: replyTo
                    ? `[Replying to ${replyTo.role === "user" ? "my own" : "your"} message: "${replyTo.content}"]
${message}`
                    : message
            }
        ];

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-oss-120b",
                messages: messages,
            },
            {
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:5173", // Optional: for OpenRouter rankings
                    "X-Title": "Voyage Travel Chat", // Optional
                },
            }
        );

        const botReply = response.data.choices[0].message.content;
        res.json({ reply: botReply });

    } catch (error) {
        console.error("AI Chat Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch AI response" });
    }
});

module.exports = router;
