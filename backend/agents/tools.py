from langchain_core.tools import tool

@tool
def create_jira_ticket(title: str, description: str) -> str:
    """Creates a Jira ticket for bug reports or feature requests."""
    # Mock implementation for now
    ticket_id = "PROJ-1234"
    return f"Successfully created Jira ticket {ticket_id}: {title}"

@tool
def send_slack_message(channel: str, message: str) -> str:
    """Sends a message to a specific Slack channel."""
    # Mock implementation
    return f"Successfully sent message to {channel}."

@tool
def search_github_issues(query: str) -> str:
    """Searches open GitHub issues based on a query."""
    # Mock implementation
    return f"Found 2 open issues matching '{query}': #42 Database Error, #45 API Timeout."

TOOLS = [create_jira_ticket, send_slack_message, search_github_issues]
