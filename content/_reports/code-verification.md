# Code verification report

`npx tsx scripts/verify-code.ts` — every TypeScript/TSX fence in the corpus,
extracted and typechecked. Generated file: do not edit by hand.

| | |
|---|---:|
| TS/TSX fences | 161 |
| Clean | 25 |
| Only uninstalled-module errors (tolerated) | 22 |
| **Failing** | **114** |
| Lessons affected | 114 |
| Fences importing private `@/libs|modules|stores` aliases | 16 |

## Defects by class

| Class | Count |
|---|---:|
| undefined-identifier | 423 |
| type-error | 250 |
| implicit-any | 23 |

## Failing lessons

### advanced-deep-dive-topics/106_event_streaming_kafka_vs_bullmq.md

- `typescript` fence at line 22 (section: Example Code)
  - TS2304: Cannot find name 'sendEmail'.
  - TS2304: Cannot find name 'sendWelcomeEmail'.

### advanced-deep-dive-topics/107_api_design_philosophy.md

- `typescript` fence at line 22 (section: Example Code)
  - TS2304: Cannot find name 'TenantService'.

### ai-llm-engineering/140_ai_llm_integration.md

- `typescript` fence at line 19 (section: Example Code)
  - TS2304: Cannot find name 'embed'.
  - TS2304: Cannot find name 'db'.
  - TS7006: Parameter 'c' implicitly has an 'any' type.
  - TS2304: Cannot find name 'callModel'.

### ai-llm-engineering/147_anthropic_api_client_architecture.md

- `typescript` fence at line 20 (section: Example Code)
  - TS2395: Individual declarations in merged declaration 'anthropic' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'anthropic' must be all exported or all local.

### ai-llm-engineering/148_prompts_as_versioned_code.md

- `typescript` fence at line 20 (section: Example Code)
  - TS2395: Individual declarations in merged declaration 'SUMMARY_SYSTEM_PROMPT' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'SUMMARY_CONFIG' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'SUMMARY_SYSTEM_PROMPT' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'SUMMARY_CONFIG' must be all exported or all local.

### ai-llm-engineering/150_context_window_conversation_management.md

- `typescript` fence at line 20 (section: Example Code)
  - TS2304: Cannot find name 'anthropic'.
  - TS2304: Cannot find name 'anthropic'.
  - TS2304: Cannot find name 'extractText'.

### ai-llm-engineering/151_tool_use_agentic_loops.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2552: Cannot find name 'searchProducts'. Did you mean 'searchProductsTool'?
  - TS2304: Cannot find name 'AppError'.
  - TS2304: Cannot find name 'anthropic'.
  - TS2304: Cannot find name 'AGENT_SYSTEM_PROMPT'.
  - TS2304: Cannot find name 'extractText'.
  - TS2304: Cannot find name 'AppError'.

### ai-llm-engineering/152_advanced_rag_chunking_reranking_grounding.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'vectorStore'.
  - TS7006: Parameter 'c' implicitly has an 'any' type.
  - TS2304: Cannot find name 'rerank'.
  - TS2304: Cannot find name 'RetrievedChunk'.
  - TS2304: Cannot find name 'anthropic'.
  - TS2304: Cannot find name 'extractText'.
  - TS2304: Cannot find name 'embed'.
  - TS2304: Cannot find name 'anthropic'.
  - TS2304: Cannot find name 'RAG_SYSTEM_PROMPT'.
  - TS2304: Cannot find name 'extractText'.
  - TS7006: Parameter 'c' implicitly has an 'any' type.

### ai-llm-engineering/154_token_budget_cost_engineering.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'anthropic'.
  - TS2304: Cannot find name 'SUMMARY_SYSTEM_PROMPT'.
  - TS2304: Cannot find name 'logger'.
  - TS2304: Cannot find name 'logger'.
  - TS2304: Cannot find name 'extractText'.

### ai-llm-engineering/155_streaming_ai_responses_production.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'DRAFT_SYSTEM_PROMPT'.
  - TS2304: Cannot find name 'useState'.
  - TS2304: Cannot find name 'useState'.

### ai-llm-engineering/156_fallback_graceful_degradation.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'anthropic'.
  - TS2304: Cannot find name 'SUMMARY_SYSTEM_PROMPT'.
  - TS2304: Cannot find name 'extractText'.
  - TS18046: 'err' is of type 'unknown'.
  - TS18046: 'err' is of type 'unknown'.

### ai-llm-engineering/157_building_eval_pipeline.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2395: Individual declarations in merged declaration 'goldenCases' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'goldenCases' must be all exported or all local.

### ai-llm-engineering/158_observability_logging_ai_features.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'logger'.
  - TS2304: Cannot find name 'logger'.
  - TS2304: Cannot find name 'redis'.
  - TS2304: Cannot find name 'anthropic'.
  - TS2304: Cannot find name 'CLASSIFY_CONFIG'.
  - TS2304: Cannot find name 'extractText'.
  - TS2304: Cannot find name 'redis'.

### ai-llm-engineering/159_prompt_injection_defense.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'userSuppliedText'.
  - TS2875: This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found. Make sure you have types for the appropriate package installed.

### ai-llm-engineering/160_ai_data_privacy_regulatory_compliance.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'db'.

### ai-llm-engineering/161_ai_feature_ux_patterns.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2875: This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found. Make sure you have types for the appropriate package installed.
  - TS2304: Cannot find name 'useState'.

### ai-llm-engineering/162_mcp_server_architecture_tool_design.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'projectService'.
  - TS2304: Cannot find name 'projectService'.
  - TS2304: Cannot find name 'projectService'.

### ai-llm-engineering/163_mcp_server_auth_error_idempotency.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'redis'.
  - TS2304: Cannot find name 'redis'.
  - TS2304: Cannot find name 'server'.
  - TS2304: Cannot find name 'z'.
  - TS2304: Cannot find name 'z'.
  - TS2304: Cannot find name 'z'.
  - TS7031: Binding element 'projectId' implicitly has an 'any' type.
  - TS7031: Binding element 'name' implicitly has an 'any' type.
  - TS7031: Binding element 'idempotencyKey' implicitly has an 'any' type.
  - TS2304: Cannot find name 'createItem'.

