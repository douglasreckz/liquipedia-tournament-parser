const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = 3000;

// Cache para armazenar respostas recentes por 1 minuto
const cache = new Map();
const CACHE_EXPIRATION_MS = 300 * 1000; // 5 minutos
const REQUEST_DELAY_MS = 2000; // 2 segundos entre requisições

app.use(express.static(path.join(__dirname, 'public')));

// Função de conversão de URL dinâmica para qualquer jogo
function convertToRunQueryURL(staticURL) {
  try {
    const urlObj = new URL(staticURL);
    const pathParts = urlObj.pathname.split("/");
    const game = pathParts[1]; // Identifica o nome do jogo
    const tournamentPath = pathParts.slice(2).join("/");

    if (!game || !tournamentPath) {
      throw new Error("Invalid URL format. Please enter a valid URL.");
    }

    const baseRunQueryURL = `https://liquipedia.net/${game}/Special:RunQuery/Tournament_player_information`;
    const formattedParams = encodeURIComponent(tournamentPath.replace(/_/g, " "));
    const runQueryURL = `${baseRunQueryURL}?pfRunQueryFormName=Tournament+player+information&TPI%5Bpage%5D=${formattedParams}&wpRunQuery=Run+query`;

    return runQueryURL;
  } catch (error) {
    throw new Error("Invalid or unsupported URL.");
  }
}

// Função para aplicar um delay entre requisições
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.get('/scrape', async (req, res) => {
  const staticURL = req.query.url;

  if (!staticURL) {
    return res.status(400).json({ error: "No URL provided." });
  }

  let convertedURL;

  // 1. Converter a URL fornecida
  try {
    convertedURL = convertToRunQueryURL(staticURL);
    console.log(`Converted URL: ${convertedURL}`);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  // 2. Cache: Verificar se os dados já estão em cache
  const cachedResponse = cache.get(convertedURL);
  if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_EXPIRATION_MS) {
    console.log('Returning cached response');
    return res.status(200).json(cachedResponse.data);
  }

  // 3. Delay entre requisições para respeitar a política de rate limit
  console.log(`Waiting ${REQUEST_DELAY_MS / 1000} seconds before making the request...`);
  await delay(REQUEST_DELAY_MS);

  // 4. Fazer o scraping a partir da URL convertida
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setUserAgent('LiquipediaScraper/1.0 (https://github.com/douglasreckz/; douglas.reckziegel@hotmail.com)');
    await page.goto(convertedURL, { waitUntil: 'networkidle2', timeout: 90000 });

    await page.waitForSelector('div.table-responsive table');

    const scrapedData = await page.evaluate(() => {
      const baseUrl = 'https://liquipedia.net';
      const table = document.querySelector('div.table-responsive table');
      const headers = Array.from(table.querySelectorAll('thead th'));
      const columnIndices = {
        player: headers.findIndex((th) => th.innerText.trim().toLowerCase() === 'player'),
        team: headers.findIndex((th) => th.innerText.trim().toLowerCase() === 'team'),
        links: headers.findIndex((th) => th.innerText.trim().toLowerCase() === 'links')
      };

      const rows = Array.from(table.querySelectorAll('tbody tr'));
      return rows.map((row) => {
        const cells = Array.from(row.children);
        const playerCell = cells[columnIndices.player];
        const playerAnchor = playerCell?.querySelector('a[title]');
        const playerName = playerAnchor?.textContent.trim() || '';
        const playerLink = playerAnchor ? `${baseUrl}${playerAnchor.getAttribute('href')}` : '';
        const teamName = cells[columnIndices.team]?.textContent.trim() || '';
        const socialLinks = {
          twitter: '',
          youtube: '',
          faceit: '',
          twitch: '',
          instagram: ''
        };

        const linksCell = cells[columnIndices.links];
        if (linksCell) {
          const links = Array.from(linksCell.querySelectorAll('a')).filter(link => link.getAttribute('href') && !link.textContent.includes('show'));

          links.forEach(link => {
            const href = link.getAttribute('href');
            const className = link.querySelector('i')?.className || '';
            if (className.includes('lp-twitter')) socialLinks.twitter = href;
            if (className.includes('lp-youtube')) socialLinks.youtube = href;
            if (className.includes('lp-faceit')) socialLinks.faceit = href;
            if (className.includes('lp-twitch')) socialLinks.twitch = href;
            if (className.includes('lp-instagram')) socialLinks.instagram = href;
          });
        }

        return { playerName, playerLink, teamName, socialLinks };
      }).filter(item => item.playerName);
    });

    await browser.close();

    // 5. Salvar a resposta no cache
    cache.set(convertedURL, { data: scrapedData, timestamp: Date.now() });

    res.status(200).json(scrapedData);
  } catch (error) {
    console.error('Error scraping data:', error.message);
    res.status(500).json({ error: 'Failed to fetch data: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
