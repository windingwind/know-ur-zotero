/* eslint-disable no-restricted-globals */

import { MessageHelper } from "zotero-plugin-toolkit";
import { ParsedData, ParsedResult, Stats } from "./analyzer";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { getColorForKey } from "../utils/str";

export { handlers };

const MAX_HISTORY_LENGTH = 20;
const MAX_LOG_LENGTH = 10;
let cachedData: ParsedData[];
let usageChart: Chart;

const chartHistory = {
  labels: [] as string[],
  total: [] as number[],
  allRows: {} as { [rowId: string]: (number | null)[] },
};

const openLogs: { [id: string]: boolean } = {};

document.addEventListener("DOMContentLoaded", () => {
  window.arguments[0].wrappedJSObject._initPromise.resolve();

  Chart.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    LineController,
    Title,
    Tooltip,
    Legend,
  );

  const canvas = document.getElementById("usage-chart") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    usageChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: chartHistory.labels,
        datasets: [
          {
            label: "CPU Usage",
            data: chartHistory.total,
            borderColor: "red",
            backgroundColor: "rgba(255, 0, 0, 0.2)",
            fill: true,
          },
        ],
      },
      options: {
        animation: { duration: 0 },
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false, grid: { display: false } },
          y: { display: false, grid: { display: false }, min: 0, max: 100 },
        },
        elements: {
          line: { tension: 0.2, borderWidth: 2 },
          point: { radius: 0 },
        },
      },
    });
  }
});

const handlers = { display };

const messageServer = new MessageHelper({
  canBeDestroyed: true,
  dev: __env__ === "development",
  name: "monitorWorker",
  target: self,
  handlers,
});
messageServer.start();

function updateChartDatasets() {
  const toggledRows = Object.keys(openLogs).filter((id) => openLogs[id]);
  if (toggledRows.length === 0) {
    usageChart.data.labels = chartHistory.labels;
    usageChart.data.datasets = [
      {
        label: "Total CPU Usage",
        data: chartHistory.total,
        borderColor: "blue",
        fill: false,
      },
    ];
  } else {
    usageChart.data.labels = chartHistory.labels;
    usageChart.data.datasets = toggledRows.map((rowId) => {
      const { borderColor, backgroundColor } = getColorForKey(rowId);
      return {
        label: rowId,
        data:
          chartHistory.allRows[rowId] ||
          new Array(chartHistory.labels.length).fill(null),
        borderColor,
        backgroundColor,
        fill: true,
        borderWidth: 2,
        tension: 0.2,
        pointRadius: 0,
      };
    });
  }
  usageChart.update();
}

function getRowId(thread: string, stat: Stats): string {
  return `${thread}-${stat.key}`;
}

function createLogRow(
  row: HTMLTableRowElement,
  thread: string,
  stat: Stats,
): HTMLTableRowElement {
  const logRow = document.createElement("tr");
  logRow.classList.add("log-row");

  const logCell = document.createElement("td");
  logCell.colSpan = 4;

  const container = document.createElement("div");
  container.classList.add("log-container");

  const fullLog = JSON.stringify({ thread, ...stat }, null, 2);
  let lines = fullLog.split("\n");
  if (lines.length > MAX_LOG_LENGTH) {
    lines = lines.slice(0, MAX_LOG_LENGTH);
    lines.push("...");
  }

  const hideButton = document.createElement("button");
  hideButton.textContent = "Hide Log";
  hideButton.addEventListener("click", (event) => {
    event.stopPropagation();
    logRow.remove();
    openLogs[getRowId(thread, stat)] = false;
  });
  container.appendChild(hideButton);

  const saveButton = document.createElement("button");
  saveButton.textContent = "Copy JSON";
  saveButton.addEventListener("click", (event) => {
    event.stopPropagation();
    navigator.clipboard.writeText(fullLog);
  });
  container.appendChild(saveButton);

  const pre = document.createElement("pre");
  pre.textContent = lines.join("\n");
  container.appendChild(pre);

  logCell.appendChild(container);
  logRow.appendChild(logCell);
  return logRow;
}

function createDataRow(thread: string, stat: Stats): HTMLTableRowElement {
  const row = document.createElement("tr");
  row.classList.add("clickable");
  row.title = stat.description || "";

  const threadCell = document.createElement("td");
  threadCell.textContent = thread;
  row.appendChild(threadCell);

  const keyCell = document.createElement("td");
  keyCell.textContent = stat.name;
  row.appendChild(keyCell);

  const cpuTimeCell = document.createElement("td");
  cpuTimeCell.textContent = stat.totalCpuTime.toString();
  row.appendChild(cpuTimeCell);

  const percentCell = document.createElement("td");
  percentCell.textContent = stat.percent;
  row.appendChild(percentCell);

  row.addEventListener("click", () => {
    const rowId = getRowId(thread, stat);
    const nextRow = row.nextElementSibling;
    if (nextRow && nextRow.classList.contains("log-row")) {
      nextRow.remove();
      openLogs[rowId] = false;
    } else {
      const logRow = createLogRow(row, thread, stat);
      row.parentNode!.insertBefore(logRow, row.nextSibling);
      openLogs[rowId] = true;
    }
    updateChartDatasets();
  });

  return row;
}

function renderTableRows(): void {
  const tbody = document
    .getElementById("detail-table")!
    .getElementsByTagName("tbody")[0];
  tbody.innerHTML = "";

  const rows: { thread: string; stat: Stats }[] = [];
  cachedData.forEach((data) => {
    data.statistics?.forEach((stat) => {
      rows.push({ thread: data.thread, stat });
    });
  });

  rows.sort((a, b) => b.stat.totalCpuTime - a.stat.totalCpuTime);

  rows.forEach(({ thread, stat }) => {
    const row = createDataRow(thread, stat);
    tbody.appendChild(row);
    const rowId = getRowId(thread, stat);
    if (openLogs[rowId]) {
      const logRow = createLogRow(row, thread, stat);
      tbody.appendChild(logRow);
    }
  });
}

function display(result: ParsedResult): void {
  const { parsedData, averageUsage } = result;

  const indicator = document.getElementById("cpu-indicator")!;
  indicator.textContent = averageUsage.toFixed(1) + "%";

  if (averageUsage < 30) {
    indicator.className = "cpu-indicator green";
  } else if (averageUsage < 60) {
    indicator.className = "cpu-indicator orange";
  } else {
    indicator.className = "cpu-indicator red";
  }

  cachedData = parsedData;
  renderTableRows();

  const now = new Date().toLocaleTimeString();
  chartHistory.labels.push(now);
  chartHistory.total.push(averageUsage);

  const currentRowIds = new Set<string>();
  parsedData.forEach((data) => {
    data.statistics?.forEach((stat) => {
      const rowId = getRowId(data.thread, stat);
      currentRowIds.add(rowId);
      const usage = parseFloat(stat.percent);
      if (!chartHistory.allRows[rowId]) {
        chartHistory.allRows[rowId] = new Array(
          chartHistory.labels.length - 1,
        ).fill(null);
      }
      chartHistory.allRows[rowId].push(usage);
    });
  });

  for (const rowId in chartHistory.allRows) {
    if (!currentRowIds.has(rowId)) {
      chartHistory.allRows[rowId].push(null);
    }
  }

  if (chartHistory.labels.length > MAX_HISTORY_LENGTH) {
    chartHistory.labels.shift();
    chartHistory.total.shift();
    for (const rowId in chartHistory.allRows) {
      chartHistory.allRows[rowId].shift();
    }
  }

  updateChartDatasets();
}
