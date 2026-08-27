# 405. Spring Boot: Bean Validation with @Valid, @Validated, and Custom Constraints

## What It Is
Spring Boot's answer to Zod's `safeParse` is Jakarta Bean Validation (JSR-380): request DTOs are Java records annotated field-by-field with constraint annotations (`@NotBlank`, `@Email`, `@Size`, `@Positive`, and friends), and `@Valid` on the controller's `@RequestBody` parameter tells Spring to run the validation engine before the method body executes. There is no manual `if (x == null)` boundary checking anywhere in this stack — every constraint the client's input must satisfy is declared as an annotation, and a failure throws `MethodArgumentNotValidException` automatically, which flows to the `@ControllerAdvice` for a uniform 400 response. This is functionally identical in spirit to `Schema.safeParse(req.body)` in Express, just declarative instead of imperative.

Two annotations do different jobs and are easy to confuse. `@Valid` triggers validation of a single object graph — including nested `@Valid` fields for recursive validation of nested DTOs. `@Validated`, applied at the class level, is what enables Spring AOP to validate individual method parameters (like a bare `@NotNull UUID userId` path variable) or to activate validation groups. Without `@Validated` on the class, a `@Valid` or `@NotNull` on a plain method parameter silently does nothing — this is one of the most common "the validation just doesn't fire" bugs in a new Spring Boot codebase.

For validation logic that can't be expressed as a static annotation — checking an email against the database for uniqueness, for example — a custom `@Constraint` annotation paired with a `ConstraintValidator` implementation lets that check live at the same declarative boundary as everything else, instead of leaking into the service as a manual `if` check. The validator is a `@Component` so it can be constructor-injected with whatever repository it needs to check against.

## Key Concepts
- **`@Valid @RequestBody`**: triggers Bean Validation on the whole object graph before the controller method body runs; failure throws `MethodArgumentNotValidException`
- **Constraint annotations with explicit messages**: `@NotBlank(message = "...")`, `@Email`, `@Size(min, max)`, `@Positive`, `@Pattern` — always with an explicit, user-facing `message`, never the framework default
- **`@Validated` at the class level**: required to enable method-level validation via Spring AOP — validates bare `@NotNull`/`@Valid` parameters (e.g. path variables) and activates validation groups; has no effect on its own without it
- **Nested object validation**: a `@Valid` on a nested field (including `List<@Valid X>`) triggers recursive validation of that nested DTO
- **Validation groups**: marker interfaces (`OnCreate`, `OnUpdate`) let one request record serve create and update with different required fields, activated via `@Validated(OnCreate.class)`
- **Custom `@Constraint`**: a `@Component`-annotated `ConstraintValidator` for checks that need a dependency (e.g. a repository) — keeps DB-backed validation at the same declarative boundary as everything else
- **`ConstraintViolationException` vs `MethodArgumentNotValidException`**: the former comes from a `@Validated` service/path-variable failure, the latter from a `@RequestBody` failure — both are caught by `@ControllerAdvice` and produce the same 400 shape
- **`BindingResult` is banned in REST controllers**: adding it as a parameter stops Spring from throwing automatically, forcing manual error handling that bypasses the uniform `@ControllerAdvice` path

## Example Code
```java
// modules/user/request/RegisterRequest.java
public record RegisterRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @UniqueEmail(message = "Email already registered")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 72, message = "Password must be 8-72 characters")
    String password,

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 50)
    String name
) {}

// libs/validation/UniqueEmail.java — custom constraint annotation
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = UniqueEmailValidator.class)
public @interface UniqueEmail {
    String message() default "Email already registered";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

// libs/validation/UniqueEmailValidator.java — @Component so the repository can be injected
@Component
@RequiredArgsConstructor
public class UniqueEmailValidator implements ConstraintValidator<UniqueEmail, String> {

    private final UserRepository userRepository;

    @Override
    public boolean isValid(String email, ConstraintValidatorContext context) {
        if (email == null) return true; // let @NotBlank own the null case
        return !userRepository.existsByEmailIgnoreCase(email);
    }
}

// modules/user/controller/UserController.java
@RestController
@RequestMapping("/api/v1/system/users")
@RequiredArgsConstructor
@Validated   // required for @PathVariable / @RequestParam constraints below
public class UserController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        // @Valid already ran Bean Validation, including @UniqueEmail — no manual checks needed here
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUser(@PathVariable @NotNull UUID userId) {
        // @NotNull only fires because the class carries @Validated
        return ResponseEntity.ok(userService.getById(userId));
    }
}

// Validation groups — same record serving create and update with different requirements
public interface OnCreate {}

public record ProductRequest(
    @NotBlank(groups = OnCreate.class) String name,
    @Positive @NotNull(groups = OnCreate.class) BigDecimal price
) {}

@PostMapping
public ResponseEntity<ProductResponse> create(@Validated(OnCreate.class) @RequestBody ProductRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(request));
}
```

## When to Use
- Writing any request DTO — reach for a Bean Validation annotation first; only fall back to a custom `@Constraint` when the check needs a dependency the annotation system can't express
- Validating a `@PathVariable` or `@RequestParam` directly — remember to add `@Validated` at the controller class level or the constraint silently does nothing
- The same request shape needs different required fields for create vs. update — use validation groups before reaching for two near-duplicate request records
- A validation rule needs to hit the database (uniqueness, existence) — write a `@Component` `ConstraintValidator` rather than a manual check inside the service

## Common Mistakes
- **Adding `BindingResult` as a controller parameter** — this stops Spring from throwing `MethodArgumentNotValidException` automatically, forcing a manual check that bypasses the shared `@ControllerAdvice` error path. Acceptable only in server-rendered form flows, never in a REST API.
- **Forgetting `@Validated` at the class level** — a bare `@NotNull UUID userId` path-variable parameter is silently unvalidated without it; this is the most common "why isn't validation firing" bug.
- **Manual null/blank checks in the service** (`if (request.email() == null) throw ...`) — this duplicates what Bean Validation already guarantees ran before the method body executed; if a manual check feels necessary, the constraint annotation is missing from the DTO.
- **Omitting explicit `message()` on constraints** — the framework default ("must not be blank") is not written for end users; always supply a message meant to be read by a human.
- **Reaching for validation groups when the fields genuinely differ** — groups add complexity; if create and update request shapes have little in common, two separate records are clearer than one record split by groups.

## Further Reading
- Jakarta Bean Validation specification: https://jakarta.ee/specifications/bean-validation/3.0/
- Spring — "Validation, Data Binding, and Type Conversion": https://docs.spring.io/spring-framework/reference/core/validation.html
- Hibernate Validator (reference implementation) docs: https://hibernate.org/validator/documentation/
