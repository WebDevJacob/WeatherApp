const hourIndex = new Date().getHours();
const todayCard = document.querySelector(".today");
const sunriseElem = document.querySelector(".sun-diagram .rise span");
const sunsetElem = document.querySelector(".sun-diagram .set span");
const next6DaysSection = document.querySelector(".next-6-days");

import createChart from "./charts.js";

/**
 * = function name
 * @returns saved user location or string indicating usage of device location
 */
function getPreferedLocationFormat() {
  if (JSON.parse(localStorage.getItem("prefersDeviceLocation") == "true")) {
    return ["📱📡", ""];
  } else {
    let savedData = JSON.parse(localStorage.getItem("savedData"));
    let country = savedData.country ? savedData.country : "";
    return [savedData.name, country];
  }
}

/**
 * Formats time string to en-GB localeDateString
 * @param {string} time time string of any type
 * @returns formatted time string
 */
function createDateString(time) {
  let dateOptions = { weekday: "short", day: "numeric", month: "2-digit" };
  return new Date(time).toLocaleDateString("en-GB", dateOptions);
}

/**
 * Get weather icon depending on conditions
 * @param {number} code weather code
 * @param {boolean} codePoint if funtion should return code point or html tag
 * @returns weather code appropiate icon as htlm or code poinz
 */
export function getWeatherIcon(code, codePoint = false) {
  let obj = {
    0: ["sun", "\uF5A2"],
    1: ["sun", "\uF5A2"],
    2: ["cloud-sun", "\uF2BE"],
    3: ["clouds", "\uF2C3"],
    45: ["cloud-fog", "\uF2A0"],
    48: ["cloud-fog", "\uF2A0"],
    51: ["cloud-drizzle", "\uF29D"],
    53: ["cloud-drizzle", "\uF29D"],
    55: ["cloud-drizzle", "\uF29D"],
    56: ["cloud-snow", "\uF2BC"],
    57: ["cloud-snow", "\uF2BC"],
    61: ["cloud-rain", "\uF2B6"],
    63: ["cloud-rain", "\uF2B6"],
    65: ["cloud-rain-heavy"],
    66: ["cloud-sleet", "\uF2BA"],
    67: ["cloud-sleet", "\uF2BA"],
    71: ["cloud-snow", "\uF2BC"],
    73: ["cloud-snow", "\uF2BC"],
    75: ["cloud-snow", "\uF2BC"],
    77: ["snow", "\uF56D"],
    80: ["cloud-drizzle", "\uF29D"],
    81: ["cloud-drizzle", "\uF29D"],
    82: ["cloud-rain", "\uF2B6"],
    85: ["cloud-snow", "\uF2BC"],
    86: ["cloud-snow", "\uF2BC"],
    95: ["cloud-lightning-rain", "\uF2AB"],
    96: ["cloud-lightning-rain", "\uF2AB"],
    99: ["cloud-lightning-rain", "\uF2AB"],
  };
  if (codePoint) return obj[code][1];
  return `<i class='bi bi-${obj[code][0]}'></i>` || "";
}

/**
 * Creates first card (current weather card)
 * @param {object} data JSON Object from API (hourly data)
 */
function createCurrCard(data, aqData) {
  const currLocation = getPreferedLocationFormat();

  const weatherCode = data["weathercode"][hourIndex];
  const currTemp = data["temperature_2m"][hourIndex];
  const currPrecip = data["precipitation"][hourIndex];
  const currCloudCover = data["cloudcover"][hourIndex];
  const currWindSpeed = data["windspeed_10m"][hourIndex];
  const currWindDir = data["winddirection_10m"][hourIndex];
  const currHumidity = data["relativehumidity_2m"][hourIndex];

  const locationElem = document.querySelector(".location");
  locationElem.innerHTML = `${currLocation[0]} <span>${currLocation[1]}</span>`;

  const targetCard = document.querySelector(".current-weather");

  const icon = targetCard.querySelector(".icon");
  icon.innerHTML = getWeatherIcon(weatherCode);

  const temperatureElem = targetCard.querySelector(".curr-temp");
  temperatureElem.textContent = `${currTemp}`;

  const smallCards = targetCard.querySelector(".curr-cards");

  const rainCard = smallCards.querySelector(".rain");
  rainCard.querySelector("span").textContent = `${currPrecip}mm`;

  const cloudcoverCard = smallCards.querySelector(".cloudcover");
  cloudcoverCard.querySelector("span").textContent = `${currCloudCover}%`;

  const windCard = smallCards.querySelector(".wind");
  windCard.querySelector("span").textContent = `${currWindSpeed}`;

  const windDirIndicator = smallCards.querySelector(".wind-dir i");
  windDirIndicator.style.transform = `rotate(${currWindDir - 45 + 180}deg)`;

  const humidityCard = smallCards.querySelector(".humidity");
  humidityCard.querySelector("span").textContent = `${currHumidity}%`;

  const uvCard = smallCards.querySelector(".uv");
  uvCard.querySelector("span").textContent = Math.round(
    aqData.uv_index[hourIndex]
  );
}

