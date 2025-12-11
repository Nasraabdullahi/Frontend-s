const { createApp } = Vue;

createApp({
  data() {
    return {
      packages: [],       // pakker fra API
      sensorEvents: {},   // events pr. pakke
      limitProfiles: {},  // evt. limit profiles
      weather: {},        // tredjeparts vejrdata
      search: ""          // søgefelt til filter
    };
  },
  mounted() {
    this.fetchPackages();
    this.fetchLimitProfiles();
  },
  computed: {
    filteredPackages() {
      if (!this.search) return this.packages;
      return this.packages.filter(p =>
        p.Description?.toLowerCase().includes(this.search.toLowerCase()) ||
        p.Id.toString().includes(this.search)
      );
    },
    fragileCount() {
      return this.packages.filter(p => p.latestTilt > 10).length;
    }
  },
  methods: {
    async fetchPackages() {
      try {
        const res = await axios.get("http://localhost:5187/api/Package");
        this.packages = res.data.map(p => ({
          id: p.Id,
          description: p.Description,
          Tilt: 0,
          limitProfile: null
        }));
      } catch (err) {
        console.error("Fejl ved hentning af pakker:", err);
      }
    },
    async loadEvents(packageId) {
      try {
        const res = await axios.get(`http://localhost:5187/api/SensorEvent/package/${packageId}`);
        this.sensorEvents[packageId] = res.data.map(ev => ({
          id: ev.id,
          tilt: ev.tilt,
          pitch: ev.pitch,
          roll: ev.roll,
          yaw: ev.yaw,
          timestamp: ev.timestamp
        }));
        if (this.sensorEvents[packageId].length > 0) {
          const latestEvent = this.sensorEvents[packageId].at(-1);
          const pkg = this.packages.find(p => p.id === packageId);
          if (pkg) pkg.latestTilt = latestEvent.tilt;
        }
      } catch (err) {
        console.error("Fejl ved hentning af events:", err);
      }
    },
    async fetchLimitProfiles() {
      try {
        const res = await axios.get("http://localhost:5187/api/limitprofile");
        this.limitProfiles = res.data;
      } catch (err) {
        console.error("Fejl ved hentning af limit profiles:", err);
      }
    },
    async loadWeather(packageId) {
      try {
        const apiKey = "DIN_API_KEY"; // indsæt din OpenWeatherMap nøgle
        const city = "Copenhagen";
        const res = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
        );
        this.weather[packageId] = {
          temp: res.data.main.temp,
          description: res.data.weather[0].description,
          wind: res.data.wind.speed
        };
      } catch (err) {
        console.error("Fejl ved hentning af vejr:", err);
      }
    },
    displayTilt(tilt) {
      return tilt ? `${tilt.toFixed(2)}°` : "Ingen data";
    },
    formatTimestamp(ts) {
      return new Date(ts).toLocaleString("da-DK");
    },
    tiltClass(pkg) {
      if (!pkg.latestTilt) return "text-muted";
      return pkg.latestTilt > 10 ? "text-danger font-weight-bold" : "text-success";
    },
    hasTiltLimit(pkg) {
      return pkg.limitProfile?.maxTiltDegrees !== undefined;
    },
    refreshAll() {
      this.fetchPackages();
      this.fetchLimitProfiles();
    }
  }
}).mount("#app");

// Testkald til API
axios.get("http://localhost:5187/api/package")
  .then(res => console.log("API test response:", res.data))
  .catch(err => console.error("API test fejl:", err));

