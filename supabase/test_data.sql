-- ================================================================
-- TEST DATA FOR GENERATE-DIGEST CHECKPOINT
-- ================================================================
-- Purpose: Validate semantic deduplication and summarization
-- 
-- Expected Results:
--   - Tin A → INCLUDED in digest
--   - Tin B → EXCLUDED (semantic duplicate of A, similarity > 0.85)
--   - Tin C → INCLUDED in digest
-- ================================================================

-- Step 0: Clean up any existing test data (OPTIONAL - comment out if not needed)
-- DELETE FROM raw_news WHERE url IN ('nvidia.com/news1', 'techcrunch.com/nv-chip', 'openai.com/o1');

-- Step 1: Generate embeddings using Gemini API
-- You need to call the Gemini embedding API for each news item.
-- Below is a Node.js/Deno script approach, OR you can use the SQL workaround.

-- ================================================================
-- OPTION A: Manual Insert with Pre-generated Embeddings
-- ================================================================
-- Run this AFTER generating embeddings via the helper script below

-- ================================================================
-- OPTION B: Insert WITHOUT embeddings (for basic test only)
-- ================================================================
-- This will test Gemini summarization but NOT semantic deduplication
-- The generate-digest function will still work, but won't filter Tin B

INSERT INTO raw_news (title, url, content, created_at)
VALUES 
  (
    'Nvidia ra mắt chip Blackwell mới với hiệu năng gấp 3 lần thế hệ cũ',
    'nvidia.com/news1',
    'Nvidia vừa công bố thế hệ GPU Blackwell với hiệu năng tăng vọt so với thế hệ Hopper trước đó. Jensen Huang, CEO của Nvidia cho biết đây là bước nhảy vọt lớn nhất trong lịch sử công ty. Chip mới hỗ trợ AI inference tốt hơn 30 lần.',
    NOW() - INTERVAL '2 hours'
  ),
  (
    'Thế hệ GPU Blackwell của Nvidia hứa hẹn hiệu năng vượt trội so với Hopper',
    'techcrunch.com/nv-chip',
    'TechCrunch đưa tin: Nvidia ra mắt chip Blackwell mới, với nhiều cải tiến về hiệu năng AI và đồ họa. Thế hệ GPU mới này được kỳ vọng sẽ thay đổi cuộc chơi trong lĩnh vực AI hardware.',
    NOW() - INTERVAL '1 hour'
  ),
  (
    'OpenAI ra mắt mô hình o1 có khả năng suy luận như người',
    'openai.com/o1',
    'OpenAI chính thức ra mắt o1, mô hình AI mới có khả năng suy luận phức tạp. Không giống các mô hình trước, o1 có thể "suy nghĩ" trước khi trả lời, giúp giải quyết các bài toán logic và toán học tốt hơn đáng kể.',
    NOW() - INTERVAL '30 minutes'
  )
ON CONFLICT (url) DO NOTHING;

-- Verify inserted data
SELECT id, title, url, 
       CASE WHEN embedding IS NULL THEN 'NO EMBEDDING' ELSE 'HAS EMBEDDING' END as embedding_status,
       created_at
FROM raw_news 
WHERE url IN ('nvidia.com/news1', 'techcrunch.com/nv-chip', 'openai.com/o1')
ORDER BY created_at DESC;
