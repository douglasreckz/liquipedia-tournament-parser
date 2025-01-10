const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = 3000;

const url = 'https://liquipedia.net/overwatch/Special:RunQuery/Tournament_player_information?title=Special%3ARunQuery%2FTournament_player_information&pfRunQueryFormName=Tournament+player+information&TPI=page%3DOverwatch%2BChampions%2BSeries%252F2024%252FEMEA%252FStage_3&wpRunQuery=&pf_free_text=&TPI%5Bpage%5D=Overwatch+Champions+Series%2F2024%2FEMEA%2FStage_4&wpRunQuery=&pf_free_text=';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Servir a página HTML
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/scrape', async (req, res) => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    await page.waitForSelector('div.table-responsive table');

    const scrapedData = await page.evaluate(() => {
      const baseUrl = 'https://liquipedia.net';
      const table = document.querySelector('div.table-responsive table');
      const headers = table.querySelectorAll('thead th');
      let playerColumnIndex = -1;

      headers.forEach((th, index) => {
        if (th.innerText.trim() === 'Player') {
          playerColumnIndex = index;
        }
      });

      if (playerColumnIndex === -1) throw new Error('Player column not found');

      const rows = table.querySelectorAll('tbody tr');
      const data = [];

      rows.forEach((row) => {
        const cols = row.querySelectorAll('td');
        if (cols.length <= playerColumnIndex) return;

        const playerAnchor = cols[playerColumnIndex].querySelector('a');
        const playerName = playerAnchor ? playerAnchor.textContent.trim() : '';
        const playerLink = playerAnchor ? `${baseUrl}${playerAnchor.getAttribute('href')}` : '';
        const teamName = cols[4]?.textContent.trim() || '';

        // ** Extracting Social Media Links (ignoring "show photo" links): **
        const socialLinks = {
          twitter: '',
          youtube: '',
          faceit: '',
          twitch: '',
          instagram: ''
        };

        const socialIcons = Array.from(cols[6]?.querySelectorAll('a')).filter(
          (icon) => icon.getAttribute('href') !== '#'
        ); // Ignore "show" links

        socialIcons.forEach((icon) => {
          const href = icon.getAttribute('href');
          const className = icon.querySelector('i')?.className || '';

          if (className.includes('lp-twitter')) socialLinks.twitter = href;
          if (className.includes('lp-youtube')) socialLinks.youtube = href;
          if (className.includes('lp-faceit')) socialLinks.faceit = href;
          if (className.includes('lp-twitch')) socialLinks.twitch = href;
          if (className.includes('lp-instagram')) socialLinks.instagram = href;
        });

        data.push({
          playerName,
          playerLink,
          teamName,
          socialLinks
        });
      });

      return data;
    });

    await browser.close();
    await delay(2000); // 2-second delay
    res.status(200).json(scrapedData);
  } catch (error) {
    console.error('Error scraping data:', error.message);
    res.status(500).json({ error: 'Failed to scrape data.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
