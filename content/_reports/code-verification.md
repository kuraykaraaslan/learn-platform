# Code verification report

`npx tsx scripts/verify-code.ts` — every TypeScript/TSX fence in the corpus,
extracted and typechecked. Generated file: do not edit by hand.

| | |
|---|---:|
| TS/TSX fences | 162 |
| Clean | 23 |
| Only uninstalled-module errors (tolerated) | 19 |
| **Failing** | **120** |
| Lessons affected | 120 |
| Fences importing private `@/libs|modules|stores` aliases | 39 |

## Defects by class

| Class | Count |
|---|---:|
| undefined-identifier | 611 |
| syntax | 346 |
| type-error | 342 |
| implicit-any | 23 |

## Failing lessons

### advanced-deep-dive-topics/105_cryptography_fundamentals.md

- `typescript` fence at line 22 (section: Example Code)
  - TS1192: Module '"crypto"' has no default export.

### advanced-deep-dive-topics/106_event_streaming_kafka_vs_bullmq.md

- `typescript` fence at line 22 (section: Example Code)
  - TS2304: Cannot find name 'sendEmail'.
  - TS2304: Cannot find name 'sendWelcomeEmail'.

### advanced-deep-dive-topics/107_api_design_philosophy.md

- `typescript` fence at line 22 (section: Example Code)
  - TS2304: Cannot find name 'TenantService'.

### advanced-deep-dive-topics/109_performance_profiling.md

- `typescript` fence at line 73 (section: Example Code)
  - TS1192: Module '"v8"' has no default export.
  - TS1259: Module '"process"' can only be default-imported using the 'allowSyntheticDefaultImports' flag

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

- `typescript` fence at line 21 (section: Example Code)
  - TS1005: ';' expected.
  - TS2304: Cannot find name 'userSuppliedText'.
  - TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
  - TS2693: 'never' only refers to a type, but is being used as a value here.
  - TS2304: Cannot find name 'dangerouslySetInnerHTML'.

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

- `typescript` fence at line 21 (section: Example Code)
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

- `typescript` fence at line 25 (section: Example Code)
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
  - TS1259: Module '"path"' can only be default-imported using the 'allowSyntheticDefaultImports' flag
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
  - TS1192: Module '"crypto"' has no default export.
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
  - TS1192: Module '"crypto"' has no default export.
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

- `typescript` fence at line 21 (section: Example Code)
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1161: Unterminated regular expression literal.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1161: Unterminated regular expression literal.
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
  - TS2304: Cannot find name 'allocateSeats'.
  - TS2304: Cannot find name 'refundCharge'.
  - TS2304: Cannot find name 'deleteTenant'.

### distributed-systems-api-design/04_circuit_breaker_bulkhead_retry.md

- `typescript` fence at line 23 (section: Example Code)
  - TS2304: Cannot find name 'stripe'.

### distributed-systems-api-design/05_rate_limiting_strategies.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'Redis'.
  - TS2304: Cannot find name 'Redis'.

### distributed-systems-api-design/06_distributed_locking.md

- `typescript` fence at line 20 (section: Example Code)
  - TS1192: Module '"crypto"' has no default export.
  - TS2304: Cannot find name 'redis'.
  - TS2304: Cannot find name 'createTenantSchema'.
  - TS2304: Cannot find name 'seedTenantDefaults'.
  - TS2304: Cannot find name 'markTenantActive'.
  - TS2304: Cannot find name 'PrismaClient'.

### distributed-systems-api-design/08_webhook_security_retry.md

- `typescript` fence at line 21 (section: Example Code)
  - TS1192: Module '"crypto"' has no default export.
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
  - TS1192: Module '"http"' has no default export.
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
  - TS2582: Cannot find name 'describe'. Do you need to install type definitions for a test runner? Try `npm i --save-dev @types/jest` or `npm i --save-dev @types/mocha`.
  - TS2304: Cannot find name 'beforeAll'.
  - TS2304: Cannot find name 'afterAll'.
  - TS2582: Cannot find name 'it'. Do you need to install type definitions for a test runner? Try `npm i --save-dev @types/jest` or `npm i --save-dev @types/mocha`.
  - TS2304: Cannot find name 'expect'.
  - TS2304: Cannot find name 'expect'.
  - TS2582: Cannot find name 'it'. Do you need to install type definitions for a test runner? Try `npm i --save-dev @types/jest` or `npm i --save-dev @types/mocha`.
  - TS2304: Cannot find name 'expect'.
  - TS2582: Cannot find name 'it'. Do you need to install type definitions for a test runner? Try `npm i --save-dev @types/jest` or `npm i --save-dev @types/mocha`.
  - TS2304: Cannot find name 'expect'.
  - TS2304: Cannot find name 'expect'.

### framework-deep-dives/414_reactnative_expo_router_navigation.md

