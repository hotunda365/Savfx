const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const BASE_URL = 'https://www.savfx.com.hk/zh/events'; 
const OUTPUT_FILE = path.join(__dirname, 'migrated_activities.json');

async function scrapeEvents() {
    let allActivities = [];
    console.log('--- 開始抓取 SAVFX 舊網站首頁活動資料 ---');

    try {
        const response = await axios.get(BASE_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);
        const items = [];

        // 嘗試更廣泛的選擇器
        $('.event-item, .blog-item, .post-item, [class*="event"], [class*="post"]').each((i, el) => {
            const title = $(el).find('h2, h3, .title').first().text().trim();
            const date = $(el).find('span, .date, time').first().text().trim() || '2024-01-01';
            const content = $(el).find('p, .description, .excerpt').first().text().trim();
            let img = $(el).find('img').attr('src');

            if (title && title.length > 2) {
                items.push({
                    id: `legacy-direct-${i}-${Date.now()}`,
                    title,
                    date,
                    content: content.slice(0, 300),
                    img: img ? (img.startsWith('http') ? img : `https://www.savfx.com.hk${img}`) : 'https://www.savfx.com.hk/images/default.jpg',
                    tags: content.match(/#[^\s#\u3000]+/g) || ['#SAVFX', '#AI', '#活動重溫']
                });
            }
        });

        allActivities = items;
        console.log(`首頁初步抓取結果: ${allActivities.length} 筆`);

    } catch (error) {
        console.error(`抓取失敗: ${error.message}`);
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allActivities, null, 2), 'utf8');
    console.log(`--- 任務結束，資料已儲存 ---`);
}

scrapeEvents();
