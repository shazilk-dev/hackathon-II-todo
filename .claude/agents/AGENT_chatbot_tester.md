---
name: chatbot-tester
description: Tests AI chatbot functionality including natural language understanding, tool invocation, conversation flow, and error handling. Generates test scripts and validates responses.
model: claude-sonnet-4-20250514
tools: Read, Bash, Write
---

# Chatbot Tester Subagent

## Purpose

Test AI chatbot functionality for Phase III. Validate natural language processing, tool invocation, conversation persistence, and error handling. Generate test scripts and analyze responses.

## Test Categories

### 1. Natural Language Understanding

Test that the chatbot correctly interprets user intent:

| User Input | Expected Intent | Expected Tool |
|------------|-----------------|---------------|
| "Add a task to buy groceries" | Create task | add_task |
| "I need to remember to call mom" | Create task | add_task |
| "Show me my tasks" | List tasks | list_tasks |
| "What's on my list?" | List tasks | list_tasks |
| "What's pending?" | List pending | list_tasks(status="pending") |
| "Mark task 3 as done" | Complete task | complete_task |
| "I finished task 1" | Complete task | complete_task |
| "Delete the meeting task" | Delete task | delete_task |
| "Remove task 2" | Delete task | delete_task |
| "Change task 1 to 'Call mom tonight'" | Update task | update_task |
| "Rename task 2" | Update task | update_task |

### 2. Tool Invocation Tests

Verify correct tool calls with proper parameters:

```bash
# Test add_task
curl -X POST "http://localhost:8000/api/testuser/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add a task to buy groceries"}'

# Expected response includes:
# - tool_calls: [{"tool": "add_task", "args": {"user_id": "testuser", "title": "Buy groceries"}}]
# - response: Contains confirmation message
```

### 3. Conversation Flow Tests

Test multi-turn conversations:

```
Turn 1: "Add task to buy groceries"
→ Expected: Task created confirmation

Turn 2: "Add another task to call mom"  
→ Expected: Second task created, same conversation_id

Turn 3: "Show me my tasks"
→ Expected: Both tasks listed

Turn 4: "Mark the first one as done"
→ Expected: Buy groceries marked complete
```

### 4. Error Handling Tests

| Scenario | Input | Expected Behavior |
|----------|-------|-------------------|
| Invalid task ID | "Complete task 9999" | Friendly error message |
| Missing task | "Delete task 999" | Task not found message |
| Ambiguous request | "Delete it" | Ask for clarification |
| Empty message | "" | Ask what user needs |

## Test Commands

### Quick Functional Test

```bash
# Set environment
export API_URL="http://localhost:8000"
export USER_ID="testuser123"
export TOKEN="your-jwt-token"

# Test 1: Add task
echo "Test 1: Add task"
curl -s -X POST "$API_URL/api/$USER_ID/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add a task to test the chatbot"}' | jq .

# Test 2: List tasks
echo "Test 2: List tasks"
curl -s -X POST "$API_URL/api/$USER_ID/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me all my tasks"}' | jq .

# Test 3: Complete task
echo "Test 3: Complete task"
curl -s -X POST "$API_URL/api/$USER_ID/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Mark task 1 as complete"}' | jq .
```

### Full Test Suite

