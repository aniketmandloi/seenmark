# Seenmark full codebase audit

Date: 30 September 2026. Baseline: `8a7a3b7` (`main` checkout at audit start). Staff engineering assessment of architecture, correctness, security, privacy, testing, accessibility, performance, and release operations.

## Assessment

**The codebase builds and its existing checks pass, but it should not be released with the five P1 findings below.** The most serious defect permits an untrusted site's multipart form to delete a signed-in member's account. Client session lifetime also has two separate failures: stale web identity can delete the wrong account, and a delayed native upload can restore another member's photo to the current cache. Native mutation failure handling recursively overflows instead of recovering.

The persistence design is largely sound. Keep the ownership predicates, schema constraints, cascades, metadata-only history, and single-statement writes. Concentrate the next architectural work around request integrity and member session lifetime. A broad rewrite would delay the fixes without addressing their cause.

This is a completed audit and remediation plan. Findings remain unfixed. The only repository addition from the audit is this document. No deployment, production database operation, GitHub issue creation, or product decision change was performed.

## Scope and evidence

Reviewed all first-party source areas and their configuration, existing tests, three committed migrations, domain glossary, seven ADRs, and relevant GitHub specs. The initial repository had 258 tracked files. Counts below include tests and configuration code, exclude generated/ignored files, and do not imply a line-by-line audit of third-party dependencies.

| Area | Tracked code files | Review coverage |
| --- | ---: | --- |
| `apps/server` | 9 | Hono middleware, HTTP/auth routing, context, bootstrap, bundling, HTTP tests |
| `apps/web` | 54 | Every route, SSR/session flow, member actions, photo preparation/display, comparison, history, account/auth, styling/config |
| `apps/native` | 39 | Every route and shared helper; SwiftUI, Compose and fallback form adapters; capture, recovery, actions, auth/cache lifecycle |
| `packages/api` | 24 | Every router, domain helper, validation rule, test harness and test file |
| `packages/db` | 11 | Schema, relations, driver interface, committed migration SQL and snapshots, migration configuration |
| `packages/auth` | 1 | Better Auth configuration, account-opening integration and installed auth behavior |
| `packages/ui` | 28 | Shared primitives, call sites, styles, modal and accessibility behavior |
| Root/config/scripts | — | Package/workspace/lock/config files, Turbo tasks, Vercel routing, environment sync, documentation and history |

The last 90 commits concentrated changes in the native form adapters, form types, `use-member-loop.ts`, and check-in screens. The review gave those areas additional scrutiny and widened to all source areas.

Spec interpretation follows the domain docs and later decisions. Original issues #11/#12 contain obsolete instructions to retain Polar and avoid the web loop. Current ADR-0007 records Polar removal; later #24–#48 expressly develop the web loop and #56–#64 develop native parity. Those historical differences are not defects. All recommendations preserve the adult US member, member-chosen score, educational menus, free member, private photos, and recorded-but-unsent introduction.

### Executed checks

| Check | Result | What it establishes |
| --- | --- | --- |
| `pnpm run verify` | Passed | Biome: 192 files, no fixes; seven package TypeScript checks; 81 tests |
| API tests | 60 passed, 8 files | Router behavior over fresh PGlite databases using committed migrations |
| Server tests | 5 passed, 1 file | Real Hono request handling over disposable databases |
| Web tests | 16 passed, 5 files | Utilities and cache helpers; no rendered browser workflow |
| `pnpm run build` | Passed | Server bundle and Next production build; no native binary build task exists |
| Isolated authenticated HTTP probes | Reproduced F01, F06, F07 | Untrusted multipart mutations accepted; malformed image and future date stored |
| Maximum photo batch probe | 8,388,897 response bytes | Two accepted 3 MiB photos exceed the documented buffered Vercel response limit |
| Actual native source reproduction | Reproduced F02 and F04 | Transpiled action/session source, controlled React/Expo/transport adapters, installed TanStack mutation machinery |
| Independent PostgreSQL sessions | Five checks passed, PostgreSQL 15.5 | Last-two deletion cleanup, choose/delete in both orders, introduction retry and account cascades |
| `pnpm audit --prod --json` | Two moderate advisories | Registry-reported vulnerable transitive versions; exploit reachability considered separately |

