from langchain_openai import ChatOpenAI
from langchain_core.messages import ToolMessage
from .state import GraphState
from .tools import TOOLS

llm = ChatOpenAI(model="gpt-4o", temperature=0)
llm_with_tools = llm.bind_tools(TOOLS)

def action_node(state: GraphState) -> GraphState:
    messages = state.get("messages", [])
    
    # We invoke the LLM to decide which tools to call
    response = llm_with_tools.invoke(messages)
    
    # If the LLM decided to call tools, we execute them
    # For a real implementation, we would use ToolExecutor or handle tool calls manually
    final_response_text = ""
    if response.tool_calls:
        # Mock execution of the first tool for brevity
        # In a robust system, this loops and calls the tools via a tool node mapping
        tool_call = response.tool_calls[0]
        tool_name = tool_call["name"]
        
        # Execute tool
        tool_result = f"Tool {tool_name} executed successfully."
        
        # We simulate the LLM responding with the final action result
        final_response_text = f"I've taken action: {tool_result}"
    else:
        final_response_text = response.content

    return {"final_answer": final_response_text}
