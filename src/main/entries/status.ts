import { getPref } from "../utils/prefs";
import { BUTTON_ID } from "../modules/status";

export { registerStatusButton };

function registerStatusButton(win: Window) {
  if (getPref("showMonitorIcon") === false) {
    return;
  }

  const anchor = win.document?.querySelector(
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
    anchor.nextElementSibling!,
  );
}
