/// <reference path="global.d.ts" />
/// <reference path="prefs.d.ts" />
/// <reference path="../node_modules/zotero-types/index.d.ts" />
/// <reference path="../node_modules/zotero-types/internal.d.ts" />

declare const _globalThis: {
  [key: string]: any;
  Zotero: _ZoteroTypes.Zotero;
  ztoolkit: ZToolkit;
  addon: typeof addon;
};

declare type ZToolkit = ReturnType<
  typeof import("../src/utils/ztoolkit").createZToolkit
>;

declare const ztoolkit: ZToolkit;

declare const rootURI: string;

declare const addon: import("../src/main/addon").default;
