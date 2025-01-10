const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = 3000;

const url = 'https://liquipedia.net/overwatch/Special:RunQuery/Tournament_player_information?title=Special%3ARunQuery%2FTournament_player_information&pfRunQueryFormName=Tournament+player+information&TPI=page%3DOverwatch%2BChampions%2BSeries%252F2024%252FEMEA%252FStage%2B1&wpRunQuery=&pf_free_text=&TPI%5Bpage%5D=FACEIT+League%2FSeason_1%2FNA%2FMaster&wpRunQuery=&pf_free_text=';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
      if (!table) throw new Error('Table not found!');

      // Obter os índices apenas das colunas que nos interessam
      const headers = Array.from(table.querySelectorAll('thead th'));
      const columnIndices = {
        player: headers.findIndex((th) => th.innerText.trim().toLowerCase() === 'player'),
        team: headers.findIndex((th) => th.innerText.trim().toLowerCase() === 'team'),
        links: headers.findIndex((th) => th.innerText.trim().toLowerCase() === 'links')
      };

      const rows = Array.from(table.querySelectorAll('tbody tr'));
      if (!rows.length) throw new Error('No rows found in the table!');

      return rows.map((row) => {
        const cells = Array.from(row.children); // Usar children ao invés de querySelectorAll('td')
        
        // Extrair dados do jogador
        const playerCell = cells[columnIndices.player];
        const playerAnchor = playerCell?.querySelector('a[title]');
        const playerName = playerAnchor?.textContent.trim() || '';
        const playerLink = playerAnchor ? `${baseUrl}${playerAnchor.getAttribute('href')}` : '';

        // Extrair dados da equipe
        const teamCell = cells[columnIndices.team];
        const teamName = teamCell?.textContent.trim() || '';

        // Extrair links sociais
        const socialLinks = {
          twitter: '',
          youtube: '',
          faceit: '',
          twitch: '',
          instagram: ''
        };

        const linksCell = cells[columnIndices.links];
        if (linksCell) {
          const links = Array.from(linksCell.querySelectorAll('a')).filter(link => {
            const href = link.getAttribute('href');
            return href && href !== '#' && !link.textContent.includes('show');
          });

          links.forEach(link => {
            const href = link.getAttribute('href');
            const icon = link.querySelector('i');
            const className = icon?.className || '';

            if (className.includes('lp-twitter')) socialLinks.twitter = href;
            if (className.includes('lp-youtube')) socialLinks.youtube = href;
            if (className.includes('lp-faceit')) socialLinks.faceit = href;
            if (className.includes('lp-twitch')) socialLinks.twitch = href;
            if (className.includes('lp-instagram')) socialLinks.instagram = href;
          });
        }

        return {
          playerName,
          playerLink,
          teamName,
          socialLinks
        };
      }).filter(item => item.playerName);
    });

    await browser.close();
    await delay(2000);
    res.status(200).json(scrapedData);
  } catch (error) {
    console.error('Error scraping data:', error.message);
    res.status(500).json({ error: 'Failed to scrape data.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});