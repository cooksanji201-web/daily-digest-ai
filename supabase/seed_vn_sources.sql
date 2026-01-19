-- Insert Vietnamese Tech/News Sources
INSERT INTO sources (name, url, type, active) VALUES
('VnExpress Tin Mới', 'https://vnexpress.net/rss/tin-moi-nhat.rss', 'rss', true),
('Tuổi Trẻ Công Nghệ', 'https://tuoitre.vn/rss/cong-nghe.rss', 'rss', true),
('Tinh Tế', 'https://tinhte.vn/rss', 'rss', true),
('GenK', 'https://genk.vn/cong-nghe.rss', 'rss', true)
ON CONFLICT (url) DO NOTHING;
