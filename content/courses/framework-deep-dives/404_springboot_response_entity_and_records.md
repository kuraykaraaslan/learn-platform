# 404. Spring Boot: ResponseEntity and Standard Response Records

## What It Is
Every Spring Boot controller method in this stack returns `ResponseEntity<T>` with an explicit HTTP status — never a bare object relying on Spring's implicit 200, and never a raw `Map<String, Object>` standing in for a typed shape. This is the direct parallel to Express's `res.status(...).json(...)` and Next.js's `NextResponse.json(..., { status })`: all three conventions exist for the same reason, to make the status code a visible, reviewable part of the code rather than something Spring, Express, or Next.js infers on your behalf.

Response bodies are Java records living in each module's `response/` package, not entities and not ad-hoc maps. Three shapes cover almost every case: `MessageResponse` for a bare acknowledgement (`{ "message": "..." }`), `PageResponse<T>` for a single resource plus optional metadata, and `PaginatedResponse<T>` for a list with cursor/count metadata. Records are immutable, require no boilerplate getters, and each one carries a static `from()` or `of()` factory that does the entity-to-response projection in one place — this is the same discipline as the response DTO mapping enforced at the JPA layer, and it means a controller or service can never accidentally leak a full entity onto the wire.

The rule that unifies all of this: nothing wraps a success payload in an extra `{ "success": true, "data": ... }` envelope, and nothing returns `ResponseEntity.ok(null)` — a 204 with `noContent().build()` is always the correct shape for "succeeded, nothing to return." Consistency here is what lets a frontend team write one response-parsing helper across the Express, Next.js, and Spring Boot backends without a special case for any of them.

## Key Concepts
- **`ResponseEntity<T>` with explicit status**: `ResponseEntity.ok(data)` (200), `ResponseEntity.status(HttpStatus.CREATED).body(data)` (201), `ResponseEntity.noContent().build()` (204) — always the `HttpStatus` enum, never a magic number
- **`MessageResponse`**: `public record MessageResponse(String message) {}` — for bare acknowledgements, parallel to `{ message: "..." }` in Express/Next.js
- **`PageResponse<T>`**: single resource plus optional message, built via a static `of()` factory
- **`PaginatedResponse<T>`**: `items`, `totalCount`, `page`, `pageSize`, `hasNextPage` — computed via a static `of()` factory that derives `hasNextPage` from the count
- **Entity → response mapping**: every response record has a static `from(Entity)` factory; controllers and services never construct the record field-by-field inline
- **No entity leakage**: `@Entity` objects never cross the controller boundary — always project to a response record first
- **No `success` envelope**: the HTTP status code is the signal for success/failure; wrapping payloads in `{ success: true, data }` is forbidden as unnecessary nesting
- **Async responses**: `CompletableFuture<ResponseEntity<T>>` follows the identical shape rules — the future wrapper doesn't change what's inside it

## Example Code
```java
// modules/order/response/OrderResponse.java
public record OrderResponse(
    UUID orderId,
    String status,
    BigDecimal total,
    Instant createdAt
) {
    public static OrderResponse from(OrderEntity entity) {
        return new OrderResponse(
            entity.getOrderId(),
            entity.getStatus().name(),
            entity.getTotal(),
            entity.getCreatedAt()
        );
    }
}

// modules/shared/response/PaginatedResponse.java
public record PaginatedResponse<T>(
    List<T> items,
    long totalCount,
    int page,
    int pageSize,
    boolean hasNextPage
) {
    public static <T> PaginatedResponse<T> of(List<T> items, long totalCount, int page, int pageSize) {
        boolean hasNext = (long) page * pageSize < totalCount;
        return new PaginatedResponse<>(items, totalCount, page, pageSize, hasNext);
    }
}

// modules/shared/response/MessageResponse.java
public record MessageResponse(String message) {}

// modules/order/service/OrderService.java (excerpt)
@Transactional(readOnly = true)
public PaginatedResponse<OrderResponse> listOrders(UUID tenantId, int page, int pageSize) {
    Pageable pageable = PageRequest.of(page, pageSize, Sort.by("createdAt").descending());
    Page<OrderEntity> result = orderRepository.findByTenantId(tenantId, pageable);

    List<OrderResponse> items = result.getContent().stream().map(OrderResponse::from).toList();
    return PaginatedResponse.of(items, result.getTotalElements(), page, pageSize);
}

// modules/order/controller/OrderController.java
@RestController
@RequestMapping("/api/v1/tenant/{tenantId}/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<PaginatedResponse<OrderResponse>> list(
        @PathVariable UUID tenantId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int pageSize
    ) {
        return ResponseEntity.ok(orderService.listOrders(tenantId, page, pageSize));
    }

    @DeleteMapping("/{orderId}")
    public ResponseEntity<Void> cancel(@PathVariable UUID tenantId, @PathVariable UUID orderId) {
        orderService.cancel(tenantId, orderId);
        return ResponseEntity.noContent().build();   // 204 — succeeded, nothing to return
    }

    @PostMapping("/{orderId}/refund")
    public ResponseEntity<MessageResponse> refund(@PathVariable UUID tenantId, @PathVariable UUID orderId) {
        orderService.refund(tenantId, orderId);
        return ResponseEntity.ok(new MessageResponse(OrderMessages.REFUND_ISSUED));
    }
}
```

## When to Use
- Defining any new controller endpoint — decide the exact `HttpStatus` up front rather than letting Spring default to 200
- Returning a list — always reach for `PaginatedResponse<T>` rather than a bare `List<T>`, even if pagination isn't wired up yet, so the shape doesn't change later
- Returning a bare success acknowledgement (logout, delete-confirmed) — use `MessageResponse`, not a hand-rolled map
- Mapping any entity to the wire — add a static `from()` factory on the response record rather than constructing the record inline at each call site

## Common Mistakes
- **Returning the entity directly** (`ResponseEntity.ok(userEntity)`) — exposes internal fields like password hashes and foreign keys that were never meant to leave the service layer.
- **`ResponseEntity.ok(null)`** — a 200 with a null body is ambiguous; use `ResponseEntity.noContent().build()` (204) when there is genuinely nothing to return.
- **Wrapping every response in `{ "success": true, "data": ... }`** — the HTTP status code already communicates success/failure; this envelope is unnecessary nesting that every client then has to unwrap.
- **Using `Map<String, Object>` instead of a record** — loses compile-time safety and IDE support; define a record even for a two-field response.
- **Mapping logic scattered across services instead of centralized in the record's factory** — leads to two services producing slightly different shapes of the "same" response.

## Further Reading
- Spring `ResponseEntity` Javadoc: https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/ResponseEntity.html
- Java Records (JEP 395): https://openjdk.org/jeps/395
- Google JSON Style Guide: https://google.github.io/styleguide/jsoncstyleguide.xml
