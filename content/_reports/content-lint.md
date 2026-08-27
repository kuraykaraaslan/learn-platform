# Content lint report

`npx tsx scripts/content-lint` — generated file, do not edit by hand.

412 lessons · 274 findings · 4 waived

| Rule | Findings | Severity | What it means |
|---|---:|---|---|
| `sources/no-url` | 172 | warn | A Further Reading section with no followable link is a list of names, not sources. |
| `code/private-alias` | 45 | warn | Snippets importing @/libs, @/modules, @/stores or @/components reference the first owner's private boilerplate; no reader can resolve them. |
| `code/unlabeled-fence` | 35 | warn | An unlabeled fence gets no syntax highlighting and cannot be verified by tooling. |
| `sources/quota-signature` | 15 | warn | Every lesson in a course carrying the same number of Further Reading bullets is a generation artifact, not a research result. |
| `sources/bare-domain` | 6 | warn | A bare domain in parentheses looks like a citation but renders as plain grey text — remark-gfm only autolinks bare URLs, not "(zod.dev)". |
| `links/unlinked-lesson-ref` | 1 | warn | A "#N" that matches a real lesson but carries no reference cue is left as plain text by the markdown pipeline, because "rule #1" and "Top 10 #29" also exist. Parenthesise it as "(#N)" or add a cue ("see #N"). |

## Findings by rule

### `sources/no-url` — 172

- advanced-deep-dive-topics/110_reading_large_codebases.md — 3 Further Reading bullets, none with a URL
- advanced-deep-dive-topics/111_production_debugging.md — 3 Further Reading bullets, none with a URL
- advanced-deep-dive-topics/113_systems_thinking.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/146_when_to_add_ai.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/148_prompts_as_versioned_code.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/150_context_window_conversation_management.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/151_tool_use_agentic_loops.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/152_advanced_rag_chunking_reranking_grounding.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/155_streaming_ai_responses_production.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/156_fallback_graceful_degradation.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/158_observability_logging_ai_features.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/160_ai_data_privacy_regulatory_compliance.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/161_ai_feature_ux_patterns.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/163_mcp_server_auth_error_idempotency.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/164_multi_agent_orchestration_workflow_chaining.md — 3 Further Reading bullets, none with a URL
- ai-llm-engineering/165_human_in_the_loop_review_gates.md — 3 Further Reading bullets, none with a URL
- algorithms-concurrency/130_data_structures_algorithms_practice.md — 3 Further Reading bullets, none with a URL
- architecture-design-patterns-testing/142_capacity_planning_estimation.md — 3 Further Reading bullets, none with a URL
- business-finance-solo-ops/316_cash_flow_and_runway.md — 2 Further Reading bullets, none with a URL
- business-finance-solo-ops/317_invoicing_and_payment_tracking.md — 2 Further Reading bullets, none with a URL
- business-finance-solo-ops/321_project_accounting_and_costing.md — 2 Further Reading bullets, none with a URL
- business-finance-solo-ops/322_time_tracking_and_effective_rate.md — 2 Further Reading bullets, none with a URL
- business-finance-solo-ops/323_revenue_stream_design.md — 2 Further Reading bullets, none with a URL
- business-finance-solo-ops/324_monthly_financial_close.md — 2 Further Reading bullets, none with a URL
- business-finance-solo-ops/325_finance_dashboard_and_kpis.md — 2 Further Reading bullets, none with a URL
- business-finance-solo-ops/326_business_records_and_file_system.md — 2 Further Reading bullets, none with a URL
- business-finance-solo-ops/327_risk_reserve_and_contingency.md — 2 Further Reading bullets, none with a URL
- business-finance-solo-ops/328_procurement_and_vendor_management.md — 2 Further Reading bullets, none with a URL
- business-finance-solo-ops/329_operations_sops_and_admin_calendar.md — 2 Further Reading bullets, none with a URL
- business-finance-solo-ops/330_pricing_for_margin.md — 2 Further Reading bullets, none with a URL
- business-finance-solo-ops/331_productized_offer_catalog.md — 2 Further Reading bullets, none with a URL
- business-finance-solo-ops/332_paid_audit_as_door_opener.md — 2 Further Reading bullets, none with a URL
- business-finance-solo-ops/333_retainers_vs_maintenance.md — 2 Further Reading bullets, none with a URL
- business-finance-solo-ops/334_retainer_renewal_and_negotiation.md — 2 Further Reading bullets, none with a URL
- business-finance-solo-ops/335_custom_bundle_design.md — 2 Further Reading bullets, none with a URL
- business-finance-solo-ops/336_scoping_fixed_price_projects.md — 2 Further Reading bullets, none with a URL
- business-finance-solo-ops/337_selling_without_a_reference.md — 2 Further Reading bullets, none with a URL
- business-finance-solo-ops/338_growth_focus_and_bets.md — 2 Further Reading bullets, none with a URL
- business-finance-solo-ops/339_growth_risk_and_concentration.md — 2 Further Reading bullets, none with a URL
- business-finance-solo-ops/340_scaling_with_contractors.md — 2 Further Reading bullets, none with a URL
- …and 132 more (see content-lint.json)

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
- framework-deep-dives/425_electron_renderer_react_and_design_system_fork.md:21 — imports a private alias: @/modules/home/ui/Home, @/modules/settings/ui/Settings, @/libs/api, @/components/ui
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

