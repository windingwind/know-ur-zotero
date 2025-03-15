import { config } from "../../package.json";
import { ParsedResult } from "../extras/analyzer";

export { updateStatusButton, BUTTON_ID };

const BUTTON_ID = `zotero-${config.addonRef}-usage-status`;

function updateStatusButton(result: ParsedResult) {
  let { averageUsage: usage } = result;
  if (usage > 100) {
    usage = 100;
  }
  const win = Zotero.getMainWindow();
  const button = win.document.querySelector(`#${BUTTON_ID}`) as HTMLDivElement;
  if (!button) {
    return;
  }

  // Determine the color based on usage thresholds
  let color;
  if (usage < 30) {
    color = "green";
  } else if (usage < 60) {
    color = "orange";
  } else {
    color = "red";
  }
  button.style.color = `var(--accent-${color})`;

  button.title = `Average CPU usage: ${usage.toFixed(2)}%`;

  // Fixed size values for a 20x20 SVG
  const strokeWidth = 4;
  // Using a fixed normalized radius so that the circle fits within 20x20
  const radius = 8 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - usage / 100);

  // Build and return the SVG markup
  const svg = `
     <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20" height="20" viewBox="0 0 20 20">
       <!-- Background circle -->
       <circle
         cx="10"
         cy="10"
         r="${radius}"
         stroke="context-stroke"
         stroke-width="${strokeWidth}"
         fill="none" />
       <!-- Progress arc -->
       <circle
         cx="10"
         cy="10"
         r="${radius}"
         stroke="currentColor"
         stroke-width="${strokeWidth}"
         fill="none"
         stroke-dasharray="${circumference}"
         stroke-dashoffset="${strokeDashoffset}"
         stroke-linecap="round"
         transform="rotate(-90 10 10)" />
     </svg>
   `;
  button.innerHTML = svg;
}
