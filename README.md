# Herdr icon mod

A drop-in replacement for Herdr's Spaces sidebar that shows an image instead of
the first letter of a space's name. Spaces without an icon keep Herdr's colored
letter avatar, so nothing is lost when a space has no matching image.

## Install

```sh
./sync.sh
```

This copies `mods/icon-spaces/` into Herdr's app home (by default
`~/.config/herdr-app`) and runs `herdr-app check` on it. It keeps an existing
`icons.json` and staged icons, so re-running it after an update does not erase
your configuration.

The mod is installed with `place: none`, which means copying the folder alone
does not display it: point the spaces block of a layout you own at it:

```json
{ "id": "spaces", "type": "block", "content": { "mod": "icon-spaces" } }
```

Herdr's shipped layouts are restored on every start. If the active layout is
one of them, duplicate it first (`herdr-app do layout.clone '{"name":"main","as":"my-layout"}'`)
and edit the copy. The mod does not touch agents, tabs, keys, or any other mod.

## Configure icons

Edit `~/.config/herdr-app/mods/icon-spaces/icons.json`. It maps a space to an
image file; paths may be absolute or start with `~`:

```json
{
  "website": "/home/tim/Git/website/public/favicon.svg",
  "MinimalUI": "/home/tim/Git/MinimalUI/docs/brand/icon/icon.svg",
  "Dailies": "/home/tim/Git/Dailies/data/icons/hicolor/scalable/apps/io.github.tim_van_oudheusden.Dailies.svg",
  "pindu-launcher": "/home/tim/Git/pindu-launcher/data/icons/io.github.tim_van_oudheusden.pindu-launcher.svg",
  "pindu-os": "/home/tim/Git/pindu-os/docs/brand/icon.png"
}
```

A space id also works as a key, e.g.
`"spa8cf7b56b64a52351ee6167419066a4a": "~/Git/website/public/icon-192.png"`.

A key matches a space's **id**, its **name**, or the **folder its first terminal
is in** (the repository folder). Name matching covers spaces with the same name
on different machines. SVG, PNG, JPEG, WebP and GIF files are supported.

Herdr's `image()` only resolves files under its app home, so the mod copies each
configured file into `mods/icon-spaces/icons/` on startup and when the file
changes (checked once a minute). Saving `icons.json` reloads the mod. All reads
are local; the mod runs `mkdir` and `cp` and writes only inside its own folder.

## How it is built

- `mods/icon-spaces/spaces-base.js` is a vendored copy of Herdr's shipped
  `spaces` mod (v0.1.18, Apache-2.0). The only change is one seam: the avatar in
  `row()` calls `this.avatar(w, t, fill)`, with the original letter avatar kept
  as the base method. Everything else — machine groups, worktrees, drag, menus,
  branches, compact rail — is untouched.
- `mods/icon-spaces/main.js` subclasses it and overrides `avatar()` to show a
  configured image, falling back to the base method when there is none.
- `mods/icon-spaces/icons.json` is per-machine configuration, not code.

Herdr mods are native GPUI: no DOM, CSS or Node runtime. The type files in the
app home (`herdr.d.ts`, `gpui-kit.d.ts`) are the API reference.

## Check

```sh
herdr-app check ~/.config/herdr-app/mods/icon-spaces
herdr-app status
```
