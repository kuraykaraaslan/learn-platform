# Code verification report

`npx tsx scripts/verify-code.ts` — every TypeScript/TSX fence in the corpus,
extracted and typechecked. Generated file: do not edit by hand.

| | |
|---|---:|
| TS/TSX fences | 284 |
| Clean | 56 |
| Only uninstalled-module errors (tolerated) | 151 |
| **Failing** | **77** |
| Lessons affected | 65 |
| Fences importing private `@/libs|modules|stores` aliases | 23 |

## Defects by class

| Class | Count |
|---|---:|
| undefined-identifier | 190 |
| type-error | 1 |

## Failing lessons

### advanced-deep-dive-topics/107_api_design_philosophy.md

- `typescript` fence at line 22 (section: Example Code)
  - TS2304: Cannot find name 'TenantService'.

### ai-llm-engineering/151_tool_use_agentic_loops.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'AppError'.
  - TS2304: Cannot find name 'AGENT_SYSTEM_PROMPT'.
  - TS2304: Cannot find name 'AppError'.

### ai-llm-engineering/152_advanced_rag_chunking_reranking_grounding.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'vectorStore'.
  - TS2304: Cannot find name 'RAG_SYSTEM_PROMPT'.

### ai-llm-engineering/154_token_budget_cost_engineering.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'SUMMARY_SYSTEM_PROMPT'.

### ai-llm-engineering/155_streaming_ai_responses_production.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'DRAFT_SYSTEM_PROMPT'.

### ai-llm-engineering/156_fallback_graceful_degradation.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'SUMMARY_SYSTEM_PROMPT'.

### ai-llm-engineering/158_observability_logging_ai_features.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'CLASSIFY_CONFIG'.

### ai-llm-engineering/159_prompt_injection_defense.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'userSuppliedText'.

### ai-llm-engineering/162_mcp_server_architecture_tool_design.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'projectService'.
  - TS2304: Cannot find name 'projectService'.
  - TS2304: Cannot find name 'projectService'.

### ai-llm-engineering/163_mcp_server_auth_error_idempotency.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'server'.
  - TS2304: Cannot find name 'z'.
  - TS2304: Cannot find name 'z'.
  - TS2304: Cannot find name 'z'.

### ai-llm-engineering/164_multi_agent_orchestration_workflow_chaining.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'CLASSIFY_SYSTEM_PROMPT'.
  - TS2304: Cannot find name 'DRAFT_SYSTEM_PROMPT'.
  - TS2304: Cannot find name 'REVIEW_SYSTEM_PROMPT'.
  - TS2304: Cannot find name 'AppError'.

### ai-llm-engineering/165_human_in_the_loop_review_gates.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'AppError'.

### algorithms-concurrency/129_concurrency_async_fundamentals.md

- `typescript` fence at line 18 (section: Example Code)
  - TS2304: Cannot find name 'userIds'.

### architecture-design-patterns-testing/134_domain_driven_design.md

- `typescript` fence at line 18 (section: Example Code)
  - TS2304: Cannot find name 'OrderLine'.
  - TS2304: Cannot find name 'OrderLine'.

### architecture-design-patterns-testing/64_solid_principles.md

- `typescript` fence at line 27 (section: Example Code)
  - TS2304: Cannot find name 'UserRecord'.
  - TS2304: Cannot find name 'CreateUserDto'.
  - TS2304: Cannot find name 'UserRecord'.
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
  - TS2304: Cannot find name 'JwtTokenService'.
  - TS2304: Cannot find name 'env'.
  - TS2304: Cannot find name 'StaticTokenService'.

### architecture-design-patterns-testing/65_hexagonal_architecture.md

- `typescript` fence at line 23 (section: Example Code)
  - TS2304: Cannot find name 'IPasswordHasher'.
  - TS2304: Cannot find name 'ITokenIssuer'.