/**
 * Creates specific items for today card
 * @param {object} data JSON data from API
 * @param {object} aqData JSON data from API (air quality)
 */
function createTodayCardSpecifics(data, aqData) {
  // add today date
  const todayCardTitle = document.querySelector(".today .card-title");
  todayCardTitle.innerHTML = `Today <span>${createDateString(
    data.daily["time"][0]
  )}</span>`;

  // today chart
  const chartSelect = document.querySelector(".ctrl-select");
  const todayChart = document.querySelector(".today-chart");
  initChart(data, aqData, todayChart, chartSelect);

  // sun diagram (with progress circle)
  let riseToday = todayCard.querySelector(".rise span").textContent;
  let setToday = todayCard.querySelector(".set span").textContent;
  calculateSunDiagramProgress(riseToday, setToday);

  let warningTodayElem = todayCard.querySelector(".warnings");
  createDayWarnings(warningTodayElem, data, aqData);
}

/**
 * creates day summary for all cards
 * @param {object} data JSON object from API
 * @param {number} index index for accessing data param
 * @param {HTMLElement} element display element(default: todayCard)
 */
function createDaySummary(data, index = 0, element = todayCard) {
  const tempMax = data.daily["temperature_2m_max"][index];
  const precipSum = data.daily["precipitation_sum"][index];
  const precipHoursSum = data.daily["precipitation_hours"][index];

  const tempMaxElem = element.querySelector(".temp-max p");
  tempMaxElem.textContent = `${tempMax} °C`;

  const precipTotal = element.querySelector(".precip-total p");
  precipTotal.textContent = `${precipSum}mm (${precipHoursSum}h)`;

  const weatherCodeResult = getWeatherIcon(data.daily["weathercode"][index]);
  const dayIcon = element.querySelector(".day-icon");
  dayIcon.innerHTML = weatherCodeResult;
}

/**
 * create day card warning section
 * @param {HTMLElement} elem warning section to be filled with content
 * @param {object} data API data to determine warning necessity (weather)
 * @param {object} aqData different API data to determine warning(air quality)
 * @param {number} index index to access data
 */
function createDayWarnings(elem, data, aqData, index = 0) {
  // add warning icon first
  let warningsHTML = "<li><i class='bi bi-exclamation-triangle'></i></li>";

  let tempArr = data.hourly["temperature_2m"].slice(index, index + 24);
  let precipArr = data.hourly["precipitation"].slice(index, index + 24);
  let windSpeedArr = data.hourly["windspeed_10m"].slice(index, index + 24);
  let uvIndexArr = aqData["uv_index"].slice(index, index + 24);
  let snowArr = data.hourly["snowfall"].slice(index, index + 24);

  if (tempArr.some((t) => t > 25)) {
    let maxTemp = Math.max.apply(null, tempArr);
    let tSeverity = evaluateSeverity(25, 35, maxTemp);
    warningsHTML += `<li data-severity="${tSeverity}"><i class="bi bi-thermometer-high"></i></li>`;
  }
  if (tempArr.some((t) => t <= 0) && !tempArr.includes(null)) {
    let minTemp = Math.min.apply(null, tempArr);
    let tSeverity2 = evaluateSeverity(-5, -10, minTemp);
    warningsHTML += `<li data-severity="${tSeverity2}"><i class="bi bi-thermometer"></i></li>`;
  }
  if (precipArr.some((p) => p > 0)) {
    let precipSum = data.daily["precipitation_sum"][Math.floor(index / 24)];
    let pSeverity = evaluateSeverity(1, 8, precipSum);
    warningsHTML += `<li data-severity="${pSeverity}"><i class="bi bi-cloud-rain"></i></li>`;
  }
  if (windSpeedArr.some((w) => w > 20)) {
    let maxSpeed = Math.max.apply(null, windSpeedArr);
    let wSeverity = evaluateSeverity(20, 30, maxSpeed);
    warningsHTML += `<li data-severity="${wSeverity}"><i class="bi bi-wind"></i></li>`;
  }
  if (uvIndexArr.some((u) => u > 3)) {
    let maxUV = Math.max.apply(null, uvIndexArr);
    let uvSeverity = evaluateSeverity(3, 6, maxUV);
    warningsHTML += `<li data-severity="${uvSeverity}"><i class="bi bi-sun-fill"></i></li>`;
  }
  if (snowArr.some((s) => s > 0)) {
    let maxSnow = Math.max.apply(null, snowArr);
    let snowSeverity = evaluateSeverity(0, 10, maxSnow);
    warningsHTML += `<li data-severity="${snowSeverity}"><i class="bi bi-snow"></i></li>`;
  }

  // if warningsHTML only includes warning icon
  if (warningsHTML.length == 51) {
    warningsHTML += "<li>No warnings :)</li>";
  }

  elem.insertAdjacentHTML("beforeend", warningsHTML);
}

