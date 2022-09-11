const locPopup = document.querySelector(".location-popup");
export const locationSearch = document.querySelector(".location-search");
const searchIcon = document.querySelector(".search-icon i");

const tableWrapper = document.querySelector(".table-wrapper");
const locationSearchResultTable = document.querySelector(".loc-search-results");
const tableBody = locationSearchResultTable.querySelector("tbody");

const savedLocations = document.querySelector(".saved-locations");

import { getWeatherIcon } from "./createCards.js";
import { infoBanner, infoBannerIcon, infoBannerSpan } from "./index.js";
import { deviceLocationBtn, locationInfoSpan } from "./index.js";

/**
 * Get location API data
 */
async function getLocationApiData(query) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${query}`;
  let response = await fetch(url);
  let data = await response.json();
  if (data.results) getRelevantProperties(data.results);
}

/**
 * filters location API results to get relevant data
 * @param {array} results array of objects from API
 */
function getRelevantProperties(results) {
  const relevantArr = [];
  for (let i = 0; i < results.length; i++) {
    let relevantProperties = {
      name: results[i].name,
      country: results[i].country,
      timeZone: results[i].timezone,
      lat: Number(results[i].latitude).toFixed(4),
      long: Number(results[i].longitude).toFixed(4),
      elevation: results[i].elevation,
    };
    relevantArr.push(relevantProperties);
  }
  displayRelevant(relevantArr);
}

/**
 * Display array from location API in table
 * @param {array} array array of objects
 */
function displayRelevant(array) {
  // reset table
  tableBody.innerHTML = "";
  tableWrapper.classList.remove("hidden");

  for (let i = 0; i < array.length; i++) {
    let temp = document.querySelector("#loc-result-temp");
    let tableRow = temp.content.querySelector(".loc-result-item");

    let name = tableRow.querySelector(".name");
    name.textContent = array[i].name;

    let country = tableRow.querySelector(".country");
    country.textContent = array[i].country;

    let timeZone = tableRow.querySelector(".timezone");
    timeZone.textContent = array[i].timeZone;

    let index = tableRow.querySelector(".index");
    index.textContent = i;

    let clon = temp.content.cloneNode(true);
    tableBody.append(clon);
  }

  const tableRows = tableBody.querySelectorAll("tr");
  tableRows.forEach((row) => {
    row.addEventListener("click", () => {
      let rowIndex = +row.querySelector(".index").textContent;
      if (locationSearch.classList.contains("saving-search")) {
        saveNewLocCard(array[rowIndex]);
      } else {
        saveNewLocation(array[rowIndex]);
      }
      locationSearch.classList.remove("saving-search");
    });
  });
}

/**
 * Save location data in localstorage
 * @param {object} object data to be saved
 */
function saveNewLocation(object) {
  localStorage.setItem("savedData", JSON.stringify(object));
  localStorage.setItem("prefersDeviceLocation", "false");
  deviceLocationBtn.classList.remove("active");
  setLocationInfoText(object);
}

/**
 * Creates 'Saved Location' card
 * @param {object} obj object to get saved data
 */
export function setLocationInfoText(obj) {
  if (obj == null) return;
  let { name, country, timeZone, lat, long, elevation } = obj;

  if (country == undefined) country = "";
  else country = country + "<br>";

  timeZone = timeZone.replace("_", " ");

  let locationText = `${name} <br> ${country}Timezone: ${timeZone} <br>Position: ${lat}° / ${long}°`;

  let prefersDL = JSON.parse(localStorage.getItem("prefersDeviceLocation"));
  if (prefersDL == false || prefersDL == null) {
    locationText += ` <i class="bi bi-arrow-bar-up"></i> ${elevation}m`;
  } else {
    // onload add active class to show that user uses device location
    deviceLocationBtn.classList.add("active");
  }
  locationInfoSpan.innerHTML = locationText;
}

/**
 * Loads saved Location Cards from localStorage
 */
export function loadLocCards() {
  let saved = JSON.parse(localStorage.getItem("savedLocations"));
  if (saved == null) return;

  for (const obj of saved) {
    createLocCard(obj);
  }
}

/**
 * Create Loc Cards from template and display them
 * @param {object} obj object containing data to be displayed
 */
async function createLocCard(obj) {
  let { temperature, weathercode } = await getLocCardCurrWeather(obj);
  let temp = document.querySelector("#loc-card-temp");

  let li = temp.content.querySelector(".loc-card");
  li.setAttribute("data-index", savedLocations.childElementCount - 1);

  let locName = temp.content.querySelector(".loc-name");
  locName.textContent = `${obj.name}`;

  let span = temp.content.querySelector("span");
  span.innerHTML = `${obj.country}<br>Timezone: ${obj.timeZone}`;

  let locWeather = temp.content.querySelector(".loc-weather");
  locWeather.querySelector(".temp").textContent = temperature + " °C";
  locWeather.querySelector(".icon").innerHTML = getWeatherIcon(weathercode);

  let clon = temp.content.cloneNode(true);
  savedLocations.append(clon);
}

/**
 * get current weather for saved locations
 * @param {object} obj information about location
 * @returns relevant properties for loc card
 */
async function getLocCardCurrWeather(obj) {
  const locCardUrl = `https://api.open-meteo.com/v1/forecast?latitude=${obj.lat}&longitude=${obj.long}&current_weather=true`;
  let req = await fetch(locCardUrl);
  let res = await req.json();
  return {
    temperature: res.current_weather.temperature,
    weathercode: res.current_weather.weathercode,
  };
}

