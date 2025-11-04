import React from 'react';

function FAQTable({ faqs, onEdit, onDelete }) {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <h2 className="text-xl font-semibold p-4 border-b">📜 All FAQs</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 w-1/3 font-medium text-gray-600">Question</th>
              <th className="p-4 w-1/2 font-medium text-gray-600">Answer</th>
              <th className="p-4 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {faqs.map((faq) => (
              <tr key={faq._id} className="border-b hover:bg-gray-50">
                <td className="p-4 align-top">{faq.question}</td>
                <td className="p-4 align-top text-gray-700">{faq.answer}</td>
                <td className="p-4 align-top">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(faq)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(faq._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {faqs.length === 0 && <p className="p-4 text-gray-500">No FAQs found. Add one above to get started!</p>}
    </div>
  );
}

export default FAQTable;
