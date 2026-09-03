# Content lint report

`npx tsx scripts/content-lint` — generated file, do not edit by hand.

505 lessons · 21 findings · 6 waived

| Rule | Findings | Severity | What it means |
|---|---:|---|---|
| `code/unverified-language` | 19 | warn | A code fence in a language nothing checks: scripts/verify-code.ts typechecks TS/JS only, and the three runtimes cover TS/JS (P8), a Node project (P9) and SQL (P10). Everything else ships unverified. This is a COUNTER, not a ban — docs/phases/16-autodesk-developer-platform.md deliberately brings C# fences in, because the Revit API has no other language, and caps them in its own acceptance criteria. What the rule buys is that the unchecked fence count stays visible and bounded, instead of Python quietly arriving with the built-environment courses whose real tools (ifcopenshell, pyproj) are Python. |
| `drill/widget-on-unverified-lesson` | 2 | warn | A `quiz` or `recall` fence, or a `spatial` fence declaring an `ask`, on a lesson that is not `verified`. QuizCard and RecallCard both return null in that case — the stopping rule working — so the fence renders nothing at all and the effort is invisible to every reader. SpatialCard is the one partial case: its tree still renders (a tree is a reference, not an exercise) but its `ask` half stays shut, so the question and its reveal are the invisible part. The neighbouring `drill/unverified-lesson` rule does not catch any of this: it checks a manifest `interactive` field that no lesson in the corpus actually sets, so nothing was watching the fences themselves. Born `warn` per the repo rule, because the corpus is not clean of it: 114 is on stamp-verified.ts's T1.7 harm denylist and can only be cleared by the expert pass that list is waiting for, so its drills stay written-but-dark until then. Promote to `error` once that is resolved. |

## Findings by rule

### `code/unverified-language` — 19

- autodesk-developer-platform/455_the_autodesk_developer_surface.md:57 — `csharp` fence — no typechecker and no runtime covers this language
- autodesk-developer-platform/456_revits_object_model.md:55 — `csharp` fence — no typechecker and no runtime covers this language
- autodesk-developer-platform/456_revits_object_model.md:63 — `csharp` fence — no typechecker and no runtime covers this language
- autodesk-developer-platform/457_revit_addins_and_the_manifest.md:70 — `csharp` fence — no typechecker and no runtime covers this language
- autodesk-developer-platform/457_revit_addins_and_the_manifest.md:89 — `csharp` fence — no typechecker and no runtime covers this language
- autodesk-developer-platform/458_filteredelementcollector.md:140 — `csharp` fence — no typechecker and no runtime covers this language
- autodesk-developer-platform/459_revit_parameters.md:55 — `csharp` fence — no typechecker and no runtime covers this language
- autodesk-developer-platform/459_revit_parameters.md:66 — `csharp` fence — no typechecker and no runtime covers this language
- autodesk-developer-platform/460_design_automation.md:55 — `csharp` fence — no typechecker and no runtime covers this language
- framework-deep-dives/403_springboot_three_layer_architecture.md:21 — `java` fence — no typechecker and no runtime covers this language
- framework-deep-dives/404_springboot_response_entity_and_records.md:21 — `java` fence — no typechecker and no runtime covers this language
- framework-deep-dives/405_springboot_bean_validation.md:62 — `java` fence — no typechecker and no runtime covers this language
- framework-deep-dives/406_springboot_service_layer_transactional.md:62 — `java` fence — no typechecker and no runtime covers this language
- framework-deep-dives/407_springboot_security_filter_chain.md:62 — `java` fence — no typechecker and no runtime covers this language
- framework-deep-dives/408_springboot_jwt_auth_integration.md:21 — `java` fence — no typechecker and no runtime covers this language
- framework-deep-dives/409_springboot_controller_advice_error_handling.md:62 — `java` fence — no typechecker and no runtime covers this language
- framework-deep-dives/410_springboot_jpa_entities_and_n_plus_one.md:21 — `java` fence — no typechecker and no runtime covers this language
- framework-deep-dives/411_springboot_flyway_migrations.md:109 — `java` fence — no typechecker and no runtime covers this language
- framework-deep-dives/412_springboot_testing_mockmvc_testcontainers.md:21 — `java` fence — no typechecker and no runtime covers this language

### `drill/widget-on-unverified-lesson` — 2

- career-entrepreneurship/114_niche_positioning.md:11 — `quiz` fence on an unverified lesson — it renders nothing
- career-entrepreneurship/114_niche_positioning.md:100 — `recall` fence on an unverified lesson — it renders nothing
