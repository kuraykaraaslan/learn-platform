# 403. Spring Boot: Three-Layer Architecture — Controller, Service, and Repository

## What It Is
Spring Boot projects in this shop use a strict three-layer model: `@RestController` → `@Service` → `@Repository`/`JpaRepository`. This is one layer more than the Express two-layer convention (route + static service) covered earlier in this course, and the extra layer is not accidental — it reflects a real difference between the two ecosystems. In TypeORM, a repository is a thin wrapper you call inline from a service; wrapping it in a fourth abstraction buys nothing. In Spring Data JPA, `JpaRepository<Entity, ID>` is a proxy Spring generates from an interface, and it is a meaningful, independently mockable unit — mocking it in a `@WebMvcTest` slice test, injecting a different implementation, or adding a custom `@Query` are all first-class operations that the interface boundary makes clean.

The controller's job is narrow and mirrors the Express route: parse and validate the request (`@Valid @RequestBody`), call exactly one service method, and translate the result into a `ResponseEntity` with an explicit status code. Business logic never lives in the controller. The service is a Spring-managed bean — not a static class — injected via constructor and annotated `@Service`. It owns `@Transactional` boundaries, calls one or more repositories, and throws `AppException` on failure rather than returning null or a boolean. The repository layer is Spring Data JPA interfaces only; raw `EntityManager` queries are reserved for genuinely complex dynamic queries inside a custom repository implementation.

Because Spring services are proxied beans (this is what makes `@Transactional` and `@PreAuthorize` work — see the service-layer and security lessons), the static-class pattern from Express cannot be ported over. A `static async` method call bypasses the Spring proxy entirely, silently disabling any AOP-based behavior applied to it. This is the single most important mental adjustment moving from Express/TypeORM to Spring Boot: layering isn't just a filing convention here, it's load-bearing for how the framework intercepts calls.

## Key Concepts
- **`@RestController`**: parses the request, delegates to exactly one service call, returns `ResponseEntity<T>` with an explicit status — contains zero business logic
- **`@Service` (Spring bean, not static)**: constructor-injected via `@RequiredArgsConstructor`, owns `@Transactional` boundaries and business logic, throws `AppException` on failure
- **`@Repository` / `JpaRepository<Entity, UUID>`**: Spring Data JPA interfaces; no raw `EntityManager` outside complex custom implementations
- **Why the extra layer vs Express**: Spring Data JPA repositories are meaningful, independently mockable units; TypeORM repositories are not, so Express inlines them into the service
- **Module package layout**: `controller/`, `service/`, `request/`, `response/`, `entity/`, `repository/` — one package per technical layer within a domain module
- **Component scanning**: controllers/services/repositories are auto-discovered by `@SpringBootApplication`; placement under `com.company.modules.[module]` is what makes them visible, not manual registration
- **API path convention**: `/api/v1/system/[resource]` and `/api/v1/tenant/{tenantId}/[resource]` — identical convention to the Express/TypeScript stack for cross-project consistency
- **Health check**: `GET /actuator/health` (Spring Actuator) or a custom `GET /api/health` — no auth, no rate limit, always `200`

## Example Code
```java
// modules/project/entity/ProjectEntity.java
@Entity
@Table(name = "projects")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID projectId;

    @Column(nullable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    @CreationTimestamp
    private Instant createdAt;
}

// modules/project/repository/ProjectRepository.java
public interface ProjectRepository extends JpaRepository<ProjectEntity, UUID> {
    Optional<ProjectEntity> findByTenantIdAndName(UUID tenantId, String name);
    List<ProjectEntity> findByTenantId(UUID tenantId);
}

// modules/project/request/CreateProjectRequest.java
public record CreateProjectRequest(
    @NotBlank @Size(max = 120) String name,
    @Size(max = 500) String description
) {}

// modules/project/response/ProjectResponse.java
public record ProjectResponse(UUID projectId, String name, String description, Instant createdAt) {
    public static ProjectResponse from(ProjectEntity entity) {
        return new ProjectResponse(entity.getProjectId(), entity.getName(), entity.getDescription(), entity.getCreatedAt());
    }
}

// modules/project/service/ProjectService.java — Spring bean, constructor injection, owns @Transactional
@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;

    @Transactional
    public ProjectResponse create(UUID tenantId, CreateProjectRequest request) {
        projectRepository.findByTenantIdAndName(tenantId, request.name()).ifPresent(existing -> {
            throw new AppException(ProjectMessages.NAME_TAKEN, 409);
        });

        ProjectEntity project = ProjectEntity.builder()
            .tenantId(tenantId)
            .name(request.name())
            .description(request.description())
            .build();

        return ProjectResponse.from(projectRepository.save(project));
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> listByTenant(UUID tenantId) {
        return projectRepository.findByTenantId(tenantId).stream()
            .map(ProjectResponse::from)
            .toList();
    }
}

// modules/project/controller/ProjectController.java — thin, validates + delegates
@RestController
@RequestMapping("/api/v1/tenant/{tenantId}/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ProjectResponse> create(
        @PathVariable UUID tenantId,
        @Valid @RequestBody CreateProjectRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.create(tenantId, request));
    }

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<ProjectResponse>> list(@PathVariable UUID tenantId) {
        return ResponseEntity.ok(projectService.listByTenant(tenantId));
    }
}
```

## When to Use
- Scaffolding any new Spring Boot module — start by creating `controller/`, `service/`, `request/`, `response/`, `entity/`, `repository/` packages, not a flat file dump
- Deciding whether logic belongs in the controller or the service — if it does more than validate input or map a response, it belongs in the service
- Porting an Express/TypeORM module to Spring Boot — expect the 2-layer Route→Service split to become 3-layer Controller→Service→Repository, and expect the service to become an injected bean, not a static class
- Exposing the same business logic to an HTTP endpoint and a `@Scheduled` job — the service method is the shared entry point for both

## Common Mistakes
- **Copying the Express static-service pattern into Spring Boot** — a `static` method bypasses the Spring proxy entirely, silently breaking `@Transactional`, `@PreAuthorize`, and any other AOP-based annotation on it.
- **Returning `@Entity` objects from the controller** — this leaks internal fields (password hashes, `deletedAt`, foreign keys) and couples the wire format to the JPA schema; always map through a response record.
- **Putting `@Transactional` on the controller** — the transactional boundary belongs in the service; controllers only handle HTTP concerns (including setting cookies, which is an intentional exception).
- **Field injection (`@Autowired` on a field)** — use constructor injection via `@RequiredArgsConstructor`; field injection hides dependencies and breaks clean unit testing.
- **Writing raw `EntityManager` queries in a service** — reach for a derived query method or `@Query` on the repository interface first; raw `EntityManager` is reserved for genuinely complex dynamic queries in a custom repository implementation.

## Further Reading
- Spring Boot reference — "Developing Web Applications": https://docs.spring.io/spring-boot/reference/web/index.html
- Spring Data JPA reference: https://docs.spring.io/spring-data/jpa/reference/
- Martin Fowler — "PresentationDomainDataLayering": https://martinfowler.com/bliki/PresentationDomainDataLayering.html
