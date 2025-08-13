# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [1.0.0] - 2025-08-13
### Added
- First official release of the standalone FastAPI service.
- Endpoints: / (source link), /health, /v1/julian-day, /v1/ayanamsa, /v1/planets, /v1/houses.
- CORS support (configurable via CORS_ORIGINS env).
- Dockerfile and docker-compose.yml for containerized deployment (no ephemeris bundled).
- CI on PRs and pushes; release workflow to publish images to GHCR on tags.

### Notes
- No ephemeris files are included. Set EPHE_DIR to point at your local .se1 data, or rely on Moshier fallback.

## [0.3.0] - 2025-08-13
### Added
- CORS configuration via FastAPI middleware with CORS_ORIGINS env.
- Dockerfile and docker-compose.yml for containerized deployment (no ephemeris bundled).
- /health endpoint for monitoring and a root (/) route linking to the source repo (AGPL helpful).

### Changed
- CLI entrypoint for API: `swiss-calc-api` now accepts `--host` and `--port`.

### Fixed
- Minor type hint artifacts in service module.

