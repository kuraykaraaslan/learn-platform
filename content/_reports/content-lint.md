# Content lint report

`npx tsx scripts/content-lint` — generated file, do not edit by hand.

412 lessons · 768 findings · 0 waived

| Rule | Findings | Severity | What it means |
|---|---:|---|---|
| `sources/no-url` | 282 | warn | A Further Reading section with no followable link is a list of names, not sources. |
| `sources/bare-domain` | 166 | warn | A bare domain in parentheses looks like a citation but renders as plain grey text — remark-gfm only autolinks bare URLs, not "(zod.dev)". |
| `links/non-canonical-ref` | 69 | warn | Cross-references written as "see #41" or "Lesson 41" are never linked; only the canonical "(#41)" form is rewritten by the markdown pipeline. |
| `voice/private-reference` | 62 | warn | Names, repos and paths belonging to the corpus's first owner have no meaning to a reader. |
| `code/private-alias` | 45 | warn | Snippets importing @/libs, @/modules, @/stores or @/components reference the first owner's private boilerplate; no reader can resolve them. |
| `code/unlabeled-fence` | 43 | warn | An unlabeled fence gets no syntax highlighting and cannot be verified by tooling. |
| `sources/disclaimer-as-source` | 40 | warn | A legal/financial disclaimer occupying a Further Reading slot is not a reference. |
| `code/jsx-in-ts-fence` | 19 | warn | JSX inside a fence tagged `typescript` mis-highlights and proves the snippet was never compiled. |
| `voice/audit-residue` | 17 | warn | Sentences that grade the reader's own codebase are left over from the deleted Coverage Level section; the reader has never seen that codebase. |
| `sources/quota-signature` | 15 | warn | Every lesson in a course carrying the same number of Further Reading bullets is a generation artifact, not a research result. |
| `shape/unrecognized-heading` | 10 | warn | A "## " heading the parser does not recognize is silently folded into the previous card instead of becoming its own section. |

## Findings by rule

### `sources/no-url` — 282

- advanced-deep-dive-topics/104_database_internals.md — 3 Further Reading bullets, none with a URL
- advanced-deep-dive-topics/105_cryptography_fundamentals.md — 3 Further Reading bullets, none with a URL
- advanced-deep-dive-topics/106_event_streaming_kafka_vs_bullmq.md — 3 Further Reading bullets, none with a URL
- advanced-deep-dive-topics/107_api_design_philosophy.md — 3 Further Reading bullets, none with a URL
- advanced-deep-dive-topics/108_monorepo_tooling.md — 3 Further Reading bullets, none with a URL
- advanced-deep-dive-topics/109_performance_profiling.md — 3 Further Reading bullets, none with a URL
- advanced-deep-dive-topics/110_reading_large_codebases.md — 3 Further Reading bullets, none with a URL
- advanced-deep-dive-topics/111_production_debugging.md — 3 Further Reading bullets, none with a URL
- advanced-deep-dive-topics/112_technical_writing.md — 3 Further Reading bullets, none with a URL
- advanced-deep-dive-topics/113_systems_thinking.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/140_ai_llm_integration.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/146_when_to_add_ai.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/147_anthropic_api_client_architecture.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/148_prompts_as_versioned_code.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/149_structured_output_schema_validation.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/150_context_window_conversation_management.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/151_tool_use_agentic_loops.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/152_advanced_rag_chunking_reranking_grounding.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/153_model_selection_strategy.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/154_token_budget_cost_engineering.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/155_streaming_ai_responses_production.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/156_fallback_graceful_degradation.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/157_building_eval_pipeline.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/158_observability_logging_ai_features.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/159_prompt_injection_defense.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/160_ai_data_privacy_regulatory_compliance.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/161_ai_feature_ux_patterns.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/162_mcp_server_architecture_tool_design.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/163_mcp_server_auth_error_idempotency.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/164_multi_agent_orchestration_workflow_chaining.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/165_human_in_the_loop_review_gates.md — 3 Further Reading bullets, none with a URL
- algorithms-concurrency/129_concurrency_async_fundamentals.md — 3 Further Reading bullets, none with a URL
- algorithms-concurrency/130_data_structures_algorithms_practice.md — 3 Further Reading bullets, none with a URL
- architecture-design-patterns-testing/132_load_stress_testing_basics.md — 3 Further Reading bullets, none with a URL
- architecture-design-patterns-testing/134_domain_driven_design.md — 3 Further Reading bullets, none with a URL
- architecture-design-patterns-testing/142_capacity_planning_estimation.md — 3 Further Reading bullets, none with a URL
- business-finance-solo-ops/316_cash_flow_and_runway.md — 3 Further Reading bullets, none with a URL
- business-finance-solo-ops/317_invoicing_and_payment_tracking.md — 3 Further Reading bullets, none with a URL
- business-finance-solo-ops/318_banking_and_payment_methods.md — 3 Further Reading bullets, none with a URL
- business-finance-solo-ops/319_tax_and_accounting_readiness.md — 3 Further Reading bullets, none with a URL
- …and 242 more (see content-lint.json)

### `sources/bare-domain` — 166

