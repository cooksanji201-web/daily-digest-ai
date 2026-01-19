-- Seed Data for VN Sources (Generated)

INSERT INTO raw_news (source_id, title, url, content, published_date, image_url, content_hash)
SELECT id, 'Mổ xẻ NuPhy Air75 V3: bàn phím cơ low-profile gõ êm, gọn đẹp, phù hợp cho người dùng Mac', 'https://tinhte.vn/thread/mo-xe-nuphy-air75-v3-ban-phim-co-low-profile-go-em-gon-dep-phu-hop-cho-nguoi-dung-mac.4067610/', 'Mổ xẻ NuPhy Air75 V3: bàn phím cơ low-profile gõ êm, gọn đẹp, phù hợp cho người dùng Mac', '2025-11-15T15:38:25.000Z', 'https://photo2.tinhte.vn/data/attachment-files/2025/10/8873365_Colorful_Simple_Library_Photo_Collage.jpg', md5('Mổ xẻ NuPhy Air75 V3: bàn phím cơ low-profile gõ êm, gọn đẹp, phù hợp cho người dùng Mac' || 'https://tinhte.vn/thread/mo-xe-nuphy-air75-v3-ban-phim-co-low-profile-go-em-gon-dep-phu-hop-cho-nguoi-dung-mac.4067610/')
FROM sources WHERE url = 'https://tinhte.vn/rss'
ON CONFLICT (url) DO UPDATE SET image_url = EXCLUDED.image_url;

INSERT INTO raw_news (source_id, title, url, content, published_date, image_url, content_hash)
SELECT id, 'Cơn sốt chip AI khiến Apple phải cạnh tranh giành suất sản xuất tại TSMC', 'https://tinhte.vn/thread/con-sot-chip-ai-khien-apple-phai-canh-tranh-gianh-suat-san-xuat-tai-tsmc.4093001/', 'Cơn sốt chip AI khiến Apple phải cạnh tranh giành suất sản xuất tại TSMC', '2026-01-19T06:43:07.000Z', 'https://photo2.tinhte.vn/data/attachment-files/2026/01/8944932_apple-silicon-feature-joeblue.jpg', md5('Cơn sốt chip AI khiến Apple phải cạnh tranh giành suất sản xuất tại TSMC' || 'https://tinhte.vn/thread/con-sot-chip-ai-khien-apple-phai-canh-tranh-gianh-suat-san-xuat-tai-tsmc.4093001/')
FROM sources WHERE url = 'https://tinhte.vn/rss'
ON CONFLICT (url) DO UPDATE SET image_url = EXCLUDED.image_url;

INSERT INTO raw_news (source_id, title, url, content, published_date, image_url, content_hash)
SELECT id, 'Robot Denso "chuyển nghề" nấu cơm chiên chahan', 'https://tinhte.vn/thread/robot-denso-chuyen-nghe-nau-com-chien-chahan.4093026/', 'Robot Denso "chuyển nghề" nấu cơm chiên chahan', '2026-01-19T06:40:35.000Z', NULL, md5('Robot Denso "chuyển nghề" nấu cơm chiên chahan' || 'https://tinhte.vn/thread/robot-denso-chuyen-nghe-nau-com-chien-chahan.4093026/')
FROM sources WHERE url = 'https://tinhte.vn/rss'
ON CONFLICT (url) DO UPDATE SET image_url = EXCLUDED.image_url;

INSERT INTO raw_news (source_id, title, url, content, published_date, image_url, content_hash)
SELECT id, 'MacBook Pro OLED có thể được trang bị cảm ứng?', 'https://tinhte.vn/thread/macbook-pro-oled-co-the-duoc-trang-bi-cam-ung.4093005/', 'MacBook Pro OLED có thể được trang bị cảm ứng?', '2026-01-19T06:33:21.000Z', 'https://photo2.tinhte.vn/data/attachment-files/2026/01/8944939_M6-MacBook-Pro-Feature-1-3.jpg', md5('MacBook Pro OLED có thể được trang bị cảm ứng?' || 'https://tinhte.vn/thread/macbook-pro-oled-co-the-duoc-trang-bi-cam-ung.4093005/')
FROM sources WHERE url = 'https://tinhte.vn/rss'
ON CONFLICT (url) DO UPDATE SET image_url = EXCLUDED.image_url;

INSERT INTO raw_news (source_id, title, url, content, published_date, image_url, content_hash)
SELECT id, 'Proteus: trực thăng robot săn ngầm nặng 3 tấn của Hải quân Anh', 'https://tinhte.vn/thread/proteus-truc-thang-robot-san-ngam-nang-3-tan-cua-hai-quan-anh.4092834/', 'Proteus: trực thăng robot săn ngầm nặng 3 tấn của Hải quân Anh', '2026-01-19T05:42:41.000Z', 'https://photo2.tinhte.vn/data/attachment-files/2026/01/8944574_cover-truc-thang-tu-dong-proteus-bay-thu-tai-predannack.jpg', md5('Proteus: trực thăng robot săn ngầm nặng 3 tấn của Hải quân Anh' || 'https://tinhte.vn/thread/proteus-truc-thang-robot-san-ngam-nang-3-tan-cua-hai-quan-anh.4092834/')
FROM sources WHERE url = 'https://tinhte.vn/rss'
ON CONFLICT (url) DO UPDATE SET image_url = EXCLUDED.image_url;
