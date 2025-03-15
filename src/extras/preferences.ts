/* eslint-disable no-restricted-globals */
import { config } from "../../package.json";

function main() {
  document.querySelector("#prefs-navigation")?.addEventListener("select", init);

  setTimeout(() => {
    init();
  }, 1000);
}

main();

let initialized = false;

function init() {
  if (initialized) {
    return;
  }
  const container = document.querySelector(
    `.zotero-prefpane-${config.addonRef}`,
  );
  if (!container) {
    return;
  }
  initialized = true;
  document
    .querySelector("#prefs-navigation")
    ?.removeEventListener("select", init);
  // ...
}