### ai-llm-engineering/164_multi_agent_orchestration_workflow_chaining.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'anthropic'.
  - TS2304: Cannot find name 'CLASSIFY_SYSTEM_PROMPT'.
  - TS2304: Cannot find name 'extractText'.
  - TS2304: Cannot find name 'anthropic'.
  - TS2304: Cannot find name 'DRAFT_SYSTEM_PROMPT'.
  - TS2304: Cannot find name 'extractText'.
  - TS2304: Cannot find name 'anthropic'.
  - TS2304: Cannot find name 'REVIEW_SYSTEM_PROMPT'.
  - TS2304: Cannot find name 'extractText'.
  - TS2304: Cannot find name 'AppError'.

### ai-llm-engineering/165_human_in_the_loop_review_gates.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'logger'.
  - TS2304: Cannot find name 'logger'.
  - TS2304: Cannot find name 'mergePullRequest'.
  - TS2304: Cannot find name 'AppError'.

### algorithms-concurrency/129_concurrency_async_fundamentals.md

- `typescript` fence at line 18 (section: Example Code)
  - TS2304: Cannot find name 'readBalanceFromDb'.
  - TS2304: Cannot find name 'writeBalanceToDb'.
  - TS2304: Cannot find name 'db'.
  - TS2304: Cannot find name 'userIds'.
  - TS7006: Parameter 'id' implicitly has an 'any' type.
  - TS2304: Cannot find name 'sendWelcomeEmail'.
  - TS7006: Parameter 'r' implicitly has an 'any' type.

### architecture-design-patterns-testing/134_domain_driven_design.md

- `typescript` fence at line 18 (section: Example Code)
  - TS2304: Cannot find name 'OrderLine'.
  - TS2304: Cannot find name 'OrderLine'.

### architecture-design-patterns-testing/64_solid_principles.md

- `typescript` fence at line 27 (section: Example Code)
  - TS2304: Cannot find name 'UserRecord'.
  - TS2304: Cannot find name 'CreateUserDto'.
  - TS2304: Cannot find name 'UserRecord'.
  - TS2304: Cannot find name 'bcrypt'.
  - TS2304: Cannot find name 'bcrypt'.
  - TS2304: Cannot find name 'DataSource'.
  - TS2304: Cannot find name 'UserRecord'.
  - TS2304: Cannot find name 'UserEntity'.
  - TS2304: Cannot find name 'CreateUserDto'.
  - TS2304: Cannot find name 'UserRecord'.
  - TS2304: Cannot find name 'UserEntity'.
  - TS2304: Cannot find name 'UserEntity'.
  - TS2304: Cannot find name 'UserRecord'.
  - TS2304: Cannot find name 'CreateUserDto'.
  - TS2304: Cannot find name 'UserRecord'.
  - TS2304: Cannot find name 'UserRecord'.
  - TS2304: Cannot find name 'dataSource'.
  - TS2304: Cannot find name 'JwtTokenService'.
  - TS2304: Cannot find name 'env'.
  - TS2304: Cannot find name 'StaticTokenService'.

### architecture-design-patterns-testing/65_hexagonal_architecture.md

- `typescript` fence at line 23 (section: Example Code)
  - TS2304: Cannot find name 'IPasswordHasher'.
  - TS2304: Cannot find name 'ITokenIssuer'.
  - TS2304: Cannot find name 'systemDataSource'.
  - TS2304: Cannot find name 'NodemailerEmailAdapter'.
  - TS2304: Cannot find name 'smtpConfig'.
  - TS2304: Cannot find name 'BcryptPasswordHasher'.
  - TS2304: Cannot find name 'JwtTokenIssuer'.
  - TS2304: Cannot find name 'env'.

### architecture-design-patterns-testing/66_dependency_injection_container.md

- `typescript` fence at line 23 (section: Example Code)
  - TS2304: Cannot find name 'InMemoryUserRepository'.

### architecture-design-patterns-testing/67_design_patterns.md

- `typescript` fence at line 22 (section: Example Code)
  - TS2304: Cannot find name 'AuthService'.
  - TS2304: Cannot find name 'AuthService'.
  - TS2304: Cannot find name 'IEmailService'.
  - TS2339: Property 'randomBytes' does not exist on type 'Crypto'.
  - TS2304: Cannot find name 'User'.
  - TS2304: Cannot find name 'User'.
  - TS2304: Cannot find name 'sendWelcomeEmail'.
  - TS2304: Cannot find name 'initializeUserSettings'.
  - TS2304: Cannot find name 'sendSlackNotification'.
  - TS2304: Cannot find name 'provisionFreeTrial'.

### architecture-design-patterns-testing/68_big_o_analysis.md

- `typescript` fence at line 23 (section: Example Code)
  - TS2304: Cannot find name 'Tenant'.
  - TS2304: Cannot find name 'db'.
  - TS2304: Cannot find name 'db'.
  - TS7006: Parameter 'r' implicitly has an 'any' type.
  - TS2304: Cannot find name 'Tenant'.

### architecture-design-patterns-testing/69_tail_call_memoization_lazy_evaluation.md

- `tsx` fence at line 25 (section: Example Code)
  - TS2304: Cannot find name 'db'.
  - TS2304: Cannot find name 'AuditLogRow'.
  - TS2304: Cannot find name 'db'.
  - TS2304: Cannot find name 'AuditLogRow'.
  - TS2304: Cannot find name 'AuditLogRow'.

### architecture-design-patterns-testing/71_test_pyramid.md

- `typescript` fence at line 27 (section: Example Code)
  - TS2300: Duplicate identifier 'beforeEach'.
  - TS2300: Duplicate identifier 'describe'.
  - TS2300: Duplicate identifier 'it'.
  - TS2300: Duplicate identifier 'expect'.
  - TS2300: Duplicate identifier 'beforeEach'.
  - TS2300: Duplicate identifier 'AuthService'.
  - TS2300: Duplicate identifier 'describe'.
  - TS2300: Duplicate identifier 'it'.
  - TS2300: Duplicate identifier 'expect'.
  - TS2300: Duplicate identifier 'AuthService'.

### architecture-design-patterns-testing/72_property_based_testing.md

- `typescript` fence at line 23 (section: Example Code)
  - TS2304: Cannot find name 'UserService'.

### architecture-design-patterns-testing/73_contract_testing_pact.md

- `typescript` fence at line 23 (section: Example Code)
  - TS2304: Cannot find name 'stripeProvider'.

### architecture-design-patterns-testing/74_tdd_cycle.md

