# 407. Spring Boot: Security Filter Chain, CORS, and Rate Limiting

## What It Is
Where Express builds its middleware pipeline as an explicit, ordered list of `app.use(...)` calls, Spring Security assembles an equivalent pipeline declaratively through a `SecurityFilterChain` bean — but the underlying concern is identical: every request passes through an ordered sequence of filters before it reaches a controller, and getting that order wrong produces the same class of bug in both frameworks (a route that's supposed to be protected isn't, or rate limiting fires after the expensive work it was meant to prevent). In this stack the declared order is CSRF handling, CORS, stateless session policy, security headers (the Spring Security equivalent of Express's Helmet), route-level `authorizeHttpRequests` rules, and finally two custom filters — rate limiting and JWT authentication — both inserted with `addFilterBefore` ahead of Spring's own authentication processing.

CSRF protection is deliberately disabled (`.csrf(AbstractHttpConfigurer::disable)`) because this is a stateless JWT API using httpOnly cookies with `SameSite` set — the CSRF attack this protection defends against doesn't apply the same way when there's no server-side session and the cookie's `SameSite` attribute already blocks cross-site submission. `SessionCreationPolicy.STATELESS` reinforces this: Spring never creates an `HttpSession`, because auth state lives entirely in the verified JWT, not server memory.

CORS configuration follows the same non-negotiable rule as every other framework in this house: the allowed origin comes from an environment variable, never a wildcard (which blocks credentialed requests entirely) and never a hardcoded domain. Rate limiting uses Bucket4j, keyed by client IP, with a stricter bucket for auth endpoints (10 requests/15 minutes) than for the rest of the API (100 requests/15 minutes) — the same numeric policy used in the Express rate limiter, just implemented as a token bucket algorithm instead of a sliding window.

```quiz
- q: "You set the allowed origin to `*` while debugging, and cookie auth stops working. Why?"
  anchor: "a wildcard origin silently blocks `allowCredentials(true)`, breaking cookie-based auth"
  options:
    - text: "Browsers reject cookies on any cross-origin request"
      correct: false
      why: "They do not, given a correctly configured origin. The wildcard is what disqualifies credentials."
    - text: "A wildcard origin silently blocks `allowCredentials(true)`"
      correct: true
      why: "Which is why the origin comes from `@Value(\"${CORS_ORIGIN}\")` rather than being written into the config."
    - text: "`SessionCreationPolicy.STATELESS` forbids cookies"
      correct: false
      why: "It stops Spring creating an `HttpSession`. Cookies as a transport are untouched."

- q: "This configuration disables CSRF. Should you copy that into a session-based app?"
  anchor: "this is a deliberate, documented exception, not a default to copy blindly"
  options:
    - text: "Yes — CSRF protection is legacy once you are on a modern framework"
      correct: false
      why: "It is disabled here specifically because there is no server session and cookies carry `SameSite=Strict`."
    - text: "No — it is a documented exception that depends on being stateless"
      correct: true
      why: "A session-based app is exactly the case CSRF protection exists for."
    - text: "Yes, as long as that app also sets `SameSite=Strict`"
      correct: false
      why: "SameSite is one of the two conditions. Statelessness is the other, and a session-based app fails it."

- q: "Where does rate limiting sit in the chain?"
  anchor: "rate limiting → JWT authentication → `authorizeHttpRequests` → controller"
  options:
    - text: "After JWT authentication, so limits can be applied per user"
      correct: false
      why: "Then an unauthenticated flood does full JWT verification work before being turned away."
    - text: "First — ahead of JWT authentication"
      correct: true
      why: "Registered via `addFilterBefore(filter, UsernamePasswordAuthenticationFilter.class)`, with the bucket keyed by client IP."
    - text: "In the controller, so limits can differ per endpoint"
      correct: false
      why: "Limits do differ per endpoint — 10/15min on auth against 100/15min elsewhere — and the filter still runs first."
```

## Key Concepts
- **`SecurityFilterChain` bean**: the declarative equivalent of Express's middleware chain — order matters just as much, expressed via `.addFilterBefore(...)` and the fluent `HttpSecurity` builder
- **CSRF disabled for stateless JWT**: safe here specifically because there's no server session and cookies carry `SameSite=Strict` — this is a deliberate, documented exception, not a default to copy blindly
- **`SessionCreationPolicy.STATELESS`**: Spring never creates an `HttpSession`; all auth state lives in the verified JWT
- **CORS from environment, never wildcard**: `config.setAllowedOrigins(List.of(corsOrigin))` where `corsOrigin` comes from `@Value("${CORS_ORIGIN}")` — a wildcard origin silently blocks `allowCredentials(true)`, breaking cookie-based auth
- **Security headers via `.headers(...)`**: CSP, `X-Frame-Options` (via `frameOptions(FrameOptionsConfig::deny)`), and referrer policy — the Spring Security equivalent of Helmet's defaults
- **Filter order**: rate limiting → JWT authentication → `authorizeHttpRequests` → controller — registered via `addFilterBefore(filter, UsernamePasswordAuthenticationFilter.class)`
- **Bucket4j rate limiting**: token-bucket algorithm, bucket keyed by client IP, stricter limits (10/15min) on auth endpoints than the rest of the API (100/15min)
- **`@EnableMethodSecurity`**: enables `@PreAuthorize` at the method level — the primary mechanism for role-based access on individual controller or service methods, covered in the auth-integration lesson

## Example Code
```java
// libs/security/SecurityConfig.java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity   // enables @PreAuthorize elsewhere in the codebase
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final RateLimitFilter rateLimitFilter;

    @Value("${CORS_ORIGIN}")
    private String corsOrigin;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)   // safe: stateless JWT + SameSite cookies
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp.policyDirectives(
                    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"))
                .frameOptions(FrameOptionsConfig::deny)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/api/health").permitAll()
                .requestMatchers("/api/v1/system/auth/login", "/api/v1/system/auth/register").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        var config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(corsOrigin));               // ✅ from env var — never "*"
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Content-Type", "Authorization"));
        config.setAllowCredentials(true);                            // required for httpOnly cookies

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}

