<!--
Sync Impact Report - Constitution Update
========================================
Version: 0.0.0 → 1.0.0
Rationale: Initial constitution creation for Hackathon II Todo Console App

Principles Added:
- I. Technology Stack
- II. Architecture Constraints
- III. Code Quality Standards
- IV. Testing Requirements
- V. Spec-Driven Development Workflow

Sections Added:
- Development Workflow (SDD mandatory sequence)
- Quality Gates
- Governance

Templates Requiring Updates:
✅ plan-template.md - Constitution Check section aligns with defined gates
✅ spec-template.md - Requirements align with SDD workflow
✅ tasks-template.md - Task format aligns with ID referencing requirement

Follow-up TODOs:
- None (all placeholders filled)
-->

# Hackathon II - Todo Console App Constitution

## Core Principles

### I. Technology Stack (NON-NEGOTIABLE)

- **Python Version**: Python 3.13+ required for all code
- **Package Management**: UV for dependency management and virtual environments
- **Dependencies**: Standard library only - no third-party runtime dependencies allowed
- **Testing Framework**: pytest is the only permitted testing dependency

**Rationale**: Minimalist approach ensures maximum portability, reduces attack surface, eliminates dependency hell, and forces mastery of Python's powerful standard library capabilities. UV provides fast, reliable package management without adding runtime complexity.

### II. Architecture Constraints

- **Single Module Design**: All application code MUST reside in one Python module
- **Core Data Model**: Task dataclass for representing todo items with type safety
- **Task Management**: TaskManager class handles all CRUD operations and business logic
- **No Over-Engineering**: Simplest solution that works - YAGNI principles strictly enforced
- **No Premature Abstraction**: Three instances before extracting a pattern

**Rationale**: Single module keeps cognitive load low for hackathon pace, enables rapid iteration, prevents premature abstraction, and makes the entire codebase graspable in one reading. This constraint forces clarity of design and eliminates architectural bikeshedding.

### III. Code Quality Standards (NON-NEGOTIABLE)

- **Type Hints**: Required on ALL function signatures (parameters + return types)
- **Docstrings**: Required on all public methods and classes (Google style preferred)
- **Private Methods**: No docstrings required for underscore-prefixed (`_method`) methods
- **Type Checking**: Code MUST pass static type checking (mypy or equivalent)
- **Naming**: Clear, descriptive names; avoid abbreviations except standard ones (id, db, etc.)

**Rationale**: Type hints provide self-documentation, enable IDE intelligence, and catch type errors at development time rather than runtime. Docstrings ensure API clarity for future maintainers. Type checking enforcement prevents an entire class of bugs before code execution.

### IV. Testing Requirements

- **Framework**: pytest for all tests - no other testing libraries allowed
- **Coverage Minimum**: 80% code coverage required for main application module
- **Test Structure**: Tests in `tests/` directory, mirroring module structure
- **Test Naming**: `test_<functionality>.py` convention for files, `test_<method>_<scenario>` for functions
- **Test Independence**: Each test MUST be runnable independently (no order dependencies)
- **Red-Green-Refactor**: TDD cycle encouraged but not mandatory given hackathon pace

**Rationale**: 80% coverage balances thoroughness with hackathon time constraints while ensuring core logic is validated. pytest provides expressive, maintainable tests with excellent fixture support. Test independence ensures reliability and enables parallel execution.

### V. Spec-Driven Development Workflow (MANDATORY)

All development MUST follow this strict sequence:

1. **Specify** (`/sp.specify`): Define feature requirements in `specs/<feature>/spec.md`
2. **Plan** (`/sp.plan`): Document architecture decisions in `specs/<feature>/plan.md`
3. **Tasks** (`/sp.tasks`): Create testable task breakdown in `specs/<feature>/tasks.md`
4. **Implement** (`/sp.implement`): Write code that references Task IDs

**Non-negotiable rules**:
- **NO CODE WITHOUT TASK**: Every code change MUST correspond to a task in `tasks.md`
- **Commit Messages**: MUST reference Task ID format: `[TASK-001] Add task creation functionality`
- **File Headers**: All modified files MUST include Task ID comment at top: `# Task: TASK-001`
- **Traceability**: Requirement → Plan → Task → Code linkage MUST be maintained

**Rationale**: Spec-Driven Development ensures traceability from requirement to implementation, prevents scope creep, enables audit trail, eliminates orphaned code, and provides clear project state visibility. Task IDs create accountability and enable precise change tracking.

## Development Workflow

### Mandatory SDD Sequence

```
User Request → /sp.specify → /sp.plan → /sp.tasks → /sp.implement
```

**Flow Details**:

1. **Specify Phase**: Capture WHAT needs to be built (user stories, requirements, success criteria)
2. **Plan Phase**: Define HOW it will be built (architecture, technical approach, design decisions)
3. **Tasks Phase**: Break down INTO executable tasks (concrete, testable, independently verifiable)
4. **Implement Phase**: Execute tasks with code that references Task IDs

