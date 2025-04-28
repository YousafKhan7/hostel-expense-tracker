import { useState } from 'react';
import { doc, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { useAuth } from '../../contexts/AuthContext';

const TEXT = {
  TITLE: 'Adjust Balance',
  AMOUNT: 'Amount',
  COMMENT: 'Comment',
  TYPE: 'Type',
  MEMBER: 'Member',
  ADD: 'Add',
  DEDUCT: 'Deduct',
  SUBMIT: 'Submit Adjustment',
  CANCEL: 'Cancel',
  REQUIRED: 'This field is required',
  INVALID_AMOUNT: 'Please enter a valid amount',
  SUCCESS: 'Balance adjusted successfully',
};

export default function BalanceAdjustment({ group, onClose, onSuccess }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [type, setType] = useState('ADD');
  const [memberId, setMemberId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isAdmin = group?.members[user.uid]?.role === 'admin';

  const validateForm = () => {
    if (!amount || isNaN(amount) || amount <= 0) {
      setError(TEXT.INVALID_AMOUNT);
      return false;
    }
    if (!comment.trim()) {
      setError(TEXT.REQUIRED);
      return false;
    }
    if (!memberId) {
      setError(TEXT.REQUIRED);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // Create adjustment record
      const adjustmentRef = await addDoc(collection(db, 'adjustments'), {
        groupId: group.id,
        memberId,
        adminId: user.uid,
        amount: Number(amount),
        type,
        comment,
        createdAt: serverTimestamp()
      });

      // Update member's balance in group
      const groupRef = doc(db, 'groups', group.id);
      const balanceChange = type === 'ADD' ? Number(amount) : -Number(amount);
      
      await updateDoc(groupRef, {
        [`members.${memberId}.balance`]: (group.members[memberId]?.balance || 0) + balanceChange,
        [`members.${memberId}.lastAdjustment`]: serverTimestamp()
      });

      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">{TEXT.TITLE}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {TEXT.MEMBER}
          </label>
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select member</option>
            {Object.entries(group.members)
              .filter(([id]) => id !== user.uid)
              .map(([id, member]) => (
                <option key={id} value={id}>
                  {member.name || id}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {TEXT.TYPE}
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="ADD">{TEXT.ADD}</option>
            <option value="DEDUCT">{TEXT.DEDUCT}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {TEXT.AMOUNT}
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {TEXT.COMMENT}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-2 border rounded"
            rows="3"
            required
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            {TEXT.CANCEL}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : TEXT.SUBMIT}
          </button>
        </div>
      </form>
    </div>
  );
}