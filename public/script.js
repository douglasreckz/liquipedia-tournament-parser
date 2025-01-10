document.getElementById('convertButton').addEventListener('click', async () => {
    const urlInput = document.getElementById('urlInput').value.trim();
    const resultMessage = document.getElementById('resultMessage');
    const tableContainer = document.getElementById('tableContainer');
    const tableBody = document.querySelector('#resultTable tbody');
  
    if (!urlInput) {
      resultMessage.textContent = "Please enter a URL.";
      resultMessage.style.color = "red";
      tableContainer.style.display = "none"; // Hide the table if no URL is provided
      return;
    }
  
    try {
      const response = await fetch(`/scrape?url=${encodeURIComponent(urlInput)}`);
      const data = await response.json();
  
      if (response.ok) {
        resultMessage.textContent = "Data successfully fetched!";
        resultMessage.style.color = "green";
  
        // Clear the table before adding new data
        tableBody.innerHTML = "";
  
        // Add the data to the table
        data.forEach((player) => {
          const row = document.createElement('tr');
  
          row.innerHTML = `
            <td><a href="${player.playerLink}" target="_blank">${player.playerName}</a></td>
            <td>${player.teamName || "No team"}</td>
            <td>${player.socialLinks.twitter ? `<a href="${player.socialLinks.twitter}" target="_blank">Twitter</a>` : "-"}</td>
            <td>${player.socialLinks.youtube ? `<a href="${player.socialLinks.youtube}" target="_blank">YouTube</a>` : "-"}</td>
            <td>${player.socialLinks.faceit ? `<a href="${player.socialLinks.faceit}" target="_blank">Faceit</a>` : "-"}</td>
            <td>${player.socialLinks.twitch ? `<a href="${player.socialLinks.twitch}" target="_blank">Twitch</a>` : "-"}</td>
            <td>${player.socialLinks.instagram ? `<a href="${player.socialLinks.instagram}" target="_blank">Instagram</a>` : "-"}</td>
          `;
  
          tableBody.appendChild(row);
        });
  
        tableContainer.style.display = "block"; // Show the table
      } else {
        resultMessage.textContent = `Error: ${data.error}`;
        resultMessage.style.color = "red";
        tableContainer.style.display = "none";
      }
    } catch (error) {
      resultMessage.textContent = "Error connecting to the server.";
      resultMessage.style.color = "red";
      tableContainer.style.display = "none";
    }
  });
  