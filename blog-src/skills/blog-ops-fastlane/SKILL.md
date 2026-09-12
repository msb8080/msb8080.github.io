# blog-ops-fastlane

## Purpose

Provide a repeatable workflow to validate, preview, and release the Astro blog.

## Use this skill when

- A post or site component needs pre-release validation.
- The local Astro preview must be started.
- The `/blog/` site must be published without touching the Pages root homepage.

## Commands

- Check: `./bin/blog-flow.sh check`
- Preview: `./bin/blog-flow.sh preview`
- Release: `./bin/blog-flow.sh release`

## Validation contract

1. Require `npm` and `rg`.
2. Validate changed Markdown Front Matter.
3. Run the complete Astro production build.
4. Before release, require a clean Pages repository and preserve its root `index.html`.

## Failure handling

- Content errors: fix the exact Markdown field reported by Astro.
- Dependency errors: preserve the lock file; do not modify global npm configuration.
- Deployment errors: leave both repositories recoverable and do not force push.
