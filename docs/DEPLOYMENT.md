# Deployment & Git Workflow

This guide explains exactly which files belong in git, which do not, and how to deploy `@redeem/widget` assets to a production server — especially when the host project is **PHP-served and Node is not available on production**.

> TL;DR for PHP hosts:
>
> 1. **`node_modules/`** → gitignore (never commit)
> 2. **`package.json` + `package-lock.json`** → commit
> 3. **`static/assets/redeem-widget/`** (the copied CSS/JS) → **commit**
>
> The `postinstall` hook does the copying automatically. Run `npm install` locally once after each widget update and commit the refreshed assets.

---

## 1. Which files go where?

| Path                                   | Commit? | Why                                                                                          |
| -------------------------------------- | :-----: | -------------------------------------------------------------------------------------------- |
| `node_modules/`                        |   ❌    | Re-created by `npm install`. Bloats the repo, leaks paths, slows clones.                     |
| `package.json`                         |   ✅    | Declares which version of the widget the project uses.                                       |
| `package-lock.json`                    |   ✅    | Locks transitive versions for reproducible installs.                                         |
| `static/assets/redeem-widget/`         |   ✅    | The actual files PHP serves at `$markupUrl/redeem-widget/`. Production needs them.           |
| `.gitignore`                           |   ✅    | Should contain `node_modules/` and friends.                                                  |
| Any built assets you reference in PHP  |   ✅    | Same logic — your PHP server reads them at request time, so git is the simplest deploy pipe. |

---

## 2. Automated `.gitignore` setup

The `redeem-widget-install` CLI ships with two helpers to make this seamless.

### 2a. Default behavior — friendly hint

Running the install script (typically via `postinstall`) prints a clear "next steps" block:

```text
[redeem-widget-install] Copied 3 asset(s) to /…/static/assets/redeem-widget

[redeem-widget-install] Next steps for PHP / static hosts:
  1. Add the following entries to your .gitignore (or run with --ensure-gitignore):
       node_modules/
       npm-debug.log*
       yarn-debug.log*
       yarn-error.log*
       .npm/
  2. Commit 'static/assets/redeem-widget/' so production PHP servers can serve the assets without Node.
  3. Commit 'package.json' and 'package-lock.json' for reproducible installs.
```

You then update `.gitignore` yourself.

### 2b. Opt-in automation — `--ensure-gitignore`

If you'd rather have the script touch `.gitignore` for you, pass `--ensure-gitignore` (or `-g`):

```jsonc
// host package.json
{
  "scripts": {
    "postinstall": "redeem-widget-install static/assets/redeem-widget --ensure-gitignore"
  }
}
```

What this does:

- Creates `.gitignore` if it does not exist.
- Adds a **managed block** delimited by markers:

  ```text
  # >>> @redeem/widget managed-block (do not edit by hand) >>>
  node_modules/
  npm-debug.log*
  yarn-debug.log*
  yarn-error.log*
  .npm/
  # <<< @redeem/widget managed-block <<<
  ```

- On subsequent runs the block is detected and **not duplicated** (idempotent).
- Your own `.gitignore` entries outside the markers are never touched.

> The flag is **opt-in by design**. npm packages that silently modify host files break user trust; we leave the choice to you.

### 2c. Silent mode

For CI or scripted use add `--silent` (or `-s`) to suppress all log output.

```bash
redeem-widget-install static/assets/redeem-widget --ensure-gitignore --silent
```

---

## 3. Developer workflow (recommended)

### First-time setup

```bash
# in the host PHP project
npm init -y     # if you don't already have package.json
npm i git+https://github.com/ShakoZvi/redeem-widget.git
```

Edit `package.json`:

```json
{
  "scripts": {
    "postinstall": "redeem-widget-install static/assets/redeem-widget --ensure-gitignore"
  }
}
```

Then:

```bash
npm install          # runs postinstall → copies assets → updates .gitignore
git add .gitignore package.json package-lock.json static/assets/redeem-widget
git commit -m "chore: install @redeem/widget"
```

### Daily work

You almost never need to think about it. The widget is just another set of static assets in `static/assets/redeem-widget/`. Edit `index.php`, refresh the page, develop normally.

### Updating the widget

```bash
npm update @redeem/widget            # fetches latest from git
# postinstall ran automatically and refreshed static/assets/redeem-widget/

git add static/assets/redeem-widget package-lock.json
git commit -m "chore(deps): update @redeem/widget"
git push
```

### Deploying

Whatever you use to deploy PHP (`git pull`, FTP, rsync, CI), the assets already live in `static/assets/redeem-widget/` so they ship with the rest of your code. **No Node required on production.**

---

## 4. Alternative — never commit `static/assets/redeem-widget/`

If your CI/CD runs `npm install` on every deploy (Node is available on the production server or build agent), you can keep the asset folder out of git too.

Add to host `.gitignore`:

```text
static/assets/redeem-widget/
```

Workflow:

1. CI/CD checks out the repo.
2. `npm ci --omit=dev` runs `postinstall` which copies fresh assets.
3. PHP serves them as usual.

Trade-off: requires Node on every deploy environment. For traditional shared PHP hosting that is rarely practical, so the default flow (commit the assets) is recommended.

---

## 5. PHP-served file URLs

The widget is referenced from PHP like this:

```php
<link rel="stylesheet" href="<?php echo $markupUrl; ?>/redeem-widget/redeem-widget.css">
<script src="<?php echo $markupUrl; ?>/redeem-widget/redeem-widget.umd.js"></script>
```

For these URLs to resolve, the files **must physically exist** at `static/assets/redeem-widget/` on production. The strategies in sections 3 and 4 are the two practical ways to guarantee that. Pick whichever matches your hosting environment.

---

## 6. Cheat sheet

| I want to…                                            | Do this                                                                 |
| ----------------------------------------------------- | ----------------------------------------------------------------------- |
| Keep `node_modules/` out of git                       | Already happens with `--ensure-gitignore` or commit your own gitignore. |
| Make `npm install` also patch `.gitignore`            | Use `--ensure-gitignore` flag in the postinstall script.                |
| Deploy without Node on production                     | Commit `static/assets/redeem-widget/`. Default workflow.                |
| Deploy with Node on production / CI                   | Gitignore `static/assets/redeem-widget/`; `npm ci` on deploy.           |
| Update the widget version                             | `npm update @redeem/widget` → commit the refreshed assets.              |
| Suppress install logs                                 | Add `--silent` to the postinstall command.                              |