- `typescript` fence at line 25 (section: Example Code)
  - TS2304: Cannot find name 'AuthService'.
  - TS2304: Cannot find name 'AuthService'.
  - TS2304: Cannot find name 'AuthService'.
  - TS2304: Cannot find name 'mockRedis'.
  - TS2304: Cannot find name 'AuthService'.

### database-advanced/41_postgresql_mvcc_vacuum_bloat_isolation.md

- `typescript` fence at line 62 (section: Example Code)
  - TS2304: Cannot find name 'Tenant'.
  - TS2304: Cannot find name 'TenantMember'.
  - TS2304: Cannot find name 'DEFAULT_SEAT_LIMIT'.
  - TS2304: Cannot find name 'TenantMember'.

### database-advanced/42_optimistic_vs_pessimistic_locking.md

- `typescript` fence at line 23 (section: Example Code)
  - TS2304: Cannot find name 'PrismaClient'.
  - TS2304: Cannot find name 'dataSource'.

### database-advanced/43_zero_downtime_database_migration.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'getAllTenantIds'.

### database-advanced/44_soft_delete_pattern_problems_alternatives.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'UserSession'.
  - TS2304: Cannot find name 'TenantMember'.
  - TS2304: Cannot find name 'AuditLog'.
  - TS2304: Cannot find name 'UserArchive'.

### database-advanced/45_time_series_data_timescaledb_partitioning.md

- `typescript` fence at line 70 (section: Example Code)
  - TS2304: Cannot find name 'DataSource'.
  - TS2304: Cannot find name 'TenantAuditLog'.

### database-advanced/46_full_text_search_postgres_tsvector_elasticsearch.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'DataSource'.
  - TS2304: Cannot find name 'PrismaClient'.
  - TS2304: Cannot find name 'User'.
  - TS2304: Cannot find name 'User'.

### database-advanced/47_audit_log_design_application_level.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'getTenantDataSource'.
  - TS2304: Cannot find name 'getSystemDataSource'.
  - TS2304: Cannot find name 'AuditLog'.
  - TS2304: Cannot find name 'DataSource'.
  - TS2304: Cannot find name 'AuditLog'.
  - TS2304: Cannot find name 'getTenantDataSource'.
  - TS2304: Cannot find name 'getSystemDataSource'.
  - TS2304: Cannot find name 'AuditLog'.

### database-advanced/48_data_retention_gdpr_kvkk_deletion_flow.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'DataSource'.
  - TS7006: Parameter 'manager' implicitly has an 'any' type.
  - TS2304: Cannot find name 'UserSession'.
  - TS2304: Cannot find name 'UserSocialAccount'.
  - TS2304: Cannot find name 'TenantMember'.
  - TS2304: Cannot find name 'AuditLog'.
  - TS2304: Cannot find name 'User'.
  - TS2304: Cannot find name 'TenantSubscription'.
  - TS2304: Cannot find name 'Invoice'.
  - TS2304: Cannot find name 'AuditLogService'.
  - TS2304: Cannot find name 'getSystemDataSource'.
  - TS2304: Cannot find name 'UserSession'.
  - TS2304: Cannot find name 'Logger'.
  - TS2304: Cannot find name 'User'.

### database-advanced/50_multi_tenant_data_isolation_models.md

- `typescript` fence at line 23 (section: Example Code)
  - TS2304: Cannot find name 'resolveTenantDatabaseUrl'.
  - TS2304: Cannot find name 'tenantEntities'.
  - TS2304: Cannot find name 'getAdminDataSource'.
  - TS2339: Property 'randomBytes' does not exist on type 'Crypto'.
  - TS2304: Cannot find name 'DB_HOST'.
  - TS2304: Cannot find name 'tenantEntities'.
  - TS2304: Cannot find name 'systemRepo'.
  - TS2304: Cannot find name 'getAdminDataSource'.
  - TS2304: Cannot find name 'systemRepo'.
  - TS2304: Cannot find name 'getAllActiveTenants'.
  - TS2304: Cannot find name 'TenantMember'.

### database-advanced/51_event_log_rehydration.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'db'.
  - TS7006: Parameter 'state' implicitly has an 'any' type.
  - TS7006: Parameter 'row' implicitly has an 'any' type.

### database-advanced/52_oltp_vs_olap.md

- `typescript` fence at line 23 (section: Example Code)
  - TS2304: Cannot find name 'db'.
  - TS2304: Cannot find name 'Pool'.
  - TS2304: Cannot find name 'AnalyticsRow'.

### database-caching-performance/16_n_plus_1_query_problem.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'db'.
  - TS2304: Cannot find name 'db'.
  - TS2304: Cannot find name 'db'.
  - TS2304: Cannot find name 'PrismaClient'.
  - TS2304: Cannot find name 'User'.
  - TS2304: Cannot find name 'NextRequest'.
  - TS2304: Cannot find name 'db'.
  - TS2304: Cannot find name 'db'.
  - TS2304: Cannot find name 'NextResponse'.
  - TS2304: Cannot find name 'PrismaClient'.

### database-caching-performance/17_database_index_strategy.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'PrismaClient'.

### database-caching-performance/18_query_plan_analysis.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'PrismaClient'.
  - TS2304: Cannot find name 'PrismaClient'.
  - TS2304: Cannot find name 'PrismaClient'.
  - TS7006: Parameter 'e' implicitly has an 'any' type.

### database-caching-performance/19_connection_pool_tuning.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'pgBouncerAdminClient'.

### database-caching-performance/20_redis_cache_strategies.md

- `typescript` fence at line 23 (section: Example Code)
  - TS2304: Cannot find name 'Redis'.
  - TS2304: Cannot find name 'PrismaClient'.
  - TS2304: Cannot find name 'TenantConfig'.
  - TS2304: Cannot find name 'Redis'.
  - TS2304: Cannot find name 'PrismaClient'.
  - TS2304: Cannot find name 'Redis'.
  - TS2304: Cannot find name 'Redis'.
  - TS2304: Cannot find name 'PrismaClient'.
  - TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
  - TS2304: Cannot find name 'Redis'.

