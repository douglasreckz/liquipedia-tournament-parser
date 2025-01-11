🌟 Main Functionalities

- Dynamic URL Conversion: Converts Liquipedia URLs into queryable RunQuery format for scraping.
- Multi-Game Support: Supports various game tournament pages (e.g., Overwatch, Counter-Strike, Dota 2, Valorant).
- Player Data Scraping:
- Player Name and Link to Profile
- Current Team
- Social Media Links (Twitter, YouTube, Twitch, Instagram, Faceit)
- Caching: Stores API responses for 5 minutes to reduce server load and API rate limits.
- Rate Limiting: Automatically adds a delay between requests to comply with Liquipedia's API guidelines.
- Custom User-Agent: Uses a personalized User-Agent string to identify the project.

🎨 Frontend Features
- Responsive user interface built with HTML, CSS, and JavaScript.
- Loading Animation: Displays a loading circle with a progress percentage.
- Error Handling: User-friendly messages for invalid URLs or API errors.
- Results Table: Displays scraped data in a clean and organized table format.

Installation Instructions
1. Clone the Repository
   
```
git clone https://github.com/yourusername/liquipedia-scraper.git
cd liquipedia-scraper
```

2. Install Dependencies
   
```
npm install
```

3. Environment Setup
Create a .env file in the root folder and add:

```
PORT=3000
USER_AGENT=LiquipediaScraper/1.0 (https://github.com/yourusername/; your.email@example.com)
```

4. Run the Server Locally
```
node server.js
```
Visit: http://localhost:3000
