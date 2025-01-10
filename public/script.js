document.getElementById('scrape-btn').addEventListener('click', async () => {
  const urlInput = document.getElementById('url-input').value.trim();
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const progressContainer = document.querySelector('.progress-bar-container');
  const tableContainer = document.getElementById('tableContainer');
  const resultTableBody = document.querySelector('#resultTable tbody');

  if (!urlInput) {
    alert("Please enter a valid Liquipedia URL.");
    return;
  }

  // Reset loading state
  progressBar.style.width = '0%';
  progressText.textContent = '0%';
  progressContainer.style.display = 'block';
  tableContainer.style.display = 'none';
  resultTableBody.innerHTML = ''; // Clear previous results

  let progress = 0;
  const updateInterval = 500; // Update every 0.5 seconds
  const estimatedTimeMs = 5000; // Estimated total loading time (5 seconds)
  const maxProgress = 90; // Maximum progress before final load
  const progressStep = (maxProgress / (estimatedTimeMs / updateInterval));

  const interval = setInterval(() => {
    if (progress < maxProgress) {
      progress += progressStep;
      progressBar.style.width = `${Math.round(progress)}%`;
      progressText.textContent = `${Math.round(progress)}%`;
    }
  }, updateInterval);

  try {
    const response = await fetch(`/scrape?url=${encodeURIComponent(urlInput)}`);
    const data = await response.json();

    // Complete loading bar at 100% after 1 second
    setTimeout(() => {
      clearInterval(interval);
      progressBar.style.width = '100%';
      progressText.textContent = '100%';

      // Show the results after the loading bar finishes
      setTimeout(() => {
        progressContainer.style.display = 'none';
        tableContainer.style.display = 'block';

        // Populate table with data
        data.forEach(player => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td><a href="${player.playerLink}" target="_blank">${player.playerName}</a></td>
            <td>${player.teamName}</td>
            <td>${player.socialLinks.twitter ? `<a href="${player.socialLinks.twitter}" target="_blank">Twitter</a>` : '-'}</td>
            <td>${player.socialLinks.youtube ? `<a href="${player.socialLinks.youtube}" target="_blank">YouTube</a>` : '-'}</td>
            <td>${player.socialLinks.faceit ? `<a href="${player.socialLinks.faceit}" target="_blank">Faceit</a>` : '-'}</td>
            <td>${player.socialLinks.twitch ? `<a href="${player.socialLinks.twitch}" target="_blank">Twitch</a>` : '-'}</td>
            <td>${player.socialLinks.instagram ? `<a href="${player.socialLinks.instagram}" target="_blank">Instagram</a>` : '-'}</td>
          `;
          resultTableBody.appendChild(row);
        });
      }, 1000); // Show results 1 second after 100% is reached
    }, 1000);
  } catch (error) {
    clearInterval(interval);
    progressContainer.style.display = 'none';
    tableContainer.style.display = 'none';
    alert(`Error fetching data: ${error.message}`);
  }
});