- `typescript` fence at line 23 (section: Example Code)
  - TS2304: Cannot find name 'systemDataSource'.
  - TS2304: Cannot find name 'NodemailerEmailAdapter'.
  - TS2304: Cannot find name 'smtpConfig'.
  - TS2304: Cannot find name 'BcryptPasswordHasher'.
  - TS2304: Cannot find name 'JwtTokenIssuer'.
  - TS2304: Cannot find name 'env'.

### architecture-design-patterns-testing/66_dependency_injection_container.md

- `typescript` fence at line 23 (section: Example Code)
  - TS2304: Cannot find name 'AuthService'.
  - TS2304: Cannot find name 'InMemoryUserRepository'.

### architecture-design-patterns-testing/67_design_patterns.md

- `typescript` fence at line 22 (section: Example Code)
  - TS2304: Cannot find name 'AuthService'.
  - TS2304: Cannot find name 'AuthService'.
  - TS2304: Cannot find name 'IEmailService'.
  - TS2304: Cannot find name 'User'.
  - TS2304: Cannot find name 'User'.

### architecture-design-patterns-testing/68_big_o_analysis.md

- `typescript` fence at line 23 (section: Example Code)
  - TS2304: Cannot find name 'Tenant'.
  - TS2304: Cannot find name 'Tenant'.

### architecture-design-patterns-testing/69_tail_call_memoization_lazy_evaluation.md

- `tsx` fence at line 25 (section: Example Code)
  - TS2304: Cannot find name 'AuditLogRow'.
  - TS2304: Cannot find name 'AuditLogRow'.
  - TS2304: Cannot find name 'AuditLogRow'.

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
- `typescript` fence at line 25 (section: Example Code)
  - TS2304: Cannot find name 'mockRedis'.
  - TS2304: Cannot find name 'bcrypt'.
  - TS2304: Cannot find name 'AuthService'.

### database-advanced/41_postgresql_mvcc_vacuum_bloat_isolation.md

- `typescript` fence at line 62 (section: Example Code)
  - TS2304: Cannot find name 'Tenant'.
  - TS2304: Cannot find name 'TenantMember'.
  - TS2304: Cannot find name 'DEFAULT_SEAT_LIMIT'.
  - TS2304: Cannot find name 'TenantMember'.

### database-advanced/44_soft_delete_pattern_problems_alternatives.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'UserSession'.
  - TS2304: Cannot find name 'TenantMember'.
  - TS2304: Cannot find name 'AuditLog'.
  - TS2304: Cannot find name 'UserArchive'.

### database-advanced/45_time_series_data_timescaledb_partitioning.md

- `typescript` fence at line 70 (section: Example Code)
  - TS2304: Cannot find name 'TenantAuditLog'.

### database-advanced/46_full_text_search_postgres_tsvector_elasticsearch.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'User'.
  - TS2304: Cannot find name 'User'.

### database-advanced/47_audit_log_design_application_level.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'AuditLog'.
  - TS2304: Cannot find name 'AuditLog'.
  - TS2304: Cannot find name 'AuditLog'.

### database-advanced/48_data_retention_gdpr_kvkk_deletion_flow.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'UserSession'.
  - TS2304: Cannot find name 'UserSocialAccount'.
  - TS2304: Cannot find name 'TenantMember'.
  - TS2304: Cannot find name 'AuditLog'.
  - TS2304: Cannot find name 'User'.
  - TS2304: Cannot find name 'TenantSubscription'.
  - TS2304: Cannot find name 'Invoice'.
  - TS2304: Cannot find name 'AuditLogService'.
  - TS2304: Cannot find name 'UserSession'.
  - TS2304: Cannot find name 'Logger'.
  - TS2304: Cannot find name 'User'.

### database-advanced/50_multi_tenant_data_isolation_models.md

- `typescript` fence at line 23 (section: Example Code)
  - TS2304: Cannot find name 'tenantEntities'.
  - TS2304: Cannot find name 'DB_HOST'.
  - TS2304: Cannot find name 'tenantEntities'.
  - TS2304: Cannot find name 'systemRepo'.
  - TS2304: Cannot find name 'systemRepo'.
  - TS2304: Cannot find name 'TenantMember'.

