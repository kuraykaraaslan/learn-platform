# 410. Spring Boot: JPA Entities, Repositories, and N+1 Prevention

## What It Is
Spring Data JPA is the Java equivalent of TypeORM, but with meaningfully different defaults and failure modes that matter once an application has real relationships and real traffic. Entities are plain classes annotated `@Entity`, built with Lombok (`@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`) to avoid hand-written boilerplate, and suffixed `Entity` specifically to keep them visually distinct from the response DTOs they get mapped to. Repositories are interfaces extending `JpaRepository<Entity, ID>` — Spring generates the implementation at startup from method name conventions (`findByEmailAndUserStatus`), from `@Query` JPQL for anything a derived name can't express, or from projection interfaces for read-only field subsets. Raw `EntityManager` access is reserved for genuinely complex dynamic queries inside a custom repository implementation, not a default tool.

The single most consequential default in this stack is that every relationship — `@OneToMany`, `@ManyToOne`, `@OneToOne` — is `FetchType.LAZY`. Hibernate's default for `@ManyToOne`/`@OneToOne` is actually `EAGER`, and this ruleset overrides that explicitly, because eager loading is what causes the N+1 query problem: load a list of users, then access `user.getSessions()` inside a loop, and Hibernate fires one query per user instead of one query total. The fix is `JOIN FETCH` in a JPQL query or `@EntityGraph` on a derived query method — both tell Hibernate to pull the related rows in the same round trip, deliberately, at the one call site that needs them, rather than eagerly on every load of the parent entity everywhere in the codebase.

The same output-filtering discipline from the response-format lesson applies here from the other direction: an entity never crosses the service boundary as a controller return value, and for list endpoints that need only a few fields, a Spring Data projection interface (a plain interface with getter method signatures) lets the query fetch exactly those columns instead of the whole row. Soft deletes follow a `deletedAt` timestamp column with `findActiveById`-style queries filtering `WHERE deletedAt IS NULL`, and schema changes are handled entirely by Flyway (covered in the next lesson) — `spring.jpa.hibernate.ddl-auto` is always `validate`, never `update` or `create`.

## Key Concepts
- **`@Entity` classes suffixed `Entity`**: `UserEntity`, not `User` — keeps the persistence class visually distinct from response DTOs and any domain object
- **`JpaRepository<Entity, UUID>` interfaces**: derived query methods (`findByEmail`), `@Query` JPQL for complex joins, `Page<T>` for pagination, `existsByX` for cheap existence checks — raw `EntityManager` only in custom implementations for cases none of these cover
- **`FetchType.LAZY` on every relationship**: overrides Hibernate's `EAGER` default for `@ManyToOne`/`@OneToOne`; the single biggest lever against accidental N+1 queries
- **N+1 prevention via `JOIN FETCH` or `@EntityGraph`**: fetch related rows deliberately, at the call site that needs them, in one round trip — not implicitly on every load
- **Projection interfaces**: a plain interface with getter signatures (`UserSummary { UUID getUserId(); String getEmail(); }`) lets a repository method return only the needed columns for list views
- **Column naming**: JPA maps `camelCase` field names to `snake_case` columns automatically (`userId` → `user_id`) — never override with `@Column(name = ...)` just to force snake_case manually
- **Soft delete via `deletedAt`**: a nullable `Instant` column, filtered with `WHERE deletedAt IS NULL` in repository queries, rather than a hard `DELETE`
- **`ddl-auto: validate`, never `update`/`create`**: Hibernate checks the schema matches the entities but never mutates it — all schema changes go through Flyway

## Example Code
```java
// modules/user/entity/UserEntity.java
@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID userId;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    @Builder.Default
    private String userRole = "USER";

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)   // always LAZY
    private List<UserSessionEntity> sessions = new ArrayList<>();

    @CreationTimestamp
    private Instant createdAt;

    @Column
    private Instant deletedAt;   // soft delete marker
}

// modules/user/repository/UserRepository.java
public interface UserRepository extends JpaRepository<UserEntity, UUID> {

    Optional<UserEntity> findByEmail(String email);

    boolean existsByEmail(String email);   // cheaper than findOne when only existence matters

    // Projection — returns only the listed fields, not the whole row
    List<UserSummary> findByUserStatus(String status);

    // ❌ N+1 risk if callers loop and touch getSessions() lazily — fine as-is, dangerous downstream
    List<UserEntity> findAll();

    // ✅ JOIN FETCH — pulls sessions in the same query, deliberately, at this one call site
    @Query("""
        SELECT DISTINCT u FROM UserEntity u
        LEFT JOIN FETCH u.sessions
        WHERE u.userStatus = 'ACTIVE'
        """)
    List<UserEntity> findActiveUsersWithSessions();

    // ✅ @EntityGraph — same fix, declarative form on a derived query
    @EntityGraph(attributePaths = {"sessions"})
    List<UserEntity> findByUserStatus(String status);

    // Soft-delete-aware lookup
    @Query("SELECT u FROM UserEntity u WHERE u.deletedAt IS NULL AND u.userId = :id")
    Optional<UserEntity> findActiveById(@Param("id") UUID id);
}

public interface UserSummary {
    UUID getUserId();
    String getEmail();
    String getUserRole();
}

// modules/user/service/UserService.java (excerpt) — demonstrating the N+1 fix in context
@Transactional(readOnly = true)
public List<UserWithSessionCountResponse> listActiveWithSessionCounts() {
    // ✅ one query total, thanks to JOIN FETCH in the repository method
    return userRepository.findActiveUsersWithSessions().stream()
        .map(u -> new UserWithSessionCountResponse(u.getUserId(), u.getEmail(), u.getSessions().size()))
        .toList();
}
```

## When to Use
- Defining any new relationship between entities — default to `FetchType.LAZY` explicitly, even where Hibernate's default happens to already be lazy, for consistency and clarity
- Building a list endpoint that touches a related collection for every row — reach for `JOIN FETCH` or `@EntityGraph` before writing the loop, not after profiling reveals the N+1
- A list endpoint needs only a handful of fields — use a projection interface instead of fetching (and mapping) the full entity
- Implementing "delete" for a user-facing resource — default to a soft delete (`deletedAt`) unless the domain genuinely requires permanent removal

## Common Mistakes
- **Leaving a `@ManyToOne`/`@OneToOne` on its Hibernate default (`EAGER`)** — this silently loads the related entity on every fetch of the parent, everywhere, which both wastes bandwidth and hides N+1 problems until they compound in a loop.
- **Accessing a lazy collection inside a loop without `JOIN FETCH`/`@EntityGraph`** — `users.forEach(u -> u.getSessions().size())` fires one query per user; fix it at the repository method, not by adding more collection access patterns.
- **Returning `@Entity` objects from a service** — exposes internal columns like `deletedAt` and any lazy proxy fields that fail to serialize outside a transaction; always map to a response record first.
- **Using `spring.jpa.hibernate.ddl-auto=update` "just for now"** — this drifts the schema out of sync with tracked migrations and is explicitly banned in every environment, including local dev.
- **Manually overriding column names to force `snake_case`** — JPA already does this mapping from `camelCase` by convention; an explicit `@Column(name = "user_id")` is redundant and adds noise.

## Further Reading
- Spring Data JPA reference: https://docs.spring.io/spring-data/jpa/reference/
- Vlad Mihalcea — "The best way to fix the N+1 query problem": https://vladmihalcea.com/n-plus-1-query-problem/
- Hibernate ORM user guide — "Fetching strategies": https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html#fetching