- `typescript` fence at line 21 (section: Example Code)
  - TS1005: '>' expected.
  - TS1005: ')' expected.
  - TS1136: Property assignment expected.
  - TS1109: Expression expected.
  - TS1005: '>' expected.
  - TS1161: Unterminated regular expression literal.
  - TS1128: Declaration or statement expected.
  - TS1128: Declaration or statement expected.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1109: Expression expected.
  - TS1109: Expression expected.
  - TS1005: '>' expected.
  - TS1005: ')' expected.
  - TS1136: Property assignment expected.
  - TS1109: Expression expected.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1109: Expression expected.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1109: Expression expected.
  - TS1110: Type expected.
  - TS1128: Declaration or statement expected.
  - TS1128: Declaration or statement expected.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1109: Expression expected.
  - TS1109: Expression expected.
  - TS1005: '>' expected.
  - TS1005: ')' expected.
  - TS1136: Property assignment expected.
  - TS1109: Expression expected.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1005: ';' expected.
  - TS1136: Property assignment expected.
  - TS1128: Declaration or statement expected.
  - TS1161: Unterminated regular expression literal.
  - TS1005: ';' expected.
  - TS1005: ';' expected.
  - TS1136: Property assignment expected.
  - TS1128: Declaration or statement expected.
  - TS1161: Unterminated regular expression literal.
  - TS1161: Unterminated regular expression literal.
  - TS1128: Declaration or statement expected.
  - TS1128: Declaration or statement expected.
  - TS1005: '>' expected.
  - TS1005: ')' expected.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1005: ';' expected.
  - TS1005: ';' expected.
  - TS1109: Expression expected.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1005: ';' expected.
  - TS1005: ';' expected.
  - TS1109: Expression expected.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1005: ';' expected.
  - TS1161: Unterminated regular expression literal.
  - TS1161: Unterminated regular expression literal.
  - TS1161: Unterminated regular expression literal.
  - TS1128: Declaration or statement expected.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1109: Expression expected.
  - TS1005: ';' expected.
  - TS1110: Type expected.
  - TS2323: Cannot redeclare exported variable 'default'.
  - TS2393: Duplicate function implementation.
  - TS2304: Cannot find name 'style'.
  - TS2365: Operator '<' cannot be applied to types 'boolean' and 'RegExp'.
  - TS2300: Duplicate identifier 'Redirect'.
  - TS2300: Duplicate identifier 'useAuthStore'.
  - TS2323: Cannot redeclare exported variable 'default'.
  - TS2393: Duplicate function implementation.
  - TS2304: Cannot find name 'href'.
  - TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
  - TS2304: Cannot find name 'screenOptions'.
  - TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
  - TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
  - TS2300: Duplicate identifier 'Redirect'.
  - TS2300: Duplicate identifier 'useAuthStore'.
  - TS2323: Cannot redeclare exported variable 'default'.
  - TS2393: Duplicate function implementation.
  - TS2304: Cannot find name 'href'.
  - TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
  - TS2304: Cannot find name 'screenOptions'.
  - TS2304: Cannot find name 'options'.
  - TS2588: Cannot assign to 'name' because it is a constant.
  - TS2304: Cannot find name 'options'.
  - TS2300: Duplicate identifier 'useAuthStore'.
  - TS2323: Cannot redeclare exported variable 'default'.
  - TS2393: Duplicate function implementation.
  - TS2304: Cannot find name 'AuthService'.
  - TS2304: Cannot find name 'className'.
  - TS2304: Cannot find name 'value'.
  - TS2304: Cannot find name 'onChangeText'.
  - TS2304: Cannot find name 'placeholder'.
  - TS2304: Cannot find name 'className'.
  - TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
  - TS2304: Cannot find name 'value'.
  - TS2304: Cannot find name 'onChangeText'.
  - TS2304: Cannot find name 'placeholder'.
  - TS2304: Cannot find name 'secureTextEntry'.
  - TS2304: Cannot find name 'className'.
  - TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
  - TS2304: Cannot find name 'onPress'.
  - TS2304: Cannot find name 'className'.
  - TS2304: Cannot find name 'className'.
  - TS2304: Cannot find name 'Sign'.
  - TS2304: Cannot find name 'In'.
  - TS2365: Operator '<' cannot be applied to types 'boolean' and 'RegExp'.
  - TS2365: Operator '<' cannot be applied to types 'boolean' and 'RegExp'.
  - TS2323: Cannot redeclare exported variable 'default'.
  - TS2393: Duplicate function implementation.
  - TS2304: Cannot find name 'href'.
  - TS2304: Cannot find name 'Edit'.
  - TS2304: Cannot find name 'user'.

### framework-deep-dives/415_reactnative_zustand_mmkv_state_management.md

- `typescript` fence at line 21 (section: Example Code)
  - TS1005: ',' expected.
  - TS1005: ',' expected.
  - TS1110: Type expected.
  - TS1128: Declaration or statement expected.
  - TS2395: Individual declarations in merged declaration 'mmkv' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'mmkv' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'zustandMMKVStorage' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'zustandMMKVStorage' must be all exported or all local.
  - TS2352: Conversion of type '{ user: any; fullName: any; }' to type 'Text' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.   Type '{ user: any; fullName: any; }' is missing the following properties from type 'Text': wholeText, splitText, data, length, and 62 more.
  - TS2869: Right operand of ?? is unreachable because the left operand is never nullish.
  - TS18004: No value exists in scope for the shorthand property 'fullName'. Either declare one or provide an initializer.

### framework-deep-dives/416_reactnative_data_fetching_and_offline.md

- `typescript` fence at line 21 (section: Example Code)
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

