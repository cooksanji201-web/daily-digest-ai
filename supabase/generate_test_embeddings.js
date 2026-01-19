/**
 * TEST HELPER: Generate Embeddings for Test Data
 * 
 * Usage:
 *   1. Create a .env file with:
 *      SUPABASE_URL=...
 *      SUPABASE_SERVICE_KEY=...
 *      GEMINI_API_KEY=...
 *   2. Run: node generate_test_embeddings.js
 */

// Load env vars if you use dotenv, or just expect them in process.env
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_KEY';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_KEY';

// Test data following the "Acid Test" specification
const testNews = [
    {
        title: 'Nvidia ra mắt chip Blackwell mới với hiệu năng gấp 3 lần thế hệ cũ',
        url: 'nvidia.com/news1',
        content: 'Nvidia vừa công bố thế hệ GPU Blackwell với hiệu năng tăng vọt so với thế hệ Hopper trước đó. Jensen Huang, CEO của Nvidia cho biết đây là bước nhảy vọt lớn nhất trong lịch sử công ty. Chip mới hỗ trợ AI inference tốt hơn 30 lần.'
    },
    {
        title: 'Thế hệ GPU Blackwell của Nvidia hứa hẹn hiệu năng vượt trội so với Hopper',
        url: 'techcrunch.com/nv-chip',
        content: 'TechCrunch đưa tin: Nvidia ra mắt chip Blackwell mới, với nhiều cải tiến về hiệu năng AI và đồ họa. Thế hệ GPU mới này được kỳ vọng sẽ thay đổi cuộc chơi trong lĩnh vực AI hardware.'
    },
    {
        title: 'OpenAI ra mắt mô hình o1 có khả năng suy luận như người',
        url: 'openai.com/o1',
        content: 'OpenAI chính thức ra mắt o1, mô hình AI mới có khả năng suy luận phức tạp. Không giống các mô hình trước, o1 có thể "suy nghĩ" trước khi trả lời, giúp giải quyết các bài toán logic và toán học tốt hơn đáng kể.'
    }
];

async function generateEmbedding(text) {
    if (GEMINI_API_KEY.includes('YOUR_GEMINI_KEY')) {
        console.error('❌ Please set GEMINI_API_KEY environment variable');
        return null;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: { parts: [{ text: text.substring(0, 8000) }] }
        })
    });

    const data = await response.json();

    if (data.embedding) {
        return data.embedding.values;
    }

    console.error('Embedding error:', data);
    return null;
}

// ... rest of the helper logic ...
