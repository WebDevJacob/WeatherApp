/**
 * Get API data
 * @returns data object from API
 */
export default async function getApiData() {
  const url = buildApiUrl();
  let response = await fetch(url);
  let data = await response.json();
  return data;
}

/**
 * Build the API url with saved parameters
 * @returns the api url to get weather data
 */
function buildApiUrl() {
  let obj = JSON.parse(localStorage.getItem("savedData"));

  const hourlyParams =
    "temperature_2m,dewpoint_2m,surface_pressure,relativehumidity_2m,precipitation,snowfall,weathercode,snow_depth,cloudcover,windspeed_10m,winddirection_10m,soil_temperature_6cm,soil_temperature_18cm";
  const dailyParams =
    "weathercode,temperature_2m_max,sunrise,sunset,precipitation_sum,rain_sum,snowfall_sum,precipitation_hours";

  return `https://api.open-meteo.com/v1/forecast?latitude=${obj.lat}&longitude=${obj.long}&hourly=${hourlyParams}&daily=${dailyParams}&timezone=auto`;
}

/**
 * Get device location if possible and use that as weather location
 * @returns saved data object
 */
export function getUserLocation() {
  if (!navigator.geolocation) {
    infoBanner.classList.add("active");
    infoBanner.textContent = " ⚠️ Can't get device location :( ⚠️";
    setTimeout(() => {
      infoBanner.classList.remove("active");
    }, 2000);
    return;
  }
  navigator.geolocation.getCurrentPosition((position) => {
    const latitude = position.coords.latitude.toFixed(4);
    const longitude = position.coords.longitude.toFixed(4);
    // get device timezone in text format e.g. Europe/Berlin
    const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    let toBeSavedData = {
      name: "[Device Location]",
      timeZone: deviceTimezone,
      lat: latitude,
      long: longitude,
    };

    localStorage.setItem("savedData", JSON.stringify(toBeSavedData));
    localStorage.setItem("prefersDeviceLocation", "true");
  });
}