- `typescript` fence at line 22 (section: Example Code)
  - TS1005: '>' expected.
  - TS1005: ')' expected.
  - TS1005: ',' expected.
  - TS1109: Expression expected.
  - TS1005: '>' expected.
  - TS1161: Unterminated regular expression literal.
  - TS1128: Declaration or statement expected.
  - TS1128: Declaration or statement expected.
  - TS1005: '>' expected.
  - TS1005: ')' expected.
  - TS1136: Property assignment expected.
  - TS1109: Expression expected.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1161: Unterminated regular expression literal.
  - TS1005: ';' expected.
  - TS1161: Unterminated regular expression literal.
  - TS1161: Unterminated regular expression literal.
  - TS1128: Declaration or statement expected.
  - TS1128: Declaration or statement expected.
  - TS1005: '>' expected.
  - TS1005: ')' expected.
  - TS1136: Property assignment expected.
  - TS1005: ';' expected.
  - TS1136: Property assignment expected.
  - TS1005: ';' expected.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1109: Expression expected.
  - TS1110: Type expected.
  - TS1128: Declaration or statement expected.
  - TS1161: Unterminated regular expression literal.
  - TS1128: Declaration or statement expected.
  - TS1128: Declaration or statement expected.
  - TS2300: Duplicate identifier 'View'.
  - TS2304: Cannot find name 'className'.
  - TS2367: This comparison appears to be unintentional because the types '{ scheme: any; }' and 'string' have no overlap.
  - TS2839: This condition will always return 'false' since JavaScript compares objects by reference, not value.
  - TS2365: Operator '<' cannot be applied to types 'boolean' and 'RegExp'.
  - TS2300: Duplicate identifier 'View'.
  - TS2300: Duplicate identifier 'useWindowDimensions'.
  - TS2304: Cannot find name 'className'.
  - TS2304: Cannot find name 'style'.
  - TS2304: Cannot find name 'className'.
  - TS2365: Operator '>' cannot be applied to types 'string' and '{ name: void; }'.
  - TS2365: Operator '<' cannot be applied to types 'boolean' and 'RegExp'.
  - TS2304: Cannot find name 'className'.
  - TS2365: Operator '>' cannot be applied to types 'string' and '{ email: any; }'.
  - TS2365: Operator '<' cannot be applied to types 'boolean' and 'RegExp'.
  - TS2365: Operator '<' cannot be applied to types 'boolean' and 'RegExp'.
  - TS18004: No value exists in scope for the shorthand property 'email'. Either declare one or provide an initializer.
  - TS2300: Duplicate identifier 'useWindowDimensions'.
  - TS2304: Cannot find name 'key'.
  - TS2304: Cannot find name 'numColumns'.
  - TS2304: Cannot find name 'data'.
  - TS2304: Cannot find name 'keyExtractor'.
  - TS2349: This expression is not callable.   Type '{}' has no call signatures.
  - TS2304: Cannot find name 'item'.
  - TS2304: Cannot find name 'item'.
  - TS2304: Cannot find name 'renderItem'.
  - TS2349: This expression is not callable.   Type '{}' has no call signatures.
  - TS18004: No value exists in scope for the shorthand property 'item'. Either declare one or provide an initializer.
  - TS2304: Cannot find name 'className'.
  - TS2749: 'UserCard' refers to a value, but is being used as a type here. Did you mean 'typeof UserCard'?
  - TS2304: Cannot find name 'item'.
  - TS2304: Cannot find name 'email'.
  - TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.

### framework-deep-dives/419_reactnative_accessibility_and_feedback_patterns.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2300: Duplicate identifier 'Pressable'.
  - TS2875: This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found. Make sure you have types for the appropriate package installed.
  - TS2300: Duplicate identifier 'View'.
  - TS2300: Duplicate identifier 'Text'.
  - TS2300: Duplicate identifier 'View'.
  - TS2300: Duplicate identifier 'Text'.
  - TS2300: Duplicate identifier 'Pressable'.

### framework-deep-dives/420_reactnative_testing_jest_rntl_and_maestro.md

- `typescript` fence at line 21 (section: Example Code)
  - TS1005: ';' expected.
  - TS1005: ';' expected.
  - TS1005: ';' expected.
  - TS1005: ';' expected.
  - TS1005: ';' expected.
  - TS1005: '>' expected.
  - TS2695: Left side of comma operator is unused and has no side effects.
  - TS2695: Left side of comma operator is unused and has no side effects.
  - TS2304: Cannot find name 'jest'.
  - TS2304: Cannot find name 'jest'.
  - TS2304: Cannot find name 'jest'.
  - TS2304: Cannot find name 'jest'.
  - TS2304: Cannot find name 'jest'.
  - TS2300: Duplicate identifier 'waitFor'.
  - TS2300: Duplicate identifier 'http'.
  - TS2300: Duplicate identifier 'HttpResponse'.
  - TS2300: Duplicate identifier 'server'.
  - TS2582: Cannot find name 'describe'. Do you need to install type definitions for a test runner? Try `npm i --save-dev @types/jest` or `npm i --save-dev @types/mocha`.
  - TS2582: Cannot find name 'it'. Do you need to install type definitions for a test runner? Try `npm i --save-dev @types/jest` or `npm i --save-dev @types/mocha`.
  - TS2304: Cannot find name 'expect'.
  - TS2304: Cannot find name 'expect'.
  - TS2304: Cannot find name 'expect'.
  - TS2582: Cannot find name 'it'. Do you need to install type definitions for a test runner? Try `npm i --save-dev @types/jest` or `npm i --save-dev @types/mocha`.
  - TS2304: Cannot find name 'expect'.
  - TS2304: Cannot find name 'expect'.
  - TS2300: Duplicate identifier 'waitFor'.
  - TS2300: Duplicate identifier 'http'.
  - TS2300: Duplicate identifier 'HttpResponse'.
  - TS2300: Duplicate identifier 'server'.
  - TS2304: Cannot find name 'jest'.
  - TS2582: Cannot find name 'describe'. Do you need to install type definitions for a test runner? Try `npm i --save-dev @types/jest` or `npm i --save-dev @types/mocha`.
  - TS2582: Cannot find name 'it'. Do you need to install type definitions for a test runner? Try `npm i --save-dev @types/jest` or `npm i --save-dev @types/mocha`.
  - TS2304: Cannot find name 'expect'.
  - TS2304: Cannot find name 'afterEach'.
  - TS2582: Cannot find name 'it'. Do you need to install type definitions for a test runner? Try `npm i --save-dev @types/jest` or `npm i --save-dev @types/mocha`.
  - TS2304: Cannot find name 'expect'.

