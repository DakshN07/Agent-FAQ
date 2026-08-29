// Jest CJS stub for the ESM-only @langchain/core/messages module.
class BaseMessage {
  constructor(content) {
    this.content = content;
  }
}
class SystemMessage extends BaseMessage {}
class HumanMessage extends BaseMessage {}
class AIMessage extends BaseMessage {}

module.exports = { BaseMessage, SystemMessage, HumanMessage, AIMessage };
