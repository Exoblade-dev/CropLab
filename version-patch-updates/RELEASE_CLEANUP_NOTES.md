# v1.5 Release Cleanup

This patch contains repository hygiene fixes identified during the v1.5 audit.

- Ignore the generated TypeScript build-info file.
- Restore the missing v1.2 migration notes.
- Keep package.json at version 1.5.0.

The repository's existing package-lock.json was created with the same dependency graph but has a stale root package version. After applying this patch, run `npm.cmd install --package-lock-only` once to synchronize the lockfile with package.json before committing.
