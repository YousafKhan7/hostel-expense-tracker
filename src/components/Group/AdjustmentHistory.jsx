import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';

const TEXT = {
  TITLE: 'Balance Adjustments',
  NO_ADJUSTMENTS: 'No adjustments found',
  LOADING: 'Loading adjustments...',
  DATE: 'Date',
  MEMBER: 'Member',
  AMOUNT: 'Amount',
  COMMENT: 'Comment',
  ADMIN: 'Adjusted by',
};

export default function AdjustmentHistory({ group }) {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAdjustments = async () => {
      try {
        const q = query(
          collection(db, 'adjustments'),
          where('groupId', '==', group.id),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const adjustmentData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setAdjustments(adjustmentData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdjustments();
  }, [group.id]);

  if (loading) return <div className="p-4">{TEXT.LOADING}</div>;
  if (error) return <div className="text-red-600 p-4">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{TEXT.TITLE}</h2>

      {adjustments.length === 0 ? (
        <p className="text-gray-500">{TEXT.NO_ADJUSTMENTS}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {TEXT.DATE}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {TEXT.MEMBER}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {TEXT.AMOUNT}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {TEXT.COMMENT}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {adjustments.map(adjustment => (
                <tr key={adjustment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {adjustment.createdAt?.toDate().toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {group.members[adjustment.memberId]?.name || adjustment.memberId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={adjustment.type === 'ADD' ? 'text-green-600' : 'text-red-600'}>
                      {adjustment.type === 'ADD' ? '+' : '-'}${adjustment.amount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {adjustment.comment}
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