**Checkpoint**: Each phase MUST be complete before proceeding to next phase. No skipping allowed.

### Task Tracking

- **Task IDs**: Sequential format `TASK-001`, `TASK-002`, etc. within each feature
- **Task Status**: Tracked with checkboxes in `tasks.md`:
  - `[ ]` - Pending (not started)
  - `[>]` - In Progress (actively being worked)
  - `[x]` - Completed (done and verified)
- **Code Annotation**: All code changes MUST include Task ID reference
- **Commit Messages**: MUST include Task ID for traceability

### Prompt History Records (PHR)

Every user interaction MUST create a PHR in `history/prompts/`:

- **Constitution changes** → `history/prompts/constitution/`
- **Feature work** → `history/prompts/<feature-name>/`
- **General queries** → `history/prompts/general/`

**PHR Purpose**: Capture decision context, document why choices were made, enable learning from past interactions, provide audit trail for project evolution.

### Architecture Decision Records (ADR)

Significant architectural decisions MUST be documented in `history/adr/`.

**ADR Significance Test** (ALL must be true):
1. **Long-term impact**: Decision affects system design for extended period
2. **Multiple alternatives**: More than one viable approach was considered
3. **Cross-cutting concerns**: Decision influences multiple components or system design

**Process**: Agent suggests ADR when significance test passes. User must approve ADR creation. ADRs are NEVER auto-created.

**Suggestion Format**:
```
📋 Architectural decision detected: <brief description>
   Document reasoning and tradeoffs? Run `/sp.adr <decision-title>`
```

## Quality Gates

### Constitution Check (Pre-Planning Gate)

Before any planning work begins, verify:

- [ ] Technology stack matches constitution (Python 3.13+, UV, stdlib only)
- [ ] Architecture follows single-module constraint
- [ ] No prohibited dependencies proposed
- [ ] Scope is appropriate for hackathon (not over-engineered)

**Action**: If violations detected, STOP and either adjust plan or justify complexity.

### Pre-Commit Checks

Before any commit:

- [ ] Type checking passes (mypy or equivalent)
- [ ] All tests pass (`pytest`)
- [ ] Coverage >= 80% for modified modules
- [ ] Every modified file has Task ID reference
- [ ] Commit message includes Task ID

**Action**: If any check fails, FIX before committing. No exceptions.

### Definition of Done

A task is complete ONLY when ALL criteria met:

- [ ] Code implements task requirements as specified
- [ ] Type hints present on all public interfaces
- [ ] Docstrings present on all public methods/classes
- [ ] Tests written and passing for new/changed functionality
- [ ] Code coverage >= 80% maintained
- [ ] Task ID referenced in code and commit message
- [ ] PHR created documenting work session

**Verification**: Review checklist before marking task as `[x]` completed.

## Governance

### Constitution Authority

This constitution supersedes all other development practices and preferences. When conflicts arise between constitution rules and other guidance, constitution rules MUST be followed.

### Amendment Process

1. **Propose**: Document proposed change with clear rationale
2. **Approve**: Get explicit user approval for amendment
3. **Version**: Bump version according to semantic versioning:
   - **MAJOR** (x.0.0): Backward incompatible principle removals or redefinitions
   - **MINOR** (0.x.0): New principles/sections added or materially expanded guidance
   - **PATCH** (0.0.x): Clarifications, wording fixes, non-semantic refinements
4. **Document**: Create ADR documenting the amendment reasoning
5. **Propagate**: Update all dependent templates/scripts affected by change
6. **Sync**: Update Sync Impact Report at top of constitution file

### Compliance Verification

The SDD agent is responsible for:

- **Blocking non-compliant implementations**: Refuse to proceed if constitution violated
- **Suggesting corrections**: When violations detected, propose compliant alternatives
- **Creating PHRs**: Document all user interactions per PHR guidelines
- **Recommending ADRs**: Suggest ADRs when significance test passes

### Override Protocol

User CAN override specific constitution constraints with **explicit approval**:

1. Agent detects constitutional violation
2. Agent explains which rule is being violated and why
3. User provides explicit override approval
4. Agent documents override in PHR with justification
5. If significant, agent suggests ADR to document reasoning

**Documentation Requirement**: All overrides MUST be documented. No silent violations allowed.

### Enforcement

Constitution compliance is verified at:

- **Planning**: Constitution Check gate before design work begins
- **Task Generation**: Tasks must align with SDD workflow requirements
- **Implementation**: Pre-commit checks enforce quality gates
- **Review**: Definition of Done checklist verification before task completion

**Escalation**: If systematic violations occur, revisit constitution to determine if amendment needed or if enforcement needs strengthening.

---

**Version**: 1.0.0 | **Ratified**: 2026-01-10 | **Last Amended**: 2026-01-10
