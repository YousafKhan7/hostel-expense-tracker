import { useState } from 'react';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { useAuth } from '../../contexts/AuthContext';

export default function SettlementControls({ group, onClose }) {
  const { user } = useAuth();
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const membersWithBalance = Object.entries(group.members)
    .filter(([_, member]) => member.balance !== 0)
    .sort((a, b) => Math.abs(b[1].balance) - Math.abs(a[1].balance));

  const handleMemberToggle = (memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSettlement = async () => {
    if (selectedMembers.length === 0) return;
    
    setProcessing(true);
    setError('');

    try {
      await runTransaction(db, async (transaction) => {
        const groupRef = doc(db, 'groups', group.id);
        const updatedMembers = { ...group.members };
        
        // Reset balances for selected members
        selectedMembers.forEach(memberId => {
          const previousBalance = updatedMembers[memberId].balance;
          updatedMembers[memberId] = {
            ...updatedMembers[memberId],
            balance: 0,
            lastSettlement: serverTimestamp()
          };

          // Create settlement record
          const settlementRef = doc(db, 'settlements');
          transaction.set(settlementRef, {
            groupId: group.id,
            memberId,
            adminId: user.uid,
            amount: previousBalance,
            createdAt: serverTimestamp()
          });
        });

        // Update group members
        transaction.update(groupRef, { members: updatedMembers });
      });

      onClose();
    } catch (err) {
      setError('Failed to process settlement');
      console.error('Settlement error:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">
        Settlement Controls
      </h3>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {membersWithBalance.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          No outstanding balances to settle
        </p>
      ) : (
        <div className="space-y-4">
          <div className="divide-y divide-gray-200">
            {membersWithBalance.map(([memberId, member]) => (
              <div key={memberId} className="py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(memberId)}
                    onChange={() => handleMemberToggle(memberId)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">
                      {member.name || memberId}
                    </span>
                    <span className={`block text-sm ${
                      member.balance > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      Balance: ${Math.abs(member.balance).toFixed(2)}
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSettlement}
              disabled={processing || selectedMembers.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Mark as Settled'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}