import { BasicTool, ZoteroToolkit } from "zotero-plugin-toolkit";

export function createZToolkit() {
  const basicTool = new BasicTool();
  // @ts-ignore
  const ztoolkit = new ZoteroToolkit(basicTool);
  return ztoolkit;
}
