# Branching Strategy

## Branches

| Branch | Purpose | Deploys to |
|--------|---------|------------|
| `main` | Stable releases only. Tagged with semver. Published to npm. | npm registry |
| `develop` | Integration branch. All feature work merges here first. | — |
| `feat/*` | Feature branches off `develop`. One feature per branch. | — |
| `fix/*` | Bug fix branches off `develop`. | — |
| `release/*` | Release prep branch off `develop`. Final QA + changelog. | — |
| `hotfix/*` | Critical fix off `main`. Merged back to both `main` and `develop`. | npm (patch) |

## Flow

```
feat/jsonld-extraction ──┐
feat/microdata-support ──┤
fix/type-hierarchy ──────┤
                         ▼
                      develop ──→ release/1.0.0 ──→ main (tag v1.0.0)
                         ▲                              │
                         └──────────────────────────────┘
                                  (merge back)
```

### Day-to-day work
1. Create `feat/*` or `fix/*` branch from `develop`
2. Implement, test, commit
3. Open PR to `develop`
4. Squash-merge or rebase-merge into `develop`

### Releasing
1. Create `release/x.y.z` from `develop`
2. Update version in `package.json`, finalize `CHANGELOG.md`
3. Run full test suite + accuracy tests
4. Merge to `main` (no squash — preserve history)
5. Tag `main` as `vx.y.z`
6. `npm publish` from the tag
7. Merge `release/x.y.z` back into `develop`

### Hotfixes
1. Branch `hotfix/*` from `main`
2. Fix, test, bump patch version
3. Merge to `main`, tag, publish
4. Merge to `develop`

## Release Criteria for v1.0.0

Before merging `develop` → `main` for the first release:

- [ ] All 3 extraction formats working (JSON-LD, Microdata, RDFa)
- [ ] 95%+ accuracy on 20+ fixture set
- [ ] 80%+ test coverage
- [ ] CLI `check` and `serve` commands functional
- [ ] Server endpoints tested
- [ ] TypeScript compiles with zero errors
- [ ] Build produces valid CJS + ESM + DTS
- [ ] README complete with usage examples
- [ ] DIVERGENCES.md documents all known gaps
- [ ] CHANGELOG.md documents all changes
- [ ] CI passes on Node 18, 20, 22

## Commit Convention

```
<type>: <description>

Types: feat, fix, refactor, docs, test, chore, perf, ci
```
