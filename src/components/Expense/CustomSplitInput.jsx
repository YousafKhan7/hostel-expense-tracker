import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function CustomSplitInput({ 
  members, 
  totalAmount, 
  selectedMembers, 
  onSplitChange,
  initialShares = {},
  currentUserId
}) {
  const { user } = useAuth();
  const [shares, setShares] = useState(initialShares);
  const [remainingAmount, setRemainingAmount] = useState(totalAmount);
  const [error, setError] = useState('');

  // Reset shares when members or total amount changes
  useEffect(() => {
    if (!totalAmount || !selectedMembers.length) {
      setShares({});
      setRemainingAmount(totalAmount);
      return;
    }

    // Initialize shares with existing values or zero
    const newShares = {};
    selectedMembers.forEach(memberId => {
      newShares[memberId] = shares[memberId] || 0;
    });
    setShares(newShares);

    // Calculate remaining amount
    const totalShares = Object.values(newShares).reduce((sum, share) => sum + (share || 0), 0);
    setRemainingAmount(Math.round((totalAmount - totalShares) * 100) / 100);
  }, [totalAmount, selectedMembers]);

  const handleShareChange = (memberId, value) => {
    const amount = parseFloat(value) || 0;
    const newShares = { ...shares, [memberId]: amount };
    
    // Calculate total and remaining amount
    const totalShares = Object.values(newShares).reduce((sum, share) => sum + (share || 0), 0);
    const remaining = Math.round((totalAmount - totalShares) * 100) / 100;
    
    // Validate total
    if (totalShares > totalAmount) {
      setError('Total shares cannot exceed the expense amount');
    } else {
      setError('');
    }

    setShares(newShares);
    setRemainingAmount(remaining);
    onSplitChange(newShares);
  };

  const distributeRemaining = () => {
    if (remainingAmount === 0 || selectedMembers.length === 0) return;

    const membersWithoutShare = selectedMembers.filter(id => !shares[id] || shares[id] === 0);
    if (membersWithoutShare.length === 0) return;

    const amountPerMember = Math.floor((remainingAmount / membersWithoutShare.length) * 100) / 100;
    const newShares = { ...shares };

    // Distribute evenly among members without shares
    membersWithoutShare.forEach((memberId, index) => {
      // Last member gets remaining amount to handle rounding
      if (index === membersWithoutShare.length - 1) {
        newShares[memberId] = Math.round((remainingAmount - (amountPerMember * (membersWithoutShare.length - 1))) * 100) / 100;
      } else {
        newShares[memberId] = amountPerMember;
      }
    });

    setShares(newShares);
    setRemainingAmount(0);
    onSplitChange(newShares);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-900">Custom Split</h4>
        {remainingAmount > 0 && (
          <button
            type="button"
            onClick={distributeRemaining}
            className="text-sm text-primary-600 hover:text-primary-500"
          >
            Distribute Remaining
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-2">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {selectedMembers.map(memberId => (
            <li key={memberId} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-800">
                      {(members[memberId]?.name?.[0] || '?').toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {memberId === currentUserId ? 'You' : (members[memberId]?.name || 'Unknown User')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {members[memberId]?.email || 'No email available'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={shares[memberId] || ''}
                    onChange={(e) => handleShareChange(memberId, e.target.value)}
                    className="w-24 input py-1"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-between items-center px-4 py-2 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium text-gray-500">Remaining:</span>
        <span className={`text-sm font-medium ${
          remainingAmount === 0 
            ? 'text-green-600' 
            : remainingAmount < 0 
              ? 'text-red-600' 
              : 'text-gray-900'
        }`}>
          ${remainingAmount.toFixed(2)}
        </span>
      </div>
    </div>
  );
} 