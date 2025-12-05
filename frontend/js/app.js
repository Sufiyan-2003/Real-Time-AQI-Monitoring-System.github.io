// frontend/js/app.js
class AQIMonitor {
  constructor() {
    this.baseUrl = "http://" + window.location.hostname + ":5000/api";
    this.currentLocation = null;   // {lat, lng} when GPS used
    this.currentCity = null;       // city string when user searches
    this.refreshInterval = 15000;  // 15s
    this.refreshTimer = null;
    this.chart = null;

    // initialize
    document.addEventListener("DOMContentLoaded", () => {
      this.bindEvents();
      this.askLocationPermission();
      this.initChart();
    });

    // expose for debug if needed
    window.aqiMonitor = this;
  }

  // ---------------------
  // EVENTS
  // ---------------------
  bindEvents() {
    document.getElementById("searchBtn").onclick = () => this.handleSearch();
    document.getElementById("citySearch").onkeypress = (e) => {
      if (e.key === "Enter") this.handleSearch();
    };
    document.getElementById("citySearch").oninput = (e) =>
      this.handleSearchInput(e.target.value);

    // manual refresh button (rotating class expected in CSS)
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        this.refreshNow();
      });
    }
  }

  // ---------------------
  // LOCATION (ask permission)
  // ---------------------
  askLocationPermission() {
    if (!navigator.geolocation) {
      this.showLocationPrompt();
      return;
    }

    this.showLoading();

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // GPS allowed -> set GPS mode and fetch
        this.currentLocation = {
          lat: Number(pos.coords.latitude),
          lng: Number(pos.coords.longitude)
        };
        this.currentCity = null; // GPS overrides any previous search
        this.fetchAQIData();     // initial load for GPS
        this.startAutoRefresh(); // only start auto-refresh in GPS mode
      },
      (err) => {
        // user denied or timeout -> prompt to search
        console.warn("Geolocation error:", err);
        this.showLocationPrompt();
        this.hideLoading();
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }

  showLocationPrompt() {
    const locEl = document.getElementById("currentLocation");
    if (locEl) locEl.textContent = "Location Off — Search your city";
    const inputEl = document.getElementById("citySearch");
    if (inputEl) inputEl.placeholder = "Search for a city...";
  }

  // ---------------------
  // AUTO-REFRESH (only GPS)
  // ---------------------
  startAutoRefresh() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = setInterval(() => {
      // Only refresh automatically if we are in GPS mode (no currentCity)
      if (!this.currentCity && this.currentLocation) {
        this.fetchAQIData();
      }
    }, this.refreshInterval);
  }

  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  refreshNow() {
    // short visual feedback
    const btn = document.getElementById("refreshBtn");
    if (btn) btn.classList.add("rotating");
    // fetch depending on mode
    if (this.currentCity) this.fetchAQIData({ city: this.currentCity });
    else if (this.currentLocation) this.fetchAQIData();
    setTimeout(() => { if (btn) btn.classList.remove("rotating"); }, 900);
  }

  // ---------------------
  // FETCH AQI (GPS or city)
  // ---------------------
  async fetchAQIData(params = {}) {
    this.showLoading();

    try {
      let url = null;

      if (params.city) {
        // user requested a city explicitly
        this.currentCity = params.city;
        this.currentLocation = null; // disable GPS mode
        url = `${this.baseUrl}/current?city=${encodeURIComponent(params.city)}`;
      } else if (this.currentLocation) {
        // GPS mode
        url = `${this.baseUrl}/current?lat=${this.currentLocation.lat}&lng=${this.currentLocation.lng}`;
      } else if (this.currentCity) {
        // last searched city
        url = `${this.baseUrl}/current?city=${encodeURIComponent(this.currentCity)}`;
      } else {
        throw new Error("No location or city available.");
      }

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok || !json.success) {
        // show friendly message (avoid ugly alert for repeated use)
        const message = (json && json.error) ? json.error : "Failed to fetch AQI data";
        this.showTemporaryError(message);
        this.hideLoading();
        return;
      }

      // keep currentCity for search-mode (GPS mode keeps currentLocation)
      this.currentCity = json.city || this.currentCity;
      // display cleaned location text and remove ", null" or trailing nulls
      this.updateUI(json);

      // update chart (history) if backend returns data
      await this.updateChart(json);

      this.hideLoading();
    } catch (err) {
      console.error("fetchAQIData error:", err);
      this.showTemporaryError(err.message || "Network error");
      this.hideLoading();
    }
  }

  // ---------------------
  // UI UPDATE
  // ---------------------
  updateUI(data) {
    // display_location or city might contain ", null". clean it up.
    let place = (data.display_location || data.city || "").toString();
    place = place.replace(/\s*,\s*null\s*$/i, ""); // remove trailing ", null"
    place = place.replace(/\s*,\s*null(\s*,|$)/gi, ","); // remove isolated nulls
    place = place.replace(/\s*,\s*$/g, ""); // trailing comma

    const locEl = document.getElementById("currentLocation");
    locEl && (locEl.textContent = place || `${data.city || "Unknown"}, ${data.country || ""}`);

    // AQI header values
    document.getElementById("aqiValue").textContent = data.aqi ?? "--";
    document.getElementById("aqiCategory").textContent = data.category ?? "--";
    document.getElementById("healthAdvisory").textContent = data.health_advisory ?? "";
    document.getElementById("dominantPollutant").textContent = data.dominant_pollutant ?? "--";

    // decorate circle
    const circle = document.getElementById("aqiCircle");
    if (circle && data.color) {
      circle.style.borderColor = data.color;
      circle.style.boxShadow = `0 0 28px ${data.color}40`;
      document.getElementById("aqiValue").style.color = data.color;
      document.getElementById("aqiCategory").style.color = data.color;
    }

    // update pollutant cards with color
    this.updatePollutants(data);
  }

  // ---------------------
  // Pollutant cards with color by sub-index
  // ---------------------
  updatePollutants(data) {
    const grid = document.getElementById("pollutantsGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const pollutants = data.pollutants || {};
    const sub = data.sub_indices || {};

    // order of display (preferred)
    const order = ["CO", "NO2", "O3", "PM10", "PM2.5", "SO2"];
    const keys = order.filter(k => k in pollutants).concat(Object.keys(pollutants).filter(k => !order.includes(k)));

    for (const poll of keys) {
      const val = pollutants[poll];
      const si = sub[poll] ?? null;

      // color mapping according to Indian AQI categories (approx)
      let color = "#00E400"; // Good (green)
      if (si >= 51 && si <= 100) color = "#FFFF00";      // Satisfactory / Moderate (yellow)
      if (si >= 101 && si <= 200) color = "#FF7E00";     // Moderate/Unhealthy (orange)
      if (si >= 201 && si <= 300) color = "#FF0000";     // Poor (red)
      if (si >= 301) color = "#8F3F97";                  // Very Poor / Severe (purple)

      const card = document.createElement("div");
      card.className = "pollutant-card";
      card.style.border = `2px solid ${color}33`;
      card.style.boxShadow = `0 6px 18px ${color}22`;
      card.innerHTML = `
        <div class="pollutant-name">${poll}</div>
        <div class="pollutant-value" style="color:${color};font-weight:700;font-size:28px">${val ?? "--"}</div>
        <div class="pollutant-unit">µg/m³</div>
        <div class="pollutant-index" style="background:${color}20;color:${color};padding:8px;border-radius:12px;margin-top:8px;display:inline-block;">
          Sub-index: ${si ?? "--"}
        </div>
      `;
      grid.appendChild(card);
    }
  }

  // ---------------------
  // SEARCH (autocomplete + click)
  // ---------------------
  async handleSearchInput(q) {
    if (!q || q.length < 2) {
      this.hideSearchResults();
      return;
    }

    try {
      const res = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        this.hideSearchResults();
        return;
      }
      this.showSearchResults(json.results || []);
    } catch (err) {
      console.warn("search error", err);
      this.hideSearchResults();
    }
  }

  showSearchResults(list) {
    const box = document.getElementById("searchResults");
    if (!box) return;
    box.innerHTML = "";

    list.forEach(r => {
      const div = document.createElement("div");
      div.className = "search-result-item";
      // show cleaned city text
      let label = (r.city || r.name || "").toString();
      label = label.replace(/\s*,\s*null\s*$/i, "").replace(/\s*,\s*$/g, "");
      div.textContent = `${label}, ${r.country || ""}`;
      div.onclick = () => {
        this.hideSearchResults();
        document.getElementById("citySearch").value = label;
        this.fetchAQIData({ city: label });
      };
      box.appendChild(div);
    });

    box.style.display = list.length ? "block" : "none";
  }

  hideSearchResults() {
    const box = document.getElementById("searchResults");
    if (box) box.style.display = "none";
  }

  handleSearch() {
    const q = document.getElementById("citySearch").value.trim();
    if (!q) return;
    this.fetchAQIData({ city: q });
  }

  // ---------------------
  // CHART: init + update
  // ---------------------
  initChart() {
    const canvas = document.getElementById("aqiChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    this.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [{
          label: "PM2.5 (24h)",
          data: [],
          borderWidth: 2,
          borderColor: "#FFD54F",
          backgroundColor: "rgba(255, 213, 79, 0.12)",
          tension: 0.3,
          fill: true,
          pointRadius: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: "#cfcfcf" } },
          y: { ticks: { color: "#cfcfcf" } }
        },
        plugins: { legend: { labels: { color: "#fff" } } }
      }
    });
  }

  async updateChart(apiData) {
    if (!this.chart) return;

    // call backend history endpoint (may return empty array if WAQI free doesn't provide)
    try {
      const locationId = encodeURIComponent(apiData.display_location || apiData.location || apiData.city || "");
      if (!locationId) return;

      const res = await fetch(`${this.baseUrl}/history?location_id=${locationId}`);
      const json = await res.json();
      if (!res.ok || !json.success || !Array.isArray(json.data) || json.data.length === 0) {
        // no historical data — keep previous chart or clear
        this.chart.data.labels = [];
        this.chart.data.datasets[0].data = [];
        this.chart.update();
        return;
      }

      // data expected: [{timestamp: "...", pm25_avg: number}, ...]
      const labels = json.data.map(d => {
        const dt = new Date(d.timestamp);
        return `${dt.getHours()}:00`;
      });
      const values = json.data.map(d => d.pm25_avg ?? 0);

      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = values;
      this.chart.update();

    } catch (err) {
      console.warn("updateChart error:", err);
    }
  }

  // ---------------------
  // Loading / Errors
  // ---------------------
  showLoading() {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.style.display = "flex";
  }

  hideLoading() {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.style.display = "none";
  }

  showTemporaryError(msg) {
    // small unobtrusive message: fallback to alert if necessary
    console.warn("AQI error:", msg);
    // you can implement a nicer toast here; for now use alert once
    alert(msg);
  }
}

// instantiate the monitor
new AQIMonitor();