/**
 * evaluate severity for warning icons
 * @param {number} med user defined medium severity
 * @param {number} high user defined high severity
 * @param {number} actual the number to be evaluated
 * @returns {string} severity as string to be used for icon styling (like a traffic light)
 */
function evaluateSeverity(med, high, actual) {
  if (actual >= med && actual < high) return "med";
  if (actual >= high) return "high";
}

/**
 * creates 3 hour cards to see weather throughout today
 * @param {object} data JSON object from API
 */
function createTodaySmallCards(data) {
  const todayHourCards = document.querySelector(".today .hour-data");

  for (let i = hourIndex + 1; i <= hourIndex + 4; i++) {
    let time = data.time[i];
    let weatherCode = data.weathercode[i];
    let temperature = data.temperature_2m[i];

    let temp = document.querySelector("#small-card-temp");

    let timeElem = temp.content.querySelector(".time");
    timeElem.textContent = time.slice(-5);

    let weatherIcon = temp.content.querySelector(".icon-s");
    weatherIcon.innerHTML = getWeatherIcon(weatherCode);

    let tempElem = temp.content.querySelector(".temp");
    tempElem.textContent = `${temperature}°C`;

    let clon = temp.content.cloneNode(true);
    todayHourCards.append(clon);
  }
}

/**
 * set sunrise and sunset time for all cards
 * @param {object} data JSON data from API
 * @param {number} index index number for accessing sunrise/sunset array from data
 */
function createSunCard(data, index = 0) {
  const sunriseTime = data["sunrise"][index].slice(-5);
  const sunsetTime = data["sunset"][index].slice(-5);

  sunriseElem.textContent = sunriseTime;
  sunsetElem.textContent = sunsetTime;
}

/**
 * creates today sun diagram circle
 * @param {string} rise sunrise time string
 * @param {string} set sunset time string
 */
// rise , set format hh:mm
function calculateSunDiagramProgress(rise, set) {
  let riseInMins = +rise.split(":")[0] * 60 + +rise.split(":")[1];
  let setInMins = +set.split(":")[0] * 60 + +set.split(":")[1];
  let nowInMins = new Date().getHours() * 60 + new Date().getMinutes();

  const dayLightLeftToday = todayCard.querySelector(".daylight-left span");
  const circleProgress = document.querySelector(
    ".sun-diagram .circle #progress"
  );
  let dayLightLeftTime;
  const MAX_STROKE_OFFSET = 251;

  // if sunset has already happened
  if (nowInMins > setInMins) {
    dayLightLeftTime = 0;
    circleProgress.style.setProperty("--prog", 0);
  } else {
    let ratio = (nowInMins - riseInMins) / (setInMins - riseInMins);

    let progCalc = Math.floor(
      MAX_STROKE_OFFSET - MAX_STROKE_OFFSET * ratio.toFixed(3)
    );

    // svg loading animation with stroke-dashoffset
    circleProgress.style.setProperty("--prog", progCalc);
    dayLightLeftTime = ((setInMins - nowInMins) / 60).toFixed(1);
  }

  todayCard.addEventListener("toggle", () => {
    circleProgress.classList.add("prog-load");
  });
  dayLightLeftToday.textContent = dayLightLeftTime;
}

/**
 * creates next 6 days cards
 * @param {object} data JSON from API
 */
