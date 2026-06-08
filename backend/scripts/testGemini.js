import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load environment variables
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ GEMINI_API_KEY is not defined in the environment variables.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testModel() {
    try {
        console.log("Initializing model: gemini-3.1-flash-lite...");
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

        const prompt = "Can you write a 2-sentence summary about why data privacy is important on the internet? Please format it clearly.";

        console.log("Sending prompt:", prompt);
        console.log("Waiting for response...\n");

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("✅ Success! Model responded with:");
        console.log("--------------------------------------------------");
        console.log(text);
        console.log("--------------------------------------------------");
    } catch (error) {
        console.error("❌ Failed to communicate with the model:");
        console.error(error);
    }
}

testModel();
