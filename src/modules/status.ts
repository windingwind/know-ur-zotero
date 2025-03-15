import { getPref } from "../utils/prefs";
import { BUTTON_ID } from "../utils/status";

export { initStatusButton };

function initStatusButton(win: Window) {
  if (getPref("showMonitorIcon") === false) {
    return;
  }

  const anchor = win.document.querySelector(
    "#zotero-tabs-toolbar > .zotero-tb-separator",
  );

  if (!anchor) {
    return;
  }

  ztoolkit.UI.insertElementBefore(
    {
      tag: "div",
      namespace: "html",
      id: BUTTON_ID,
      styles: {
        width: "28px",
        height: "28px",
        display: "flex",
        alignItems: "center",
        paddingInline: "4px",
        textAlign: "center",
        boxSizing: "border-box",
        marginInline: "4px",
        fill: "var(--material-tabbar)",
        // @ts-ignore
        "-moz-context-properties": "fill,fill-opacity",
      },
      listeners: [
        {
          type: "click",
          listener: async () => {
            await addon.api.profiler.getAndProcessProfileData({
              openMonitor: true,
            });

            (addon.data.processor.monitor?.target as Window).focus();
          },
        },
      ],
      skipIfExists: true,
    },
    anchor.nextElementSibling,
  );
}
