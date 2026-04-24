const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let count = 0;
  const fixed = data.map(item => {
    if (item.img && /^https?:\/\/www\.savfx\.com\.hk_/.test(item.img)) {
      item.img = item.img.replace(
        /^https?:\/\/www\.savfx\.com\.hk_(.+)$/,
        'https://www.savfx.com.hk/images/lib/_$1'
      );
      count++;
    }
    return item;
  });
  fs.writeFileSync(filePath, JSON.stringify(fixed, null, 2), 'utf8');
  console.log(filePath + ': fixed ' + count + ' URLs');
  if (fixed.length > 0) console.log('  sample:', fixed[0].img);
}

fixFile(path.join(__dirname, 'migrated_activities.json'));
fixFile(path.join(__dirname, 'recent_100_activities.json'));
