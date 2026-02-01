---
id: 0002
title: FastMCP Server Implementation Plan
stage: plan
date: 2026-01-29
surface: agent
model: claude-sonnet-4-5
feature: 004-mcp-tools
branch: 005-chat-endpoint
user: khans
command: /sp.plan
labels: ["fastmcp", "mcp-tools", "openai-agents", "architecture", "planning"]
links:
  spec: specs/004-mcp-tools/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/004-mcp-tools/plan.md
tests:
  - Plan completeness validation (Phase 0 and Phase 1 specifications complete)
---

## Prompt

```text
Create technical plan for FastMCP server implementation.

Reference specs:
- @specs/004-mcp-tools

Requirements:
- Use FastMCP (fastmcp package, not mcp.server.fastmcp)
- Implement 5 tools: add_task, list_tasks, complete_task, delete_task, update_task
- Each tool performs database operations via SQLModel
- Tools are stateless - no in-memory state
- Proper error handling and logging

Architecture:
- MCP server runs as part of FastAPI process (not separate)
- Tools imported into OpenAI Agent as function_tool
- Database operations use existing SQLModel setup

use skill from:
- @.claude/skills/fastmcp-server/SKILL.md
```

## Response snapshot

Created comprehensive implementation plan for FastMCP server with:

**Technical Approach**:
- Two-module architecture: `mcp_tools.py` (@mcp.tool decorators) and `agent_tools.py` (@function_tool wrappers)
- Synchronous sessions for tools (using existing async engine via `Session(engine)`)
- Dictionary return format with error handling (no exceptions)
- User isolation validation on all mutation operations

**Key Architectural Decisions (3 ADRs)**:
1. **ADR-001**: Use synchronous sessions for MCP tools (simpler, works with async engine)
2. **ADR-002**: Separate MCP and Agent tool layers (testability, separation of concerns)
3. **ADR-003**: Return error dicts instead of exceptions (agent-friendly error handling)

**Constitution Compliance**:
- Phase 3 AI Agent requirements: ✅ OpenAI Agents SDK, FastMCP, @mcp.tool/@function_tool decorators
- Type safety: ✅ All functions have explicit type hints
- Clean architecture: ✅ Tools layer separate from API and service
- Security: ✅ User ownership validation before mutations
- No violations identified

**Phase 0 Research Scope**:
- FastMCP sync/async patterns
- Existing codebase integration (async engine, Task model, user isolation)
- OpenAI Agents SDK tool invocation flow

**Phase 1 Design Scope**:
- Tool signatures and return formats (standard success/error schemas)
- Database session strategy (sync Session with async engine)
- User isolation and security validation patterns
- Error handling strategy (3 categories: validation, not found, database)
- MCP server configuration
- Agent wrapper layer design

**Testing Strategy**:
- 60% Unit tests (mocked database sessions)
- 30% Integration tests (real database)
- 10% Manual testing (MCP Inspector)

**Risk Mitigations**:
1. Async engine with sync sessions - integration tests + connection pool monitoring
2. Tool performance under load - <500ms p95 target + load testing
3. Error handling inconsistency - standard error format + explicit error path tests

**File Changes**:
- CREATE: `src/mcp_tools.py`, `src/agent_tools.py`
- CREATE: 3 test files (unit + integration)
- MODIFY: `requirements.txt`, `pyproject.toml` (add fastmcp>=2.14)

## Outcome

- ✅ Impact: Complete technical plan for FastMCP server ready for task generation
- 🧪 Tests: Testing strategy defined (60/30/10 split), manual MCP Inspector checklist
- 📁 Files: Created plan.md with Phase 0 and Phase 1 specifications
- 🔁 Next prompts: `/sp.tasks` to generate implementation tasks from plan
- 🧠 Reflection: Plan addresses async/sync complexity head-on with ADR-001, provides clear separation of concerns with two-module architecture, and maintains constitution compliance throughout

## Evaluation notes (flywheel)

- Failure modes observed: None - plan addresses key complexity (async engine + sync sessions) with clear decision rationale
- Graders run and results (PASS/FAIL): Constitution check - PASS (all Phase 3 AI requirements met, no violations)
- Prompt variant (if applicable): Standard /sp.plan for FastMCP integration
- Next experiment (smallest change to try): Execute /sp.tasks to generate implementation tasks, validate task granularity and acceptance criteria quality
