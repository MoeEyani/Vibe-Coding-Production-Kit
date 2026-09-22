# User Flows

For every critical journey document not only the happy path, but also loading, empty, partial, validation, permission, timeout, retry, offline (if relevant), and unexpected-error states.

## Flow: <name>

**Actor:**

**Entry points:**

**Preconditions:**

```mermaid
flowchart TD
    A[Start] --> B[Action]
    B --> C{Valid?}
    C -- Yes --> D[Success]
    C -- No --> E[Recoverable error]
```

### Screen/state inventory
| State | What user sees | Allowed actions | Backend dependency |
|---|---|---|---|
| Loading | | | |
| Empty | | | |
| Ready | | | |
| Validation error | | | |
| Forbidden | | | |
| Failure | | | |
| Success | | | |

### Edge cases
-

### Accessibility notes
-

### Analytics/audit events
-
