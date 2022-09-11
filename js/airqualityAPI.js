export default async function getAirQualityApiData() {
  const aQUrl = buildAQUrl();
  let response = await fetch(aQUrl);
  let data = await response.json();
  return data;
}

function buildAQUrl() {
  let { lat, long } = JSON.parse(localStorage.getItem("savedData"));
  return `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${long}&hourly=pm10,pm2_5,dust,uv_index,uv_index_clear_sky&timezone=auto`;
}
