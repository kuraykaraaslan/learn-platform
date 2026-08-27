# 412. Spring Boot: Testing with MockMvc, @WebMvcTest, and TestContainers

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Code_Structure_Rules_SpringBoot material to build out the Framework Deep Dives course; no existing coverage data for your own practice.

## What It Is
Spring Boot's test stack splits into two deliberately different layers, and picking the right one for a given test is the first decision to make. `@SpringBootTest` combined with `@AutoConfigureMockMvc` and a real TestContainers Postgres instance boots the *entire* application context — Security filter chain, controller, service, repository, real database — and drives it through MockMvc exactly the way the Express/Supertest lessons drive a route through a real HTTP request: no mocked repository, because a mocked repository only proves the mock behaves as told, not that the query works against real constraints and cascades. `@WebMvcTest`, by contrast, loads only the web layer for a single controller, mocks the service with `@MockitoBean`, and skips Security and the database entirely — it's fast, narrow, and exists specifically to test controller-level concerns (request mapping, validation wiring, response shape) in isolation from everything below it.

The minimum coverage bar per controller method is identical to the Express convention already covered in this course: a validation-error case (malformed input → 400 with the field-error array), an auth-error case (missing/invalid cookie → 401), and a happy path (valid input plus valid auth → the expected 2xx body). Forbidden (403) and not-found (404) cases are added wherever the route has meaningful branches for them.

Authenticating in a full integration test means minting a real session the same way the Express tests do — log in through the actual `/auth/login` endpoint via MockMvc and extract the real `accessToken` cookie from the response, rather than injecting a fake principal. `@WithMockUser` is the one deliberate exception to this rule: it creates a mock `Authentication` directly in the `SecurityContextHolder`, bypassing the JWT filter entirely, and is appropriate *only* inside `@WebMvcTest` slice tests where the JWT pipeline itself isn't what's being tested.

## Key Concepts
- **`@SpringBootTest` + `@AutoConfigureMockMvc` + TestContainers**: full integration — Security, controller, service, real Postgres — the default for testing an endpoint end-to-end
- **`@WebMvcTest(Controller.class)` + `@MockitoBean`**: web-layer-only slice test — no Security, no database, service is mocked; fast and narrow, for controller-specific concerns
- **`@MockitoBean` replaces `@MockBean`/`@SpyBean`**: those were deprecated in Spring Boot 3.4 and removed in Spring Boot 4 — always use `org.springframework.test.context.bean.override.mockito.MockitoBean` in new code
- **Real login for auth in full integration tests**: log in through the actual `/auth/login` endpoint via MockMvc, extract the real cookie — no fake principal, mirroring the Express `createTestUserAndLogin` helper
- **`@WithMockUser` — slice-test-only exception**: bypasses the JWT filter by injecting a mock `Authentication` directly; correct only in `@WebMvcTest`, wrong in a full integration test
- **Minimum coverage per method**: validation error (400), auth error (401), happy path (2xx) — with forbidden (403) and not-found (404) recommended wherever the route branches on them
- **TestContainers, never H2**: `@Container @ServiceConnection PostgreSQLContainer<?>` gives every test run a real, disposable Postgres instance with real Flyway migrations applied
- **`@AfterEach` surgical cleanup**: delete only the rows a test created (`userRepository.deleteByEmail(...)`), never truncate shared tables that other parallel test classes may depend on

## Example Code
```java
// modules/auth/tests/AuthControllerIntegrationTest.java — full integration, real DB, real Security
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class AuthControllerIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @AfterEach
    void tearDown() {
        userRepository.deleteByEmail("test@example.com");   // surgical — only this test's row
    }

    @Test
    void login_shouldReturn400_whenEmailInvalid() throws Exception {
        var request = new LoginRequest("not-an-email", "password123");

        mockMvc.perform(post("/api/v1/system/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").isArray())
            .andExpect(jsonPath("$.message[0].field").value("email"));
    }

    @Test
    void login_shouldReturn401_whenWrongPassword() throws Exception {
        userRepository.save(UserEntity.builder()
            .email("test@example.com")
            .password(passwordEncoder.encode("correctpassword"))
            .build());

        var request = new LoginRequest("test@example.com", "wrongpassword");

        mockMvc.perform(post("/api/v1/system/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value(AuthMessages.INVALID_EMAIL_OR_PASSWORD));
    }

    @Test
    void login_shouldReturn200AndSetCookie_whenValidCredentials() throws Exception {
        userRepository.save(UserEntity.builder()
            .email("test@example.com")
            .password(passwordEncoder.encode("correctpassword"))
            .build());

        mockMvc.perform(post("/api/v1/system/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginRequest("test@example.com", "correctpassword"))))
            .andExpect(status().isOk())
            .andExpect(cookie().exists("accessToken"))
            .andExpect(cookie().httpOnly("accessToken", true));
    }
}

// modules/auth/tests/AuthControllerTest.java — @WebMvcTest slice: no DB, no real Security, mocked service
@WebMvcTest(AuthController.class)
class AuthControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean   // Spring Boot 3.4+; @MockBean is removed in Spring Boot 4
    private AuthService authService;

    @Test
    @WithMockUser   // bypasses the JWT filter — acceptable ONLY in a slice test
    void getMe_shouldReturn200_whenAuthenticated() throws Exception {
        var userResponse = new UserResponse(UUID.randomUUID(), "test@example.com", "USER", "ACTIVE", Instant.now());
        when(authService.getMe(any())).thenReturn(userResponse);

        mockMvc.perform(get("/api/v1/system/auth/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("test@example.com"));
    }

    @Test
    void getMe_shouldReturn401_whenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/system/auth/me"))
            .andExpect(status().isUnauthorized());
    }
}
```

## When to Use
- Testing any new controller endpoint end-to-end — default to `@SpringBootTest` + `@AutoConfigureMockMvc` + TestContainers, and cover the validation/auth/happy-path minimum before considering it "tested"
- Testing controller-specific behavior in isolation (request mapping, a validation annotation, a response shape) without needing the whole app context — reach for `@WebMvcTest` with `@MockitoBean` on the service
- Writing an authenticated integration test — log in through the real endpoint and extract the real cookie, exactly as the Express Supertest lessons do
- Upgrading a codebase still using `@MockBean`/`@SpyBean` — replace with `@MockitoBean`; the old annotations are removed entirely in Spring Boot 4

## Common Mistakes
- **Using `@WithMockUser` inside a full `@SpringBootTest`** — this bypasses the real JWT filter, meaning the test no longer proves the auth pipeline actually works; reserve `@WithMockUser` for `@WebMvcTest` slices.
- **Mocking the repository in a full integration test** — defeats the purpose of `@SpringBootTest`; if the repository needs mocking, the test should be a `@WebMvcTest` or a plain Mockito unit test instead.
- **Testing against H2 in-memory** — misses Postgres-specific behavior (types, constraints, functions) that TestContainers' real Postgres instance would catch.
- **Truncating shared tables in `@AfterEach`** — breaks other test classes running in parallel against the same TestContainers instance; delete only the specific rows this test created.
- **Still using `@MockBean`/`@SpyBean` in new code** — both are deprecated as of Spring Boot 3.4 and removed in Spring Boot 4; use `@MockitoBean` going forward.

## Further Reading
- Spring Boot reference — "Testing": https://docs.spring.io/spring-boot/reference/testing/index.html
- Testcontainers — "Spring Boot integration": https://testcontainers.com/guides/testing-spring-boot-rest-api-using-testcontainers/
- Spring Framework Javadoc — `MockitoBean`: https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/test/context/bean/override/mockito/MockitoBean.html