### framework-deep-dives/421_electron_process_model_and_typed_ipc.md

- `typescript` fence at line 21 (section: Example Code)
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

### framework-deep-dives/422_electron_preload_and_context_isolation.md

- `typescript` fence at line 21 (section: Example Code)
  - TS1259: Module '"node:path"' can only be default-imported using the 'allowSyntheticDefaultImports' flag

### framework-deep-dives/423_electron_main_process_lifecycle_and_window_management.md

- `typescript` fence at line 22 (section: Example Code)
  - TS2300: Duplicate identifier 'BrowserWindow'.
  - TS2300: Duplicate identifier 'BrowserWindow'.
  - TS1259: Module '"node:path"' can only be default-imported using the 'allowSyntheticDefaultImports' flag
  - TS2304: Cannot find name 'ipcMain'.
  - TS2304: Cannot find name 'IPC'.
  - TS2304: Cannot find name 'assertSender'.
  - TS2304: Cannot find name 'UsersService'.
  - TS2304: Cannot find name 'UsersListReq'.

### framework-deep-dives/424_electron_project_structure_and_vite_build_config.md

- `typescript` fence at line 44 (section: Example Code)
  - TS2503: Cannot find namespace 'Electron'.
  - TS2339: Property 'env' does not exist on type 'ImportMeta'.

### framework-deep-dives/425_electron_renderer_react_and_kuireact_fork.md

- `typescript` fence at line 21 (section: Example Code)
  - TS1005: '>' expected.
  - TS1005: '>' expected.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1161: Unterminated regular expression literal.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1005: ';' expected.
  - TS1109: Expression expected.
  - TS1109: Expression expected.
  - TS2395: Individual declarations in merged declaration 'api' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'api' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'useUsers' must be all exported or all local.
  - TS2395: Individual declarations in merged declaration 'useUsers' must be all exported or all local.
  - TS2588: Cannot assign to 'loading' because it is a constant.
  - TS2304: Cannot find name 'onPage'.
  - TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.

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
  - TS2304: Cannot find name 'beforeEach'.
  - TS2304: Cannot find name 'vi'.
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

- `typescript` fence at line 21 (section: Example Code)
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1161: Unterminated regular expression literal.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1005: ',' expected.
  - TS1161: Unterminated regular expression literal.
  - TS2300: Duplicate identifier 'Menu'.
  - TS2300: Duplicate identifier 'app'.
  - TS2503: Cannot find namespace 'Electron'.
  - TS2304: Cannot find name 'exportDocument'.
  - TS2300: Duplicate identifier 'app'.
  - TS2304: Cannot find name 'focusMainWindow'.
  - TS2304: Cannot find name 'kbd'.
  - TS2304: Cannot find name 'className'.
  - TS2365: Operator '>' cannot be applied to types 'string' and '{ keys: string; }'.
  - TS2365: Operator '<' cannot be applied to types 'boolean' and 'RegExp'.
  - TS2300: Duplicate identifier 'Menu'.
  - TS2304: Cannot find name 'focusMainWindow'.
  - TS2304: Cannot find name 'showToast'.
  - TS2304: Cannot find name 'span'.
  - TS2304: Cannot find name 'className'.
  - TS2365: Operator '>' cannot be applied to types 'string' and '{ online: boolean; Synced: string; }'.
  - TS2365: Operator '<' cannot be applied to types 'boolean' and 'RegExp'.

### frontend-performance-scaling/138_frontend_state_management.md

- `typescript` fence at line 16 (section: Example Code)
  - TS2304: Cannot find name 'useQuery'.
  - TS2304: Cannot find name 'create'.
  - TS7006: Parameter 'set' implicitly has an 'any' type.
  - TS7006: Parameter 's' implicitly has an 'any' type.
  - TS2304: Cannot find name 'useSearchParams'.
  - TS2304: Cannot find name 'useRouter'.

### frontend-performance-scaling/22_http2_multiplexing.md

