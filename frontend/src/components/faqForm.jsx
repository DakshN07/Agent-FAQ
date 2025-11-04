import React, { useState, useEffect } from "react";

function FAQForm({ onAdd, onUpdate, editingFaq, onCancelEdit }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    if (editingFaq) {
      setQuestion(editingFaq.question);
      setAnswer(editingFaq.answer);
    } else {
      setQuestion("");
      setAnswer("");
    }
  }, [editingFaq]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question && answer) {
      if (editingFaq) {
        onUpdate({ question, answer });
      } else {
        onAdd({ question, answer });
      }
      setQuestion("");
      setAnswer("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-xl font-semibold mb-4">{editingFaq ? '✏️ Edit FAQ' : '➕ Add New FAQ'}</h2>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Enter the question"
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <textarea
          placeholder="Enter the answer"
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          rows="4"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
      </div>
      <div className="flex justify-end mt-4 space-x-2">
        {editingFaq && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {editingFaq ? 'Update FAQ' : 'Add FAQ'}
        </button>
      </div>
    </form>
  );
}

export default FAQForm;
