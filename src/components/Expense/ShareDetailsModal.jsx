import { formatAmount } from '../../utils/ExpenseSchema';
import Modal from '../Common/Modal';

export default function ShareDetailsModal({
  isOpen,
  onClose,
  expense,
  members,
  currentUserId
}) {
  if (!expense || !members) return null;

  const {
    description,
    amount,
    paidBy,
    shares,
    splitType,
    expenseDate
  } = expense;

  const paidByUser = members[paidBy];
  const formattedDate = new Date(expenseDate).toLocaleDateString();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Expense Details"
    >
      <div className="space-y-6">
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
                {(paidByUser?.name?.[0] || '?').toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {paidBy === currentUserId ? 'You' : (paidByUser?.name || 'Unknown User')}
              </p>
              <p className="text-xs text-gray-500">
                {paidByUser?.email || 'No email available'}
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
                const member = members[userId];
                return (
                  <li key={userId} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-800">
                            {(member?.name?.[0] || '?').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {userId === currentUserId ? 'You' : (member?.name || 'Unknown User')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {member?.email || 'No email available'}
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
      </div>
    </Modal>
  );
} 