- `typescript` fence at line 21 (section: Example Code)
  - TS1005: '>' expected.
  - TS1005: ')' expected.
  - TS1109: Expression expected.
  - TS1110: Type expected.
  - TS1161: Unterminated regular expression literal.
  - TS1161: Unterminated regular expression literal.
  - TS1128: Declaration or statement expected.
  - TS2528: A module cannot have multiple default exports.
  - TS2528: A module cannot have multiple default exports.
  - TS2304: Cannot find name 'html'.
  - TS2304: Cannot find name 'lang'.
  - TS2304: Cannot find name 'head'.
  - TS2304: Cannot find name 'link'.
  - TS2304: Cannot find name 'rel'.
  - TS2304: Cannot find name 'href'.
  - TS2304: Cannot find name 'as'.
  - TS2304: Cannot find name 'type'.
  - TS2304: Cannot find name 'crossOrigin'.
  - TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
  - TS2365: Operator '>' cannot be applied to types 'number' and '{}'.
  - TS2365: Operator '>' cannot be applied to types 'boolean' and '{ children: ReactNode; }'.
  - TS2365: Operator '<' cannot be applied to types 'boolean' and 'RegExp'.
  - TS2365: Operator '<' cannot be applied to types 'boolean' and 'RegExp'.
  - TS2304: Cannot find name 'body'.

### frontend-performance-scaling/23_react_server_components.md

- `typescript` fence at line 21 (section: Example Code)
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1005: ';' expected.
  - TS1109: Expression expected.
  - TS1109: Expression expected.
  - TS1005: '>' expected.
  - TS1005: ')' expected.
  - TS1005: ';' expected.
  - TS1161: Unterminated regular expression literal.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1005: ';' expected.
  - TS1127: Invalid character.
  - TS1434: Unexpected keyword or identifier.
  - TS1434: Unexpected keyword or identifier.
  - TS1161: Unterminated regular expression literal.
  - TS1128: Declaration or statement expected.
  - TS1110: Type expected.
  - TS1128: Declaration or statement expected.
  - TS1128: Declaration or statement expected.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1136: Property assignment expected.
  - TS1005: ';' expected.
  - TS1109: Expression expected.
  - TS1161: Unterminated regular expression literal.
  - TS1128: Declaration or statement expected.
  - TS1005: ',' expected.
  - TS1161: Unterminated regular expression literal.
  - TS1005: ')' expected.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1005: '>' expected.
  - TS1109: Expression expected.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1005: ';' expected.
  - TS1127: Invalid character.
  - TS1109: Expression expected.
  - TS1161: Unterminated regular expression literal.
  - TS1110: Type expected.
  - TS1005: ';' expected.
  - TS1136: Property assignment expected.
  - TS1109: Expression expected.
  - TS1109: Expression expected.
  - TS1109: Expression expected.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1005: ';' expected.
  - TS1127: Invalid character.
  - TS1109: Expression expected.
  - TS1161: Unterminated regular expression literal.
  - TS1128: Declaration or statement expected.
  - TS1110: Type expected.
  - TS1161: Unterminated regular expression literal.
  - TS1128: Declaration or statement expected.
  - TS1128: Declaration or statement expected.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1161: Unterminated regular expression literal.
  - TS1005: '>' expected.
  - TS1005: ')' expected.
  - TS1005: ';' expected.
  - TS1109: Expression expected.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1161: Unterminated regular expression literal.
  - TS1161: Unterminated regular expression literal.
  - TS1128: Declaration or statement expected.
  - TS2323: Cannot redeclare exported variable 'default'.
  - TS2393: Duplicate function implementation.
  - TS2304: Cannot find name 'useDashboardData'.
  - TS2304: Cannot find name 'DashboardLayout'.
  - TS2588: Cannot assign to 'filter' because it is a constant.
  - TS2304: Cannot find name 'onFilterChange'.
  - TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
  - TS2323: Cannot redeclare exported variable 'default'.
  - TS2393: Duplicate function implementation.
  - TS2304: Cannot find name 'getDashboardStats'.
  - TS2304: Cannot find name 'main'.
  - TS2304: Cannot find name 'Only'.
  - TS2683: 'this' implicitly has type 'any' because it does not have a type annotation.
  - TS2304: Cannot find name 'is'.
  - TS2304: Cannot find name 'client'.
  - TS2304: Cannot find name 'side'.
  - TS2363: The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
  - TS2304: Cannot find name 'data'.
  - TS2304: Cannot find name 'initialData'.
  - TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
  - TS2304: Cannot find name 'Server'.
  - TS2304: Cannot find name 'Component'.
  - TS2304: Cannot find name 'no'.
  - TS2304: Cannot find name 'JS'.
  - TS2304: Cannot find name 'shipped'.
  - TS2363: The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
  - TS2304: Cannot find name 'select'.
  - TS2304: Cannot find name 'onChange'.
  - TS2349: This expression is not callable.   Type '{}' has no call signatures.
  - TS2304: Cannot find name 'e'.
  - TS2304: Cannot find name 'e'.
  - TS2365: Operator '<' cannot be applied to types 'boolean' and 'RegExp'.
  - TS2323: Cannot redeclare exported variable 'default'.
  - TS2393: Duplicate function implementation.
  - TS2304: Cannot find name 'getTenant'.
  - TS2304: Cannot find name 'div'.
  - TS2304: Cannot find name 'h1'.
  - TS2304: Cannot find name 'fallback'.
  - TS2304: Cannot find name 'StatsSkeleton'.
  - TS2749: 'TenantStats' refers to a value, but is being used as a type here. Did you mean 'typeof TenantStats'?
  - TS2304: Cannot find name 'tenantId'.
  - TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
  - TS2304: Cannot find name 'Slow'.
  - TS2304: Cannot find name 'query'.
  - TS2304: Cannot find name 'streamed'.
  - TS2322: Type 'number' is not assignable to type 'object'.
  - TS2363: The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
  - TS2304: Cannot find name 'fallback'.
  - TS2365: Operator '<' cannot be applied to types '{}' and 'number'.
  - TS2304: Cannot find name 'MembersSkeleton'.
  - TS2304: Cannot find name 'MemberList'.
  - TS2304: Cannot find name 'tenantId'.
  - TS2304: Cannot find name 'params'.
  - TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
  - TS2304: Cannot find name 'Medium'.
  - TS2304: Cannot find name 'query'.
  - TS2304: Cannot find name 'streamed'.
  - TS2322: Type 'number' is not assignable to type 'object'.
  - TS2363: The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
  - TS2304: Cannot find name 'getExpensiveTenantAnalytics'.
  - TS2304: Cannot find name 'StatsGrid'.
  - TS2304: Cannot find name 'data'.
  - TS2304: Cannot find name 'getServerSession'.
  - TS2304: Cannot find name 'db'.
  - TS2304: Cannot find name 'form'.
  - TS2304: Cannot find name 'action'.
  - TS2365: Operator '>' cannot be applied to types '{ updateDisplayName: (formData: FormData) => Promise<void>; }' and '{}'.
  - TS2304: Cannot find name 'input'.
  - TS2588: Cannot assign to 'name' because it is a constant.
  - TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
  - TS2304: Cannot find name 'button'.
  - TS2304: Cannot find name 'type'.
  - TS2365: Operator '<' cannot be applied to types 'boolean' and 'RegExp'.
  - TS2365: Operator '<' cannot be applied to types 'boolean' and 'RegExp'.
  - TS2304: Cannot find name 'Save'.

