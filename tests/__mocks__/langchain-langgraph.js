// Jest CJS stub for the ESM-only @langchain/langgraph package.
const END = '__end__';

class StateGraph {
  constructor() {
    this.nodes = {};
  }
  addNode(name, fn) {
    this.nodes[name] = fn;
    return this;
  }
  setEntryPoint() {
    return this;
  }
  addEdge() {
    return this;
  }
  addConditionalEdges() {
    return this;
  }
  compile() {
    return {
      invoke: async (state) => state,
    };
  }
}

module.exports = { StateGraph, END };
