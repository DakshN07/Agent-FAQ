from langgraph.graph import StateGraph, END
from .state import GraphState
from .query_understanding import query_understanding_node
from .retrieval import retrieval_node
from .verification import verification_node
from .summarization import summarization_node
from .action import action_node

def route_query(state: GraphState) -> str:
    intent = state.get("current_intent")
    if intent == "faq_retrieval":
        return "retrieval"
    elif intent == "action_required":
        return "action" # To be implemented in Phase 4
    else:
        return "general_chat"

def general_chat_node(state: GraphState) -> GraphState:
    from langchain_openai import ChatOpenAI
    from langchain_core.messages import HumanMessage
    
    llm = ChatOpenAI(model="gpt-4o-mini")
    response = llm.invoke(state["messages"])
    return {"final_answer": response.content}

# Build graph
workflow = StateGraph(GraphState)

workflow.add_node("understanding", query_understanding_node)
workflow.add_node("retrieval", retrieval_node)
workflow.add_node("verification", verification_node)
workflow.add_node("summarization", summarization_node)
workflow.add_node("general_chat", general_chat_node)
workflow.add_node("action", action_node)

workflow.set_entry_point("understanding")

workflow.add_conditional_edges(
    "understanding",
    route_query,
    {
        "retrieval": "retrieval",
        "action": "action",
        "general_chat": "general_chat"
    }
)

workflow.add_edge("retrieval", "verification")
workflow.add_edge("verification", "summarization")
workflow.add_edge("summarization", END)
workflow.add_edge("action", END)
workflow.add_edge("general_chat", END)

app = workflow.compile()