### frontend-performance-scaling/24_bundle_size_optimization.md

- `typescript` fence at line 21 (section: Example Code)
  - TS1005: '>' expected.
  - TS1005: ',' expected.
  - TS1005: ':' expected.
  - TS1005: ',' expected.
  - TS1005: ')' expected.
  - TS1005: '>' expected.
  - TS1005: '>' expected.
  - TS1110: Type expected.
  - TS1128: Declaration or statement expected.
  - TS2304: Cannot find name 'div'.
  - TS2304: Cannot find name 'className'.
  - TS2304: Cannot find name 'div'.
  - TS2749: 'RichTextEditor' refers to a value, but is being used as a type here. Did you mean 'typeof RichTextEditor'?
  - TS2749: 'AnalyticsChart' refers to a value, but is being used as a type here. Did you mean 'typeof AnalyticsChart'?
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

- `typescript` fence at line 21 (section: Example Code)
  - TS1109: Expression expected.
  - TS1110: Type expected.
  - TS1161: Unterminated regular expression literal.
  - TS1005: '>' expected.
  - TS1005: ')' expected.
  - TS1005: ':' expected.
  - TS1005: ':' expected.
  - TS1109: Expression expected.
  - TS1109: Expression expected.
  - TS1127: Invalid character.
  - TS1435: Unknown keyword or identifier. Did you mean 'case'?
  - TS1005: '>' expected.
  - TS1005: ')' expected.
  - TS1161: Unterminated regular expression literal.
  - TS1110: Type expected.
  - TS1128: Declaration or statement expected.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1109: Expression expected.
  - TS1161: Unterminated regular expression literal.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1109: Expression expected.
  - TS1161: Unterminated regular expression literal.
  - TS2365: Operator '<' cannot be applied to types 'boolean' and 'RegExp'.
  - TS2304: Cannot find name 'html'.
  - TS2304: Cannot find name 'body'.
  - TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
  - TS2304: Cannot find name 'db'.
  - TS2304: Cannot find name 'src'.
  - TS2304: Cannot find name 'width'.
  - TS2304: Cannot find name 'height'.
  - TS2304: Cannot find name 'alt'.
  - TS2304: Cannot find name 'priority'.
  - TS2304: Cannot find name 'useState'.
  - TS2304: Cannot find name 'fetchBanner'.
  - TS2304: Cannot find name 'div'.
  - TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
  - TS2304: Cannot find name 'Injected'.
  - TS2304: Cannot find name 'causes'.
  - TS2304: Cannot find name 'shift'.
  - TS2304: Cannot find name 'useState'.
  - TS2304: Cannot find name 'fetchBanner'.
  - TS2304: Cannot find name 'div'.
  - TS2304: Cannot find name 'className'.
  - TS2365: Operator '>' cannot be applied to types 'string' and '{}'.
  - TS2304: Cannot find name 'div'.
  - TS2304: Cannot find name 'heavyComputation'.
  - TS2304: Cannot find name 'setResult'.
  - TS2304: Cannot find name 'button'.
  - TS2304: Cannot find name 'onClick'.
  - TS2365: Operator '<' cannot be applied to types 'boolean' and 'RegExp'.
  - TS2304: Cannot find name 'Calculate'.
  - TS2304: Cannot find name 'setLoading'.
  - TS2304: Cannot find name 'heavyComputation'.
  - TS2304: Cannot find name 'setResult'.
  - TS2304: Cannot find name 'setLoading'.
  - TS2304: Cannot find name 'button'.
  - TS2304: Cannot find name 'onClick'.
  - TS2365: Operator '<' cannot be applied to types 'boolean' and 'RegExp'.
  - TS2304: Cannot find name 'Calculate'.

