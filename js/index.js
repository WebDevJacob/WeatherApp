// fallback location if none is saved (yet)
const FALLBACK = {
  name: "Berlin",
  country: "Germany",
  timeZone: "Europe/Berlin",
  lat: "52.52",
  long: "13.41",
  elevation: "38",
};

if (JSON.parse(localStorage.getItem("savedData")) == null) {
  localStorage.setItem("savedData", JSON.stringify(FALLBACK));
  setLocationInfoText(FALLBACK);
}

import getApiData, { getUserLocation } from "./weatherAPI.js";
import getAirQualityApiData from "./airqualityAPI.js";
import createAppCards from "./createCards.js";
import { setLocationInfoText, loadLocCards } from "./locationAPI.js";

const loading = document.querySelector(".loading");

export const infoBanner = document.querySelector(".info-banner");
export const infoBannerIcon = infoBanner.querySelector("i");
export const infoBannerSpan = infoBanner.querySelector("span");
const infoBannerClose = infoBanner.querySelector("button");
export const locationInfoSpan = document.querySelector(".location-info > span");

// get data and init app
(async function () {
  try {
    let weatherData = await getApiData();
    let aqData = await getAirQualityApiData();

    createAppCards(weatherData, aqData.hourly);

    document.querySelectorAll("details").forEach((d) => {
      d.ontoggle = () => openDetail(d);
    });
    setLastUpdatedText();
    setLocationInfoText(JSON.parse(localStorage.getItem("savedData")));
    loadLocCards();
  } catch (error) {
    console.error(error);
    infoBanner.classList.add("active", "error");
    infoBannerSpan.textContent = `Error: ${error}`;
    infoBannerIcon.classList = "bi-exclamation-triangle";
  }
  // remove loading animation
  loading.classList.add("hidden");
})();

const reloadBtn = document.querySelector(".reload");
const lastUpdatedText = document.querySelector(".data-info span");

const locationPopup = document.querySelector(".location-popup");
const locationToggle = document.querySelector(".location-toggle");
export const deviceLocationBtn = document.querySelector(".device-location");
const locationClose = document.querySelector(".location-close");

locationToggle.onclick = () => {
  locationPopup.classList.add("active");
  body.classList.add("no-scroll");
};

locationClose.onclick = () => {
  locationPopup.classList.remove("active");
  body.classList.remove("no-scroll");
};

reloadBtn.onclick = () => window.location.reload();
infoBannerClose.onclick = () => infoBanner.classList.remove("active");

const etalSection = document.querySelector(".etal");
const etalOpen = document.querySelector(".etal-open");
const etalClose = document.querySelector(".etal-close");

etalOpen.onclick = () => etalSection.classList.remove("hidden");
etalClose.onclick = () => etalSection.classList.add("hidden");

const backtotopBtn = document.querySelector(".backtotop");
backtotopBtn.onclick = () => {
  window.scroll(0, 0);
};

/**
 * rotate chevron if details element is open
 * @param {HTML Element} elem element that triggered function
 */
function openDetail(elem) {
  let chevron = elem.querySelector("[data-icon]");
  chevron.toggleAttribute("data-rotation");
  if (chevron.hasAttribute("data-rotation")) {
    // scroll target elem to top of page
    let elemTop = elem.getBoundingClientRect().top;
    let offset = elemTop + window.scrollY - 5;
    window.scrollTo({ top: offset, behavior: "smooth" });
  }
  let hourDataSome = elem.querySelector(".hour-data.some");
  if (hourDataSome != null) hourDataSome.classList.toggle("card-hide");
}

/**
 * set last updated text on home screen
 */
function setLastUpdatedText() {
  if (navigator.onLine) {
    let timeString = `${new Date()
      .toLocaleDateString()
      .slice(0, -5)}, ${new Date().toLocaleTimeString().slice(0, 5)}`;
    localStorage.setItem("lastupdated", JSON.stringify(timeString));
    lastUpdatedText.textContent = `Last updated: ${timeString}`;
  } else {
    const savedUpdateTime = JSON.parse(localStorage.getItem("lastupdated"));
    if (savedUpdateTime != null) {
      lastUpdatedText.textContent = `Last updated: ${savedUpdateTime}`;
    }
    // info banner to indicate offline
    infoBanner.classList.add("active", "info");
    infoBannerSpan.innerHTML = `You're offline, data may not be accurate!`;
    infoBannerIcon.classList = "bi-exclamation-triangle";
  }
}

// ====== swipe gestures ========

const body = document.querySelector("body");
// minimal px value user needs to swipe to count swipe
const TOUCH_TRIGGER_THRESHOLD = 100;
let touchX = null;
let touchY = null;

body.addEventListener("touchstart", (e) => {
  touchX = e.touches[0].screenX;
  touchY = e.touches[0].screenY;
});

body.addEventListener("touchmove", (e) => {
  // if swipe happens on scrollable container exit function
  if (e.touches[0].target.closest(".chart-container")) return;
  if (e.touches[0].target.closest(".loc-btn-slider")) return;

  let newTouchX = e.touches[0].screenX;
  let newTouchY = e.touches[0].screenY;

  let deltaX = touchX - newTouchX;
  let deltaY = touchY - newTouchY;

  /* 
   run only if user swiped more in x direction than y
   to avoid popup opening when user swipes up in curved line 
   which might cover "TOUCH_TRIGGER_THRESHOLD"
  */
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX < -TOUCH_TRIGGER_THRESHOLD) {
      locationPopup.classList.add("active");
      body.classList.add("no-scroll");
    }
    if (deltaX > TOUCH_TRIGGER_THRESHOLD) {
      locationPopup.classList.remove("active");
      body.classList.remove("no-scroll");
    }
  }

  body.ontouchend = () => {
    touchX = null;
    touchY = null;
  };
});

const locBtnSlider = document.querySelector(".loc-btn-slider");
export const sliderWidth = locBtnSlider.getBoundingClientRect().width;

let dragXStart = null;
locBtnSlider.addEventListener("touchstart", (e) => {
  dragXStart = e.touches[0].screenX;
});

locBtnSlider.addEventListener("touchmove", (e) => {
  if (!e.target.closest(".device-location")) return;

  let dragXNew = e.touches[0].screenX;
  let dragDeltaX = Math.abs(dragXStart - dragXNew);

  if (dragDeltaX >= sliderWidth / 2) {
    // user swiped to the right
    if (dragXStart < dragXNew) {
      deviceLocationBtn.classList.add("active");
      getUserLocation();
      let locationObj = JSON.parse(localStorage.getItem("savedData"));
      setLocationInfoText(locationObj);
    } else {
      // user swiped to the left
      deviceLocationBtn.classList.remove("active");
    }
  }
});