function createNext6DaysCards(data, aqData) {
  for (let j = 1; j < 7; j++) {
    let temp = document.querySelector("#day-card");
    let summaryElem = temp.content.querySelector("summary");

    // card top
    let cardTitle = summaryElem.querySelector(".card-title");
    if (j == 1) {
      cardTitle.innerHTML = `Tomorrow <span> ${createDateString(
        data.daily["time"][1]
      )}</span>`;
    } else {
      cardTitle.textContent = createDateString(data.daily["time"][j]);
    }

    // day summary card
    let daySummaryCard = temp.content.querySelector(".day-summary");
    createDaySummary(data, j, daySummaryCard);

    let dayStartIndex;
    if (j == 1) dayStartIndex = 24;
    else dayStartIndex = j * 24;

    // day warnings
    let dayWarnings = temp.content.querySelector(".warnings");
    createDayWarnings(dayWarnings, data, aqData, dayStartIndex);

    // day sun diagram
    let daySunDiagram = temp.content.querySelector(".sun-diagram-simpler");

    let riseTime = data.daily["sunrise"][j].slice(-5);
    let setTime = data.daily["sunset"][j].slice(-5);

    let rise = daySunDiagram.querySelector(".rise span");
    rise.textContent = riseTime;
    let set = daySunDiagram.querySelector(".set span");
    set.textContent = setTime;

    let dayLightTotal = daySunDiagram.querySelector(".daylight-total span");
    dayLightTotal.textContent = calculateDaylightTime(riseTime, setTime);

    let clon = temp.content.cloneNode(true);
    next6DaysSection.append(clon);
    dayWarnings.innerHTML = "";

    // adding charts after appending was easier ¯\_(ツ)_/¯ (bc of some canvas methods i think)
    // day chart
    let dayChart = next6DaysSection.getElementsByTagName("canvas")[j - 1];
    dayChart.id = `chart-${j}`;
    let select = next6DaysSection.getElementsByClassName("ctrl-select")[j - 1];

    initChart(data, aqData, dayChart, select, dayStartIndex);
  }
}

/**
 * collects necessary chart data and creates charts
 * @param {object} data data from API
 * @param {object} aqData data from API
 * @param {HTMLElement} chart target chart
 * @param {HTMLElement} select select element that controls chart
 * @param {number} startIndex index for accessing data
 */
function initChart(data, aqData, chart, select, startIndex = 0) {
  let d = data.hourly;
  let sI = startIndex;

  const dayTempArr = d["temperature_2m"].slice(sI, sI + 24);
  const dayPrecipArr = d["precipitation"].slice(sI, sI + 24);
  const dayWindArr = d["windspeed_10m"].slice(sI, sI + 24);
  const dayCloudArr = d["cloudcover"].slice(sI, sI + 24);
  const dayUVArr = aqData["uv_index"].slice(sI, sI + 24);
  const dayHumidArr = d["relativehumidity_2m"].slice(sI, sI + 24);
  const dayPressureArr = d["surface_pressure"].slice(sI, sI + 24);
  const dayDewPointArr = d["dewpoint_2m"].slice(sI, sI + 24);
  const daySoilTempArr = d["soil_temperature_6cm"].slice(sI, sI + 24);
  const dayDustArr = aqData["dust"].slice(sI, sI + 24);
  const dayPMArr = aqData["pm10"].slice(sI, sI + 24);
  // weather code does not get displayed, only used for adding icon in datalabel
  const dayWCodeArr = d["weathercode"].slice(sI, sI + 24);

  const daySnowArr = d["snowfall"].slice(sI, sI + 24);
  const daySnowDepthArr = d["snow_depth"].slice(sI, sI + 24);

  const chartDataArr = [
    dayTempArr,
    dayPrecipArr,
    dayWindArr,
    dayCloudArr,
    dayUVArr,
    dayHumidArr,
    dayPressureArr,
    dayDewPointArr,
    daySoilTempArr,
    dayDustArr,
    dayPMArr,
    dayWCodeArr,
  ];

  // if there is snow add do datasets
  if (Math.max.apply(null, daySnowArr) > 0) {
    chartDataArr.push(daySnowArr);
    select.insertAdjacentHTML(
      "beforeend",
      `<option value='${select.childElementCount}'>Snow (cm)</option>`
    );
  }
  if (Math.max.apply(null, daySnowDepthArr) > 0) {
    chartDataArr.push(daySnowDepthArr);
    select.insertAdjacentHTML(
      "beforeend",
      `<option value='${select.childElementCount}'>Snow Depth (m)</option>`
    );
  }

  createChart(chartDataArr, chart, select);
}

/**
 * calculates total daylight time (time format needed: hh:mm)
 * @param {string} rise time string format hh:mm
 * @param {string} set time string format hh:mm
 * @returns daylight time in hours
 */
function calculateDaylightTime(rise, set) {
  // "+(variable)"  to turn string to number
  let riseinMinutes = +rise.split(":")[0] * 60 + +rise.split(":")[1];
  let setInMinutes = +set.split(":")[0] * 60 + +set.split(":")[1];
  let dayLightMins = setInMinutes - riseinMinutes;

  return `${(dayLightMins / 60).toFixed(1)}h`;
}

export default function createAppCards(data, aqData) {
  createCurrCard(data.hourly, aqData);
  createDaySummary(data);
  createTodaySmallCards(data.hourly);
  createSunCard(data.daily);
  createTodayCardSpecifics(data, aqData);

  createNext6DaysCards(data, aqData);
}