### database-advanced/52_oltp_vs_olap.md

- `typescript` fence at line 23 (section: Example Code)
  - TS2304: Cannot find name 'AnalyticsRow'.

### database-caching-performance/16_n_plus_1_query_problem.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'User'.

### database-caching-performance/19_connection_pool_tuning.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'pgBouncerAdminClient'.

### database-caching-performance/20_redis_cache_strategies.md

- `typescript` fence at line 23 (section: Example Code)
  - TS2304: Cannot find name 'TenantConfig'.

### database-caching-performance/21_cdn_cache_strategy.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'PricingGrid'.
  - TS2304: Cannot find name 'Dashboard'.
  - TS2304: Cannot find name 'PlanUpdateInput'.
  - TS2304: Cannot find name 'NextResponse'.
  - TS2304: Cannot find name 'NextResponse'.

### distributed-systems-api-design/04_circuit_breaker_bulkhead_retry.md

- `typescript` fence at line 23 (section: Example Code)
  - TS2304: Cannot find name 'stripe'.

### distributed-systems-api-design/10_backward_forward_compatibility.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'DbUser'.

### distributed-systems-api-design/11_read_replica_routing.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'User'.
  - TS2304: Cannot find name 'User'.
  - TS2304: Cannot find name 'userId'.

### distributed-systems-api-design/12_database_sharding_strategies.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'AuditEvent'.
  - TS2304: Cannot find name 'AuditEvent'.

### distributed-systems-api-design/131_message_queues_101.md

- `typescript` fence at line 17 (section: Example Code)
  - TS2304: Cannot find name 'order'.

### distributed-systems-api-design/135_microservices_vs_monolith.md

- `typescript` fence at line 17 (section: Example Code)
  - TS2304: Cannot find name 'PlaceOrderInput'.
  - TS2304: Cannot find name 'PlaceOrderInput'.
  - TS2304: Cannot find name 'orderService'.
  - TS2304: Cannot find name 'inventoryService'.
  - TS2304: Cannot find name 'orderService'.

### distributed-systems-api-design/136_api_gateway_bff.md

- `typescript` fence at line 16 (section: Example Code)
  - TS2304: Cannot find name 'profileService'.
  - TS2304: Cannot find name 'notificationService'.

### distributed-systems-api-design/13_cqrs_read_model_optimization.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'TenantUsageSummary'.

### distributed-systems-api-design/14_outbox_pattern.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'Tenant'.
  - TS2304: Cannot find name 'OutboxMessage'.

### distributed-systems-api-design/15_two_phase_commit_eventual_consistency.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'tenantDb'.

### framework-deep-dives/414_reactnative_expo_router_navigation.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'AuthService'.

### framework-deep-dives/417_reactnative_expo_config_permissions_and_native_apis.md

- `typescript` fence at line 22 (section: Example Code)
  - TS2304: Cannot find name 'axiosInstance'.

### framework-deep-dives/418_reactnative_nativewind_styling_tokens_and_dark_mode.md

- `tsx` fence at line 22 (section: Example Code)
  - TS2304: Cannot find name 'View'.
  - TS2304: Cannot find name 'View'.

### framework-deep-dives/423_electron_main_process_lifecycle_and_window_management.md

- `typescript` fence at line 22 (section: Example Code)
  - TS2304: Cannot find name 'ipcMain'.
  - TS2304: Cannot find name 'IPC'.
  - TS2304: Cannot find name 'UsersService'.
  - TS2304: Cannot find name 'UsersListReq'.

### framework-deep-dives/427_electron_environment_secrets_and_auto_updates.md

- `typescript` fence at line 22 (section: Example Code)
  - TS2304: Cannot find name 'AuthApi'.
- `typescript` fence at line 22 (section: Example Code)
  - TS2304: Cannot find name 'ipcMain'.
  - TS2304: Cannot find name 'autoUpdater'.
  - TS2304: Cannot find name 'ipcMain'.
  - TS2304: Cannot find name 'autoUpdater'.

