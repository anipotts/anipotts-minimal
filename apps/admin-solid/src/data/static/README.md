# admin static feed sample

`admin-feed.sample.json` is a tracked static copy of the Infra admin feed bundle.

- Source repo: `/Users/anipotts/Infra`
- Source commit: `32794b4`
- Source path: `coord/admin/static/admin-feed.sample.json`
- Builder: `coord/admin/build_static_snapshot.py`

This file is build-time sample data only. It must not become a live collector,
write path, deploy trigger, env reader, secret reader, or cross-repo runtime
dependency.
