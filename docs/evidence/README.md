# Current generated evidence

This directory contains evidence that repository commands intentionally
regenerate and verify.

- [Hiker scenario stress report](hiker-scenario-stress-report.md) is produced by
  `npm run scenario:stress`. It records the repeatable scenario matrix and
  packing outputs for the current catalog.

CI runs the generator and then checks `git diff --exit-code`. Commit the report
only when its reviewed source inputs or expected outputs change.

Other generated reports are stored in ignored `.artifacts/` directories or as
short-lived CI artifacts; see [Testing TrailPack](../testing.md).
