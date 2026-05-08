# Release Checklist

## Pre-Release

1. Run `npm install`
2. Run `npm test`
3. Run `npm run build`
4. Review generated artifacts in `dist/`
5. Review docs for API/config changes

## Versioning

Use semantic versioning:

- patch: bug fixes
- minor: backward-compatible features
- major: breaking changes

## Git Tag Example

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Git Install Consumption

If consumers install directly from git, `prepare` script builds package on install.

## Optional NPM Publish

```bash
npm publish --access public
```