### frontend-performance-scaling/26_streaming_ssr_suspense.md

- `typescript` fence at line 21 (section: Example Code)
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1161: Unterminated regular expression literal.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1161: Unterminated regular expression literal.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1161: Unterminated regular expression literal.
  - TS1161: Unterminated regular expression literal.
  - TS1005: ')' expected.
  - TS1136: Property assignment expected.
  - TS1109: Expression expected.
  - TS1109: Expression expected.
  - TS1109: Expression expected.
  - TS1005: ';' expected.
  - TS1109: Expression expected.
  - TS1110: Type expected.
  - TS1005: ';' expected.
  - TS1136: Property assignment expected.
  - TS1109: Expression expected.
  - TS1109: Expression expected.
  - TS1109: Expression expected.
  - TS1005: ';' expected.
  - TS1109: Expression expected.
  - TS1110: Type expected.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1005: '>' expected.
  - TS1109: Expression expected.
  - TS1005: ';' expected.
  - TS1109: Expression expected.
  - TS1110: Type expected.
  - TS1161: Unterminated regular expression literal.
  - TS1128: Declaration or statement expected.
  - TS1128: Declaration or statement expected.
  - TS1005: ';' expected.
  - TS1128: Declaration or statement expected.
  - TS1110: Type expected.
  - TS2304: Cannot find name 'getBillingData'.
  - TS2304: Cannot find name 'BillingCard'.
  - TS2304: Cannot find name 'data'.
  - TS2304: Cannot find name 'getTenantMembers'.
  - TS2304: Cannot find name 'TeamTable'.
  - TS2304: Cannot find name 'getAnalytics'.
  - TS2304: Cannot find name 'AnalyticsChart'.
  - TS2323: Cannot redeclare exported variable 'default'.
  - TS2393: Duplicate function implementation.
  - TS2304: Cannot find name 'main'.
  - TS2304: Cannot find name 'h1'.
  - TS2304: Cannot find name 'Dashboard'.
  - TS2304: Cannot find name 'fallback'.
  - TS2365: Operator '<' cannot be applied to types '{}' and 'number'.
  - TS2365: Operator '<' cannot be applied to types 'boolean' and '({ tenantId }: { tenantId: string; }) => Promise<BillingCard>'.
  - TS2304: Cannot find name 'fallback'.
  - TS2365: Operator '<' cannot be applied to types '{}' and 'number'.
  - TS2365: Operator '<' cannot be applied to types 'boolean' and '({ tenantId }: { tenantId: string; }) => Promise<TeamTable>'.
  - TS2304: Cannot find name 'fallback'.
  - TS2365: Operator '<' cannot be applied to types 'boolean' and '({ tenantId }: { tenantId: string; }) => Promise<AnalyticsChart>'.
  - TS2323: Cannot redeclare exported variable 'default'.
  - TS2393: Duplicate function implementation.
  - TS2304: Cannot find name 'div'.
  - TS2304: Cannot find name 'dashboard'.

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
  - TS2582: Cannot find name 'describe'. Do you need to install type definitions for a test runner? Try `npm i --save-dev @types/jest` or `npm i --save-dev @types/mocha`.
  - TS2582: Cannot find name 'it'. Do you need to install type definitions for a test runner? Try `npm i --save-dev @types/jest` or `npm i --save-dev @types/mocha`.
  - TS2304: Cannot find name 'expect'.
  - TS2582: Cannot find name 'it'. Do you need to install type definitions for a test runner? Try `npm i --save-dev @types/jest` or `npm i --save-dev @types/mocha`.
  - TS2304: Cannot find name 'expect'.
  - TS2582: Cannot find name 'it'. Do you need to install type definitions for a test runner? Try `npm i --save-dev @types/jest` or `npm i --save-dev @types/mocha`.
  - TS2304: Cannot find name 'RegistrationService'.
  - TS2304: Cannot find name 'expect'.

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

### observability-deployment/56_canary_deployment_feature_flags.md

- `typescript` fence at line 21 (section: Example Code)
  - TS1192: Module '"crypto"' has no default export.

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

