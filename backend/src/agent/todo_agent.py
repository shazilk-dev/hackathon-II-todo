# Task: T012, T036-T043
"""
Todo Assistant Agent using OpenAI Agents SDK.

This agent handles natural language todo management through MCP tools.
"""

import logging

from agents import Agent, Runner
from openai import AuthenticationError, RateLimitError

from src.agent.agent_tools import ALL_TOOLS, get_tool_call_log, reset_tool_call_log

# Configure logging
logger = logging.getLogger(__name__)

# Agent instructions (T036-T040)
AGENT_INSTRUCTIONS = """
You are a friendly and helpful Todo Assistant. Your job is to help users manage
their todo list through natural conversation.

## Your Capabilities:
- **Add new tasks** to the user's list
- **Show tasks** (all, pending, or completed)
- **Mark tasks as complete**
- **Delete tasks**
- **Update task titles or descriptions**

## When to Use Each Tool:
- **add_task**: When user wants to create/add/remember something as a task
- **list_tasks**: When user asks to see/show/view their tasks
  - Use status="all" for all tasks
  - Use status="pending" for incomplete tasks only
  - Use status="completed" for finished tasks only
- **complete_task**: When user says done/finished/complete a task
- **update_task**: When user wants to change/update/edit/rename a task
- **delete_task**: When user wants to delete/remove/cancel a task

## Response Style Guidelines:
- Be friendly, warm, and conversational
- Keep responses concise but informative
- Use checkmark emoji (✅) for successful actions
- Use cross emoji (❌) for errors or failures
- Format task lists clearly with numbers:
  1. [✓] Task title (completed)
  2. [ ] Task title (pending)

## Error Handling:
- If a tool returns an error, explain it clearly and helpfully to the user
- Suggest corrective actions when errors occur
- Example: "I couldn't find task 5. Would you like to see your current tasks?"

## Clarification Requests:
- If user's request is ambiguous, ask for clarification politely
- Example: "I'm not sure which task you mean. Could you provide the task number?"
- Never guess or make assumptions about user intent

## Important Rules:
1. The user_id will be provided in the context - use it for all tool operations
2. Always use the tools to perform actions - don't just say you did something
3. If you need a task ID and don't have it, list tasks first to find it
4. Never make up task IDs or fake results
5. When listing tasks, always call list_tasks to get fresh data
6. After successful actions, confirm what was done:
   - "✅ Task added!"
   - "✅ Marked 'Buy groceries' as complete!"
   - "✅ Task deleted!"
"""


def create_todo_agent() -> Agent:
    """
    Create and return the Todo Assistant agent.

    Returns:
        Configured Agent instance with tools and instructions
    """
    return Agent(
        name="Todo Assistant", instructions=AGENT_INSTRUCTIONS, tools=ALL_TOOLS, model="gpt-4o-mini"
    )


def run_agent(
    agent: Agent, user_id: str, message: str, conversation_history: list[dict] | None = None
) -> dict:
    """
    Run the agent with a user message and conversation history.

    Args:
        agent: The Todo Assistant agent
        user_id: The user's unique identifier
        message: The user's current message
        conversation_history: Previous messages in the conversation

    Returns:
        Dictionary containing:
        - response: Agent's natural language response
        - tool_calls: List of tools invoked with args and results
    """
    # Build the full message with user context embedded
    context_message = f"[User ID: {user_id}]\n\n{message}"

    # Build messages array
    messages = []
    if conversation_history:
        for msg in conversation_history:
            messages.append({"role": msg["role"], "content": msg["content"]})

    # Add current user message
    messages.append({"role": "user", "content": context_message})

    try:
        # Reset tool call log before each run so we get a clean slate
        reset_tool_call_log()

        # Run the agent synchronously
        result = Runner.run_sync(agent, messages)

        # Retrieve tool calls recorded by the wrapper functions
        tool_calls = get_tool_call_log()

        return {"response": result.final_output, "tool_calls": tool_calls}

    except RateLimitError as e:
        error_detail = str(e)
        if "insufficient_quota" in error_detail:
            logger.error(f"OpenAI quota exceeded: {e}")
            return {
                "response": "The AI service quota has been exceeded. Please add credits at https://platform.openai.com/account/billing to continue.",
                "tool_calls": [],
            }
        logger.error(f"OpenAI rate limit: {e}")
        return {
            "response": "The AI service is temporarily rate-limited. Please wait a moment and try again.",
            "tool_calls": [],
        }

    except AuthenticationError as e:
        logger.error(f"OpenAI auth error: {e}")
        return {
            "response": "The AI service authentication failed. Please check the OpenAI API key configuration.",
            "tool_calls": [],
        }

    except Exception as e:
        logger.error(f"Agent processing error: {e}", exc_info=True)
        return {
            "response": "I encountered an issue processing your request. Please try again.",
            "tool_calls": [],
        }


async def run_agent_async(
    agent: Agent, user_id: str, message: str, conversation_history: list[dict] | None = None
) -> dict:
    """
    Async version of run_agent for FastAPI endpoints.

    Args:
        agent: The Todo Assistant agent
        user_id: The user's unique identifier
        message: The user's current message
        conversation_history: Previous messages in the conversation

    Returns:
        Dictionary containing response and tool_calls
    """
    # Build the full message with user context
    context_message = f"[User ID: {user_id}]\n\n{message}"

    # Build messages array
    messages = []
    if conversation_history:
        for msg in conversation_history:
            messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": context_message})

    try:
        # Reset tool call log before each run so we get a clean slate
        reset_tool_call_log()

        # Run agent asynchronously
        result = await Runner.run(agent, messages)

        # Retrieve tool calls recorded by the wrapper functions
        tool_calls = get_tool_call_log()

        return {"response": result.final_output, "tool_calls": tool_calls}

    except RateLimitError as e:
        error_detail = str(e)
        if "insufficient_quota" in error_detail:
            logger.error(f"OpenAI quota exceeded: {e}")
            return {
                "response": "The AI service quota has been exceeded. Please add credits at https://platform.openai.com/account/billing to continue.",
                "tool_calls": [],
            }
        logger.error(f"OpenAI rate limit: {e}")
        return {
            "response": "The AI service is temporarily rate-limited. Please wait a moment and try again.",
            "tool_calls": [],
        }

    except AuthenticationError as e:
        logger.error(f"OpenAI auth error: {e}")
        return {
            "response": "The AI service authentication failed. Please check the OpenAI API key configuration.",
            "tool_calls": [],
        }

    except Exception as e:
        logger.error(f"Agent processing error: {e}", exc_info=True)
        return {
            "response": "I encountered an issue processing your request. Please try again.",
            "tool_calls": [],
        }