### `code/unlabeled-fence` — 35

- advanced-deep-dive-topics/108_monorepo_tooling.md:21 — fence has no language tag
- advanced-deep-dive-topics/110_reading_large_codebases.md:24 — fence has no language tag
- advanced-deep-dive-topics/111_production_debugging.md:24 — fence has no language tag
- advanced-deep-dive-topics/113_systems_thinking.md:61 — fence has no language tag
- business-finance-solo-ops/316_cash_flow_and_runway.md:25 — fence has no language tag
- business-finance-solo-ops/317_invoicing_and_payment_tracking.md:24 — fence has no language tag
- business-finance-solo-ops/317_invoicing_and_payment_tracking.md:35 — fence has no language tag
- business-finance-solo-ops/318_banking_and_payment_methods.md:24 — fence has no language tag
- business-finance-solo-ops/318_banking_and_payment_methods.md:43 — fence has no language tag
- business-finance-solo-ops/319_tax_and_accounting_readiness.md:24 — fence has no language tag
- business-finance-solo-ops/319_tax_and_accounting_readiness.md:45 — fence has no language tag
- business-finance-solo-ops/320_expense_and_subscription_control.md:24 — fence has no language tag
- business-finance-solo-ops/320_expense_and_subscription_control.md:38 — fence has no language tag
- business-finance-solo-ops/321_project_accounting_and_costing.md:24 — fence has no language tag
- business-finance-solo-ops/322_time_tracking_and_effective_rate.md:23 — fence has no language tag
- business-finance-solo-ops/323_revenue_stream_design.md:23 — fence has no language tag
- business-finance-solo-ops/324_monthly_financial_close.md:22 — fence has no language tag
- business-finance-solo-ops/325_finance_dashboard_and_kpis.md:24 — fence has no language tag
- business-finance-solo-ops/326_business_records_and_file_system.md:23 — fence has no language tag
- business-finance-solo-ops/327_risk_reserve_and_contingency.md:23 — fence has no language tag
- business-finance-solo-ops/328_procurement_and_vendor_management.md:23 — fence has no language tag
- business-finance-solo-ops/330_pricing_for_margin.md:23 — fence has no language tag
- business-finance-solo-ops/334_retainer_renewal_and_negotiation.md:24 — fence has no language tag
- business-finance-solo-ops/345_pipeline_forecasting.md:23 — fence has no language tag
- business-finance-solo-ops/348_acquisition_funnel_and_attribution.md:23 — fence has no language tag
- career-entrepreneurship/114_niche_positioning.md:23 — fence has no language tag
- career-entrepreneurship/114_niche_positioning.md:30 — fence has no language tag
- career-entrepreneurship/117_financial_literacy.md:63 — fence has no language tag
- career-entrepreneurship/118_building_in_public.md:62 — fence has no language tag
- framework-deep-dives/413_reactnative_file_organization_and_banned_patterns.md:21 — fence has no language tag
- framework-deep-dives/424_electron_project_structure_and_vite_build_config.md:21 — fence has no language tag
- fundamentals-tools/119_http_fundamentals.md:20 — fence has no language tag
- fundamentals-tools/133_networking_fundamentals.md:17 — fence has no language tag
- observability-deployment/58_dockerfile_best_practices.md:72 — fence has no language tag
- saas-business-skills/88_email_deliverability.md:143 — fence has no language tag

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

### `sources/bare-domain` — 6

- business-finance-solo-ops/317_invoicing_and_payment_tracking.md — bare domain renders as text, not a link: - Stripe's guide to invoicing and payment terms for freelancers and small businesses (stri
- database-caching-performance/21_cdn_cache_strategy.md — bare domain renders as text, not a link: - **"A Comprehensive Guide to HTTP Caching" by Jake Archibald (web.dev/http-cache)** — Cle
- frontend-performance-scaling/22_http2_multiplexing.md — bare domain renders as text, not a link: - **"HTTP/3 explained" (http3-explained.haxx.se)** — Free online book by Daniel Stenberg (
- frontend-performance-scaling/138_frontend_state_management.md — bare domain renders as text, not a link: - TkDodo (React Query maintainer) — "Practical React Query" blog series (tkdodo.eu/blog)
- process-soft-skills/85_technical_blog_conference_talk.md — bare domain renders as text, not a link: - **"Technical Writing for Developers" — Josh Comeau (joshwcomeau.com/blog/how-i-write)** 
- saas-business-skills/86_saas_metrics.md — bare domain renders as text, not a link: - **"The SaaS CFO" — Ben Murray (thesaascfo.com)** — Practical financial modeling for SaaS

### `links/unlinked-lesson-ref` — 1

- ai-llm-engineering/146_when_to_add_ai.md:59 — "#1" matches a lesson but has no cue, so it renders as plain text: - Google's "Rules of Machine Learning" (Martin Zinkevich) — rule #1 is "don't be