### database-caching-performance/21_cdn_cache_strategy.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2323: Cannot redeclare exported variable 'GET'.
  - TS2393: Duplicate function implementation.
  - TS2304: Cannot find name 'getPublicPricingData'.
  - TS2323: Cannot redeclare exported variable 'GET'.
  - TS2393: Duplicate function implementation.
  - TS2304: Cannot find name 'getTenantFromRequest'.
  - TS2304: Cannot find name 'getTenantDashboard'.
  - TS2323: Cannot redeclare exported variable 'GET'.
  - TS2393: Duplicate function implementation.
  - TS2304: Cannot find name 'getSession'.
  - TS2304: Cannot find name 'getUserProfile'.
  - TS2323: Cannot redeclare exported variable 'default'.
  - TS2393: Duplicate function implementation.
  - TS2304: Cannot find name 'db'.
  - TS2875: This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found. Make sure you have types for the appropriate package installed.
  - TS2304: Cannot find name 'PricingGrid'.
  - TS2323: Cannot redeclare exported variable 'default'.
  - TS2393: Duplicate function implementation.
  - TS2304: Cannot find name 'getTenantFromCookies'.
  - TS2304: Cannot find name 'getTenantStats'.
  - TS2304: Cannot find name 'Dashboard'.
  - TS2304: Cannot find name 'PlanUpdateInput'.
  - TS2304: Cannot find name 'db'.

### distributed-systems-api-design/01_cap_theorem.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'redis'.
  - TS2304: Cannot find name 'db'.
  - TS2304: Cannot find name 'redis'.
  - TS2304: Cannot find name 'db'.
  - TS2304: Cannot find name 'redis'.

### distributed-systems-api-design/02_event_sourcing_cqrs.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'PrismaClient'.
  - TS7006: Parameter 'r' implicitly has an 'any' type.

### distributed-systems-api-design/03_saga_pattern.md

- `typescript` fence at line 20 (section: Example Code)
  - TS2304: Cannot find name 'createTenant'.
  - TS2304: Cannot find name 'chargeCard'.
  - TS2304: Cannot find name 'isDefiniteFailure'.
  - TS2304: Cannot find name 'findChargeByIdempotencyKey'.
  - TS2304: Cannot find name 'allocateSeats'.
  - TS2304: Cannot find name 'sendWelcomeEmail'.
  - TS2304: Cannot find name 'markSagaCompleted'.
  - TS2304: Cannot find name 'refundCharge'.
  - TS2304: Cannot find name 'deleteTenant'.
  - TS2322: Type 'any' is not assignable to type 'never'.

### distributed-systems-api-design/04_circuit_breaker_bulkhead_retry.md

- `typescript` fence at line 23 (section: Example Code)
  - TS2304: Cannot find name 'stripe'.

### distributed-systems-api-design/05_rate_limiting_strategies.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'Redis'.
  - TS2304: Cannot find name 'Redis'.

### distributed-systems-api-design/06_distributed_locking.md

- `typescript` fence at line 20 (section: Example Code)
  - TS2304: Cannot find name 'redis'.
  - TS2304: Cannot find name 'createTenantSchema'.
  - TS2304: Cannot find name 'seedTenantDefaults'.
  - TS2304: Cannot find name 'markTenantActive'.
  - TS2304: Cannot find name 'PrismaClient'.

### distributed-systems-api-design/08_webhook_security_retry.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'db'.

### distributed-systems-api-design/09_api_versioning_strategies.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'getUserV2'.

### distributed-systems-api-design/10_backward_forward_compatibility.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'db'.
  - TS2304: Cannot find name 'DbUser'.

### distributed-systems-api-design/11_read_replica_routing.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'User'.
  - TS2304: Cannot find name 'User'.
  - TS2304: Cannot find name 'userId'.

### distributed-systems-api-design/12_database_sharding_strategies.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'PrismaClient'.
  - TS2304: Cannot find name 'PrismaClient'.
  - TS2304: Cannot find name 'PrismaClient'.
  - TS2304: Cannot find name 'AuditEvent'.
  - TS2304: Cannot find name 'AuditEvent'.
  - TS7006: Parameter 'a' implicitly has an 'any' type.
  - TS7006: Parameter 'b' implicitly has an 'any' type.

### distributed-systems-api-design/131_message_queues_101.md

- `typescript` fence at line 17 (section: Example Code)
  - TS2304: Cannot find name 'eventBus'.
  - TS18004: No value exists in scope for the shorthand property 'orderId'. Either declare one or provide an initializer.
  - TS18004: No value exists in scope for the shorthand property 'userId'. Either declare one or provide an initializer.
  - TS18004: No value exists in scope for the shorthand property 'totalCents'. Either declare one or provide an initializer.
  - TS2304: Cannot find name 'eventBus'.
  - TS7006: Parameter 'event' implicitly has an 'any' type.
  - TS2304: Cannot find name 'sendOrderConfirmationEmail'.
  - TS2304: Cannot find name 'eventBus'.
  - TS7006: Parameter 'event' implicitly has an 'any' type.
  - TS2304: Cannot find name 'decrementInventory'.
  - TS2304: Cannot find name 'eventBus'.
  - TS7006: Parameter 'event' implicitly has an 'any' type.
  - TS2304: Cannot find name 'recordOrderEvent'.

### distributed-systems-api-design/135_microservices_vs_monolith.md

- `typescript` fence at line 17 (section: Example Code)
  - TS2393: Duplicate function implementation.
  - TS2304: Cannot find name 'PlaceOrderInput'.
  - TS2304: Cannot find name 'db'.
  - TS7006: Parameter 'tx' implicitly has an 'any' type.
  - TS2393: Duplicate function implementation.
  - TS2304: Cannot find name 'PlaceOrderInput'.
  - TS2304: Cannot find name 'orderService'.
  - TS2304: Cannot find name 'inventoryService'.
  - TS2304: Cannot find name 'orderService'.

### distributed-systems-api-design/136_api_gateway_bff.md

- `typescript` fence at line 16 (section: Example Code)
  - TS2304: Cannot find name 'profileService'.
  - TS2304: Cannot find name 'notificationService'.
  - TS18046: 'profile.value' is of type 'unknown'.
  - TS18046: 'profile.value' is of type 'unknown'.
  - TS18046: 'notifications.value' is of type 'unknown'.

### distributed-systems-api-design/13_cqrs_read_model_optimization.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'db'.
  - TS2304: Cannot find name 'TenantUsageSummary'.
  - TS2304: Cannot find name 'db'.
  - TS2304: Cannot find name 'PrismaClient'.
  - TS2304: Cannot find name 'PrismaClient'.
  - TS2304: Cannot find name 'db'.

