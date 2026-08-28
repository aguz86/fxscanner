const https = require('https');

https.get('https://nfs.faireconomy.media/ff_calendar_thisweek.json', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const high = json.filter(item => item.impact === 'High');
      console.log('High impact events:', high.length);
      console.log(high);
    } catch (e) {
      console.error(e);
    }
  });
});
