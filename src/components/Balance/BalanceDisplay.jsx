import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { useAuth } from '../../contexts/AuthContext';
import { BalanceCalculator } from '../../utils/BalanceCalculator';

export default function BalanceDisplay({ group, expenses }) {
  const [memberProfiles, setMemberProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [balanceData, setBalanceData] = useState(null);
  const { user } = useAuth();

  // Fetch member profiles
  useEffect(() => {
    const fetchMemberProfiles = async () => {
      try {
        if (!group?.members) {
          setLoading(false);
          return;
        }

        const profiles = {};
        for (const memberId of Object.keys(group.members)) {
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
        setLoading(false);
      } catch (error) {
        console.error('Error fetching member profiles:', error);
        setLoading(false);
      }
    };

    fetchMemberProfiles();
  }, [group?.members]);

  // Calculate balances
  useEffect(() => {
    if (!loading && group?.members) {
      const data = BalanceCalculator.calculateBalances(expenses || [], group.members);
      setBalanceData(data);
    }
  }, [loading, expenses, group?.members]);

  if (loading || !balanceData) {
    return (
      <div className="animate-pulse">
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  const formatAmount = (amount) => {
    return `$${Math.abs(amount).toFixed(2)}`;
  };

  const getDisplayName = (memberId) => {
    return memberId === user.uid ? 'You' : (memberProfiles[memberId]?.name || 'Unknown User');
  };

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Balance Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Total Expenses</p>
            <p className="text-2xl font-semibold text-gray-900">
              ${balanceData.totalExpenses.toFixed(2)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Settlement Status</p>
            <p className="text-lg font-medium">
              {balanceData.summary.isSettled ? (
                <span className="text-green-600">All Settled</span>
              ) : (
                <span className="text-yellow-600">Pending Settlements</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Individual Balances */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Individual Balances</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {Object.entries(balanceData.individualBalances).map(([memberId, balance]) => (
            <li key={memberId} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-800 font-medium">
                      {(memberProfiles[memberId]?.name?.[0] || '?').toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {getDisplayName(memberId)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {memberProfiles[memberId]?.email || 'No email available'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className={`text-sm font-medium ${
                    balance > 0 
                      ? 'text-green-600' 
                      : balance < 0 
                        ? 'text-red-600' 
                        : 'text-gray-500'
                  }`}>
                    {balance === 0 
                      ? 'Settled'
                      : balance > 0
                        ? `Gets back ${formatAmount(balance)}`
                        : `Owes ${formatAmount(balance)}`}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Total spent: ${balanceData.totalSpentByMember[memberId]?.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Settlement Suggestions */}
      {!balanceData.summary.isSettled && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Detailed Settlements</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {balanceData.settlements.map((settlement, index) => (
              <li key={index} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{getDisplayName(settlement.from)}</span>
                      {' owes '}
                      <span className="font-medium">{getDisplayName(settlement.to)}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {memberProfiles[settlement.from]?.email} → {memberProfiles[settlement.to]?.email}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-primary-600 ml-4">
                    {formatAmount(settlement.amount)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 