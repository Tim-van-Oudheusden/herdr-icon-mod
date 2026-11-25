// Spaces sidebar with per-space icons. A config file maps a space (by name, id,
// or repository folder) to an image file anywhere on this computer; the mod
// copies that file into its own folder so Herdr's image() can display it.
// Spaces with no configured icon keep Herdr's colored letter avatar.
import { image } from "gpui-kit";
import { appHome, checking, exec, home, panes, readTextFile } from "herdr";
import Spaces from "./spaces-base.js";

const MOD = "icon-spaces";
const CONFIG = `mods/${MOD}/icons.json`;
const ASSETS = `mods/${MOD}/icons`;
const IMAGE_EXT = /^(svg|png|jpe?g|webp|gif)$/;
// A source file changed on disk is picked up at most this often.
const RESYNC_MS = 60000;

const base = (path) => String(path ?? "").replace(/\/+$/, "").split("/").pop() ?? "";
const expand = (path) => String(path).replace(/^~(?=\/|$)/, home());
const hash = (text) => {
  let n = 0;
  for (let i = 0; i < text.length; i++) n = (n * 31 + text.charCodeAt(i)) | 0;
  return (n >>> 0).toString(36).slice(0, 6);
};

export default class IconSpaces extends Spaces {
  init(props, cx) {
    this.icons = Object.create(null); // config key -> app-home-relative image path
    super.init(props, cx);
    this.syncIcons(cx);
    cx.timer.every(RESYNC_MS, (cx) => this.syncIcons(cx));
  }

  // Read icons.json and stage each configured image inside this mod's folder.
  // image() only resolves paths under the app home, so a repo's favicon has to
  // be copied here first. `cp -u` writes only when the source is newer: editing
  // a config file or an icon reloads the mod once, and then it settles.
  async syncIcons(cx) {
    if (checking()) return; // `herdr-app check` must have no side effects
    let config;
    try {
      config = JSON.parse((await readTextFile(`${appHome()}/${CONFIG}`)) ?? "null");
    } catch {
      config = null;
    }
    if (!config || typeof config !== "object" || Array.isArray(config)) {
      if (Object.keys(this.icons).length) {
        this.icons = Object.create(null);
        cx.notify();
      }
      return;
    }
    const dir = `${appHome()}/${ASSETS}`;
    try {
      await exec("mkdir", ["-p", dir]);
    } catch {
      return;
    }
    const ready = Object.create(null);
    let index = 0;
    for (const [key, source] of Object.entries(config)) {
      const ext = String(source ?? "").split(".").pop()?.toLowerCase() ?? "";
      if (typeof source !== "string" || !IMAGE_EXT.test(ext)) continue;
      const safe = String(key).replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 40) || `icon-${index}`;
      const file = `${index}-${safe}-${hash(source)}.${ext}`;
      const result = await exec("cp", ["-f", "-u", expand(source), `${dir}/${file}`]).catch(() => null);
      if (result?.code === 0) ready[key] = `${ASSETS}/${file}`;
      index++;
    }
    const changed = JSON.stringify(ready) !== JSON.stringify(this.icons);
    this.icons = ready;
    if (changed) cx.notify();
  }

  // The first terminal's live folder is what a space is named after, so it is
  // also the folder whose repo an icon key may name.
  folderOf(w) {
    const tabs = new Set((w.tabs ?? []).map((tab) => tab.id));
    const ps = panes();
    return ps.find((p) => tabs.has(p.tab) && p.cwd)?.cwd || w.folder || "";
  }

  iconOf(w) {
    const folder = base(this.folderOf(w));
    const key = Object.keys(this.icons).find(
      (k) => k === w.id || k === w.name || k === folder,
    );
    return key ? this.icons[key] : null;
  }

  avatar(w, t, fill) {
    const path = this.iconOf(w);
    return path ? image(path).size(18).rounded(5).flex_none() : super.avatar(w, t, fill);
  }
}
