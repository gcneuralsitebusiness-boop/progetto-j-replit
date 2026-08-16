---
name: Playwright Chromium on NixOS
description: How to get Playwright's packaged Chromium binary running on this Replit NixOS environment.
---

# Playwright Chromium on NixOS

## The problem
Playwright's downloaded `chrome-headless-shell` binary links against `libgbm.so.1` (from mesa) and other system libraries that are not in the standard linker path on this NixOS environment. Running `playwright install chromium` alone is not enough — the binary crashes with "error while loading shared libraries".

## The fix
Install mesa via nix-env so `libgbm.so.1` lands in `~/.nix-profile/lib`, then patch the binary's RPATH with `patchelf`:

```sh
nix-env -iA nixpkgs.mesa
CHROMIUM="$HOME/workspace/.cache/ms-playwright/chromium_headless_shell-<version>/chrome-headless-shell-linux64/chrome-headless-shell"
patchelf --add-rpath "$HOME/.nix-profile/lib" "$CHROMIUM"
```

After patching, `ldd` reports no missing libraries and the tests run cleanly.

**Why:** NixOS does not expose nix-profile libs to the system linker automatically. The packaged Playwright binary expects a standard FHS layout. `patchelf` embeds the nix path directly in the binary's RPATH so it finds `libgbm.so.1` without LD_LIBRARY_PATH manipulation (which causes library conflicts when mixing nix and system libs).

**How to apply:** Any time you install a new version of `@playwright/test` and run `playwright install chromium`, repeat the patchelf step. The `e2e/package.json` has an `install-browsers` script as a reminder.

## Other libraries
Most other libraries (`libudev.so.1`, `libnss*`, etc.) are already present in `/lib/x86_64-linux-gnu` or resolved through the nix store RPATH that was already set on the binary. Only `libgbm` required the extra nix-env install.

## Test location
`e2e/canvas-png-download.spec.ts` — run with `cd e2e && node_modules/.bin/playwright test --config playwright.config.ts`.
