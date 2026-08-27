# 408. Spring Boot: JWT Authentication with OncePerRequestFilter and @PreAuthorize

## What It Is
This lesson is the Spring Boot counterpart to the curried `authMiddleware("ROLE")` pattern covered earlier in the Express material — same job, different mechanism. A custom filter extending `OncePerRequestFilter` runs on every request (guaranteed exactly once, even across internal forwards), extracts the access token from an httpOnly cookie, verifies it, and — on success — populates Spring Security's `SecurityContextHolder` with a `CurrentUserDetails` object wrapped in a `UsernamePasswordAuthenticationToken`. If the token is missing or invalid, the filter simply does not set an authentication and lets the request continue; Spring Security's own `authorizeHttpRequests` rule (`.anyRequest().authenticated()`) is what actually produces the 401 for a protected route with no valid session.

`CurrentUserDetails` implements Spring Security's `UserDetails` interface and exposes the user's role as a `GrantedAuthority` prefixed with `ROLE_` — that prefix is a Spring Security convention that `hasRole("ADMIN")` checks strip off automatically, so it's added once here and never referenced again anywhere else in the code. Once the filter has populated the `SecurityContext`, two things become possible for free: `@AuthenticationPrincipal CurrentUserDetails currentUser` can be injected directly as a controller method parameter (the framework resolves it from the context), and `@PreAuthorize("hasRole('ADMIN')")` can guard a controller or service method declaratively, evaluated by the same AOP proxy mechanism that powers `@Transactional`.

The practical parallel to keep in mind: `authMiddleware("ADMIN")` in Express is one function call wrapping a route; `@PreAuthorize("hasRole('ADMIN')")` in Spring Boot is one annotation on a method. Both do the identical job — reject the request before business logic runs if the authenticated user's role doesn't match — but Spring's version can additionally be placed on a *service* method as a second enforcement layer, which has no direct Express equivalent since Express has no AOP proxy to intercept a plain function call.

## Key Concepts
- **`OncePerRequestFilter`**: guarantees exactly-once execution per request; extracts and verifies the JWT from a cookie, then populates `SecurityContextHolder`
- **Fail silently in the filter, fail loudly in `authorizeHttpRequests`**: an invalid/missing token means the filter does *not* set authentication — the actual 401 comes from Spring Security's own authorization check downstream, keeping the two concerns separate
- **`CurrentUserDetails implements UserDetails`**: wraps `userId`, `sessionId`, `email`, and role; `getAuthorities()` returns the role prefixed `ROLE_`, a Spring Security convention
- **`@AuthenticationPrincipal CurrentUserDetails currentUser`**: injects the authenticated user directly into a controller method — the equivalent of `req.user` in Express, but type-safe and resolved by the framework
- **`@PreAuthorize("hasRole('ADMIN')")`**: declarative role guard on controller *or service* methods, evaluated via the same AOP proxy as `@Transactional` — requires `@EnableMethodSecurity`
- **Route pipeline order**: rate limit filter → JWT filter (populates `SecurityContext`) → `authorizeHttpRequests` (checks it) → controller `@PreAuthorize` (if present) → service
- **`@AuthenticationPrincipal(required = false)`**: for routes with optional auth, where a null principal is expected and must be handled rather than causing a 401
- **JwtService**: a plain `@Service` wrapping `Jwts.builder()`/`Jwts.parser()` for token generation and claim extraction, configured via `@Value`-injected secret and expiration properties

## Example Code
```java
// libs/security/JwtAuthenticationFilter.java
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserSessionService userSessionService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String accessToken = extractTokenFromCookie(request, "accessToken");

        if (accessToken != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UUID userId = jwtService.extractUserId(accessToken);
                CurrentUserDetails userDetails = userSessionService.validateSession(accessToken, userId);

                var authToken = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(authToken);
            } catch (AppException e) {
                log.debug("[JwtAuthFilter] Invalid session: {}", e.getMessage());
                // do NOT set authentication — authorizeHttpRequests denies downstream
            }
        }
        chain.doFilter(request, response);
    }

    private String extractTokenFromCookie(HttpServletRequest request, String cookieName) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
            .filter(c -> cookieName.equals(c.getName()))
            .map(Cookie::getValue)
            .findFirst()
            .orElse(null);
    }
}

// libs/security/CurrentUserDetails.java
@Getter
public class CurrentUserDetails implements UserDetails {
    private final UUID userId;
    private final UUID sessionId;
    private final String email;
    private final String userRole;

    public CurrentUserDetails(UserEntity user, UserSessionEntity session) {
        this.userId = user.getUserId();
        this.sessionId = session.getSessionId();
        this.email = user.getEmail();
        this.userRole = user.getUserRole();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + userRole));   // ROLE_ prefix added exactly once
    }

    @Override public String getPassword() { return null; }
    @Override public String getUsername() { return email; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}

// modules/user/controller/UserController.java
@RestController
@RequestMapping("/api/v1/system")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/auth/me")
    public ResponseEntity<UserResponse> getMe(@AuthenticationPrincipal CurrentUserDetails currentUser) {
        return ResponseEntity.ok(userService.getById(currentUser.getUserId()));
    }

    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")   // second enforcement layer, evaluated via AOP proxy
    public ResponseEntity<PaginatedResponse<UserResponse>> listUsers(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int limit
    ) {
        return ResponseEntity.ok(userService.listUsers(page, limit));
    }
}
```

## When to Use
- Adding auth to any new Spring Boot route — reach for `@AuthenticationPrincipal CurrentUserDetails` in the controller signature rather than manually reading `SecurityContextHolder`
- Restricting a route or service method to a specific role — use `@PreAuthorize("hasRole('...')")`; put it on the service method as well as the controller when the operation is sensitive enough to warrant defense in depth
- Porting Express's `authMiddleware("ADMIN")` calls to Spring Boot — each becomes a `@PreAuthorize` annotation on the corresponding controller method
- Building a route with optional authentication — use `@AuthenticationPrincipal(required = false)` and explicitly branch on a null principal rather than assuming one is always present

## Common Mistakes
- **Throwing an exception directly from the JWT filter on an invalid token** — the filter should fail silently (log at `debug`, don't set authentication) and let `authorizeHttpRequests` produce the 401; throwing from the filter produces an inconsistent, harder-to-control error response.
- **Manually prepending `ROLE_` in a `@PreAuthorize` expression** (`hasRole('ROLE_ADMIN')`) — `hasRole()` already strips and re-adds the prefix; the correct usage is `hasRole('ADMIN')`.
- **Reading the user from `SecurityContextHolder` manually inside a controller** instead of injecting `@AuthenticationPrincipal CurrentUserDetails` — the injection is type-safe, testable, and consistent across the codebase.
- **Forgetting `@EnableMethodSecurity`** — without it on the `SecurityConfig` class, every `@PreAuthorize` annotation is silently ignored, and the route becomes accessible to any authenticated user regardless of role.
- **Putting business logic inside the JWT filter** — the filter's only job is authentication (verify token, populate context); role-based authorization decisions belong in `@PreAuthorize` or the service layer, not in filter code.

## Further Reading
- Spring Security reference — "Authentication": https://docs.spring.io/spring-security/reference/servlet/authentication/index.html
- Spring Security reference — "Method Security" (`@PreAuthorize`): https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html
- JJWT (Java JWT library) documentation: https://github.com/jwtk/jjwt
