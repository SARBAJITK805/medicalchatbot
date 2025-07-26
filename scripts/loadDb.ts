import { DataAPIClient } from "@datastax/astra-db-ts"
import "dotenv/config"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";

type SimilarityMetric = "dot_product" | "cosine" | "euclidean"

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

const data: string[] = [
    "https://www.who.int/news-room/fact-sheets",
    "https://www.cdc.gov/healthyliving/index.html",
    "https://www.nih.gov/news-events/nih-research-matters",
    "https://www.mayoclinic.org/healthy-lifestyle",
    "https://www.health.harvard.edu/topics",
    "https://www.webmd.com/health-news",
    "https://www.medicalnewstoday.com/",
    "https://www.healthline.com/health-news",
    "https://www.nhs.uk/live-well/",
    "https://www.clevelandclinic.org/health",
    "https://www.hopkinsmedicine.org/health",
    "https://www.fda.gov/consumers/consumer-updates",
    "https://www.unicef.org/health",
    "https://www.heart.org/en/healthy-living",
    "https://www.cancer.org/latest-news.html",
]

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE })

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100
})

const createCollection = async (similarityMetric: SimilarityMetric = "cosine") => {
    try {
        const res = await db.createCollection(ASTRA_DB_COLLECTION, {
            vector: {
                dimension: 768,
                metric: similarityMetric
            }
        })
        console.log("Collection created:", res);
    } catch (error) {
        console.log("Collection might already exist or error occurred:", error);
    }
}

const scrapePage = async (url: string): Promise<string> => {
    try {
        const loader = new PuppeteerWebBaseLoader(url, {
            launchOptions: {
                headless: true
            },
            gotoOptions: {
                waitUntil: "domcontentloaded"
            },
            evaluate: async (page, browser) => {
                const result = await page.evaluate(() => document.body.innerHTML)
                await browser.close()
                return result;
            }
        });
        
        const content = await loader.scrape();
        return content?.replace(/<[^>]*>?/gm, '') || '';
    } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        return '';
    }
}

const getEmbedding = async (text: string): Promise<number[]> => {
    try {
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw error;
    }
}

const loadSampleData = async () => {
    try {
        const collection = await db.collection(ASTRA_DB_COLLECTION)
        
        for (const url of data) {
            console.log(`Processing: ${url}`);
            
            const content = await scrapePage(url)
            if (!content.trim()) {
                console.log(`Skipping ${url} - no content retrieved`);
                continue;
            }
            
            const chunks = await splitter.splitText(content)
            console.log(`Created ${chunks.length} chunks for ${url}`);
            
            for (const chunk of chunks) {
                if (!chunk.trim()) continue; // Skip empty chunks
                
                try {
                    const vector = await getEmbedding(chunk);

                    const res = await collection.insertOne({
                        $vector: vector,
                        text: chunk,
                        source: url,
                        timestamp: new Date().toISOString()
                    })
                    
                    console.log(`Inserted chunk from ${url}:`, res);
                    
                    // Add a small delay to respect rate limits
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                } catch (embeddingError) {
                    console.error(`Error processing chunk from ${url}:`, embeddingError);
                }
            }
        }
        console.log("Data loading completed!");
    } catch (error) {
        console.error("Error in loadSampleData:", error);
    }
}

// Main execution
const main = async () => {
    try {
        await createCollection();
        await loadSampleData();
    } catch (error) {
        console.error("Main execution error:", error);
    }
}

main();