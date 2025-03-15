import { getString } from "../utils/locale";

export { initMenus };

function initMenus() {
  ztoolkit.Menu.register("menuTools", { tag: "menuseparator" });
  ztoolkit.Menu.register("menuTools", {
    tag: "menuitem",
    label: getString("menuTools-monitor"),
    icon: `chrome://${addon.data.config.addonRef}/content/icons/favicon.svg`,
    commandListener: async (ev) => {
      await addon.api.profiler.getAndProcessProfileData({
        openMonitor: true,
      });

      (addon.data.processor.monitor?.target as Window).focus();
    },
  });
}