// libs/security/RateLimitFilter.java — Bucket4j, keyed by IP, stricter for auth endpoints
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String ip = request.getRemoteAddr();
        boolean isAuthEndpoint = request.getRequestURI().contains("/auth/login")
            || request.getRequestURI().contains("/auth/register");

        Bucket bucket = buckets.computeIfAbsent(ip, k -> isAuthEndpoint
            ? Bucket.builder().addLimit(Bandwidth.simple(10, Duration.ofMinutes(15))).build()
            : Bucket.builder().addLimit(Bandwidth.simple(100, Duration.ofMinutes(15))).build());

        if (!bucket.tryConsume(1)) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Too many requests, please try again later.\"}");
            return;
        }

        chain.doFilter(request, response);
    }
}
```

## When to Use
- Setting up a new Spring Boot API — start from this exact filter order (CORS → session policy → headers → route rules → rate limit → JWT), because reordering it reintroduces bugs Express developers already learned to avoid
- Any endpoint that must be reachable without auth (health checks, login, register) — add it to `permitAll()` in `authorizeHttpRequests`, never bypass the filter chain with a separate unsecured `@RestController`
- Configuring CORS for a new frontend origin — add the origin to the `CORS_ORIGIN` environment variable per environment, never hardcode it or fall back to `"*"`
- Deciding auth-endpoint rate limits — mirror the numeric policy already used in the Express stack (10/15min for auth, 100/15min elsewhere) so behavior is consistent across backends

## Common Mistakes
- **Wildcard CORS origin (`List.of("*")`)** — this silently blocks `allowCredentials(true)`, which breaks httpOnly-cookie-based auth entirely; always read the origin from an environment variable.
- **Forgetting `SessionCreationPolicy.STATELESS`** — without it, Spring may create an `HttpSession` per request, which is both wasted memory and inconsistent with a JWT-only auth model.
- **Registering the JWT filter after `authorizeHttpRequests` evaluates** — filter order is enforced by `addFilterBefore` placement, not declaration order in the file; the JWT filter must run before Spring checks the `SecurityContext`.
- **Disabling CSRF without the stateless-JWT + `SameSite` cookie justification** — CSRF protection matters for session-cookie-based auth; disabling it is only safe under the specific conditions documented here, not a default to copy into a session-based app.
- **Hardcoding rate limit thresholds inline instead of as named constants** — makes the policy harder to audit and keep in sync with the Express/Next.js equivalents.

## Further Reading
- Spring Security reference — "Architecture" (filter chain): https://docs.spring.io/spring-security/reference/servlet/architecture.html
- Spring Security reference — "CORS": https://docs.spring.io/spring-security/reference/servlet/integrations/cors.html
- Bucket4j documentation: https://bucket4j.com/

```recall
- q: "What is the `SecurityFilterChain` bean, and what does `STATELESS` mean?"
  must:
    - "the declarative equivalent of Express's middleware chain, where order matters just as much"
    - "expressed via `.addFilterBefore(...)` and the fluent `HttpSecurity` builder"
    - "`SessionCreationPolicy.STATELESS` means Spring never creates an `HttpSession`, and all auth state lives in the verified JWT"

- q: "Which security headers does the chain set?"
  must:
    - "CSP"
    - "`X-Frame-Options`, via `frameOptions(FrameOptionsConfig::deny)`"
    - "referrer policy"
    - "the Spring Security equivalent of Helmet's defaults"

- q: "Describe the Bucket4j configuration."
  must:
    - "token-bucket algorithm, with the bucket keyed by client IP"
    - "10 per 15 minutes on auth endpoints"
    - "100 per 15 minutes for the rest of the API"
```
