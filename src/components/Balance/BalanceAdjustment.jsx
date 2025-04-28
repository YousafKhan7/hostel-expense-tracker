import { useState } from 'react';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { useAuth } from '../../contexts/AuthContext';

export default function BalanceAdjustment({ group, onClose }) {
  const { user } = useAuth();
  const [selectedMember, setSelectedMember] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('ADD');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember || !amount || !comment) return;
    
    setProcessing(true);
    setError('');

    try {
      await runTransaction(db, async (transaction) => {
        const memberBalance = group.members[selectedMember]?.balance || 0;
        const adjustmentAmount = Number(amount);
        
        // Calculate new balance
        const newBalance = type === 'ADD' 
          ? memberBalance + adjustmentAmount
          : memberBalance - adjustmentAmount;

        // Update member's balance
        const groupRef = doc(db, 'groups', group.id);
        transaction.update(groupRef, {
          [`members.${selectedMember}.balance`]: newBalance,
          [`members.${selectedMember}.lastAdjustment`]: serverTimestamp()
        });

        // Create adjustment record
        const adjustmentRef = doc(db, 'adjustments');
        transaction.set(adjustmentRef, {
          groupId: group.id,
          memberId: selectedMember,
          adminId: user.uid,
          amount: adjustmentAmount,
          type,
          comment,
          createdAt: serverTimestamp()
        });
      });

      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Select Member
        </label>
        <select
          value={selectedMember}
          onChange={(e) => setSelectedMember(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="">Choose member</option>
          {Object.entries(group?.members || {})
            .filter(([id]) => id !== user.uid)
            .map(([id, member]) => (
              <option key={id} value={id}>
                {member.name || id}
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Adjustment Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="ADD">Add to Balance</option>
          <option value="DEDUCT">Deduct from Balance</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Amount
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Comment
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={processing}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
        >
          {processing ? 'Processing...' : 'Submit Adjustment'}
        </button>
      </div>
    </form>
  );
}