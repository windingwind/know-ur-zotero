export { registerMainWindowResource };

function registerMainWindowResource(win: Window): void {
  win.MozXULElement.insertFTLIfNeeded(
    `${addon.data.config.addonRef}-mainWindow.ftl`,
  );

  ztoolkit.UI.appendElement(
    {
      tag: "link",
      namespace: "html",
      properties: {
        rel: "stylesheet",
        href: `chrome://${addon.data.config.addonRef}/content/mainWindow.css`,
      },
      skipIfExists: true,
    },
    win.document.documentElement,
  );
}
