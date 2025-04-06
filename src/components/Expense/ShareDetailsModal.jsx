import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { formatAmount } from '../../utils/ExpenseSchema';
import Modal from '../Common/Modal';

export default function ShareDetailsModal({
  isOpen,
  onClose,
  expense,
  members,
  currentUserId
}) {
  const [memberProfiles, setMemberProfiles] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemberProfiles = async () => {
      if (!expense || !members) return;
      
      try {
        const profiles = {};
        const memberIds = Object.keys(expense.shares || {});
        
        for (const memberId of memberIds) {
          const userDoc = await getDoc(doc(db, 'users', memberId));
          if (userDoc.exists()) {
            profiles[memberId] = userDoc.data();
          } else {
            profiles[memberId] = { 
              name: 'Unknown User',
              email: 'No email available'
            };
          }
        }
        setMemberProfiles(profiles);
      } catch (error) {
        console.error('Error fetching member profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchMemberProfiles();
    }
  }, [expense, members, isOpen]);

  if (!expense || !members) return null;

  const {
    description,
    amount,
    paidBy,
    shares,
    splitType,
    expenseDate
  } = expense;

  const paidByProfile = memberProfiles[paidBy] || members[paidBy] || { name: 'Unknown User', email: 'No email available' };
  const formattedDate = new Date(expenseDate).toLocaleDateString();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Expense Details"
    >
      <div className="space-y-6">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ) : (
          <>
            {/* Expense Header */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                {description}
              </h3>
              <p className="text-sm text-gray-500">
                {formattedDate}
              </p>
            </div>

            {/* Total Amount */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Total Amount</span>
                <span className="text-lg font-semibold text-gray-900">
                  ${formatAmount(amount)}
                </span>
              </div>
            </div>

            {/* Paid By */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Paid by</h4>
              <div className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-gray-200">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-800">
                    {(paidByProfile.name?.[0] || '?').toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {paidBy === currentUserId ? 'You' : paidByProfile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {paidByProfile.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Shares List */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700">Split Details</h4>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {splitType.toUpperCase()}
                </span>
              </div>
              <div className="bg-white rounded-lg border border-gray-200">
                <ul className="divide-y divide-gray-200">
                  {Object.entries(shares).map(([userId, shareAmount]) => {
                    const profile = memberProfiles[userId] || members[userId] || {};
                    return (
                      <li key={userId} className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-800">
                                {(profile.name?.[0] || '?').toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {userId === currentUserId ? 'You' : profile.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {profile.email}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            ${formatAmount(shareAmount)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={onClose}
                className="w-full btn btn-secondary"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
} 