```python
"""
Chatbot Integration Test Suite
Run: pytest tests/test_chatbot_integration.py -v
"""

import pytest
import httpx
from typing import Optional

API_URL = "http://localhost:8000"
USER_ID = "test_user_123"


class TestChatbot:
    """Integration tests for AI chatbot."""
    
    token: Optional[str] = None
    conversation_id: Optional[int] = None
    
    @pytest.fixture(autouse=True)
    def setup(self, auth_token):
        """Setup test with auth token."""
        self.token = auth_token
        self.conversation_id = None
    
    def chat(self, message: str) -> dict:
        """Send chat message and return response."""
        response = httpx.post(
            f"{API_URL}/api/{USER_ID}/chat",
            headers={
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            },
            json={
                "conversation_id": self.conversation_id,
                "message": message
            }
        )
        assert response.status_code == 200
        data = response.json()
        self.conversation_id = data.get("conversation_id")
        return data
    
    # === Add Task Tests ===
    
    def test_add_task_explicit(self):
        """Test adding task with explicit command."""
        result = self.chat("Add a task to buy groceries")
        
        assert "response" in result
        assert any(tc["tool"] == "add_task" for tc in result.get("tool_calls", []))
        assert "groceries" in result["response"].lower() or "created" in result["response"].lower()
    
    def test_add_task_implicit(self):
        """Test adding task with implicit language."""
        result = self.chat("I need to remember to call mom tomorrow")
        
        assert any(tc["tool"] == "add_task" for tc in result.get("tool_calls", []))
    
    def test_add_task_with_description(self):
        """Test adding task with description."""
        result = self.chat("Add task: Buy groceries - milk, eggs, bread")
        
        tool_calls = result.get("tool_calls", [])
        add_call = next((tc for tc in tool_calls if tc["tool"] == "add_task"), None)
        assert add_call is not None
    
    # === List Tasks Tests ===
    
    def test_list_all_tasks(self):
        """Test listing all tasks."""
        result = self.chat("Show me all my tasks")
        
        assert any(tc["tool"] == "list_tasks" for tc in result.get("tool_calls", []))
    
    def test_list_pending_tasks(self):
        """Test listing pending tasks."""
        result = self.chat("What's pending?")
        
        tool_calls = result.get("tool_calls", [])
        list_call = next((tc for tc in tool_calls if tc["tool"] == "list_tasks"), None)
        assert list_call is not None
        assert list_call.get("args", {}).get("status") == "pending"
    
    def test_list_completed_tasks(self):
        """Test listing completed tasks."""
        result = self.chat("What have I completed?")
        
        tool_calls = result.get("tool_calls", [])
        list_call = next((tc for tc in tool_calls if tc["tool"] == "list_tasks"), None)
        assert list_call is not None
        assert list_call.get("args", {}).get("status") == "completed"
    
    # === Complete Task Tests ===
    
    def test_complete_task_by_id(self):
        """Test completing task by ID."""
        # First add a task
        self.chat("Add task: Test task")
        
        # Then complete it
        result = self.chat("Mark task 1 as complete")
        
        assert any(tc["tool"] == "complete_task" for tc in result.get("tool_calls", []))
    
    def test_complete_task_natural_language(self):
        """Test completing task with natural language."""
        result = self.chat("I finished the grocery task")
        
        # Should either complete or ask for clarification
        assert "response" in result
    
    # === Delete Task Tests ===
    
    def test_delete_task_by_id(self):
        """Test deleting task by ID."""
        result = self.chat("Delete task 1")
        
        assert any(tc["tool"] == "delete_task" for tc in result.get("tool_calls", []))
    
    def test_delete_task_natural_language(self):
        """Test deleting with natural language."""
        result = self.chat("Remove the meeting task")
        
        # May list first to find task, then delete
        assert "response" in result
    
    # === Update Task Tests ===
    
    def test_update_task_title(self):
        """Test updating task title."""
        # Add task first
        self.chat("Add task: Original title")
        
        result = self.chat("Change task 1 to 'Updated title'")
        
        assert any(tc["tool"] == "update_task" for tc in result.get("tool_calls", []))
    
    # === Conversation Tests ===
    
    def test_conversation_persistence(self):
        """Test that conversation persists."""
        # First message creates conversation
        result1 = self.chat("Add task: Test persistence")
        conv_id = result1["conversation_id"]
        
        # Second message uses same conversation
        result2 = self.chat("Show my tasks")
        
        assert result2["conversation_id"] == conv_id
    
    def test_multi_turn_conversation(self):
        """Test multi-turn conversation flow."""
        # Turn 1: Add task
        self.chat("Add task to buy milk")
        
        # Turn 2: Add another
        self.chat("Also add task to buy eggs")
        
        # Turn 3: List should show both
        result = self.chat("Show all tasks")
        
        # Response should mention both tasks
        response = result["response"].lower()
        assert "milk" in response or "egg" in response or len(result.get("tool_calls", [])) > 0
    
    # === Error Handling Tests ===
    
    def test_invalid_task_id(self):
        """Test handling of invalid task ID."""
        result = self.chat("Complete task 99999")
        
        # Should handle gracefully
        assert "response" in result
        response = result["response"].lower()
        assert "not found" in response or "error" in response or "couldn't find" in response
    
    def test_ambiguous_request(self):
        """Test handling of ambiguous request."""
        result = self.chat("Delete it")
        
        # Should ask for clarification or list tasks
        assert "response" in result
    
    # === Response Quality Tests ===
    
    def test_response_is_friendly(self):
        """Test that responses are friendly."""
        result = self.chat("Add a task to test friendliness")
        
        response = result["response"]
        # Should not be robotic/technical
        assert len(response) > 10
        assert not response.startswith("{")  # Not raw JSON
    
    def test_response_confirms_action(self):
        """Test that responses confirm actions."""
        result = self.chat("Add task: Confirmation test")
        
        response = result["response"].lower()
        # Should confirm the action
        assert any(word in response for word in ["added", "created", "done", "✅", "task"])
```

