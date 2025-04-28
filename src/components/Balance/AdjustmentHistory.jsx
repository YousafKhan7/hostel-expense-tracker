import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { formatDate } from '../../utils/dateUtils';

export default function AdjustmentHistory({ group }) {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, ADD, DEDUCT

  useEffect(() => {
    fetchAdjustments();
  }, [group.id]);

  const fetchAdjustments = async () => {
    try {
      setLoading(true);
      const adjustmentQuery = query(
        collection(db, 'adjustments'),
        where('groupId', '==', group.id),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(adjustmentQuery);
      const adjustmentData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));

      setAdjustments(adjustmentData);
      setError('');
    } catch (err) {
      setError('Failed to load adjustment history');
      console.error('Error fetching adjustments:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAdjustments = adjustments.filter(adj => 
    filter === 'ALL' || adj.type === filter
  );

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Adjustment History
        </h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="ALL">All Adjustments</option>
          <option value="ADD">Additions</option>
          <option value="DEDUCT">Deductions</option>
        </select>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {filteredAdjustments.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          No adjustments found
        </p>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Date
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Member
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Type
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Amount
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Comment
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Admin
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredAdjustments.map((adjustment) => (
                <tr key={adjustment.id}>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatDate(adjustment.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                    {group.members[adjustment.memberId]?.name || adjustment.memberId}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      adjustment.type === 'ADD' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {adjustment.type === 'ADD' ? 'Addition' : 'Deduction'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                    ${adjustment.amount.toFixed(2)}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {adjustment.comment}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                    {group.members[adjustment.adminId]?.name || adjustment.adminId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}