### distributed-systems-api-design/14_outbox_pattern.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'PrismaClient'.
  - TS2304: Cannot find name 'Tenant'.
  - TS2304: Cannot find name 'PrismaClient'.
  - TS2304: Cannot find name 'OutboxMessage'.

### distributed-systems-api-design/15_two_phase_commit_eventual_consistency.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'systemDb'.
  - TS2304: Cannot find name 'tenantDb'.
  - TS2304: Cannot find name 'systemDb'.
  - TS7006: Parameter 'tx' implicitly has an 'any' type.
  - TS2304: Cannot find name 'systemDb'.
  - TS2304: Cannot find name 'initializeTenantDatabase'.
  - TS2304: Cannot find name 'seedTenantDefaults'.
  - TS2304: Cannot find name 'systemDb'.
  - TS2304: Cannot find name 'PoolClient'.
  - TS2304: Cannot find name 'PoolClient'.

### framework-deep-dives/396_express_two_layer_architecture.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2395: Individual declarations in merged declaration 'CreateProjectDTO' must be all exported or all local.
  - TS2528: A module cannot have multiple default exports.
  - TS2528: A module cannot have multiple default exports.
  - TS2300: Duplicate identifier 'Router'.
  - TS2395: Individual declarations in merged declaration 'CreateProjectDTO' must be all exported or all local.
  - TS2300: Duplicate identifier 'authMiddleware'.
  - TS2528: A module cannot have multiple default exports.
  - TS2300: Duplicate identifier 'Router'.
  - TS2300: Duplicate identifier 'authMiddleware'.
  - TS2528: A module cannot have multiple default exports.

### framework-deep-dives/397_express_middleware_pipeline_and_security.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2395: Individual declarations in merged declaration 'corsMiddleware' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'helmetMiddleware' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'authLimiter' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'corsMiddleware' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'helmetMiddleware' must be all exported or all local.
  - TS2528: A module cannot have multiple default exports.
  - TS2395: Individual declarations in merged declaration 'authLimiter' must be all exported or all local.
  - TS2528: A module cannot have multiple default exports.

### framework-deep-dives/398_express_curried_auth_middleware.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2300: Duplicate identifier 'SafeUser'.
  - TS2300: Duplicate identifier 'SafeUserSession'.
  - TS2300: Duplicate identifier 'AppError'.
  - TS2300: Duplicate identifier 'AuthMessages'.
  - TS2300: Duplicate identifier 'AppError'.
  - TS2300: Duplicate identifier 'AuthMessages'.
  - TS2300: Duplicate identifier 'SafeUser'.
  - TS2300: Duplicate identifier 'SafeUserSession'.
  - TS2528: A module cannot have multiple default exports.
  - TS2528: A module cannot have multiple default exports.

### framework-deep-dives/399_express_centralized_error_handling.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2300: Duplicate identifier 'AppError'.
  - TS2528: A module cannot have multiple default exports.
  - TS2300: Duplicate identifier 'AppError'.
  - TS2300: Duplicate identifier 'Logger'.
  - TS18046: 'error' is of type 'unknown'.
  - TS18046: 'error' is of type 'unknown'.
  - TS2300: Duplicate identifier 'AppError'.
  - TS2300: Duplicate identifier 'Logger'.
  - TS2528: A module cannot have multiple default exports.
  - TS2304: Cannot find name 'findUserByEmail'.
  - TS2304: Cannot find name 'warmSessionCache'.
  - TS2304: Cannot find name 'buildAuthResponse'.
  - TS2528: A module cannot have multiple default exports.

### framework-deep-dives/400_express_validation_and_response_conventions.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2300: Duplicate identifier 'z'.
  - TS2395: Individual declarations in merged declaration 'UuidParam' must be all exported or all local.
  - TS2300: Duplicate identifier 'z'.
  - TS2395: Individual declarations in merged declaration 'CreateProjectDTO' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'ListProjectsQuery' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'UuidParam' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'CreateProjectDTO' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'ListProjectsQuery' must be all exported or all local.

### framework-deep-dives/401_express_realtime_sse_and_socketio.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2323: Cannot redeclare exported variable 'default'.
  - TS2300: Duplicate identifier 'env'.
  - TS2323: Cannot redeclare exported variable 'default'.
  - TS2300: Duplicate identifier 'env'.

### framework-deep-dives/402_express_testing_with_jest_and_supertest.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2300: Duplicate identifier 'request'.
  - TS2300: Duplicate identifier 'app'.
  - TS2300: Duplicate identifier 'AppDataSource'.
  - TS2300: Duplicate identifier 'User'.
  - TS2300: Duplicate identifier 'request'.
  - TS2300: Duplicate identifier 'app'.
  - TS2300: Duplicate identifier 'AppDataSource'.
  - TS2300: Duplicate identifier 'User'.

### framework-deep-dives/414_reactnative_expo_router_navigation.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2323: Cannot redeclare exported variable 'default'.
  - TS2393: Duplicate function implementation.
  - TS2875: This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found. Make sure you have types for the appropriate package installed.
  - TS2300: Duplicate identifier 'Redirect'.
  - TS2300: Duplicate identifier 'useAuthStore'.
  - TS2323: Cannot redeclare exported variable 'default'.
  - TS2393: Duplicate function implementation.
  - TS2300: Duplicate identifier 'Redirect'.
  - TS2300: Duplicate identifier 'useAuthStore'.
  - TS2323: Cannot redeclare exported variable 'default'.
  - TS2393: Duplicate function implementation.
  - TS2300: Duplicate identifier 'useAuthStore'.
  - TS2323: Cannot redeclare exported variable 'default'.
  - TS2393: Duplicate function implementation.
  - TS2304: Cannot find name 'AuthService'.
  - TS2323: Cannot redeclare exported variable 'default'.
  - TS2393: Duplicate function implementation.

### framework-deep-dives/415_reactnative_zustand_mmkv_state_management.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2395: Individual declarations in merged declaration 'mmkv' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'mmkv' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'zustandMMKVStorage' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'zustandMMKVStorage' must be all exported or all local.
  - TS2875: This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found. Make sure you have types for the appropriate package installed.
  - TS2786: 'Text' cannot be used as a JSX component.   Its type '{ new (data?: string | undefined): Text; prototype: Text; }' is not a valid JSX element type.     Type '{ new (data?: string | undefined): Text; prototype: Text; }' is not assignable to type 'new (props: any, context: any) => Component<any, any, any>'.       Type 'Text' is missing the following properties from type 'Component<any, any, any>': context, setState, forceUpdate, render, and 2 more.

