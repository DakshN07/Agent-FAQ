from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from .state import GraphState

class VerificationSchema(BaseModel):
    is_supported: bool = Field(description="True if the retrieved documents support answering the query, False otherwise.")
    score: float = Field(description="Confidence score between 0.0 and 1.0.")

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
verifier = llm.with_structured_output(VerificationSchema)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are the Verification module. Your job is to check if the retrieved documents contain sufficient information to answer the user's query. "
               "Output whether the information is supported and provide a confidence score."),
    ("user", "Query: {query}\n\nRetrieved Documents:\n{documents}")
])

def verification_node(state: GraphState) -> GraphState:
    query = state["messages"][-1].content
    docs = state.get("retrieved_documents", [])
    
    if not docs:
        return {"verification_score": 0.0}
    
    docs_text = "\n\n".join([f"Title: {d['title']}\nContent: {d['content']}" for d in docs])
    
    chain = prompt | verifier
    result = chain.invoke({"query": query, "documents": docs_text})
    
    return {"verification_score": result.score}
