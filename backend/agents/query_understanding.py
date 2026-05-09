from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from .state import GraphState

class IntentSchema(BaseModel):
    intent: str = Field(description="The intent of the user query. Must be one of: 'faq_retrieval', 'action_required', 'general_chat'")

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
intent_analyzer = llm.with_structured_output(IntentSchema)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are the Query Understanding module of an Enterprise Knowledge Assistant. "
               "Analyze the user's input and determine the intent. "
               "If they ask a question about company policies, knowledge, or facts, output 'faq_retrieval'. "
               "If they ask to perform an action like creating a ticket, sending an email, or triggering a workflow, output 'action_required'. "
               "Otherwise, output 'general_chat'."),
    ("user", "{query}")
])

def query_understanding_node(state: GraphState) -> GraphState:
    messages = state.get("messages", [])
    if not messages:
        return state
    
    latest_message = messages[-1].content
    
    chain = prompt | intent_analyzer
    result = chain.invoke({"query": latest_message})
    
    return {"current_intent": result.intent}