The first sandboxed production build stalled; it was stopped and rerun with worker/network permissions. The successful build is the unrestricted rerun. This was an environment limitation, not a reported code defect. Dependency restoration left the lockfile and production source unchanged.

### Confidence and severity

- **P1:** Fix before release: destructive request, member isolation, broken primary failure recovery, or predictable deployment failure.
- **P2:** Concrete functional/privacy defect or ineffective protection with a narrower trigger; schedule after P1 fixes.
- **Executed:** Observed in a disposable reproduction. **Source-confirmed:** Causal path established from first-party and installed dependency source. **Deployment inference:** Local behavior plus authoritative platform constraint; live deployment not exercised.

## Ranked findings

| ID | Priority | Finding | Evidence |
| --- | --- | --- | --- |
| F01 | P1 | Cross-origin multipart request can delete an account | Executed HTTP reproduction |
| F02 | P1 | Native error helper recurses; failed saves skip rollback | Executed actual-source reproduction |
| F03 | P1 | Stale web session identity can delete the newly signed-in account | Source-confirmed; browser reproduction pending |
| F04 | P1 | Delayed native mutation restores a previous member's photo | Executed actual-source/library reproduction |
| F05 | P1 | Two large photo reads batch beyond Vercel's response limit | Executed size proof; deployment inference |
| F06 | P2 | Magic-byte validation accepts unreadable photos | Executed router reproduction |
| F07 | P2 | Future capture time pins history and suppresses reminders | Executed router reproduction |
| F08 | P2 | Account admission limits reset per instance and trust raw forwarded headers | Source-confirmed |
| F09 | P2 | Native camera output files survive record/account deletion | Source-confirmed; device filesystem observation pending |
| F10 | P2 | Compare slider disables pointer/touch photo retry | Source-confirmed CSS/event path |
| F11 | P2 | Photo modal can place controls outside short viewports | Source-confirmed geometry; browser measurement pending |
| F12 | P2 | Later-page failure hides usable history and comparison | Installed query-state reproduction plus both client source paths |

### F01 — Destructive CSRF through no-input tRPC mutations

