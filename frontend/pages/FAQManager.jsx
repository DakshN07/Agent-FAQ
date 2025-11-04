// frontend/src/pages/FAQManager.jsx
import React, { useState, useEffect } from 'react';
import FAQForm from '../components/faqForm';
import FAQTable from '../components/faqTable';
import toast from 'react-hot-toast';

const FAQManager = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingFaq, setEditingFaq] = useState(null);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://agent-faq.onrender.com/api/faqs');
      if (!response.ok) throw new Error('Failed to fetch FAQs');
      const data = await response.json();
      setFaqs(data);
    } catch (err) {
      setError('Failed to load FAQs.');
      toast.error('Failed to load FAQs.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (faq) => {
    try {
      const response = await fetch('https://agent-faq.onrender.com/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faq),
      });
      if (!response.ok) throw new Error('Failed to add FAQ');
      fetchFaqs(); // Refetch to get the latest list
      toast.success('FAQ added successfully!');
    } catch (err) {
      toast.error('Failed to add FAQ.');
    }
  };

  const handleUpdate = async (faq) => {
    try {
      const response = await fetch(`https://agent-faq.onrender.com/api/faqs/${editingFaq._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faq),
      });
      if (!response.ok) throw new Error('Failed to update FAQ');
      setEditingFaq(null);
      fetchFaqs(); // Refetch
      toast.success('FAQ updated successfully!');
    } catch (err) {
      toast.error('Failed to update FAQ.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      try {
        const response = await fetch(`https://agent-faq.onrender.com/api/faqs/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete FAQ');
        fetchFaqs(); // Refetch
        toast.success('FAQ deleted successfully!');
      } catch (err) {
        toast.error('Failed to delete FAQ.');
      }
    }
  };

  const handleEdit = (faq) => {
    setEditingFaq(faq);
  };

  const handleCancelEdit = () => {
    setEditingFaq(null);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">FAQ Management</h1>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <FAQForm
          onAdd={handleAdd}
          onUpdate={handleUpdate}
          editingFaq={editingFaq}
          onCancelEdit={handleCancelEdit}
        />
      </div>
      {loading && <p>Loading FAQs...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && (
        <FAQTable faqs={faqs} onEdit={handleEdit} onDelete={handleDelete} />
      )}
    </div>
  );
};

export default FAQManager;