## Test Report Format

### Summary Report

```markdown
# Chatbot Test Report

**Date:** [Date]
**Environment:** [Dev/Staging/Prod]
**Base URL:** http://localhost:8000

## Overall Results

| Category | Passed | Failed | Skipped |
|----------|--------|--------|---------|
| Natural Language | 8/10 | 2 | 0 |
| Tool Invocation | 5/5 | 0 | 0 |
| Conversation Flow | 3/3 | 0 | 0 |
| Error Handling | 4/4 | 0 | 0 |
| **Total** | **20/22** | **2** | **0** |

## Status: ⚠️ PASSED WITH ISSUES

### Failed Tests

#### 1. test_list_completed_tasks
- **Expected:** list_tasks called with status="completed"
- **Actual:** list_tasks called with status="all"
- **Issue:** Agent doesn't recognize "What have I completed?"

#### 2. test_complete_task_natural_language
- **Expected:** Complete the grocery task
- **Actual:** Asked for task ID
- **Issue:** Agent doesn't match task by name

### Recommendations

1. Improve agent instructions for "completed" queries
2. Add task matching by name/partial title
3. Consider adding fuzzy matching for task identification
```

### Detailed Test Log

```markdown
## Test Log

### Test: test_add_task_explicit
**Status:** ✅ PASSED
**Duration:** 1.2s

**Request:**
```json
{
  "message": "Add a task to buy groceries"
}
```

**Response:**
```json
{
  "conversation_id": 1,
  "response": "✅ I've added 'Buy groceries' to your task list!",
  "tool_calls": [
    {
      "tool": "add_task",
      "args": {"user_id": "testuser", "title": "Buy groceries"},
      "result": {"task_id": 1, "status": "created", "title": "Buy groceries"}
    }
  ]
}
```

**Assertions:**
- ✅ Response contains confirmation
- ✅ add_task tool was called
- ✅ Task title matches
```

## Usage Examples

### Run Quick Test

```
@chatbot-tester

Run quick functional test against http://localhost:8000
User: testuser123
Token: [from auth]

Test:
1. Add task
2. List tasks
3. Complete task
4. Delete task

Report results.
```

### Generate Test Script

```
@chatbot-tester

Generate bash test script for Phase III chatbot.

Include:
- Authentication setup
- All 5 tool operations
- Conversation persistence test
- Error handling tests

Output to: backend/tests/scripts/test_chatbot.sh
```

### Full Integration Test

```
@chatbot-tester

Run full integration test suite.

Environment:
- API: http://localhost:8000
- User: Create test user
- Cleanup: Delete test data after

Generate detailed report with:
- Pass/fail for each test
- Response times
- Tool call accuracy
- Recommendations for improvement
```

### Pre-Demo Validation

```
@chatbot-tester

Validate chatbot is ready for 90-second demo.

Demo flow to test:
1. "Add a task to buy groceries" → Task created
2. "Show me my tasks" → Tasks listed
3. "Mark task 1 as complete" → Completed
4. "What have I completed?" → Shows completed
5. "Delete the groceries task" → Deleted

Verify all steps work and responses are demo-ready.
```

## Integration with Spec-Kit Plus

### Validate Against Spec

```
/sp.validate

Invoke @chatbot-tester to validate implementation against:
- @specs/features/ai-chatbot.md
- @specs/features/mcp-tools.md

Test all natural language examples from spec.
```

### Pre-Submission Testing

```
Before submission, run:

@chatbot-tester Full integration test
@chatbot-tester Demo flow validation
@chatbot-tester Error handling verification

All tests must pass before submission.
```