Evidence: [Hono tRPC registration](../../apps/server/src/app.ts#L51), [cookie policy](../../packages/auth/src/index.ts#L36), [account deletion](../../packages/api/src/routers/member.ts#L129), and the installed tRPC 11.19.0 multipart content handler.

Better Auth's trusted-origin guards protect its own HTTP routes. The tRPC routes call `getSession` and do not reject untrusted mutation origins. CORS controls which browser origins can read a response; it does not stop execution of a simple form POST. Cookies use `SameSite=None; Secure`. The installed tRPC handler accepts `multipart/form-data`, and procedures without input validators can execute without interpreting a JSON body.

On a fresh migrated fixture database, a valid session plus `Origin: https://attacker.example` and multipart form data produced:

```text
introduction.file: 200, recorded=true, sent=false
member.deleteAccount: 200, ok=true
member.current after deletion: 401
```

A malicious page can submit an ordinary multipart form to these routes. Browser cookie attachment depends on its cross-site cookie policy; browsers that attach these configured cookies expose the destructive path. No attacker response read is needed. `introduction.delete` has the same no-input shape, although the executed probe specifically exercised filing and account deletion.

**Fix:** Put mutation request protection at the HTTP seam before tRPC dispatch. Enforce the JSON contract for current mutations, reject untrusted or `null` browser origins, and use browser fetch metadata where appropriate. Preserve legitimate native requests, which manually forward cookies and may omit Origin. Derive trusted web origins from explicit deployment configuration. Tighten cookie policy where same-origin deployment permits it; cookie policy alone is insufficient for every supported adapter. Keep ownership checks in the router.

**Acceptance:** Attacker multipart, form and disallowed-origin requests cannot mutate; allowed same-origin/proxied web JSON and native JSON still work. Include no-input mutations, batches, and account deletion. Do not test only a schema-validated mutation and assume all others are protected.

### F02 — Native failure handler overflows and bypasses rollback

Evidence: [recursive helper](../../apps/native/lib/use-member-loop.ts#L140), [optimistic choice](../../apps/native/lib/use-member-loop.ts#L310), [catch/rollback](../../apps/native/lib/use-member-loop.ts#L315).

`fail(message)` calls `fail(message)` instead of `setError(message)`. Camera validation and every mutation failure that reaches this helper reject with `RangeError`. In `chooseBand`, the recursive call occurs before restoring the confirmed band. The `finally` block clears pending state, leaving the rejected optimistic band selected; the choice feedback can consequently report it as saved.

The actual-source reproduction rejected band choice and check-in deletion. It observed stack overflow, an optimistic `late` cache value after rejection, and no error announcement. TypeScript and lint passed because the recursive function is syntactically and type-correct.

**Fix:** Correct the helper, make rollback complete before error presentation, and ensure presentation cannot interrupt action settlement. Preserve reply-loss recovery: a committed write with a lost response needs a authoritative refresh, not a false success or permanently optimistic value.

**Acceptance:** Rejected capture, delete, band and introduction actions settle without uncaught rejection, report error, restore confirmed state, and permit retry. Success announcements/haptics occur only for confirmed outcomes.

### F03 — Web screens retain identity after cookies change

Evidence: [Account ownership](../../apps/web/src/app/account/account.tsx#L29), [delete request](../../apps/web/src/app/account/account.tsx#L36), [displayed identity](../../apps/web/src/app/account/account.tsx#L65), [Dashboard ownership](../../apps/web/src/app/dashboard/dashboard.tsx#L34), [NextSteps ownership](../../apps/web/src/app/dashboard/next-steps/next-steps.tsx#L26).

Private screens claim their cache using the SSR session prop. Header/UserMenu subscribe to live auth. Installed Better Auth broadcasts sign-out and refetches on visibility, but private screens have no matching live-session guard or remount. Requests use whichever cookie exists when fetch executes.

Open Account as member A; in another tab sign A out and sign B in; return to the old Account screen. The header can show B while Account still shows A's name/email. Confirming deletion sends a no-input mutation under B's cookie and deletes B. Old cached photos can likewise outlive the owner transition. History may independently refetch on focus; this does not repair Account identity or establish consistent cache ownership. A signed-in browser reproduction was not executed.

**Fix:** One member session module owns live identity, private-screen mounting, cache scope, and session changes. Treat SSR identity as initial data. Hide/disable old private content when identity changes; revoke old operations, discard local state and remount for the current member. For destructive commands, compare an expected identity with the authenticated identity and reject mismatch; the server must still derive authority from its session.

**Acceptance:** A→signed-out→B across tabs or revocation never displays A's private data under B or performs B's mutation from A's stale confirmation. Test identity changing both before confirmation and while a request is deferred.

### F04 — Late native upload repopulates another member's cache

Evidence: [record callback](../../apps/native/lib/use-member-loop.ts#L162), [cache clearing and ownership](../../apps/native/lib/member-session.ts#L8), [infinite freshness](../../apps/native/lib/use-member-loop.ts#L35).

Record `onSuccess` seeds image bytes under an ID-only photo key. It does not check the originating member or a session generation. Clearing query/mutation caches and unmounting observers does not cancel the mutation's option callback. The A→null→B ownership sequence also skips a second clear on null→B.

The reproduction used actual transpiled native action/session code and the installed TanStack `MutationObserver`: start A's capture upload, defer response, unsubscribe, claim null then B, resolve A's response. A's base64 photo reappeared in the current shared cache. B opening the former photo's deep link can consume that infinitely fresh cache entry without a new server ownership check. Server owner predicates remain correct; the leak occurs in client memory.

**Fix:** Revoke a member session generation on every owner transition; every deferred callback checks it before cache/UI effects. Scope private query clients or query keys to member identity, and reset screen-local state. Cancellation reduces work but cannot substitute for late-result rejection. Bind transport identity consistently so an operation created under A cannot accidentally execute under B.

**Acceptance:** Delayed record, delete, band, introduction and query replies after logout/switch cannot seed, invalidate or display another member's current state. Exercise unmount and session transitions through the action interface, rather than calling cache clearing alone.

### F05 — Photo batching exceeds the deployment response budget

Evidence: [web batch link](../../apps/web/src/utils/trpc.ts#L18), [native batch link](../../apps/native/utils/trpc.ts#L16), [accepted photo size](../../packages/api/src/photo.ts#L17), [base64 photo response](../../packages/api/src/routers/check-in.ts#L124).

Both clients use `httpBatchLink`. The comparison mounts two photo queries together, allowing them to share one buffered response. A 3 MiB photo becomes 4,194,304 base64 characters. Two such accepted photos yielded an **8,388,897-byte** HTTP batch response in the disposable probe. Vercel documents a 4.5 MB request/response limit for Functions. This is a deterministic size conflict for the configured deployment; the live Vercel error was not exercised. [Vercel Functions limits](https://vercel.com/docs/functions/limitations).

**Fix:** Route photo reads through an unbatched transport, while retaining batching for small metadata. Define aggregate batch limits for other operations. Single-photo responses fit the current limit; recheck envelope overhead whenever accepted sizes change. A single binary/photo response can reduce overhead later while retaining Postgres storage and member authorization.

**Acceptance:** Two maximum accepted photos compare through the intended deployment without exceeding any response limit; each photo is fetched separately. Measure actual serialized bodies. A URL-length limit does not bound response size.

### F06 — Photo acceptance checks prefixes, not readability

Evidence: [magic-byte sniffing](../../packages/api/src/photo.ts#L36), [record persistence](../../packages/api/src/routers/check-in.ts#L46), [invalid test fixtures](../../packages/api/src/test-harness.ts#L25).

A PNG signature followed by arbitrary text is accepted, stored and treated as an existing check-in. The executed probe stored that payload successfully. The happy-path fixture itself constructs these invalid PNGs, so the test titled “readable JPEG, PNG, or WebP” cannot establish readability. Corrupted captures or crafted payloads can leave an undisplayable check-in and still permit a score.

**Fix:** One photo acceptance module performs bounded decode, checks dimensions/pixel budget and declared type, and returns accepted bytes. This validates image storage; it does not analyze hair or calculate a score. Replace happy-path fixtures with small valid images and retain malformed valid-signature fixtures as negative cases.

**Acceptance:** Actual JPEG/PNG/WebP fixtures round-trip; truncated/signature-only data, type mismatch, oversized encoded bodies and oversized decoded dimensions fail before persistence. Bound decoder cost.

### F07 — Future capture timestamps suppress reminders

Evidence: [timestamp validation/write](../../packages/api/src/routers/check-in.ts#L42), [reminder ordering/threshold](../../packages/api/src/routers/check-in.ts#L132).

ISO syntax is checked, but capture time is not compared with server time. The probe accepted `2099-01-01T00:00:00.000Z`; its reminder was not due. That check-in remains newest and suppresses the invitation until 30 days after its future date. Ordinary device-clock skew is sufficient; current camera code uses the local clock. Other members are unaffected.

**Fix:** Specify and enforce a modest future-clock tolerance at record acceptance. Keep historical capture time distinct from receipt time if historical imports are formally supported later. Do not silently replace every capture time with server time.

**Acceptance:** Normal timestamps and an explicit tolerance work; extreme future dates are rejected. Reminder behavior remains correct at exactly 30 days and after a valid newer check-in.

### F08 — Account admission is ineffective across instances

Evidence: [in-memory counters](../../packages/api/src/sign-up-limit.ts#L14), [per-app initialization](../../apps/server/src/app.ts#L26), [forwarded address selection](../../apps/server/src/context.ts#L13).

Each application instance owns its own Map. Independent instances each admit three attempts from the same address; restart or serverless scale-out resets admission. Direct auth API account creation skips Better Auth's HTTP route limiter. A directly exposed Node server also accepts a caller-controlled first `X-Forwarded-For` value. Vercel may normalize that header; no Vercel spoofing claim is made without deployment proof. Requests without either header share one `unknown` bucket.

**Fix:** Put validated transport identity and an atomic, shared admission window behind one module. Start with existing Postgres infrastructure or a documented deployment-enforced policy. Configure trusted proxies explicitly; use the socket peer for direct Node traffic. Define unknown-identity and storage-failure behavior. Review auth's own default memory limiter under the same deployment assumptions.

**Acceptance:** Two instances share the limit, rotated untrusted headers cannot bypass it, legitimate native/web traffic is not globally grouped as unknown, and datastore failures have an intentional bounded policy.

### F09 — Native camera files survive deletion

Evidence: [capture consumption](../../apps/native/lib/use-member-loop.ts#L207), [remote-photo eviction](../../apps/native/lib/use-member-loop.ts#L175), and native account deletion. Installed ImagePicker iOS `MediaHandler.swift` writes the returned asset to `cachesDirectory/ImagePicker`; Android exports a distinct returned output file. Android's cleanup of its initial camera temp file does not erase that exported output.

The app consumes `asset.base64` and remembers `asset.uri` for deduplication. No native filesystem delete exists. Record/account deletion removes database rows and query data but leaves capture files until OS eviction. Files remain inside the app sandbox; no public filesystem exposure is claimed. Physical-device filesystem observation was not performed.

**Fix:** Give the capture adapter explicit ownership of temporary outputs. Erase known output after it is safely consumed, and cover rejected/recovered/cancelled paths. If retry needs temporary retention, bound it and erase it on abandonment/logout. Preserve Android pending-result recovery.

**Acceptance:** Capture→save→record/account delete leaves no owned temporary capture file; failed/recovered captures follow the same documented policy. Do not indiscriminately erase unrelated app or library files.

### F10 — Slider retry is unreachable by pointer or touch

Evidence: [slider photo class](../../apps/web/src/app/dashboard/compare-slider.tsx#L12), [error branch](../../apps/web/src/app/dashboard/photo.tsx#L27).

`pointer-events-none` applies to Photo's entire root, including the error state's Retry button. After a photo read fails, tapping the offered retry reaches the slider drag frame instead of refetching. Keyboard activation may still work. The causal CSS path is confirmed; no browser reproduction was performed.

**Fix/acceptance:** Disable native image dragging on the successful image and place recovery controls outside the drag layer. Ignore interactive descendants in slider pointer handlers. Pointer, touch and keyboard retry must refetch the failed photo without moving the divider.

### F11 — Photo dialog has no short-viewport scrolling path

Evidence: [shared dialog placement](../../packages/ui/src/components/dialog.tsx#L52), [photo dialog content](../../apps/web/src/app/dashboard/check-in-dialog.tsx#L51).

A fixed centered popup has no maximum viewport height or vertical overflow. Its 3:4 photo can be about 512px tall before header/footer, gaps and padding. On a 390px landscape viewport or a short laptop viewport, controls can lie outside the visible area while modal body scroll is locked. This follows from source geometry; exact browser screenshots/zoom behavior remain unmeasured.

**Fix/acceptance:** Bound the modal using dynamic viewport height and a scrollable content region; constrain photo presentation without distorting it. Header, close and delete remain reachable in portrait/landscape, at zoom, by keyboard, and with nested delete confirmation. Apply an intentional shared modal policy rather than a local fixed-height patch.

### F12 — Pagination errors replace already usable content

Evidence: [web error branch](../../apps/web/src/app/dashboard/dashboard.tsx#L140), [native aggregate failure state](../../apps/native/lib/use-member-loop.ts#L92).

Both clients treat any history query error as a full screen failure. TanStack sets `isError=true` and `isFetchNextPageError=true` after a later-page failure while keeping first-page data. The installed-library experiment reproduced exactly that state. With more than 30 check-ins, a transient next-page failure hides the already loaded comparison/history. This is narrower than an initial-load failure.

**Fix/acceptance:** Distinguish initial load failure from background/later-page failure. Preserve loaded pages and comparison; show an inline pagination error and retry the failed page. Authentication revocation still removes private content under the session policy. Test successful first page followed by failed second page, then recovery.

## Dependency audit

The production dependency audit reported **two moderate advisories, zero high or critical advisories**. A production dependency graph can include CLI/build tooling; these counts do not prove a remotely exploitable application endpoint.

| Package/version | Advisory | Observed path and assessment |
| --- | --- | --- |
| `uuid@7.0.3` | [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) | Expo config plugins → xcode → uuid. Bounds issue in caller-provided buffers; build-tool path seen, no app-specific vulnerable call established. Patched range reported as `>=11.1.1`. |
| `decode-uri-component@0.2.2` | [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) | Expo CLI/router tooling → query-string. Malformed-input decoding DoS; determine shipping/runtime reachability before severity escalation. Patched range reported as `>=0.5.0`. |

Prefer compatible upstream upgrades. Do not force a major transitive `uuid` replacement without checking xcode compatibility. Re-run the registry audit after resolution and inspect native bundle/tooling usage. No dependency changes were made during this audit.

## Architecture recommendations

The visual report gives before/after diagrams. These are replacement proposals: each must remove caller knowledge or duplicated policy, rather than add delegation-only modules.

| Candidate | Strength | Current friction | Proposed depth and deletion test |
| --- | --- | --- | --- |
| Request integrity | Strong; first | Browser request protection is assumed at CORS/auth while tRPC executes mutations separately | One HTTP seam owns accepted origin/content type/fetch metadata. Deleting scattered request assumptions concentrates protection here. Test actual HTTP, including no-input procedures. |
| Member session and action lifecycle | Strong | Web SSR snapshots, global cache ownership, deferred callbacks, optimistic state and feedback disagree | One session-scoped interface owns identity/generation, command settlement and private cache. Keep camera, transport and feedback as real adapters. Remove distributed owner claims/callback policies; tests cross this interface. |
| Check-in photo acceptance and transport | Strong | Prefix rules, conversions, limits and batching are learned in several places | One accepted-photo interface hides decode/type/dimension checks; photo transport guarantees envelope budget. Replace fragmented validation and large-photo batching. Keep capture preparation adapters and Postgres bytes. |
| Account admission | Strong | Process-local counters and raw address strings leak deployment assumptions | One admission interface owns trusted identity, shared atomic window, expiry and failure policy. Replace local Map enforcement and raw header assumptions. Production/test storage adapters justify the seam. |
| Interrupted account opening | Worth exploring | Router knows provider hash lookup, password verification, compensation and resumed account state | Move the resumable transition into a focused implementation, retaining Better Auth. Remove provider recovery knowledge from callers. Fault-injection tests cover interruption/compensation. A generic auth-provider abstraction is not needed today. |
| Check-in history contract | Worth exploring | Server accepts variable page sizes while clients infer a cursor using a shared fixed size | Server returns items with next cursor/has-more; clients render and request. Replace client cursor inference. Current clients both use 30, so this is friction, not a current variable-limit defect. |

The database already has depth. Additional generic repositories, an event bus, CQRS, microservices, or a speculative object-storage migration are not justified by these findings. Preserve the existing router seam and schema-owned invariants. Photo decoding validates storage only; it does not contradict ADR-0005's ban on computing a score.

Independent PostgreSQL tests reduced concurrency uncertainty: no invariant failure was observed in five targeted checks. The tests used independent sessions with source-equivalent SQL and committed migrations; they were not full production Neon/router transport tests or an exhaustive deadlock search. Make a corresponding maintained test lane part of release verification.

## Completed grilling decision tree

The user delegated answers and Staff engineering judgment. These rounds resolve the audit and proposed remediation scope; they do not claim the product owner adopted new product policy or that changes were implemented.

### Round 1 — Constraints

1. **Keep both clients?** Yes. Current tree, ADR-0007 and later issues justify both adapters.
2. **Who chooses the score?** The member. No image analysis, diagnosis, regimen or calculated band.
3. **Deliver an introduction?** No. Keep one recorded, unsent request and its persistence after a band change.
4. **Add payments or clinic discovery?** No. Neither fixes the audited problem or fits v1.
5. **Assume one long-lived server?** No. Vercel deployment and Node development both exist.
6. **Use interactive transactions?** Preserve neon-http constraints; retain schema/single-statement invariants unless an explicit adapter migration is justified.

### Round 2 — Priorities and policy

7. **First release gate?** Refuse the reproduced destructive cross-origin requests centrally.
8. **First client fix?** Correct native recursion and recovery immediately; ship session isolation fixes in the same P1 phase.
9. **What does a member switch revoke?** Permission for every old operation to modify current cache, screen state or feedback; not just permission for new reads.
10. **Does photo immutability justify permanent trust?** No. Byte content, member authorization and record existence have different lifetimes.
11. **What is an accepted photo?** An actually decodable, type-consistent image within encoded and decoded resource limits.
12. **Which transport carries large photos?** Unbatched photo reads within the deployment envelope. Batch small metadata separately.
13. **Add object storage now?** No. Keep existing Postgres storage until measured payload/cost/retention requirements warrant another adapter.
14. **Which admission store?** Existing atomic Postgres policy or documented platform enforcement; avoid adding a new vendor solely for this small rule.
15. **How handle future capture time?** Explicit modest skew tolerance; reject extreme future dates. Historical import policy needs a separate decision if introduced.
16. **How handle temporary camera output?** The capture adapter owns cleanup and bounded retry retention, including recovery paths.

### Round 3 — Interfaces and proof

17. **Where does request protection live?** At HTTP dispatch, so procedure input shape cannot disable it. Keep router authorization independently.
18. **Where does session isolation live?** One session module for each application's lifetime, with shared policy only where both real adapters benefit. Avoid a universal UI hook.
19. **What do action tests exercise?** Failed requests, lost replies, optimistic rollback, deferred result arrival and owner transition through the action interface.
20. **How bind a destructive confirmation?** Check expected member identity against the authenticated session; never authorize using caller-supplied member identity.
21. **Replace pure/helper tests?** Keep useful domain tests. Add interaction tests where bugs live; avoid duplicating implementation assertions. Replace obsolete shallow-module tests only when their responsibility is absorbed.
22. **Add a repository for every table?** No. The existing persistence implementation already concentrates invariants and has production/test database adapters.
23. **How prove deletion?** Server owner/read behavior and cascades, client cache revocation, owned temporary-file cleanup, and explicit response-cache policy. Backups require a separate operational retention policy.
24. **How prove concurrency?** Independent PostgreSQL sessions plus production adapter smoke tests. The local checks passed; make them repeatable release gates.
25. **Change domain glossary/ADRs?** No new domain concept or adopted product reversal arose. Record technical recommendations in the audit; preserve established ADRs.
26. **What remains external verification?** Live proxy normalization, deployment cookie/payload behavior, device filesystem/accessibility behavior, production environment isolation, backup restore and monitoring. State concrete gates rather than invent answers.

The decision frontier is empty for the audit scope. Business facts outside the repository are explicitly listed as unverified deployment/operational facts, not silently assumed answers.

## Additional release and maintenance gaps

These are separate from the twelve concrete findings.

- **Maintained test coverage:** No native test files exist. Web tests exercise utilities/cache helpers rather than rendered identity transitions, pointer recovery or modal fit. Keep router tests and add small dedicated action/HTTP/browser suites for the proven failures. Current passing checks do not cover these behaviors.
- **CI/release automation:** No committed `.github` workflow or equivalent CI configuration was found. Deployment scripts do not run `verify` or migrations themselves. External Vercel/dashboard gates may exist but were not inspected. Require clean-install verification/build and reviewed migration application before release; avoid running schema migration blindly from every parallel build.
- **HTTP cache policy and remote deletion:** The photo HTTP probe returned no `Cache-Control`. Explicitly mark member responses private/no-store. Infinite client freshness also prevents checking whether a photo was deleted on another device. Revalidate authorization/existence on session/focus transitions, independently of immutable bytes. No shared-CDN cache leak was reproduced.
- **Environment separation:** Preview and production sync commands read the same local files by default. Confirm distinct intended databases/secrets and preview access policy. The sync script copies arbitrary keys except its short denylist and forces updates sequentially; define an allowlist/validated deployment plan and inspect partial-failure behavior. No secret values were printed or production environment inspected.
- **Native endpoint validation:** Native `.env.schema` permits relative paths, while native fetch needs an absolute origin. Tighten native validation without removing the web app's legitimate relative `/api` configuration. No deployed native endpoint failure was observed.
- **Operational proof:** Root health returns only `OK`; no repository-level backup/restore procedure, alerting policy, usage quotas or database-storage budget was found. Establish these before a public workload. Confirm current platform controls rather than asserting none exist.
- **Runtime accessibility/performance:** Read the motion gates, native labels/adapters and responsive styles, but did not perform VoiceOver/TalkBack, maximum text size, real-camera, iOS/Android binary, multi-browser or production-load testing. Keep those as explicit device/browser acceptance gates. Unvirtualized native long histories and repeated broad invalidation merit measurement when history/traffic grows, rather than speculative optimization now.
- **Cleanup:** Unused shared chat/attachment primitives and generic scaffolding docs can be removed in a deliberate maintenance change. They are not release blockers. Shared constants/helpers that avoid loading server implementations into clients are justified; do not collapse them merely to reduce file count.

## Remediation sequence and acceptance gates

| Order | Work | Exit criterion |
| --- | --- | --- |
| 1 | F01 request integrity | Negative cross-origin/no-input/batch tests pass; native and proxied web requests remain accepted |
| 2 | F02–F04 error recovery and session lifetime | Failed actions recover; deferred responses cannot cross member ownership; two-tab deletion identity is safe |
| 3 | F05 photo envelope | Maximum-size comparison passes the real deployment with independent photo reads |
| 4 | F06–F09 acceptance, time, admission and capture cleanup | Real image negative cases; bounded timestamps; shared admission; owned-file cleanup proof |
| 5 | F10–F12 recovery/accessibility fixes | Pointer retry, short-viewport modal, retained pagination and initial/auth failures verified |
| 6 | Dependency/CI/operational gates | Compatible advisory remediation; reproducible verify/build/migration lane; deployment/device/restore proof |
| 7 | Selective deepening | Replace duplicated lifecycle/validation policy only where interfaces shrink and caller knowledge disappears |

Correct small defects before architectural restructuring. Keep these changes reviewable as focused commits. Each P1 fix needs a regression test for the causal trigger described above. Re-run the existing verification/build gates after implementation; audit results cannot serve as proof of future fixes.

## Reproduction artifacts and limits

Audit-session artifacts are under `/tmp` and are temporary. They contain disposable fixture accounts, not production data:

```text
/tmp/seenmark-audit-verify.log
/tmp/seenmark-audit-build-unrestricted.log
/tmp/seenmark-audit-probes.mts
/tmp/seenmark-audit-probes.log
/tmp/seenmark-audit-batch-probe.mts
/tmp/seenmark-audit-batch-probe.log
/tmp/seenmark-native-repro.cjs
/tmp/seenmark-audit-postgres.py
/tmp/seenmark-audit-postgres.log
/tmp/seenmark-audit-dependencies.json
```

The HTTP scripts create fresh PGlite databases from committed migrations, instantiate the real Hono app and authenticate fixture accounts. The native reproduction uses actual transpiled first-party functions with controlled React/Expo/transport adapters and real TanStack callbacks; it is not a device/React-renderer test. The PostgreSQL script starts an isolated temporary cluster with no TCP listener, applies all committed migrations, runs independent sessions and stops the cluster in `finally`. The batch fixture intentionally uses an accepted signature-prefixed maximum payload to measure transport; it establishes the accepted byte-envelope conflict, not image decode success.

No authenticated browser workflow, physical-device filesystem inspection, native binary build, live Vercel deployment, production Neon operation, exhaustive concurrency schedule search, backup restore, legal determination, or independent cryptographic audit was performed. Those limits do not weaken the executed local failures; they constrain claims about production/device behavior and the completeness of runtime certification.
