// Description:
//   get the pollen count for a USA zip code
//
// Configuration:
//   BROBBOT_POLLEN_MAPBOX_KEY=mysecretkey - Secret key for the mapbox api

const https = require('https');
const MAPBOX_KEY = process.env.BROBBOT_POLLEN_MAPBOX_KEY || '';

function get(url, opts) {
  return new Promise((resolve, reject) => {
    https.get(url, opts || {}, (res) => {
      const d = [];

      if (res.statusCode !== 200) {
        reject(new Error(`Request failed with status ${res.statusCode}`));
      }

      res.on('data', (chunk) => d.push(chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(d.join('')));
        }
        catch (err) {
          reject(err);
        }
      });
    });
  });
}

async function geoCode(query) {
  const data = await get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${encodeURIComponent(MAPBOX_KEY)}&limit=1&types=poi`);
  const {context, text} = data.features[0];
  const zip = context.find(c => /^postcode\b/.test(c.id)).text;
  return {zip, text};
}

async function forecast(place) {
  const url = `https://www.pollen.com/api/forecast/current/pollen/${encodeURIComponent(place)}`;
  const opts = {
    headers: {
      'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36',
      'Referer': url,
    }
  };

  const {Location} = await get(url, opts);
  return Location;
}

function forecastString(data) {
  const {periods} = data;
  const [today, tomorrow] = periods;
  return `Today: ${forecastPeriod(today)}, Tomorrow: ${forecastPeriod(tomorrow)}`;
}

function forecastPeriod(period) {
  return `${period.Triggers.map(t => `${t.Name} ${t.PlantType}`).join(', ')} ${period.Index} ${forecastIcon(period.Index)}`;
}

function forecastIcon(index) {
  if (index <= 2.4) {
    return ':smile:';
  }
  if (index <= 4.8) {
    return ':slightly_smiling_face:';
  }
  if (index <= 7.2) {
    return ':neutral_face:';
  }
  if (index <= 9.6) {
    return ':slightly_frowning_face:';
  }
  return ':persevere:';
}


module.exports = (robot) => {
  robot.helpCommand("brobbot pollen `query`", "Get the pollen forecast for `query`");

  robot.respond(/^(pollen|cedar) (.+)/i, async (msg) => {
    try {
      const {zip, text} = await geoCode(msg.match[2]);
      const data = await forecast(zip);
      msg.send(`Pollen forecast for ${text}: ${forecastString(data)}`);
    }
    catch (err) {
      msg.send(`No results for ${msg.match[2]} :(`);
      console.error(`brobbot-pollen error: ${err}`);
    }
  });
};
