---
name: Playwright Chromium on NixOS
description: How to get Playwright's packaged Chromium binary running on this Replit NixOS environment.
---

# Playwright Chromium on NixOS

## The problem
Playwright's downloaded `chrome-headless-shell` binary links against `libgbm.so.1` (from mesa) and other system libraries that are not in the standard linker path on this NixOS environment. Running `playwright install chromium` alone is not enough — the binary crashes with "error while loading shared libraries".

The Playwright package can be present while its Chromium cache is absent. In that case `chromium.launch()` reports that the executable does not exist; install the browser before applying the NixOS RPATH fix below.

## The fix
Install Mesa through the workspace system-dependency flow, then patch the browser binary's RPATH to the installed Nix store library directory:

```sh
CHROMIUM="$HOME/workspace/.cache/ms-playwright/chromium_headless_shell-<version>/chrome-headless-shell-linux64/chrome-headless-shell"
MESA_LIB="$(for package in /nix/store/*-mesa-libgbm-* /nix/store/*-mesa-[0-9]*; do [ -e "$package/lib/libgbm.so.1" ] && printf '%s\n' "$package/lib" && break; done)"
patchelf --add-rpath "$MESA_LIB" "$CHROMIUM"
```

After patching, `ldd` reports no missing libraries and the tests run cleanly.

**Why:** The workspace system-dependency flow makes Mesa available from `/nix/store`, not necessarily at `~/.nix-profile/lib`. The packaged Playwright binary expects a standard FHS layout. `patchelf` embeds the actual library directory directly in its RPATH so it finds `libgbm.so.1` without `LD_LIBRARY_PATH`, which can cause library conflicts when mixing Nix and system libraries.

**How to apply:** Any time Playwright downloads a new Chromium version, repeat the RPATH step for the new `chrome-headless-shell` binary. The browser package can be present while its cache is absent, so run `playwright install chromium` before patching when launch reports a missing executable.

## Other libraries
Most other libraries (`libudev.so.1`, `libnss*`, etc.) are already present in `/lib/x86_64-linux-gnu` or resolved through the nix store RPATH that was already set on the binary. Only `libgbm` required the extra nix-env install.

## Test location
`e2e/canvas-png-download.spec.ts` — run with `cd e2e && node_modules/.bin/playwright test --config playwright.config.ts`.