### framework-deep-dives/416_reactnative_data_fetching_and_offline.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2300: Duplicate identifier 'useState'.
  - TS2300: Duplicate identifier 'useEffect'.
  - TS2300: Duplicate identifier 'axiosInstance'.
  - TS2300: Duplicate identifier 'extractErrorMessage'.
  - TS2300: Duplicate identifier 'UserResponse'.
  - TS2300: Duplicate identifier 'extractErrorMessage'.
  - TS18046: 'err' is of type 'unknown'.
  - TS18046: 'err' is of type 'unknown'.
  - TS2300: Duplicate identifier 'useState'.
  - TS2300: Duplicate identifier 'axiosInstance'.
  - TS2300: Duplicate identifier 'extractErrorMessage'.
  - TS2300: Duplicate identifier 'UserResponse'.
  - TS2300: Duplicate identifier 'useState'.
  - TS2300: Duplicate identifier 'useEffect'.

### framework-deep-dives/417_reactnative_expo_config_permissions_and_native_apis.md

- `typescript` fence at line 22 (section: Example Code)
  - TS2304: Cannot find name 'axiosInstance'.

### framework-deep-dives/418_reactnative_nativewind_styling_tokens_and_dark_mode.md

- `tsx` fence at line 22 (section: Example Code)
  - TS2300: Duplicate identifier 'View'.
  - TS2875: This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found. Make sure you have types for the appropriate package installed.
  - TS2300: Duplicate identifier 'View'.
  - TS2300: Duplicate identifier 'useWindowDimensions'.
  - TS2300: Duplicate identifier 'useWindowDimensions'.

### framework-deep-dives/419_reactnative_accessibility_and_feedback_patterns.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2300: Duplicate identifier 'Pressable'.
  - TS2875: This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found. Make sure you have types for the appropriate package installed.
  - TS2300: Duplicate identifier 'View'.
  - TS2300: Duplicate identifier 'Text'.
  - TS2300: Duplicate identifier 'View'.
  - TS2300: Duplicate identifier 'Text'.
  - TS2300: Duplicate identifier 'Pressable'.

### framework-deep-dives/421_electron_process_model_and_typed_ipc.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2300: Duplicate identifier 'IPC'.
  - TS2395: Individual declarations in merged declaration 'IPC' must be all exported or all local.
  - TS2300: Duplicate identifier 'UsersListReq'.
  - TS2395: Individual declarations in merged declaration 'UsersListReq' must be all exported or all local.
  - TS2300: Duplicate identifier 'UsersListReq'.
  - TS2300: Duplicate identifier 'Result'.
  - TS2503: Cannot find namespace 'Electron'.
  - TS2300: Duplicate identifier 'IPC'.
  - TS2395: Individual declarations in merged declaration 'IPC' must be all exported or all local.
  - TS2300: Duplicate identifier 'UsersListReq'.
  - TS2395: Individual declarations in merged declaration 'UsersListReq' must be all exported or all local.
  - TS2300: Duplicate identifier 'Result'.
  - TS2300: Duplicate identifier 'IPC'.
  - TS2300: Duplicate identifier 'UsersListReq'.
  - TS2300: Duplicate identifier 'Result'.
  - TS2304: Cannot find name 'showToast'.

### framework-deep-dives/423_electron_main_process_lifecycle_and_window_management.md

- `typescript` fence at line 22 (section: Example Code)
  - TS2300: Duplicate identifier 'BrowserWindow'.
  - TS2300: Duplicate identifier 'BrowserWindow'.
  - TS2304: Cannot find name 'ipcMain'.
  - TS2304: Cannot find name 'IPC'.
  - TS2304: Cannot find name 'assertSender'.
  - TS2304: Cannot find name 'UsersService'.
  - TS2304: Cannot find name 'UsersListReq'.

### framework-deep-dives/424_electron_project_structure_and_vite_build_config.md

- `typescript` fence at line 44 (section: Example Code)
  - TS2503: Cannot find namespace 'Electron'.
  - TS2339: Property 'env' does not exist on type 'ImportMeta'.

### framework-deep-dives/425_electron_renderer_react_and_design_system_fork.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2875: This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found. Make sure you have types for the appropriate package installed.
  - TS2395: Individual declarations in merged declaration 'api' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'api' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'useUsers' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'useUsers' must be all exported or all local.

### framework-deep-dives/426_electron_native_modules_and_os_integration.md

- `typescript` fence at line 33 (section: Example Code)
  - TS2304: Cannot find name 'broadcast'.
  - TS2300: Duplicate identifier 'Menu'.
  - TS2503: Cannot find namespace 'Electron'.
  - TS2300: Duplicate identifier 'Menu'.

### framework-deep-dives/427_electron_environment_secrets_and_auto_updates.md

- `typescript` fence at line 22 (section: Example Code)
  - TS2304: Cannot find name 'AuthApi'.
  - TS2304: Cannot find name 'ipcMain'.
  - TS2304: Cannot find name 'assertSender'.
  - TS2304: Cannot find name 'ipcMain'.
  - TS2304: Cannot find name 'assertSender'.

### framework-deep-dives/428_electron_error_handling_crash_reporting_and_performance.md

- `typescript` fence at line 24 (section: Example Code)
  - TS2304: Cannot find name 'ipcMain'.
  - TS2304: Cannot find name 'IPC'.
  - TS2304: Cannot find name 'assertSender'.
  - TS2304: Cannot find name 'UsersListReq'.
  - TS2304: Cannot find name 'toAppError'.
  - TS2686: 'React' refers to a UMD global, but the current file is a module. Consider adding an import instead.
  - TS2304: Cannot find name 'app'.
  - TS2304: Cannot find name 'registerIpc'.
  - TS2304: Cannot find name 'createMainWindow'.
  - TS2503: Cannot find namespace 'Electron'.
  - TS2304: Cannot find name 'initDeferredServices'.
  - TS2300: Duplicate identifier 'expect'.
  - TS2300: Duplicate identifier 'test'.
  - TS2300: Duplicate identifier 'test'.
  - TS2300: Duplicate identifier 'expect'.

