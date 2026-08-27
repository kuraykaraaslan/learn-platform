# 409. Spring Boot: Centralized Error Handling with @ControllerAdvice

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Code_Structure_Rules_SpringBoot material to build out the Framework Deep Dives course; no existing coverage data for your own practice.

## What It Is
Spring Boot's centralized error handling plays the exact same architectural role as the Express error-handling middleware covered earlier in this course: one place catches every exception thrown anywhere in the request-handling pipeline and converts it into a consistent JSON shape, so individual controllers never write inline `try/catch` blocks that craft their own error responses. The mechanism is `@RestControllerAdvice` — a single class annotated once, containing an `@ExceptionHandler` method per exception type it needs to translate. Spring intercepts any matching exception thrown from a controller, a `@Valid` validation failure, or (via propagation) a service method, and routes it to the matching handler automatically.

Four exception types cover the whole surface. `AppException` — the same domain exception concept used across every backend in this house — maps directly to whatever HTTP status code it was constructed with. `MethodArgumentNotValidException` is what Spring throws when a `@Valid @RequestBody` fails; its `BindingResult` is unpacked into a list of `{ field, message }` pairs. `ConstraintViolationException` is the equivalent failure for a `@Validated` path variable or service parameter. `HttpMessageNotReadableException` covers malformed JSON that never even reached the DTO's fields. A final catch-all `@ExceptionHandler(Exception.class)` handles anything unexpected, logs it at `error` level with the full stack trace, and returns a generic 500 message — deliberately generic, because leaking an internal exception message to the client is an information disclosure risk.

The response envelope matches the shape used across the Express and TypeScript stacks for cross-project consistency: the key is always `message`, a single string for most errors or an array of `{ field, message }` objects for validation failures, and the HTTP status code is what actually marks the response as an error — there is no `{ success: false }` wrapper. Controllers never catch these exceptions inline; the one exception to that rule is genuinely non-critical operations (writing to a cache, sending an audit log) where a caught-and-logged failure is the correct behavior precisely because the operation isn't allowed to fail the whole request.

## Key Concepts
- **`@RestControllerAdvice`**: one global class, one `@ExceptionHandler` method per exception type — the single place error-to-response translation happens
- **`AppException` → its own status code**: `@ExceptionHandler(AppException.class)` reads `ex.getStatusCode()` directly; this is the same domain exception concept as the Express/Next.js `AppError`
- **`MethodArgumentNotValidException` → 400 with field errors**: thrown automatically by `@Valid @RequestBody` failures; unpack `ex.getBindingResult().getFieldErrors()` into `{ field, message }` records
- **`ConstraintViolationException` → 400 with field errors**: the equivalent for `@Validated` path-variable/service-parameter failures — different exception type, same response shape as validation errors
- **`HttpMessageNotReadableException` → 400**: malformed JSON that never became a DTO at all; without a handler this falls through to the generic 500 and hides the real (client) cause
- **Catch-all `Exception.class` handler → 500**: logs the full exception at `error`, returns a deliberately generic message — never leak internals to the client
- **Unified envelope key is `message`**: a string for single errors, `FieldError[]` for validation — matches the shape from the Express/TypeScript ruleset for cross-stack consistency
- **`log.warn` for expected failures, `log.error` for unexpected ones**: an `AppException` for "user not found" is an expected negative path (`warn`, no stack trace); only the catch-all handler and truly unhandled exceptions get `log.error` with a stack trace

## Example Code
```java
// libs/exception/GlobalExceptionHandler.java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ErrorResponse> handleAppException(AppException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        List<FieldError> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(fe -> new FieldError(fe.getField(), fe.getDefaultMessage()))
            .toList();
        return ResponseEntity.status(400).body(new ValidationErrorResponse(errors));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ValidationErrorResponse> handleConstraintViolation(ConstraintViolationException ex) {
        List<FieldError> errors = ex.getConstraintViolations().stream()
            .map(cv -> new FieldError(cv.getPropertyPath().toString(), cv.getMessage()))
            .toList();
        return ResponseEntity.status(400).body(new ValidationErrorResponse(errors));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleMalformedBody(HttpMessageNotReadableException ex) {
        return ResponseEntity.status(400).body(new ErrorResponse("Malformed request body"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        log.error("[GlobalExceptionHandler] Unhandled exception", ex);   // full trace — internal use only
        return ResponseEntity.status(500).body(new ErrorResponse("Internal server error"));
    }
}

// libs/exception/ErrorResponse.java and friends
public record ErrorResponse(String message) {}
public record ValidationErrorResponse(List<FieldError> message) {}
public record FieldError(String field, String message) {}

// AppException — thrown from services, carries its own HTTP status
@Getter
public class AppException extends RuntimeException {
    private final int statusCode;

    public AppException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

// modules/user/service/UserService.java (excerpt) — throw, never craft a response inline
@Transactional(readOnly = true)
public UserResponse getById(UUID userId) {
    return UserResponse.from(
        userRepository.findById(userId)
            .orElseThrow(() -> {
                log.warn("[UserService][getById] User {} not found", userId);   // warn, no stack trace
                return new AppException(UserMessages.USER_NOT_FOUND, 404);
            })
    );
}

// ❌ Wrong — controller crafts its own error response, bypassing @ControllerAdvice
@GetMapping("/{userId}")
public ResponseEntity<?> getUserBroken(@PathVariable UUID userId) {
    Optional<UserEntity> user = userRepository.findById(userId);
    if (user.isEmpty()) {
        return ResponseEntity.status(404).body(Map.of("message", "User not found"));   // banned
    }
    return ResponseEntity.ok(UserResponse.from(user.get()));
}
```

## When to Use
- Any new exception type that needs a distinct HTTP status or response shape — add one `@ExceptionHandler` method to the existing `GlobalExceptionHandler`, never a per-controller `try/catch`
- A service-layer failure — always `throw new AppException(...)`, and let the exception propagate; the controller method signature stays a plain `ResponseEntity<T>`, not `ResponseEntity<?>` wrapped in a try/catch
- A genuinely non-critical side effect (cache write, audit log, notification) — this is the one place a local `try { ... } catch (Exception e) { log.warn(...) }` is correct, specifically because the operation must not fail the whole request
- Debugging a 500 that leaks no detail to the client — check the `log.error` output from the catch-all handler; the client-facing message is intentionally generic

## Common Mistakes
- **Crafting an error `ResponseEntity` inline inside a controller** — bypasses the uniform shape and logging the `@ControllerAdvice` provides; every controller method should let exceptions propagate.
- **Logging at `error` level for expected `AppException` cases** — "user not found" is a normal negative path; use `log.warn` without a stack trace in the service, and reserve `log.error` for the catch-all unexpected-exception handler.
- **Leaking the real exception message in the 500 response** — the catch-all handler must return a generic "Internal server error" string to the client while logging the real detail server-side only.
- **Missing a handler for `HttpMessageNotReadableException`** — without it, malformed JSON falls into the generic 500 handler, which misrepresents a client error (bad request) as a server error.
- **Silently swallowing an exception in a non-critical catch block** without logging — even a "safe to ignore" failure (cache write) should be logged at `warn` so it's visible if it becomes systemic.

## Further Reading
- Spring Framework reference — "Exception Handling" (`@ControllerAdvice`): https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-exceptionhandler.html
- RFC 9457 — "Problem Details for HTTP APIs" (background on structured error responses): https://www.rfc-editor.org/rfc/rfc9457
- Baeldung — "Error Handling for REST with Spring": https://www.baeldung.com/exception-handling-for-rest-with-spring
