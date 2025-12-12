const { createApp } = Vue;

createApp({
  data() {
    return {
      packages: [],
      sensorEvents: {},
      limitProfiles: [],
      weather: {},
      search: ""
    };
  },
  mounted() {
    // Hent pakker og profiler, og hent derefter vejrdata for alle pakker
    this.fetchPackages().then(() => {
      this.packages.forEach(pkg => this.loadWeather(pkg.id));
    });
    this.fetchLimitProfiles();
  },
  computed: {
    filteredPackages() {
      if (!this.search) return this.packages;
      return this.packages.filter(p =>
        p.description?.toLowerCase().includes(this.search.toLowerCase()) ||
        p.id.toString().includes(this.search)
      );
    },
    fragileCount() {
      return this.packages.filter(p => p.latestTilt > 10).length;
    }
  },
  methods: {
    async fetchPackages() {
      try {
        const res = await axios.get("http://localhost:5187/api/package");
        this.packages = res.data.map(p => ({
          id: p.id ?? p.Id,
          description: p.description ?? p.Description,
          limitProfileId: p.limitProfileId ?? p.LimitProfileId,
          latestTilt: null,
          limitProfile: null
        }));
      } catch (err) {
        console.error("Fejl ved hentning af pakker:", err);
      }
    },
    async loadEvents(packageId) {
      try {
        const res = await axios.get(`http://localhost:5187/api/sensorevent/package/${packageId}`);
        this.sensorEvents[packageId] = res.data.map(ev => ({
          id: ev.id ?? ev.Id,
          tilt: ev.tilt ?? ev.Tilt,
          timestamp: ev.timestamp ?? ev.Timestamp
        }));
        if (this.sensorEvents[packageId].length > 0) {
          const latestEvent = this.sensorEvents[packageId].at(-1);
          const pkg = this.packages.find(p => p.id === packageId);
          if (pkg) pkg.latestTilt = latestEvent.tilt;
        }
        // Hent vejrdata samtidig
        this.loadWeather(packageId);
      } catch (err) {
        console.error("Fejl ved hentning af events:", err);
      }
    },
    async fetchLimitProfiles() {
      try {
        const res = await axios.get("http://localhost:5187/api/limitprofile");
        this.limitProfiles = res.data.map(lp => ({
          id: lp.id ?? lp.Id,
          name: lp.name ?? lp.Name,
          maxTiltDegrees: lp.maxTiltDegrees ?? lp.MaxTiltDegrees
        }));
        // Bind profiler til pakker
        this.packages.forEach(pkg => {
          pkg.limitProfile = this.limitProfiles.find(lp => lp.id === pkg.limitProfileId);
        });
      } catch (err) {
        console.error("Fejl ved hentning af limit profiles:", err);
      }
    },
    async loadWeather(packageId) {
      try {
        const apiKey = "b4556485fb0e655b60b4d4de7a5de145"; // din rigtige nøgle
        const cityId = 2618425; // København

        const res = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?id=${cityId}&units=metric&appid=${apiKey}`
        );

        // VIGTIGT: brug 'weather', ikke 'loadweather'
        this.weather[packageId] = {
          temp: res.data.main.temp,
          description: res.data.weather[0].description,
          wind: res.data.wind.speed,
          icon: res.data.weather[0].icon
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
      this.fetchPackages().then(() => {
        this.packages.forEach(pkg => this.loadEvents(pkg.id));
        this.packages.forEach(pkg => this.loadWeather(pkg.id));
      });
      this.fetchLimitProfiles();
    }
  }
}).mount("#app");

