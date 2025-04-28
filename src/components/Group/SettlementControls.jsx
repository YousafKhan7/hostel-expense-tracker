import { useState } from 'react';
import { doc, addDoc, collection, serverTimestamp, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { useAuth } from '../../contexts/AuthContext';

const TEXT = {
  TITLE: 'Settlement Controls',
  MEMBER: 'Select Member',
  AMOUNT: 'Settlement Amount',
  COMMENT: 'Settlement Note',
  CONFIRM: 'Confirm Settlement',
  CANCEL: 'Cancel',
  LOADING: 'Processing...',
  INVALID_AMOUNT: 'Invalid settlement amount',
  BALANCE_MISMATCH: 'Amount exceeds current balance',
  SUCCESS: 'Settlement recorded successfully',
};

export default function SettlementControls({ group, onClose, onSuccess }) {
  const { user } = useAuth();
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isAdmin = group?.members[user.uid]?.role === 'admin';
  const memberBalance = memberId ? (group.members[memberId]?.balance || 0) : 0;

  const validateSettlement = () => {
    if (!amount || isNaN(amount) || amount <= 0) {
      setError(TEXT.INVALID_AMOUNT);
      return false;
    }
    if (Number(amount) > Math.abs(memberBalance)) {
      setError(TEXT.BALANCE_MISMATCH);
      return false;
    }
    return true;
  };

  const handleSettlement = async (e) => {
    e.preventDefault();
    if (!isAdmin || !validateSettlement()) return;

    setLoading(true);
    setError('');

    try {
      await runTransaction(db, async (transaction) => {
        // Create settlement record
        const settlementRef = doc(collection(db, 'settlements'));
        transaction.set(settlementRef, {
          groupId: group.id,
          memberId,
          adminId: user.uid,
          amount: Number(amount),
          comment,
          createdAt: serverTimestamp(),
          balanceBefore: memberBalance
        });

        // Update member's balance
        const groupRef = doc(db, 'groups', group.id);
        const newBalance = memberBalance > 0 
          ? memberBalance - Number(amount)
          : memberBalance + Number(amount);

        transaction.update(groupRef, {
          [`members.${memberId}.balance`]: newBalance,
          [`members.${memberId}.lastSettlement`]: serverTimestamp()
        });

        // Create adjustment record
        const adjustmentRef = doc(collection(db, 'adjustments'));
        transaction.set(adjustmentRef, {
          groupId: group.id,
          memberId,
          adminId: user.uid,
          amount: Number(amount),
          type: memberBalance > 0 ? 'DEDUCT' : 'ADD',
          comment: `Settlement: ${comment}`,
          createdAt: serverTimestamp(),
          isSettlement: true
        });
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

      <form onSubmit={handleSettlement} className="space-y-4">
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
              .filter(([id, member]) => id !== user.uid && member.balance !== 0)
              .map(([id, member]) => (
                <option key={id} value={id}>
                  {member.name || id} (Balance: ${member.balance})
                </option>
              ))}
          </select>
        </div>

        {memberId && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">
                {TEXT.AMOUNT}
              </label>
              <input
                type="number"
                min="0"
                max={Math.abs(memberBalance)}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Current balance: ${memberBalance}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {TEXT.COMMENT}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-2 border rounded"
                rows="2"
                required
              />
            </div>
          </>
        )}

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
            disabled={loading || !memberId}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? TEXT.LOADING : TEXT.CONFIRM}
          </button>
        </div>
      </form>
    </div>
  );
}