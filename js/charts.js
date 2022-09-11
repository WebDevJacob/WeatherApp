Chart.register(ChartDataLabels);
import { getWeatherIcon } from "./createCards.js";

// red, orange, yellow, turquoise, green, lightblue, blue, purple, pink, lightbrown,brown, grey
const colors = [
  "#ee1264",
  "#F19A36",
  "#f7cf1d",
  "#45CBC6",
  "#12cd89",
  "#65DBE6",
  "#3f72af",
  "#ff00ff",
  "#F782D9",
  "#e1c699",
  "#573319",
  "#8F9699",
  "#dddddd",
];
const labels = [
  "00",
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
];

/**
 * add event listener to chart legend select
 * @param {HTMLElement} select the target <select> element
 * @param {object} chart the chart to be controlled by select param
 */
function addChartActions(select, chart) {
  select.onchange = function () {
    let index = this.value;
    highlightLine(chart, index);
  };
}

/**
 * highlights one line, hides all others
 * @param {object} chart the target chart
 * @param {number} index index for accessing charts dataset
 */
function highlightLine(chart, index) {
  const chartDataObject = chart.config.data.datasets;
  // hide all datasets first
  chartDataObject.map((dataset) => {
    dataset.hidden = true;
  });

  // chart.config.options.scales.y.ticks.max = Math.max(
  //   ...chartDataObject[index].data
  // );
  // add styling to target dataset and show again
  chartDataObject[index].borderColor = colors[index];
  chartDataObject[index].fill.above = colors[index] + "22";
  chartDataObject[index].fill.below = colors[index] + "11";
  chartDataObject[index].hidden = false;

  const ChartDataLabels = chart.config.options.plugins.datalabels.labels;
  const wCodes = chartDataObject[chartDataObject.length - 1].data;

  if (index < 3) {
    // for temp, rain and wind add weather icon
    ChartDataLabels.icon = {
      font: {
        size: 20,
        family: "Bootstrap-Icons",
      },
      formatter: function (value, context) {
        let wCode = getWeatherIcon(wCodes[context.dataIndex], true);
        return `${wCode}\n`;
      },
    };

    ChartDataLabels.value.backgroundColor = "transparent";
  } else {
    ChartDataLabels.icon = null;
    ChartDataLabels.value.backgroundColor = "#77777755";
  }
  chart.update();
}

/**
 * creates config object for creating chart
 * @param {object} data object with chart data
 * @param {string} yLabel unit for yAxis
 * @returns config object
 */
function getConfig(data) {
  return {
    type: "line",
    data: data,
    options: {
      layout: {
        padding: {
          top: 50,
          right: 15,
          left: 10,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
        },
        datalabels: {
          color: "#fff",
          backgroundColor: "#77777755",
          borderRadius: 2,
          align: "top",
          textAlign: "center",
          offset: 5,
          padding: 4,
          labels: {
            value: {
              font: { size: 10 },
              backgroundColor: "#77777755",
              formatter: function (value, context) {
                return `${context.dataset.data[context.dataIndex]}`;
              },
            },
          },
        },
      },
      scales: {
        y: {
          suggestedMin: 0,
          beginAtZero: true,
        },
      },
      elements: {
        point: {
          pointStyle: "circle",
        },
      },
    },
  };
}

/**
 * Create dataset(s) array for chart
 * @param {object} data data for dataset(s)
 * @returns dataset array
 */
function createDataSets(data) {
  let dataSetArr = [];
  let i = 0;

  for (const item of data) {
    let dataSetObj = {
      data: item,
      borderColor: colors[i],
      borderWidth: 2,
      fill: {
        target: "origin",
        above: colors[i] + "22",
        below: colors[i] + "11",
      },
      tension: 0.1,
      pointRadius: 2,
    };
    dataSetArr.push(dataSetObj);
    i++;
  }
  return dataSetArr;
}

/**
 * Creates new chart
 * @param {object} data data for chart as array of arrays
 * @param {HTMLELement} display where to display chart
 */
export default function createChart(data, display, select) {
  const chartData = {
    labels: labels,
    datasets: createDataSets(data),
  };
  let chart = new Chart(display, getConfig(chartData));
  addChartActions(select, chart);
  highlightLine(chart, 0);
}
