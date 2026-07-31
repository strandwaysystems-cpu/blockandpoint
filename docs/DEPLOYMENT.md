# Block & Point — Deployment

> How this site gets from `main` to blockandpoint.com, and the one build failure
> that is worth understanding before you touch anything.
>
> Last updated: 2026-07-31

---

## The GLIBC build failure, and why "use Node 18" is not the fix

Hostinger's build failed with a variant of:

```
Error: ... /lib/x86_64-linux-gnu/libm.so.6: version `GLIBC_2.29' not found
    (required by .../@rollup/rollup-linux-x64-gnu/rollup.linux-x64-gnu.node)
```

### What is actually happening

Astro depends on Vite, which depends on **Rollup 4**. Rollup 4 ships its bundler
as a **compiled native binary** — one per platform — and the Linux x64 build is
compiled against **GLIBC 2.29 or newer**. Hostinger's build image runs an older
glibc, so the dynamic linker refuses to load the binary and the build dies before
Astro even starts.

### Why changing the Node version does nothing

**GLIBC belongs to the operating system, not to Node.** It is the C library the
whole box is built on. Node 18 and Node 20 both link against whatever glibc the
host image provides, and both will download the *same*
`@rollup/rollup-linux-x64-gnu` binary requiring the *same* GLIBC 2.29. Downgrading
Node changes nothing about this error — the build fails identically.

(A related npm bug, [npm#4828](https://github.com/npm/cli/issues/4828), *is* real
and often cited alongside this error. It causes a **missing module** failure —
`Cannot find module @rollup/rollup-linux-x64-gnu` — not a `GLIBC_2.29 not found`
failure. Different symptom, different cause. The fix below happens to resolve both,
because it removes the optional native packages from the tree entirely.)

### The fix that is in place

`package.json` overrides Rollup with **Rollup's own WebAssembly build**:

```json
"overrides": {
  "rollup": "npm:@rollup/wasm-node@^4"
}
```

`@rollup/wasm-node` is published by the Rollup team, exposes the same API, and
contains **no native code** — so it has no libc requirement of any kind and runs on
any Node ≥ 18.17.1 regardless of how old the host image is.

Verified after the change:

- `rollup` resolves to `@rollup/wasm-node@4.62.3`
- **zero** `@rollup/rollup-<platform>` native binaries remain in `package-lock.json`
- build output is unchanged — 40 pages, identical assets
- build time ~2.9s (WASM is slower than native; irrelevant at this size)

**Do not remove the override** unless you have confirmed the host's glibc is ≥ 2.29
(`ldd --version` on the build box). Removing it re-introduces the native binary and
the failure returns.

---

## Option A — build on Hostinger (works now)

Hostinger's Git integration pulls `main` and builds.

| Setting | Value |
|---|---|
| Branch | `main` |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output / public directory | `dist` |
| Node version | 20 (18.17.1+ also works) |

`npm ci` requires `package-lock.json` to match `package.json` — it does, and the
lock is committed. If Hostinger's UI has no install step, `npm install` is fine.

**Point the document root at `dist/`, not the repo root.** If it serves the repo
root, visitors get the source tree instead of the site.

### Why this option is still fragile

The host controls the build image, so an image change can break the build again
without any change from you. For a site that compiles to plain static files, the
host does not need to build at all — which is Option B.

---

## Option B — build in CI, upload `dist/` (recommended)

GitHub Actions already builds this repo green on every push. Deploying that output
removes Node, npm, glibc and native binaries from the host entirely: Hostinger just
serves files.

`.github/workflows/deploy-hostinger.yml` is committed and ready. **It is inert
until the secrets exist**, so it cannot turn CI red in the meantime — it checks for
them and skips with a message.

To enable, add these four repository secrets
(Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `HOSTINGER_FTP_HOST` | FTP/SFTP hostname from hPanel → Files → FTP Accounts |
| `HOSTINGER_FTP_USER` | FTP username |
| `HOSTINGER_FTP_PASSWORD` | FTP password |
| `HOSTINGER_FTP_PATH` | Remote target, usually `/public_html/` |

Then either push to `main` or run the workflow manually from the Actions tab.

Once this is working, **turn Hostinger's own Git auto-deploy off** so the two
mechanisms don't fight over the same directory.

---

## Either way: what must be served

The build emits `dist/` (~11 MB). These four files matter beyond the pages:

| File | Why it matters |
|---|---|
| `.htaccess` | Extensionless URLs, the 301s, and the silo fix below. **Dotfiles are easy to lose in an FTP sync — confirm it arrived.** |
| `robots.txt` | Points crawlers at the sitemap, disallows `/go/` |
| `sitemap-index.xml` | Submitted to Search Console |
| `404.html` | Wired via `ErrorDocument` |

### The silo collision `.htaccess` solves

`build.format: 'file'` means a silo exists as **both** a directory and a file —
`dist/edit/` holds the spoke pages, `dist/edit.html` is the index. So:

- `/edit/` matches a real directory containing no `index.html` → without the rules,
  Apache returns 403 or a directory listing.
- `DirectorySlash Off` is required: otherwise mod_dir redirects `/edit` → `/edit/`,
  and the trailing-slash rule sends it back → infinite loop.

**These rules were reasoned through, not executed — the build environment has no
Apache.** After the first deploy, check all four:

```
/edit                                → silo index (200)
/edit/                               → 301 to /edit
/edit.html                           → 301 to /edit
/edit/best-scandinavian-block-heels  → spoke page (200)
```

If `/edit` loops or 403s, LiteSpeed has ignored `DirectorySlash Off`. The fallback
is to emit silo indexes as real `index.html` files (`build.format: 'directory'`
with `trailingSlash: 'always'`), which sidesteps the collision — at the cost of
changing every URL to a trailing-slash form.

---

## Verifying a deploy

```bash
npm ci && npm run build     # postbuild runs the link check automatically
```

Then, against the live site:

- The four silo URLs above.
- `/go/atp-atelier` redirects to the retailer, and its source has
  `<meta name="robots" content="noindex, nofollow">`.
- `/affiliate-disclosure` and `/privacy` load (network reviewers check these).
- `https://blockandpoint.com/sitemap-index.xml` resolves.
- View source on any money page: `rel="sponsored nofollow"` on the CTAs.
