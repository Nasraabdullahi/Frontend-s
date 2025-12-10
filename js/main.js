const { createApp } = Vue;

createApp({
  data() {
    return {
      packages: [],
      events: {},
      weather: {}
    };
  },
  mounted() {
    this.fetchPackages();
  },
  methods: {
    async fetchPackages() {
      try {
        const res = await axios.get("http://localhost:5000/api/packages");
        this.packages = res.data.map(p => ({
          ...p,
          latestTilt: 0 // placeholder, kan opdateres fra events
        }));
      } catch (err) {
        console.error("Fejl ved hentning af pakker:", err);
      }
    },
    async loadEvents(packageId) {
      try {
        const res = await axios.get(`http://localhost:5000/api/sensorevents/package/${packageId}`);
        this.events[packageId] = res.data;
        if (res.data.length > 0) {
          this.packages.find(p => p.id === packageId).latestTilt = res.data[res.data.length - 1].tilt;
        }
      } catch (err) {
        console.error("Fejl ved hentning af events:", err);
      }
    },
    async loadWeather(packageId) {
      try {
        // Eksempel: OpenWeatherMap (kræver API key)
        const apiKey = "DIN_API_KEY";
        const city = "Copenhagen"; // evt. dynamisk fra pakken
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
    }
  }
}).mount("#app");