- advanced-deep-dive-topics/104_database_internals.md — bare domain renders as text, not a link: - *Use The Index, Luke* (use-the-index-luke.com) — practical B-tree index design, vendor-n
- advanced-deep-dive-topics/105_cryptography_fundamentals.md — bare domain renders as text, not a link: - *Cryptopals Challenges* (cryptopals.com) — hands-on exercises that break bad cryptograph
- advanced-deep-dive-topics/106_event_streaming_kafka_vs_bullmq.md — bare domain renders as text, not a link: - BullMQ docs (docs.bullmq.io) — covers patterns, flows, and sandboxed processors
- advanced-deep-dive-topics/106_event_streaming_kafka_vs_bullmq.md — bare domain renders as text, not a link: - Confluent's Kafka tutorials (developer.confluent.io) — free, hands-on, producer/consumer
- advanced-deep-dive-topics/107_api_design_philosophy.md — bare domain renders as text, not a link: - tRPC docs (trpc.io) — especially the Next.js App Router integration guide
- advanced-deep-dive-topics/107_api_design_philosophy.md — bare domain renders as text, not a link: - Google's API Design Guide (cloud.google.com/apis/design) — REST best practices from Goog
- advanced-deep-dive-topics/108_monorepo_tooling.md — bare domain renders as text, not a link: - Turborepo docs (turbo.build/repo) — quickstart is well-written, 30-minute setup
- advanced-deep-dive-topics/108_monorepo_tooling.md — bare domain renders as text, not a link: - Nx docs (nx.dev) — choose Nx over Turborepo if you need code generation and strict bound
- advanced-deep-dive-topics/109_performance_profiling.md — bare domain renders as text, not a link: - clinic.js (clinicjs.org) — the fastest path to a Node.js flame graph, zero config
- advanced-deep-dive-topics/112_technical_writing.md — bare domain renders as text, not a link: - Google's SRE Workbook (sre.google/workbook) — Chapter 8 covers on-call and runbook best 
- advanced-deep-dive-topics/112_technical_writing.md — bare domain renders as text, not a link: - Swagger/OpenAPI docs (swagger.io/docs) — reference for writing OpenAPI 3.0 specs
- ai-llm-engineering/140_ai_llm_integration.md — bare domain renders as text, not a link: - "Building LLM Applications for Production" by Chip Huyen (huyenchip.com)
- ai-llm-engineering/147_anthropic_api_client_architecture.md — bare domain renders as text, not a link: - Anthropic — official TypeScript/Node SDK documentation and README (github.com/anthropics
- ai-llm-engineering/149_structured_output_schema_validation.md — bare domain renders as text, not a link: - Zod official documentation (zod.dev) — schema definition and `safeParse`
- ai-llm-engineering/152_advanced_rag_chunking_reranking_grounding.md — bare domain renders as text, not a link: - Pinecone — "Chunking Strategies for LLM Applications" (learn.pinecone.io)
- ai-llm-engineering/153_model_selection_strategy.md — bare domain renders as text, not a link: - Anthropic — "Models overview" and pricing page (anthropic.com/pricing) — verify current 
- ai-llm-engineering/154_token_budget_cost_engineering.md — bare domain renders as text, not a link: - Anthropic pricing page (anthropic.com/pricing) — always verify current rates before writ
- ai-llm-engineering/157_building_eval_pipeline.md — bare domain renders as text, not a link: - Chip Huyen — "Designing Machine Learning Systems" and her AI Engineering writing on eval
- ai-llm-engineering/157_building_eval_pipeline.md — bare domain renders as text, not a link: - OpenAI Evals framework (github.com/openai/evals) — a widely referenced open-source patte
- ai-llm-engineering/159_prompt_injection_defense.md — bare domain renders as text, not a link: - Simon Willison — extensive public writing on prompt injection, coined much of the common
- ai-llm-engineering/162_mcp_server_architecture_tool_design.md — bare domain renders as text, not a link: - Model Context Protocol specification (modelcontextprotocol.io) — the authoritative refer
- algorithms-concurrency/129_concurrency_async_fundamentals.md — bare domain renders as text, not a link: - Jake Archibald — "Tasks, microtasks, queues and schedules" (jakearchibald.com)
- architecture-design-patterns-testing/132_load_stress_testing_basics.md — bare domain renders as text, not a link: - k6 documentation (k6.io/docs) — test types explained with runnable examples
- architecture-design-patterns-testing/134_domain_driven_design.md — bare domain renders as text, not a link: - Martin Fowler — "AggregateOrientedDatabase" and "BoundedContext" articles (martinfowler.
- business-finance-solo-ops/317_invoicing_and_payment_tracking.md — bare domain renders as text, not a link: - Stripe's guide to invoicing and payment terms for freelancers and small businesses (stri
- business-finance-solo-ops/318_banking_and_payment_methods.md — bare domain renders as text, not a link: - Wise's guide to receiving international payments as a freelancer (wise.com/gb/blog) — pr
- business-finance-solo-ops/319_tax_and_accounting_readiness.md — bare domain renders as text, not a link: - IRS instructions for Form W-8BEN (irs.gov) — the authoritative source for foreign-contra
- business-finance-solo-ops/320_expense_and_subscription_control.md — bare domain renders as text, not a link: - Ramit Sethi's writing on "conscious spending" (iwillteachyoutoberich.com) — though aimed
- career-entrepreneurship/117_financial_literacy.md — bare domain renders as text, not a link: - Turkish Revenue Administration (gib.gov.tr) — source of truth for KDV on exported servic
- content-seo-personal-brand/271_content_pillars_and_strategic_positioning.md — bare domain renders as text, not a link: - HubSpot's guide to "pillar pages and topic clusters" (blog.hubspot.com) — the SEO-adjace
- content-seo-personal-brand/272_idea_capture_system.md — bare domain renders as text, not a link: - Julian Shapiro's essay "How to Write Useful Blog Posts" (julian.com) — a working writer'
- content-seo-personal-brand/275_technical_writing_style_for_business_readers.md — bare domain renders as text, not a link: - Julia Evans' technical zines and blog (jvns.ca) — a widely cited example of explaining d
- content-seo-personal-brand/275_technical_writing_style_for_business_readers.md — bare domain renders as text, not a link: - Google's Technical Writing courses (developers.google.com/tech-writing) — a free, practi
- content-seo-personal-brand/277_content_calendar_cadence_and_quality_gate.md — bare domain renders as text, not a link: - CoSchedule's "Content Calendar" templates and guidance (coschedule.com/marketing-calenda
- content-seo-personal-brand/278_ai_assisted_content_without_losing_your_voice.md — bare domain renders as text, not a link: - Anthropic's guide to prompting Claude (docs.claude.com) — practical, current guidance on
- content-seo-personal-brand/279_content_analytics_library_and_asset_management.md — bare domain renders as text, not a link: - HubSpot's "Marketing Analytics" guidance (blog.hubspot.com/marketing/analytics) — a prac
- content-seo-personal-brand/280_seo_and_aeo_as_one_visibility_system.md — bare domain renders as text, not a link: - Google Search Central documentation (developers.google.com/search) — the primary source 
- content-seo-personal-brand/281_search_intent_topic_clusters_and_keyword_query_mapping.md — bare domain renders as text, not a link: - HubSpot's "Topic Clusters" guide (blog.hubspot.com) — a practical, widely cited explanat
- content-seo-personal-brand/282_technical_seo_foundations_crawl_render_index.md — bare domain renders as text, not a link: - Google Search Central's "Crawling and Indexing" documentation (developers.google.com/sea
- content-seo-personal-brand/283_metadata_titles_descriptions_and_canonical_url_strategy.md — bare domain renders as text, not a link: - The Open Graph protocol documentation (ogp.me) — the spec behind how social platforms re
- …and 126 more (see content-lint.json)

### `links/non-canonical-ref` — 69

- ai-llm-engineering/140_ai_llm_integration.md:6 — "#29" is not the canonical "(#N)" form, so it is never linked
- ai-llm-engineering/140_ai_llm_integration.md:16 — "#29" is not the canonical "(#N)" form, so it is never linked
- ai-llm-engineering/140_ai_llm_integration.md:64 — "#29" is not the canonical "(#N)" form, so it is never linked
- ai-llm-engineering/146_when_to_add_ai.md:59 — "#1" is not the canonical "(#N)" form, so it is never linked
- algorithms-concurrency/130_data_structures_algorithms_practice.md:6 — "#69" is not the canonical "(#N)" form, so it is never linked
- architecture-design-patterns-testing/132_load_stress_testing_basics.md:9 — "#55" is not the canonical "(#N)" form, so it is never linked
- architecture-design-patterns-testing/134_domain_driven_design.md:14 — "#131" is not the canonical "(#N)" form, so it is never linked
- architecture-design-patterns-testing/134_domain_driven_design.md:14 — "#14" is not the canonical "(#N)" form, so it is never linked
- architecture-design-patterns-testing/134_domain_driven_design.md:59 — "#135" is not the canonical "(#N)" form, so it is never linked
- architecture-design-patterns-testing/142_capacity_planning_estimation.md:44 — "#12" is not the canonical "(#N)" form, so it is never linked
- architecture-design-patterns-testing/142_capacity_planning_estimation.md:44 — "#11" is not the canonical "(#N)" form, so it is never linked
- architecture-design-patterns-testing/142_capacity_planning_estimation.md:44 — "#20" is not the canonical "(#N)" form, so it is never linked
- business-finance-solo-ops/339_growth_risk_and_concentration.md:62 — "Lesson 327" is not the canonical "(#N)" form, so it is never linked
- business-finance-solo-ops/341_strategic_repositioning.md:76 — "Lesson 337" is not the canonical "(#N)" form, so it is never linked
- client-delivery-pm-handover/265_support_operations_channels_slas_and_boundaries.md:4 — "Lesson 258" is not the canonical "(#N)" form, so it is never linked
- client-delivery-pm-handover/266_customer_success_metrics_and_health_reporting.md:15 — "Lesson 264" is not the canonical "(#N)" form, so it is never linked
- client-delivery-pm-handover/266_customer_success_metrics_and_health_reporting.md:63 — "Lesson 264" is not the canonical "(#N)" form, so it is never linked
- client-delivery-pm-handover/267_delivery_playbooks_codifying_project_types.md:6 — "Lesson 269" is not the canonical "(#N)" form, so it is never linked
- client-delivery-pm-handover/268_discovery_calls_red_flags_and_disqualification.md:4 — "Lesson 236" is not the canonical "(#N)" form, so it is never linked
- client-delivery-pm-handover/268_discovery_calls_red_flags_and_disqualification.md:6 — "Lesson 236" is not the canonical "(#N)" form, so it is never linked
- client-delivery-pm-handover/268_discovery_calls_red_flags_and_disqualification.md:11 — "Lesson 236" is not the canonical "(#N)" form, so it is never linked
- client-delivery-pm-handover/269_scope_ladders_included_vs_priced_add_ons.md:4 — "Lesson 267" is not the canonical "(#N)" form, so it is never linked
- client-delivery-pm-handover/269_scope_ladders_included_vs_priced_add_ons.md:17 — "Lesson 267" is not the canonical "(#N)" form, so it is never linked
- client-delivery-pm-handover/269_scope_ladders_included_vs_priced_add_ons.md:55 — "Lesson 267" is not the canonical "(#N)" form, so it is never linked
- distributed-systems-api-design/131_message_queues_101.md:6 — "#7" is not the canonical "(#N)" form, so it is never linked
- distributed-systems-api-design/135_microservices_vs_monolith.md:4 — "#53" is not the canonical "(#N)" form, so it is never linked
- distributed-systems-api-design/135_microservices_vs_monolith.md:6 — "#134" is not the canonical "(#N)" form, so it is never linked
- distributed-systems-api-design/135_microservices_vs_monolith.md:14 — "#3" is not the canonical "(#N)" form, so it is never linked
- distributed-systems-api-design/135_microservices_vs_monolith.md:14 — "#14" is not the canonical "(#N)" form, so it is never linked
- distributed-systems-api-design/135_microservices_vs_monolith.md:14 — "#15" is not the canonical "(#N)" form, so it is never linked
- distributed-systems-api-design/136_api_gateway_bff.md:4 — "#135" is not the canonical "(#N)" form, so it is never linked
- framework-deep-dives/400_express_validation_and_response_conventions.md:131 — "#9" is not the canonical "(#N)" form, so it is never linked
- fundamentals-tools/121_sql_fundamentals.md:48 — "#18" is not the canonical "(#N)" form, so it is never linked
- fundamentals-tools/123_debugging_fundamentals.md:52 — "#111" is not the canonical "(#N)" form, so it is never linked
- fundamentals-tools/127_auth_basics.md:4 — "#32" is not the canonical "(#N)" form, so it is never linked
- fundamentals-tools/139_git_internals_advanced_workflows.md:16 — "#120" is not the canonical "(#N)" form, so it is never linked
- observability-deployment/141_cloud_architecture_well_architected.md:4 — "#49" is not the canonical "(#N)" form, so it is never linked
- observability-deployment/141_cloud_architecture_well_architected.md:4 — "#1" is not the canonical "(#N)" form, so it is never linked
- privacy-compliance-incident-response/362_incident_response_process_detection_to_postmortem.md:4 — "#79" is not the canonical "(#N)" form, so it is never linked
- privacy-compliance-incident-response/362_incident_response_process_detection_to_postmortem.md:6 — "#363" is not the canonical "(#N)" form, so it is never linked
- …and 29 more (see content-lint.json)

### `voice/private-reference` — 62

- advanced-deep-dive-topics/108_monorepo_tooling.md:8 — private reference: The main benefit is not the caching — it's colocation. When your UI component library (`01
- advanced-deep-dive-topics/108_monorepo_tooling.md:24 — private reference: │   ├── next-boilerplate/          # your main SaaS app
- advanced-deep-dive-topics/108_monorepo_tooling.md:73 — private reference: // apps/next-boilerplate/package.json (relevant part)
- advanced-deep-dive-topics/108_monorepo_tooling.md:85 — private reference: npx turbo test --filter=next-boilerplate  # only test one app
- advanced-deep-dive-topics/112_technical_writing.md:26 — private reference: **Owner:** @kuray
- advanced-deep-dive-topics/112_technical_writing.md:59 — private reference: pm2 restart next-boilerplate
- advanced-deep-dive-topics/112_technical_writing.md:61 — private reference: kubectl rollout restart deployment/next-boilerplate
- business-finance-solo-ops/344_referral_and_partner_channels.md:36 — private reference: "Kuray helped us replace three spreadsheets with a live reporting
- business-finance-solo-ops/346_case_study_and_proof_loop.md:58 — private reference: "Before working with Kuray, we spent most of Monday morning
- career-entrepreneurship/118_building_in_public.md:26 — private reference: ## Week 1 — Architecture Posts (from next-boilerplate)
- content-seo-personal-brand/283_metadata_titles_descriptions_and_canonical_url_strategy.md:26 — private reference: **Title:** Custom SaaS MVP Development for SMEs | Kuray Karaaslan
- content-seo-personal-brand/286_entity_clarity_and_eeat_trust_signals.md:24 — private reference: Written by Kuray Karaaslan, a software engineer focused on production-ready
- framework-deep-dives/424_electron_project_structure_and_vite_build_config.md:37 — private reference: │   │   ├── components/     ← forked KUIreact
- framework-deep-dives/425_electron_renderer_react_and_kuireact_fork.md:1 — private reference: # 425. Electron: Renderer Architecture — React, Client Routing, and the KUIreact Fork
- framework-deep-dives/425_electron_renderer_react_and_kuireact_fork.md:6 — private reference: Data never flows into the renderer through a fetch call or a server component; it flows ex
- framework-deep-dives/425_electron_renderer_react_and_kuireact_fork.md:8 — private reference: KUIreact itself — a private, 145-component Next.js showcase library — is deliberately **co
- framework-deep-dives/425_electron_renderer_react_and_kuireact_fork.md:14 — private reference: - **Components stay fetch-agnostic**, receiving data/handlers as props — this is the exact
- framework-deep-dives/425_electron_renderer_react_and_kuireact_fork.md:15 — private reference: - **KUIreact is copied/forked into `src/renderer/components/`, not installed as a package*
- framework-deep-dives/425_electron_renderer_react_and_kuireact_fork.md:71 — private reference: return <DataTable rows={rows} loading={loading} onPage={load} />;   // ✅ same component KU
- framework-deep-dives/425_electron_renderer_react_and_kuireact_fork.md:75 — private reference: // ❌ from KUIreact (Next)
- framework-deep-dives/425_electron_renderer_react_and_kuireact_fork.md:91 — private reference: Re-sync: diff upstream modules/ui against this folder each KUIreact minor; re-apply the la
- framework-deep-dives/425_electron_renderer_react_and_kuireact_fork.md:97 — private reference: - Bringing a KUIreact component into the app for the first time — copy it, don't reference
- framework-deep-dives/425_electron_renderer_react_and_kuireact_fork.md:99 — private reference: - Re-syncing after a KUIreact update — diff upstream against the fork using `_FORK.md`'s r
- framework-deep-dives/425_electron_renderer_react_and_kuireact_fork.md:103 — private reference: - **Calling `window.api` directly from inside a presentational component** — couples the c
- framework-deep-dives/425_electron_renderer_react_and_kuireact_fork.md:104 — private reference: - **Trying to `npm install` KUIreact as if it were a published package** — it's a private 
- framework-deep-dives/425_electron_renderer_react_and_kuireact_fork.md:106 — private reference: - **Editing a forked KUIreact component's styling locally instead of wrapping it** — cause
- framework-deep-dives/427_electron_environment_secrets_and_auto_updates.md:75 — private reference: appId: com.kuray.myapp
- framework-deep-dives/429_electron_window_chrome_and_desktop_layout.md:6 — private reference: Multi-window decisions default toward *not* opening a new window: a single window with in-
- framework-deep-dives/429_electron_window_chrome_and_desktop_layout.md:8 — private reference: Desktop layout differs from web layout in density and resilience to resizing, not in its c
- framework-deep-dives/429_electron_window_chrome_and_desktop_layout.md:14 — private reference: - **Most "modals" should be in-window KUIreact `Modal`s, not separate OS windows** — a tru
- framework-deep-dives/429_electron_window_chrome_and_desktop_layout.md:90 — private reference: - **Building a native modal child window for an in-content confirmation** — heavier than n
- framework-deep-dives/430_electron_menus_shortcuts_tray_and_dialogs.md:4 — private reference: Desktop apps expose two visually and functionally different kinds of menu, and confusing t
- framework-deep-dives/430_electron_menus_shortcuts_tray_and_dialogs.md:8 — private reference: The tray icon is an earned feature, not a default one — it belongs on an app that does som
- framework-deep-dives/430_electron_menus_shortcuts_tray_and_dialogs.md:11 — private reference: - **Application menu (native, OS-level) vs context menu (native or KUIreact `DropdownMenu`
- framework-deep-dives/430_electron_menus_shortcuts_tray_and_dialogs.md:17 — private reference: - **Native `dialog` is for file pick/save and hard-blocking pre-window decisions; KUIreact
- framework-deep-dives/430_electron_menus_shortcuts_tray_and_dialogs.md:95 — private reference: - Building the app's top-level menu bar — use native `Menu` with `role`-based items, and r
- framework-deep-dives/430_electron_menus_shortcuts_tray_and_dialogs.md:98 — private reference: - Picking or saving a file, or showing a hard-blocking pre-window error — native `dialog`;
- observability-deployment/53_opentelemetry.md:38 — private reference: [SEMRESATTRS_SERVICE_NAME]: 'next-boilerplate',
- observability-deployment/53_opentelemetry.md:65 — private reference: const tracer = trace.getTracer('next-boilerplate');
- observability-deployment/57_blue_green_vs_rolling_deployment.md:65 — private reference: name: 'next-boilerplate',
- …and 22 more (see content-lint.json)

### `code/private-alias` — 45

- advanced-deep-dive-topics/101_realtime_systems.md:22 — imports a private alias: @/modules/auth/auth.token.service, @/libs/redis
- advanced-deep-dive-topics/106_event_streaming_kafka_vs_bullmq.md:22 — imports a private alias: @/libs/redis/bullmq
- advanced-deep-dive-topics/107_api_design_philosophy.md:22 — imports a private alias: @/modules/user/user.service, @/libs/trpc
- ai-llm-engineering/147_anthropic_api_client_architecture.md:20 — imports a private alias: @/libs/errors, @/libs/ai/client, @/libs/ai/extract-text
- ai-llm-engineering/148_prompts_as_versioned_code.md:20 — imports a private alias: @/libs/ai/client, @/libs/ai/prompts/summary.prompt, @/libs/ai/extract-text, @/libs/logger
- ai-llm-engineering/149_structured_output_schema_validation.md:20 — imports a private alias: @/libs/ai/client, @/libs/ai/extract-text, @/libs/errors, @/libs/logger
- ai-llm-engineering/155_streaming_ai_responses_production.md:21 — imports a private alias: @/libs/ai/client
- ai-llm-engineering/156_fallback_graceful_degradation.md:21 — imports a private alias: @/libs/logger, @/libs/errors
- architecture-design-patterns-testing/71_test_pyramid.md:27 — imports a private alias: @/modules/auth/auth.service, @/modules/auth/auth.service, @/libs/typeorm
- architecture-design-patterns-testing/74_tdd_cycle.md:25 — imports a private alias: @/modules/auth/auth.service
- database-advanced/43_zero_downtime_database_migration.md:21 — imports a private alias: @/libs/typeorm
- distributed-systems-api-design/07_idempotency_key_pattern.md:21 — imports a private alias: @/libs/db
- framework-deep-dives/396_express_two_layer_architecture.md:21 — imports a private alias: @/libs/typeorm, @/modules/project/entities/Project, @/libs/app-error, @/modules/project/project.messages, @/modules/project/project.dto, @/modules/project/project.service, @/modules/project/project.dto, @/libs/middleware/auth, @/libs/middleware/rate-limit, @/modules/project/project.route, @/libs/middleware/auth
- framework-deep-dives/397_express_middleware_pipeline_and_security.md:21 — imports a private alias: @/libs/env, @/libs/middleware/cors, @/libs/middleware/helmet, @/libs/middleware/error, @/libs/router/system, @/libs/router/tenant, @/libs/middleware/rate-limit, @/modules/auth/auth.service
- framework-deep-dives/398_express_curried_auth_middleware.md:21 — imports a private alias: @/modules/user/user.types, @/modules/user_session/user_session.types, @/modules/user_session/user_session.service, @/libs/app-error, @/modules/auth/auth.messages, @/libs/redis, @/libs/crypto, @/libs/env, @/libs/app-error, @/modules/auth/auth.messages, @/modules/user_session/user_session.types, @/libs/middleware/auth, @/libs/middleware/rate-limit, @/modules/user/user.service
- framework-deep-dives/399_express_centralized_error_handling.md:21 — imports a private alias: @/libs/app-error, @/libs/logger, @/libs/app-error, @/libs/logger, @/modules/auth/auth.messages, @/modules/auth/auth.service, @/modules/auth/auth.dto
- framework-deep-dives/400_express_validation_and_response_conventions.md:21 — imports a private alias: @/libs/validation, @/libs/pagination, @/modules/project/project.dto, @/modules/project/project.service
- framework-deep-dives/401_express_realtime_sse_and_socketio.md:21 — imports a private alias: @/libs/middleware/auth, @/modules/jobs/job.service, @/libs/validation, @/libs/jwt, @/libs/env, @/libs/typeorm, @/modules/notification/entities/Notification, @/libs/socket, @/modules/notification/notification.types, @/libs/socket, @/libs/env
- framework-deep-dives/402_express_testing_with_jest_and_supertest.md:21 — imports a private alias: @/libs/typeorm, @/modules/user/entities/User, @/libs/typeorm, @/modules/project/entities/Project, @/modules/user/entities/User, @/modules/auth/tests/helpers/auth.helper
- framework-deep-dives/413_reactnative_file_organization_and_banned_patterns.md:83 — imports a private alias: @/libs/axios
- framework-deep-dives/414_reactnative_expo_router_navigation.md:21 — imports a private alias: @/stores/authStore, @/stores/authStore, @/stores/authStore
- framework-deep-dives/415_reactnative_zustand_mmkv_state_management.md:21 — imports a private alias: @/libs/mmkv, @/libs/zustandStorage, @/libs/secureStorage
- framework-deep-dives/416_reactnative_data_fetching_and_offline.md:21 — imports a private alias: @/libs/axios, @/libs/errorUtils, @/libs/axios, @/libs/errorUtils
- framework-deep-dives/418_reactnative_nativewind_styling_tokens_and_dark_mode.md:22 — imports a private alias: @/stores/appStore
- framework-deep-dives/419_reactnative_accessibility_and_feedback_patterns.md:21 — imports a private alias: @/components/ui/SkeletonCard
- framework-deep-dives/420_reactnative_testing_jest_rntl_and_maestro.md:21 — imports a private alias: @/stores/authStore
- framework-deep-dives/425_electron_renderer_react_and_kuireact_fork.md:21 — imports a private alias: @/modules/home/ui/Home, @/modules/settings/ui/Settings, @/libs/api, @/components/ui
- frontend-performance-scaling/24_bundle_size_optimization.md:21 — imports a private alias: @/components/ui, @/components/ui/button, @/components/ui/input, @/components/ui/modal
- frontend-performance-scaling/25_web_vitals.md:21 — imports a private alias: @/components/web-vitals-reporter
- frontend-performance-scaling/26_streaming_ssr_suspense.md:21 — imports a private alias: @/modules/ui/skeletons
- frontend-performance-scaling/27_job_queue_bullmq.md:21 — imports a private alias: @/libs/redis/bullmq, @/modules/notification_mail/notification_mail.service, @/libs/logger
- frontend-performance-scaling/28_horizontal_scaling_stateless_design.md:21 — imports a private alias: @/libs/redis, @/libs/redis
- observability-deployment/55_slo_sli_sla.md:23 — imports a private alias: @/libs/redis, @/libs/logger
- observability-deployment/56_canary_deployment_feature_flags.md:21 — imports a private alias: @/libs/redis
- observability-deployment/57_blue_green_vs_rolling_deployment.md:23 — imports a private alias: @/libs/typeorm, @/libs/redis
- observability-deployment/61_alerting_design.md:23 — imports a private alias: @/libs/redis, @/libs/logger
- observability-deployment/62_log_aggregation.md:25 — imports a private alias: @/libs/env
- observability-deployment/63_chaos_engineering.md:23 — imports a private alias: @/libs/chaos
- saas-business-skills/87_payment_integration_depth.md:22 — imports a private alias: @/libs/db
- saas-business-skills/88_email_deliverability.md:23 — imports a private alias: @/libs/db
- …and 5 more (see content-lint.json)

### `code/unlabeled-fence` — 43

- advanced-deep-dive-topics/108_monorepo_tooling.md:21 — fence has no language tag
- advanced-deep-dive-topics/110_reading_large_codebases.md:24 — fence has no language tag
- advanced-deep-dive-topics/111_production_debugging.md:24 — fence has no language tag
- advanced-deep-dive-topics/112_technical_writing.md:74 — fence has no language tag
- advanced-deep-dive-topics/113_systems_thinking.md:61 — fence has no language tag
- business-finance-solo-ops/316_cash_flow_and_runway.md:23 — fence has no language tag
- business-finance-solo-ops/317_invoicing_and_payment_tracking.md:22 — fence has no language tag
- business-finance-solo-ops/317_invoicing_and_payment_tracking.md:33 — fence has no language tag
- business-finance-solo-ops/318_banking_and_payment_methods.md:22 — fence has no language tag
- business-finance-solo-ops/318_banking_and_payment_methods.md:41 — fence has no language tag
- business-finance-solo-ops/319_tax_and_accounting_readiness.md:22 — fence has no language tag
- business-finance-solo-ops/319_tax_and_accounting_readiness.md:43 — fence has no language tag
- business-finance-solo-ops/320_expense_and_subscription_control.md:22 — fence has no language tag
- business-finance-solo-ops/320_expense_and_subscription_control.md:36 — fence has no language tag
- business-finance-solo-ops/321_project_accounting_and_costing.md:22 — fence has no language tag
- business-finance-solo-ops/322_time_tracking_and_effective_rate.md:21 — fence has no language tag
- business-finance-solo-ops/323_revenue_stream_design.md:21 — fence has no language tag
- business-finance-solo-ops/324_monthly_financial_close.md:20 — fence has no language tag
- business-finance-solo-ops/325_finance_dashboard_and_kpis.md:22 — fence has no language tag
- business-finance-solo-ops/326_business_records_and_file_system.md:21 — fence has no language tag
- business-finance-solo-ops/327_risk_reserve_and_contingency.md:21 — fence has no language tag
- business-finance-solo-ops/328_procurement_and_vendor_management.md:21 — fence has no language tag
- business-finance-solo-ops/330_pricing_for_margin.md:21 — fence has no language tag
- business-finance-solo-ops/334_retainer_renewal_and_negotiation.md:22 — fence has no language tag
- business-finance-solo-ops/345_pipeline_forecasting.md:21 — fence has no language tag
- business-finance-solo-ops/348_acquisition_funnel_and_attribution.md:21 — fence has no language tag
- career-entrepreneurship/114_niche_positioning.md:23 — fence has no language tag
- career-entrepreneurship/114_niche_positioning.md:30 — fence has no language tag
- career-entrepreneurship/117_financial_literacy.md:63 — fence has no language tag
- career-entrepreneurship/118_building_in_public.md:62 — fence has no language tag
- client-delivery-pm-handover/252_database_api_and_integration_handover_docs.md:55 — fence has no language tag
- client-delivery-pm-handover/253_deployment_runbook_and_emergency_handover.md:70 — fence has no language tag
- framework-deep-dives/413_reactnative_file_organization_and_banned_patterns.md:21 — fence has no language tag
- framework-deep-dives/424_electron_project_structure_and_vite_build_config.md:21 — fence has no language tag
- fundamentals-tools/119_http_fundamentals.md:20 — fence has no language tag
- fundamentals-tools/133_networking_fundamentals.md:17 — fence has no language tag
- observability-deployment/58_dockerfile_best_practices.md:72 — fence has no language tag
- open-source-community/94_contributing_to_open_source.md:52 — fence has no language tag
- open-source-community/94_contributing_to_open_source.md:56 — fence has no language tag
- open-source-community/94_contributing_to_open_source.md:111 — fence has no language tag
- …and 3 more (see content-lint.json)

### `sources/disclaimer-as-source` — 40

- business-finance-solo-ops/316_cash_flow_and_runway.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Reserve percent
- business-finance-solo-ops/317_invoicing_and_payment_tracking.md — disclaimer in Further Reading: - This lesson is general education, not legal or accounting advice. Invoice numb
- business-finance-solo-ops/318_banking_and_payment_methods.md — disclaimer in Further Reading: - This lesson is general education, not accounting advice. Currency conversion t
- business-finance-solo-ops/319_tax_and_accounting_readiness.md — disclaimer in Further Reading: - This lesson is general education, not tax or legal advice. It does not replace
- business-finance-solo-ops/320_expense_and_subscription_control.md — disclaimer in Further Reading: - This lesson is general education, not accounting advice. Whether a given expen
- business-finance-solo-ops/321_project_accounting_and_costing.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Treat effective
- business-finance-solo-ops/322_time_tracking_and_effective_rate.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Time-tracking d
- business-finance-solo-ops/323_revenue_stream_design.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Revenue classif
- business-finance-solo-ops/324_monthly_financial_close.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. The monthly clo
- business-finance-solo-ops/325_finance_dashboard_and_kpis.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. These KPIs are 
- business-finance-solo-ops/326_business_records_and_file_system.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Confirm with yo
- business-finance-solo-ops/327_risk_reserve_and_contingency.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Reserve sizing 
- business-finance-solo-ops/328_procurement_and_vendor_management.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Contract terms 
- business-finance-solo-ops/329_operations_sops_and_admin_calendar.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Calendar cadenc
- business-finance-solo-ops/330_pricing_for_margin.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Margin targets 
- business-finance-solo-ops/331_productized_offer_catalog.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Price bands sho
- business-finance-solo-ops/332_paid_audit_as_door_opener.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Price bands her
- business-finance-solo-ops/333_retainers_vs_maintenance.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Cancellation an
- business-finance-solo-ops/334_retainer_renewal_and_negotiation.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Any price chang
- business-finance-solo-ops/335_custom_bundle_design.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Confirm any cus
- business-finance-solo-ops/336_scoping_fixed_price_projects.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Scope and chang
- business-finance-solo-ops/337_selling_without_a_reference.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Any client-faci
- business-finance-solo-ops/338_growth_focus_and_bets.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Trial-period le
- business-finance-solo-ops/339_growth_risk_and_concentration.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Concentration t
- business-finance-solo-ops/340_scaling_with_contractors.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Contractor agre
- business-finance-solo-ops/341_strategic_repositioning.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Any public clai
- business-finance-solo-ops/342_account_health_management.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Refund, credit,
- business-finance-solo-ops/343_expansion_signals_and_upsell.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Expansion prici
- business-finance-solo-ops/344_referral_and_partner_channels.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Referral fee ar
- business-finance-solo-ops/345_pipeline_forecasting.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Weighted foreca
- business-finance-solo-ops/346_case_study_and_proof_loop.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Always confirm 
- business-finance-solo-ops/347_growth_model_and_north_star.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Directional tar
- business-finance-solo-ops/348_acquisition_funnel_and_attribution.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Attribution per
- business-finance-solo-ops/349_growth_experiment_design.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Directional sig
- business-finance-solo-ops/350_decision_rules_and_scaling.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Capacity and sc
- business-finance-solo-ops/351_weekly_monthly_business_review.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Revenue and mar
- business-finance-solo-ops/352_ethical_growth_guardrails.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Data collection
- business-finance-solo-ops/353_business_continuity_planning.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. SLA remedy comm
- business-finance-solo-ops/354_non_negotiable_operating_rules.md — disclaimer in Further Reading: - This lesson is general education, not financial or tax advice. Specific capaci
- business-finance-solo-ops/355_burnout_as_a_business_risk.md — disclaimer in Further Reading: - This lesson is general education, not financial, tax, or medical advice. Persi

### `code/jsx-in-ts-fence` — 19

- advanced-deep-dive-topics/109_performance_profiling.md:22 — fence contains JSX but is tagged `typescript` — should be `tsx`
- ai-llm-engineering/163_mcp_server_auth_error_idempotency.md:21 — fence contains JSX but is tagged `typescript` — should be `tsx`
- architecture-design-patterns-testing/69_tail_call_memoization_lazy_evaluation.md:25 — fence contains JSX but is tagged `typescript` — should be `tsx`
- framework-deep-dives/414_reactnative_expo_router_navigation.md:21 — fence contains JSX but is tagged `typescript` — should be `tsx`
- framework-deep-dives/416_reactnative_data_fetching_and_offline.md:21 — fence contains JSX but is tagged `typescript` — should be `tsx`
- framework-deep-dives/418_reactnative_nativewind_styling_tokens_and_dark_mode.md:22 — fence contains JSX but is tagged `typescript` — should be `tsx`
- framework-deep-dives/421_electron_process_model_and_typed_ipc.md:21 — fence contains JSX but is tagged `typescript` — should be `tsx`
- framework-deep-dives/422_electron_preload_and_context_isolation.md:21 — fence contains JSX but is tagged `typescript` — should be `tsx`
- frontend-performance-scaling/22_http2_multiplexing.md:21 — fence contains JSX but is tagged `typescript` — should be `tsx`
- frontend-performance-scaling/23_react_server_components.md:21 — fence contains JSX but is tagged `typescript` — should be `tsx`
- frontend-performance-scaling/24_bundle_size_optimization.md:21 — fence contains JSX but is tagged `typescript` — should be `tsx`
- frontend-performance-scaling/25_web_vitals.md:21 — fence contains JSX but is tagged `typescript` — should be `tsx`
- frontend-performance-scaling/26_streaming_ssr_suspense.md:21 — fence contains JSX but is tagged `typescript` — should be `tsx`
- privacy-compliance-incident-response/360_cookie_consent_tracking_governance.md:21 — fence contains JSX but is tagged `typescript` — should be `tsx`
- process-soft-skills/77_technical_debt_prioritization.md:22 — fence contains JSX but is tagged `typescript` — should be `tsx`
- saas-business-skills/90_accessibility.md:22 — fence contains JSX but is tagged `typescript` — should be `tsx`
- saas-business-skills/92_analytics_integration.md:22 — fence contains JSX but is tagged `typescript` — should be `tsx`
- saas-business-skills/93_ab_test_infrastructure.md:22 — fence contains JSX but is tagged `typescript` — should be `tsx`
- security/35_content_security_policy_csp_headers.md:21 — fence contains JSX but is tagged `typescript` — should be `tsx`

### `voice/audit-residue` — 17

- advanced-deep-dive-topics/102_edge_computing.md:8 — assumes a codebase the reader has not seen: Cloudflare Workers extend this further with Durable Objects (strongly consistent stateful 
- architecture-design-patterns-testing/65_hexagonal_architecture.md:8 — assumes a codebase the reader has not seen: You already have this in your payment module. `BasePaymentProvider` is a Driven Port. `Str
- architecture-design-patterns-testing/66_dependency_injection_container.md:10 — assumes a codebase the reader has not seen: For your boilerplate, the immediate gap is not necessarily "install a DI framework" — it i
- architecture-design-patterns-testing/69_tail_call_memoization_lazy_evaluation.md:12 — assumes a codebase the reader has not seen: For your stack, memoization is immediately applicable to permission checking, tenant confi
- architecture-design-patterns-testing/71_test_pyramid.md:14 — assumes a codebase the reader has not seen: For your codebase, the highest-value first tests are integration tests on `AuthService.log
- architecture-design-patterns-testing/72_property_based_testing.md:10 — assumes a codebase the reader has not seen: For your stack, property-based testing shines on Zod schemas (does the schema accept exact
- architecture-design-patterns-testing/73_contract_testing_pact.md:10 — assumes a codebase the reader has not seen: For your stack, the highest-value use of Pact is testing your payment provider integration
- database-advanced/42_optimistic_vs_pessimistic_locking.md:10 — assumes a codebase the reader has not seen: For your SaaS, pessimistic locking is the safer default for low-frequency high-stakes oper
- database-advanced/47_audit_log_design_application_level.md:6 — assumes a codebase the reader has not seen: The properties that distinguish a compliance-grade audit log from a simple event log are: 
- distributed-systems-api-design/05_rate_limiting_strategies.md:8 — assumes a codebase the reader has not seen: For your SaaS, you likely want different algorithms for different endpoints. Public auth e
- fundamentals-tools/122_oop_data_structures_basics.md:4 — assumes a codebase the reader has not seen: SOLID Principles (#64) assumes you already have this vocabulary: classes as a bundle of st
- security/32_jwt_security_rs256_hs256_rotation.md:22 — assumes a codebase the reader has not seen: // Your current approach (HS256) — correct for your architecture.
- security/32_jwt_security_rs256_hs256_rotation.md:24 — assumes a codebase the reader has not seen: // and how to implement reuse detection (the gap in your current implementation).
- security/32_jwt_security_rs256_hs256_rotation.md:131 — assumes a codebase the reader has not seen: - **HS256** — Your current setup; correct when all token verification happens on your own 
- security/32_jwt_security_rs256_hs256_rotation.md:135 — assumes a codebase the reader has not seen: - **`notBefore: 5` on refresh tokens** — You already do this; prevents a race condition wh
- security/33_ssrf_server_side_request_forgery.md:8 — assumes a codebase the reader has not seen: For your SaaS specifically, the realistic SSRF surface areas are: tenant custom webhook UR
- security/39_rbac_vs_abac.md:8 — assumes a codebase the reader has not seen: For your SaaS, you are currently at the right level of abstraction. You have RBAC within t

### `sources/quota-signature` — 15

- advanced-deep-dive-topics — all 13 lessons have exactly 3 Further Reading bullets (zero variance)
- ai-llm-engineering — all 21 lessons have exactly 3 Further Reading bullets (zero variance)
- architecture-design-patterns-testing — all 14 lessons have exactly 3 Further Reading bullets (zero variance)
- client-acquisition-sales — all 24 lessons have exactly 3 Further Reading bullets (zero variance)
- client-delivery-pm-handover — all 34 lessons have exactly 3 Further Reading bullets (zero variance)
- content-seo-personal-brand — all 43 lessons have exactly 3 Further Reading bullets (zero variance)
- database-advanced — all 12 lessons have exactly 3 Further Reading bullets (zero variance)
- distributed-systems-api-design — all 18 lessons have exactly 3 Further Reading bullets (zero variance)
- frontend-performance-scaling — all 8 lessons have exactly 3 Further Reading bullets (zero variance)
- fundamentals-tools — all 12 lessons have exactly 3 Further Reading bullets (zero variance)
- observability-deployment — all 13 lessons have exactly 3 Further Reading bullets (zero variance)
- process-soft-skills — all 13 lessons have exactly 3 Further Reading bullets (zero variance)
- product-technical-strategy — all 25 lessons have exactly 3 Further Reading bullets (zero variance)
- saas-business-skills — all 8 lessons have exactly 3 Further Reading bullets (zero variance)
- security — all 13 lessons have exactly 3 Further Reading bullets (zero variance)

### `shape/unrecognized-heading` — 10

- open-source-community/94_contributing_to_open_source.md:75 — "## Problem" is not a recognized section; it renders inside the previous card.
- open-source-community/94_contributing_to_open_source.md:78 — "## Solution" is not a recognized section; it renders inside the previous card.
- open-source-community/94_contributing_to_open_source.md:81 — "## Testing" is not a recognized section; it renders inside the previous card.
- open-source-community/94_contributing_to_open_source.md:84 — "## Before / After (if applicable)" is not a recognized section; it renders inside the previous card.
- open-source-community/95_publishing_maintaining_oss_tool.md:96 — "## Install" is not a recognized section; it renders inside the previous card.
- open-source-community/95_publishing_maintaining_oss_tool.md:102 — "## Quick Start" is not a recognized section; it renders inside the previous card.
- open-source-community/95_publishing_maintaining_oss_tool.md:107 — "## API Reference" is not a recognized section; it renders inside the previous card.
- open-source-community/95_publishing_maintaining_oss_tool.md:111 — "## Why This Exists" is not a recognized section; it renders inside the previous card.
- open-source-community/95_publishing_maintaining_oss_tool.md:116 — "## Contributing" is not a recognized section; it renders inside the previous card.
- open-source-community/95_publishing_maintaining_oss_tool.md:120 — "## License" is not a recognized section; it renders inside the previous card.