### framework-deep-dives/429_electron_window_chrome_and_desktop_layout.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2875: This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found. Make sure you have types for the appropriate package installed.
  - TS2304: Cannot find name 'WindowControls'.
  - TS2304: Cannot find name 'Toolbar'.
  - TS2304: Cannot find name 'StatusBar'.
  - TS2304: Cannot find name 'useEffect'.
  - TS2304: Cannot find name 'applyTheme'.
  - TS2304: Cannot find name 'create'.
  - TS2304: Cannot find name 'mainWindow'.

### framework-deep-dives/430_electron_menus_shortcuts_tray_and_dialogs.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2300: Duplicate identifier 'Menu'.
  - TS2300: Duplicate identifier 'app'.
  - TS2503: Cannot find namespace 'Electron'.
  - TS2304: Cannot find name 'exportDocument'.
  - TS2300: Duplicate identifier 'app'.
  - TS2304: Cannot find name 'focusMainWindow'.
  - TS2875: This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found. Make sure you have types for the appropriate package installed.
  - TS2300: Duplicate identifier 'Menu'.
  - TS2304: Cannot find name 'focusMainWindow'.
  - TS2304: Cannot find name 'showToast'.

### frontend-performance-scaling/138_frontend_state_management.md

- `typescript` fence at line 16 (section: Example Code)
  - TS2304: Cannot find name 'useQuery'.
  - TS2304: Cannot find name 'create'.
  - TS7006: Parameter 'set' implicitly has an 'any' type.
  - TS7006: Parameter 's' implicitly has an 'any' type.
  - TS2304: Cannot find name 'useSearchParams'.
  - TS2304: Cannot find name 'useRouter'.

### frontend-performance-scaling/22_http2_multiplexing.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2528: A module cannot have multiple default exports.
  - TS2528: A module cannot have multiple default exports.
  - TS2875: This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found. Make sure you have types for the appropriate package installed.

### frontend-performance-scaling/23_react_server_components.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2323: Cannot redeclare exported variable 'default'.
  - TS2393: Duplicate function implementation.
  - TS2304: Cannot find name 'useDashboardData'.
  - TS2875: This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found. Make sure you have types for the appropriate package installed.
  - TS2304: Cannot find name 'DashboardLayout'.
  - TS2323: Cannot redeclare exported variable 'default'.
  - TS2393: Duplicate function implementation.
  - TS2304: Cannot find name 'getDashboardStats'.
  - TS2323: Cannot redeclare exported variable 'default'.
  - TS2393: Duplicate function implementation.
  - TS2304: Cannot find name 'getTenant'.
  - TS2304: Cannot find name 'StatsSkeleton'.
  - TS2304: Cannot find name 'MembersSkeleton'.
  - TS2304: Cannot find name 'MemberList'.
  - TS2304: Cannot find name 'getExpensiveTenantAnalytics'.
  - TS2304: Cannot find name 'StatsGrid'.
  - TS2304: Cannot find name 'getServerSession'.
  - TS2304: Cannot find name 'db'.

### frontend-performance-scaling/24_bundle_size_optimization.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2875: This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found. Make sure you have types for the appropriate package installed.
  - TS2451: Cannot redeclare block-scoped variable 'grouped'.
  - TS2304: Cannot find name 'items'.
  - TS2451: Cannot redeclare block-scoped variable 'grouped'.
  - TS2304: Cannot find name 'items'.
  - TS2451: Cannot redeclare block-scoped variable 'formatted'.
  - TS2451: Cannot redeclare block-scoped variable 'formatted'.
  - TS2300: Duplicate identifier 'Button'.
  - TS2300: Duplicate identifier 'Input'.
  - TS2300: Duplicate identifier 'Modal'.
  - TS2300: Duplicate identifier 'Button'.
  - TS2300: Duplicate identifier 'Input'.
  - TS2300: Duplicate identifier 'Modal'.

### frontend-performance-scaling/25_web_vitals.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2875: This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found. Make sure you have types for the appropriate package installed.
  - TS2304: Cannot find name 'db'.
  - TS2304: Cannot find name 'useState'.
  - TS2304: Cannot find name 'fetchBanner'.
  - TS2304: Cannot find name 'useState'.
  - TS2304: Cannot find name 'fetchBanner'.
  - TS2304: Cannot find name 'heavyComputation'.
  - TS2304: Cannot find name 'setResult'.
  - TS2304: Cannot find name 'setLoading'.
  - TS2304: Cannot find name 'heavyComputation'.
  - TS2304: Cannot find name 'setResult'.
  - TS2304: Cannot find name 'setLoading'.

### frontend-performance-scaling/26_streaming_ssr_suspense.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'getBillingData'.
  - TS2875: This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found. Make sure you have types for the appropriate package installed.
  - TS2304: Cannot find name 'BillingCard'.
  - TS2304: Cannot find name 'getTenantMembers'.
  - TS2304: Cannot find name 'TeamTable'.
  - TS2304: Cannot find name 'getAnalytics'.
  - TS2304: Cannot find name 'AnalyticsChart'.
  - TS2323: Cannot redeclare exported variable 'default'.
  - TS2393: Duplicate function implementation.
  - TS2578: Unused '@ts-expect-error' directive.
  - TS2578: Unused '@ts-expect-error' directive.
  - TS2578: Unused '@ts-expect-error' directive.
  - TS2323: Cannot redeclare exported variable 'default'.
  - TS2393: Duplicate function implementation.

### frontend-performance-scaling/28_horizontal_scaling_stateless_design.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'SessionData'.
  - TS2300: Duplicate identifier 'redis'.
  - TS2304: Cannot find name 'SafeUser'.
  - TS2304: Cannot find name 'SafeUserSession'.
  - TS2304: Cannot find name 'SafeUser'.
  - TS2304: Cannot find name 'SafeUserSession'.
  - TS2300: Duplicate identifier 'redis'.
  - TS2304: Cannot find name 'worker'.

### fundamentals-tools/121_sql_fundamentals.md

- `typescript` fence at line 30 (section: Example Code)
  - TS2304: Cannot find name 'prisma'.
  - TS2304: Cannot find name 'thirtyDaysAgo'.

### fundamentals-tools/124_unit_testing_basics.md

- `typescript` fence at line 16 (section: Example Code)
  - TS2304: Cannot find name 'RegistrationService'.

