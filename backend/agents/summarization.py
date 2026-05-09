from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from .state import GraphState

llm = ChatOpenAI(model="gpt-4o", temperature=0.2)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are the Summarization module. Answer the user's query using ONLY the retrieved documents provided. "
               "If the information is not in the documents, say you don't know based on the knowledge base. "
               "Provide citations at the end based on the document titles."),
    ("user", "Query: {query}\n\nRetrieved Documents:\n{documents}")
])

def summarization_node(state: GraphState) -> GraphState:
    query = state["messages"][-1].content
    docs = state.get("retrieved_documents", [])
    
    if state.get("verification_score", 0.0) < 0.5:
        return {"final_answer": "I'm sorry, I couldn't find a highly confident answer in the knowledge base."}
    
    docs_text = "\n\n".join([f"Title: {d['title']}\nContent: {d['content']}" for d in docs])
    
    chain = prompt | llm | StrOutputParser()
    result = chain.invoke({"query": query, "documents": docs_text})
    
    return {"final_answer": result}