- `typescript` fence at line 22 (section: Example Code or Template)
  - TS1005: '>' expected.
  - TS1005: ')' expected.
  - TS1005: ';' expected.
  - TS1005: ';' expected.
  - TS1005: ';' expected.
  - TS1136: Property assignment expected.
  - TS1005: ';' expected.
  - TS1109: Expression expected.
  - TS1005: ';' expected.
  - TS1005: ';' expected.
  - TS1005: ';' expected.
  - TS1127: Invalid character.
  - TS1110: Type expected.
  - TS1161: Unterminated regular expression literal.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1161: Unterminated regular expression literal.
  - TS1110: Type expected.
  - TS1161: Unterminated regular expression literal.
  - TS1128: Declaration or statement expected.
  - TS1128: Declaration or statement expected.
  - TS18046: 'el' is of type 'unknown'.
  - TS2339: Property 'focus' does not exist on type '{}'.
  - TS2339: Property 'focus' does not exist on type '{}'.
  - TS2304: Cannot find name 'div'.
  - TS2304: Cannot find name 'className'.
  - TS2304: Cannot find name 'aria'.
  - TS2304: Cannot find name 'hidden'.
  - TS2304: Cannot find name 'onClick'.
  - TS2365: Operator '>' cannot be applied to types '{ onClose: () => void; }' and '{}'.
  - TS2304: Cannot find name 'div'.
  - TS2304: Cannot find name 'ref'.
  - TS2304: Cannot find name 'role'.
  - TS2304: Cannot find name 'aria'.
  - TS2304: Cannot find name 'modal'.
  - TS2304: Cannot find name 'aria'.
  - TS2304: Cannot find name 'labelledby'.
  - TS2304: Cannot find name 'className'.
  - TS2304: Cannot find name 'onKeyDown'.
  - TS2304: Cannot find name 'onClick'.
  - TS2349: This expression is not callable.   Type '{}' has no call signatures.
  - TS2304: Cannot find name 'e'.
  - TS2304: Cannot find name 'e'.
  - TS2304: Cannot find name 'button'.
  - TS2304: Cannot find name 'type'.
  - TS2304: Cannot find name 'onClick'.
  - TS18004: No value exists in scope for the shorthand property 'onClose'. Either declare one or provide an initializer.
  - TS2304: Cannot find name 'className'.
  - TS2304: Cannot find name 'aria'.
  - TS2304: Cannot find name 'label'.
  - TS2365: Operator '>' cannot be applied to types 'string' and '{}'.
  - TS2304: Cannot find name 'span'.
  - TS2304: Cannot find name 'aria'.
  - TS2304: Cannot find name 'hidden'.
  - TS2304: Cannot find name 'h2'.
  - TS2304: Cannot find name 'id'.
  - TS2304: Cannot find name 'titleId'.
  - TS2304: Cannot find name 'className'.
  - TS2365: Operator '>' cannot be applied to types 'string' and '{ title: any; }'.
  - TS2365: Operator '<' cannot be applied to types 'boolean' and 'RegExp'.
  - TS18004: No value exists in scope for the shorthand property 'title'. Either declare one or provide an initializer.
  - TS2304: Cannot find name 'children'.

### saas-business-skills/91_mobile_first_api_design.md

- `typescript` fence at line 22 (section: Example Code or Template)
  - TS1192: Module '"crypto"' has no default export.

### saas-business-skills/93_ab_test_infrastructure.md

- `typescript` fence at line 22 (section: Example Code or Template)
  - TS1005: '>' expected.
  - TS1005: ')' expected.
  - TS1005: ';' expected.
  - TS1161: Unterminated regular expression literal.
  - TS1128: Declaration or statement expected.
  - TS2304: Cannot find name 'button'.
  - TS2304: Cannot find name 'onClick'.
  - TS2304: Cannot find name 'className'.
  - TS2365: Operator '>' cannot be applied to types 'string' and '{ buttonText: string; }'.
  - TS2365: Operator '<' cannot be applied to types 'boolean' and 'RegExp'.

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
  - TS1192: Module '"fs"' has no default export.
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

### security/33_ssrf_server_side_request_forgery.md

- `typescript` fence at line 21 (section: Example Code)
  - TS1192: Module '"dns/promises"' has no default export.

### security/34_timing_attack_constant_time_comparison.md

- `typescript` fence at line 21 (section: Example Code)
  - TS1192: Module '"crypto"' has no default export.
  - TS2304: Cannot find name 'bcrypt'.
  - TS2304: Cannot find name 'plainPassword'.
  - TS2304: Cannot find name 'hashedPassword'.
  - TS2304: Cannot find name 'rawToken'.
  - TS2304: Cannot find name 'repo'.

### security/35_content_security_policy_csp_headers.md

- `typescript` fence at line 21 (section: Example Code)
  - TS1005: ')' expected.
  - TS1005: ';' expected.
  - TS1136: Property assignment expected.
  - TS1161: Unterminated regular expression literal.
  - TS1161: Unterminated regular expression literal.
  - TS1005: '>' expected.
  - TS1005: ';' expected.
  - TS1109: Expression expected.
  - TS1110: Type expected.
  - TS1161: Unterminated regular expression literal.
  - TS1128: Declaration or statement expected.
  - TS1128: Declaration or statement expected.
  - TS2300: Duplicate identifier 'NextRequest'.
  - TS2300: Duplicate identifier 'NextResponse'.
  - TS1192: Module '"crypto"' has no default export.
  - TS2304: Cannot find name 'html'.
  - TS2304: Cannot find name 'head'.
  - TS2304: Cannot find name 'script'.
  - TS2588: Cannot assign to 'nonce' because it is a constant.
  - TS2304: Cannot find name 'dangerouslySetInnerHTML'.
  - TS2304: Cannot find name 'body'.
  - TS2635: Type 'RegExp' has no signatures for which the type argument list is applicable.
  - TS2304: Cannot find name 'children'.
  - TS2304: Cannot find name 'src'.
  - TS2304: Cannot find name 'strategy'.
  - TS2304: Cannot find name 'nonce'.
  - TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
  - TS2365: Operator '<' cannot be applied to types 'boolean' and 'RegExp'.
  - TS18004: No value exists in scope for the shorthand property 'nonce'. Either declare one or provide an initializer.
  - TS2300: Duplicate identifier 'NextRequest'.
  - TS2300: Duplicate identifier 'NextResponse'.
