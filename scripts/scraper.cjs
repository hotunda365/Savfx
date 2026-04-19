const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_API_URL = 'https://www.savfx.com.hk/zh/events/page/'; 
const OUTPUT_FILE = path.join(__dirname, 'migrated_activities.json');

async function scrapeEverything() {
    let allActivities = [];
    let page = 1;
    let hasMore = true;

    console.log('--- 🚀 開始全自動抓取 1100+ 筆活動資料 ---');

    while (hasMore) {
        const url = `${BASE_API_URL}${page}`;
        console.log(`📡 正在抓取第 ${page} 頁... (目前累計: ${allActivities.length} 筆)`);

        try {
            const response = await axios.get(url, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest', 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 10000
            });

            const data = response.data;

            if (data && Array.isArray(data) && data.length > 0) {
                const formattedItems = data.map((item, index) => ({
                    id: `legacy-${page}-${index}-${Date.now()}`,
                    title: item.event_title || "未命名活動",
                    date: item.event_date_format || "2024-01-01",
                    content: item.event_desc || "",
                    img: item.event_cover_url ? (item.event_cover_url.startsWith('http') ? item.event_cover_url : `https://www.savfx.com.hk${item.event_cover_url}`) : 'https://www.savfx.com.hk/images/default.jpg',
                    tags: (item.event_desc || "").match(/#[^\s#\u3000]+/g) || ['#SAVFX', '#AI', '#活動重溫']
                }));

                allActivities = [...allActivities, ...formattedItems];
                page++;
                await new Promise(r => setTimeout(r, 300));
            } else {
                console.log('🏁 已經抓取到最後一頁，結束。');
                hasMore = false;
            }

        } catch (error) {
            console.error(`❌ 抓取第 ${page} 頁時發生錯誤:`, error.message);
            hasMore = false;
        }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allActivities, null, 2), 'utf8');
    console.log(`\n✅ 抓取完成！📊 總計抓取: ${allActivities.length} 筆資料`);
}

scrapeEverything();
