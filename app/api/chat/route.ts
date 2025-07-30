import { DataAPIClient } from "@datastax/astra-db-ts";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const {
    ASTRA_DB_ENDPOINT,
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_APPLICATION_TOKEN,
    GEMINI_API_KEY
} = process.env;

if (!ASTRA_DB_ENDPOINT || !ASTRA_DB_NAMESPACE || !ASTRA_DB_APPLICATION_TOKEN || !ASTRA_DB_COLLECTION || !GEMINI_API_KEY) {
    throw new Error("Missing required environment variables.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_ENDPOINT, {
    keyspace: ASTRA_DB_NAMESPACE
})

export async function POST(req: Request) {
    try {
        const { messages } = await req.json()
        const latestMsg = messages[messages.length - 1]?.content

        let docContext = ""
        
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const embedding = await model.embedContent(latestMsg)
        
        try {
            const collection = await db.collection(ASTRA_DB_COLLECTION!)
            const cursor = collection.find({}, {
                sort: {
                    $vector: embedding.embedding.values
                },
                limit: 10
            })
            const documents = await cursor.toArray()
            const docsMap = documents?.map(doc => doc.text)
            docContext = JSON.stringify(docsMap)
        }
        catch (err) {
            console.log(err);
            docContext = "";
        }

        interface ChatMessage {
            role: 'user' | 'assistant';
            content: string;
        }

        interface GeminiMessage {
            role: 'user' | 'model';
            parts: { text: string }[];
        }

        const formattedMessages: GeminiMessage[] = (messages as ChatMessage[]).map((msg: ChatMessage): GeminiMessage => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const systemPrompt = `You are a highly knowledgeable and reliable AI assistant specialized in medicine. Your responsibilities include providing accurate, evidence-based, and up-to-date information about a wide range of medical topics, such as diseases, treatments, medications, symptoms, diagnostics, healthcare practices, and medical research. When responding to user questions:
        - Use clear, concise, and professional language suitable for both laypersons and healthcare professionals.
        - Integrate and reference any relevant context provided, including recent research, clinical guidelines, or information from the context below.
        - Cite reputable sources or guidelines where applicable (e.g., WHO, CDC, NICE, peer-reviewed journals, UpToDate).
        - Avoid giving personal medical advice, making diagnoses, or recommending specific treatment plans.
        - Encourage users to consult qualified healthcare professionals for personalized medical concerns or emergencies.
        - Clearly state if you are unsure, if the information is outside your scope, or if more research is needed.
        - Explain complex medical concepts in an accessible manner, using analogies or examples when helpful.
        - Highlight risks, benefits, and alternatives when discussing treatments or procedures.
        - Respect privacy and confidentiality, and avoid requesting or storing personal health information.
        
        Context from medical knowledge base: ${docContext}
        
        Your primary goal is to educate, inform, and support users in understanding medical topics safely and responsibly.`;

        const conversationHistory = [
            {
                role: 'user',
                parts: [{ text: systemPrompt }]
            },
            {
                role: 'model',
                parts: [{ text: 'I understand. I will provide accurate, evidence-based medical information while encouraging users to consult healthcare professionals for personal medical advice.' }]
            },
            ...formattedMessages
        ];

        const selectModel = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 2048,
            }
        });

        const result = await selectModel.generateContent({
            contents: conversationHistory
        });

        const response = result.response;
        const text = response.text();

        return NextResponse.json({ 
            message: text,
            success: true 
        });

    } catch (error) {
        console.log("Error querying db or generating response:", error);
        return NextResponse.json({ 
            error: "Internal server error",
            success: false 
        }, { status: 500 });
    }
}