### fundamentals-tools/125_rest_api_basics.md

- `typescript` fence at line 17 (section: Example Code)
  - TS2304: Cannot find name 'prisma'.
  - TS2304: Cannot find name 'prisma'.
  - TS2304: Cannot find name 'prisma'.
  - TS2304: Cannot find name 'prisma'.

### fundamentals-tools/127_auth_basics.md

- `typescript` fence at line 18 (section: Example Code)
  - TS2304: Cannot find name 'db'.
  - TS2304: Cannot find name 'redis'.

### fundamentals-tools/128_clean_code_basics.md

- `typescript` fence at line 17 (section: Example Code)
  - TS2304: Cannot find name 'User'.

### fundamentals-tools/133_networking_fundamentals.md

- `typescript` fence at line 30 (section: Example Code)
  - TS2304: Cannot find name 'getSocketRemoteAddress'.

### observability-deployment/53_opentelemetry.md

- `typescript` fence at line 25 (section: Example Code)
  - TS2304: Cannot find name 'lookupUserIdByEmail'.

### observability-deployment/54_distributed_tracing.md

- `typescript` fence at line 23 (section: Example Code)
  - TS2300: Duplicate identifier 'trace'.
  - TS2300: Duplicate identifier 'context'.
  - TS2300: Duplicate identifier 'propagation'.
  - TS2300: Duplicate identifier 'context'.
  - TS2300: Duplicate identifier 'propagation'.
  - TS2300: Duplicate identifier 'context'.
  - TS2300: Duplicate identifier 'propagation'.
  - TS2300: Duplicate identifier 'trace'.

### observability-deployment/61_alerting_design.md

- `typescript` fence at line 23 (section: Example Code)
  - TS2304: Cannot find name 'sendToPagerDuty'.
  - TS2304: Cannot find name 'sendToSlack'.
  - TS2304: Cannot find name 'sendToSlack'.
  - TS2304: Cannot find name 'writeToLog'.
  - TS2304: Cannot find name 'writeToLog'.

### privacy-compliance-incident-response/361_vulnerability_management_lifecycle_patch_slas.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'notifySecurityChannel'.

### saas-business-skills/90_accessibility.md

- `tsx` fence at line 22 (section: Example Code or Template)
  - TS18046: 'el' is of type 'unknown'.
  - TS2339: Property 'focus' does not exist on type '{}'.
  - TS2339: Property 'focus' does not exist on type '{}'.
  - TS2875: This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found. Make sure you have types for the appropriate package installed.

### saas-business-skills/93_ab_test_infrastructure.md

- `tsx` fence at line 22 (section: Example Code or Template)
  - TS2875: This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found. Make sure you have types for the appropriate package installed.

### security/143_compliance_frameworks.md

- `typescript` fence at line 17 (section: Example Code)
  - TS2304: Cannot find name 'db'.
  - TS2304: Cannot find name 'db'.
  - TS2304: Cannot find name 'db'.

### security/29_owasp_top_10.md

- `typescript` fence at line 23 (section: Example Code)
  - TS2304: Cannot find name 'TenantMemberService'.
  - TS2304: Cannot find name 'AuditLogService'.
  - TS2304: Cannot find name 'Logger'.

### security/30_sql_injection_protection.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2451: Cannot redeclare block-scoped variable 'user'.
  - TS2304: Cannot find name 'prisma'.
  - TS2304: Cannot find name 'userInput'.
  - TS2451: Cannot redeclare block-scoped variable 'user'.
  - TS2304: Cannot find name 'repo'.
  - TS2304: Cannot find name 'userInput'.
  - TS2451: Cannot redeclare block-scoped variable 'result'.
  - TS2304: Cannot find name 'prisma'.
  - TS2304: Cannot find name 'tenantId'.
  - TS2451: Cannot redeclare block-scoped variable 'result'.
  - TS2304: Cannot find name 'dataSource'.
  - TS2304: Cannot find name 'actorId'.
  - TS2304: Cannot find name 'action'.
  - TS2304: Cannot find name 'dataSource'.
  - TS2304: Cannot find name 'AuditLog'.
  - TS18004: No value exists in scope for the shorthand property 'actorId'. Either declare one or provide an initializer.
  - TS18004: No value exists in scope for the shorthand property 'action'. Either declare one or provide an initializer.
  - TS2304: Cannot find name 'prisma'.
  - TS2304: Cannot find name 'req'.
  - TS2304: Cannot find name 'prisma'.

### security/31_mass_assignment_protection_dto_whitelist.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'prisma'.
  - TS2304: Cannot find name 'prisma'.
  - TS2304: Cannot find name 'prisma'.
  - TS2304: Cannot find name 'prisma'.

### security/32_jwt_security_rs256_hs256_rotation.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'TokenPayload'.
  - TS2304: Cannot find name 'TokenPayload'.
  - TS2304: Cannot find name 'TokenPayload'.
  - TS2339: Property 'createHash' does not exist on type 'Crypto'.
  - TS2304: Cannot find name 'sessionRepo'.
  - TS2304: Cannot find name 'rotationHistoryRepo'.
  - TS2304: Cannot find name 'rotationHistoryRepo'.
  - TS2304: Cannot find name 'sessionRepo'.
  - TS2304: Cannot find name 'generateAccessToken'.
  - TS2339: Property 'randomBytes' does not exist on type 'Crypto'.
  - TS2339: Property 'createHash' does not exist on type 'Crypto'.
  - TS2304: Cannot find name 'rotationHistoryRepo'.
  - TS2304: Cannot find name 'sessionRepo'.
  - TS2304: Cannot find name 'token'.
  - TS2304: Cannot find name 'SECRET'.

### security/34_timing_attack_constant_time_comparison.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'bcrypt'.
  - TS2304: Cannot find name 'plainPassword'.
  - TS2304: Cannot find name 'hashedPassword'.
  - TS2304: Cannot find name 'rawToken'.
  - TS2304: Cannot find name 'repo'.

### security/35_content_security_policy_csp_headers.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2300: Duplicate identifier 'NextRequest'.
  - TS2300: Duplicate identifier 'NextResponse'.
  - TS2875: This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found. Make sure you have types for the appropriate package installed.
  - TS2300: Duplicate identifier 'NextRequest'.
  - TS2300: Duplicate identifier 'NextResponse'.