/**
 * save loc card data in localStorage
 * @param {object} object data to save
 */
function saveNewLocCard(object) {
  if (localStorage.getItem("savedLocations") == null) {
    localStorage.setItem("savedLocations", JSON.stringify([object]));
  } else {
    let savedLocArray = JSON.parse(localStorage.getItem("savedLocations"));
    savedLocArray.push(object);
    localStorage.setItem("savedLocations", JSON.stringify(savedLocArray));
  }
  createLocCard(object);
}

/**
 * set saved card data as location
 * @param {HTMLElement} elem
 */
function setLocCardAsLocation(elem) {
  let elemIndex = parseInt(elem.getAttribute("data-index"));
  saveNewLocation(
    JSON.parse(localStorage.getItem("savedLocations"))[elemIndex]
  );
  document.querySelectorAll(".loc-card").forEach((card) => {
    card.classList.remove("curr-saved");
  });
  if (!elem.classList.contains("deletable")) {
    elem.classList.add("curr-saved");
  }
}

/**
 * deletes saved loc Card
 * @param {HTMLELement} elem elem to be deleted
 */
function deleteLocCard(elem) {
  let card = elem.closest(".loc-card");
  let cardIndex = parseInt(card.getAttribute("data-index"));

  // delete from localStorage
  let arr = JSON.parse(localStorage.getItem("savedLocations"));
  let deleted = arr.splice(cardIndex, 1);
  localStorage.setItem("savedLocations", JSON.stringify(arr));
  // delete from DOM
  card.remove();

  // show info banner as delete confirm
  infoBanner.classList.add("active", "success");
  infoBannerIcon.classList = " bi bi-check2-circle";
  infoBannerSpan.textContent = `Location: ${deleted[0].name} was deleted from saved`;

  setTimeout(() => {
    infoBanner.classList.remove("active");
  }, 2000);

  // set new indices for cards
  let locCardCount = 0;
  document.querySelectorAll(".loc-card").forEach((card) => {
    card.setAttribute("data-index", locCardCount);
    locCardCount++;
  });
}

locationSearch.onfocus = () => {
  searchIcon.classList.replace("bi-search", "bi-x-lg");
};

let searchTimeout;
locationSearch.addEventListener("input", (e) => {
  // hide result table
  if (e.target.value.length == 0) {
    tableWrapper.classList.add("hidden");
  } else {
    // limit api calls by 'debounce'
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      getLocationApiData(e.target.value);
    }, 500);
  }
});

searchIcon.addEventListener("click", () => {
  if (!searchIcon.classList.contains("bi-x-lg")) return;
  locationSearch.value = "";
  tableWrapper.classList.add("hidden");
  searchIcon.classList.replace("bi-x-lg", "bi-search");
});

locPopup.addEventListener("click", (e) => {
  if (!e.target.closest(".save-new") && !e.target.closest(".location-search")) {
    locationSearch.classList.remove("saving-search");
    locationSearch.setAttribute("placeholder", "Search for a location ...");
  }
  if (locationSearch.value.length == 0 && !e.target.closest(".search")) {
    searchIcon.classList.replace("bi-x-lg", "bi-search");
  }
});

savedLocations.addEventListener("click", (e) => {
  if (e.target.closest(".save-new")) {
    locationSearch.classList.add("saving-search");
    locationSearch.setAttribute(
      "placeholder",
      "Enter a location you want to save"
    );
  } else if (e.target.closest(".loc-card")) {
    let card = e.target.closest(".loc-card");
    // if user did not click on delete buttons
    if (!e.target.matches("i") && !e.target.matches("button")) {
      setLocCardAsLocation(card);
    } else if (e.target.closest(".delete-loc-card")) {
      deleteLocCard(card);
    }
  }
});
