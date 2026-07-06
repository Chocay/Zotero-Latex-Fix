import { config } from "../package.json";
import { createZToolkit } from "./utils/ztoolkit";
import { KatexFix } from "./modules/katex-fix";

let katexFix: KatexFix | null = null;

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  await onMainWindowLoad(Zotero.getMainWindow());
}

async function onMainWindowLoad(win: Window): Promise<void> {
  addon.data.ztoolkit = createZToolkit();

  // Initialize KaTeX fix in the main window context (needs DOM APIs)
  if (!katexFix) {
    katexFix = new KatexFix();
    katexFix.init();
  }
}

async function onMainWindowUnload(win: Window): Promise<void> {
  ztoolkit.unregisterAll();
}

function onShutdown(): void {
  if (katexFix) {
    katexFix.destroy();
    katexFix = null;
  }
  ztoolkit.unregisterAll();
  addon.data.alive = false;
  // @ts-ignore
  delete Zotero[config.addonInstance];
}

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
};