### framework-deep-dives/428_electron_error_handling_crash_reporting_and_performance.md

- `typescript` fence at line 24 (section: Example Code)
  - TS2304: Cannot find name 'ipcMain'.
  - TS2304: Cannot find name 'IPC'.
  - TS2304: Cannot find name 'UsersService'.
  - TS2304: Cannot find name 'UsersListReq'.
- `typescript` fence at line 24 (section: Example Code)
  - TS2686: 'React' refers to a UMD global, but the current file is a module. Consider adding an import instead.
- `typescript` fence at line 24 (section: Example Code)
  - TS2304: Cannot find name 'app'.
  - TS2304: Cannot find name 'initDeferredServices'.

### framework-deep-dives/429_electron_window_chrome_and_desktop_layout.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'WindowControls'.
  - TS2304: Cannot find name 'Toolbar'.
  - TS2304: Cannot find name 'StatusBar'.
  - TS2304: Cannot find name 'mainWindow'.

### framework-deep-dives/430_electron_menus_shortcuts_tray_and_dialogs.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'exportDocument'.
- `tsx` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'focusMainWindow'.
- `tsx` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'focusMainWindow'.

### frontend-performance-scaling/23_react_server_components.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'DashboardLayout'.
- `tsx` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'StatsSkeleton'.
  - TS2304: Cannot find name 'MembersSkeleton'.
  - TS2304: Cannot find name 'MemberList'.
- `tsx` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'StatsGrid'.

### frontend-performance-scaling/24_bundle_size_optimization.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'items'.
  - TS2304: Cannot find name 'items'.

### frontend-performance-scaling/26_streaming_ssr_suspense.md

- `tsx` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'BillingCard'.
  - TS2304: Cannot find name 'TeamTable'.
  - TS2304: Cannot find name 'AnalyticsChart'.

### frontend-performance-scaling/28_horizontal_scaling_stateless_design.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'SessionData'.
- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'SafeUser'.
  - TS2304: Cannot find name 'SafeUserSession'.
  - TS2304: Cannot find name 'SafeUser'.
  - TS2304: Cannot find name 'SafeUserSession'.
- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'worker'.

### fundamentals-tools/121_sql_fundamentals.md

- `typescript` fence at line 30 (section: Example Code)
  - TS2304: Cannot find name 'thirtyDaysAgo'.

### fundamentals-tools/124_unit_testing_basics.md

- `typescript` fence at line 16 (section: Example Code)
  - TS2304: Cannot find name 'RegistrationService'.

### fundamentals-tools/128_clean_code_basics.md

- `typescript` fence at line 17 (section: Example Code)
  - TS2304: Cannot find name 'User'.

### observability-deployment/61_alerting_design.md

- `typescript` fence at line 23 (section: Example Code)
  - TS2304: Cannot find name 'sendToPagerDuty'.
  - TS2304: Cannot find name 'sendToSlack'.
  - TS2304: Cannot find name 'sendToSlack'.
  - TS2304: Cannot find name 'writeToLog'.
  - TS2304: Cannot find name 'writeToLog'.

### security/29_owasp_top_10.md

- `typescript` fence at line 23 (section: Example Code)
  - TS2304: Cannot find name 'TenantMemberService'.
- `typescript` fence at line 23 (section: Example Code)
  - TS2304: Cannot find name 'AuditLogService'.
  - TS2304: Cannot find name 'Logger'.

### security/30_sql_injection_protection.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'req'.
  - TS2304: Cannot find name 'AuditLog'.
  - TS2304: Cannot find name 'req'.

### security/32_jwt_security_rs256_hs256_rotation.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'token'.
  - TS2304: Cannot find name 'SECRET'.

### security/34_timing_attack_constant_time_comparison.md

- `typescript` fence at line 21 (section: Example Code)
  - TS2304: Cannot find name 'plainPassword'.
  - TS2304: Cannot find name 'hashedPassword'.
  - TS2304: Cannot find name 'rawToken'.
