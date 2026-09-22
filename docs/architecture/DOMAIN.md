# Domain Model

## Ubiquitous language
| Term | Precise meaning | Avoid / confused with |
|---|---|---|
| | | |

## Bounded contexts / modules
| Context | Responsibility | Owns | Does not own |
|---|---|---|---|
| | | | |

## Entities

### <Entity>
**Identity:**

**Responsibilities:**
-

**State:**
-

**Invariants:**
- Things that must always be true.

**Allowed transitions:**
```text
STATE_A -> STATE_B
STATE_B -> STATE_C | STATE_D
```

**Forbidden transitions:**
-

**Ownership/tenant rules:**
-

## Domain services
Document logic that spans entities but remains business-domain logic.

## Domain events
| Event | Trigger | Producer | Consumers | Delivery expectation |
|---|---|---|---|---|
| | | | | |

## Cross-context contracts
-
