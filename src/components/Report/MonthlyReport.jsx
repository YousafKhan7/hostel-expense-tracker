import { useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { getMonthBoundaries, formatAmount } from '../../utils/ExpenseSchema';

/**
 * Component for generating and downloading monthly expense reports
 */
export default function MonthlyReport({ 
  groupId, 
  groupName, 
  monthKey, 
  expenses, 
  members, 
  balances, 
  settlements = [] 
}) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const reportRef = useRef(null);

  // Format the month for display
  const getMonthDisplay = () => {
    const [year, month] = monthKey.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric'
    });
  };

  // Generate report filename
  const getReportFilename = () => {
    return `${groupName.replace(/\s+/g, '-').toLowerCase()}-expenses-${monthKey}.pdf`;
  };

  // Format a date for display in the report
  const formatReportDate = (date) => {
    if (!date) return 'N/A';
    
    let dateObj;
    if (typeof date === 'object' && date.seconds) {
      dateObj = new Date(date.seconds * 1000);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      dateObj = new Date(date);
    }

    if (isNaN(dateObj.getTime())) return 'Invalid Date';

    return dateObj.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate member expense summaries
  const getMemberSummaries = () => {
    const memberExpenses = {};
    
    // Initialize member data
    members && Object.keys(members).forEach(memberId => {
      memberExpenses[memberId] = { 
        paid: 0, 
        share: 0,
        name: members[memberId]?.name || 'Unknown User'
      };
    });

    // Calculate each member's paid amounts and shares
    expenses.forEach(expense => {
      // Add payer amount
      if (memberExpenses[expense.paidBy]) {
        memberExpenses[expense.paidBy].paid += parseFloat(expense.amount || 0);
      }
      
      // Add each member's share
      if (expense.shares) {
        Object.entries(expense.shares).forEach(([memberId, share]) => {
          if (memberExpenses[memberId]) {
            memberExpenses[memberId].share += parseFloat(share || 0);
          }
        });
      }
    });

    return memberExpenses;
  };

  // Generate and download the PDF report
  const generateReport = async () => {
    try {
      setGenerating(true);
      setError('');

      // Get the report HTML element
      const element = reportRef.current;
      if (!element) {
        throw new Error('Report element not found');
      }

      // Configure html2pdf options
      const options = {
        margin: [5, 5, 5, 5],
        filename: getReportFilename(),
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true 
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // Generate PDF
      await html2pdf().from(element).set(options).save();
      
      setGenerating(false);
    } catch (err) {
      console.error('Error generating report:', err);
      setError(`Failed to generate report: ${err.message}`);
      setGenerating(false);
    }
  };

  // Get sorted expenses
  const getSortedExpenses = () => {
    return [...expenses].sort((a, b) => {
      const dateA = a.expenseDate instanceof Date ? a.expenseDate : new Date(a.expenseDate?.seconds * 1000 || 0);
      const dateB = b.expenseDate instanceof Date ? b.expenseDate : new Date(b.expenseDate?.seconds * 1000 || 0);
      return dateA - dateB;
    });
  };

  // Calculate total amount
  const getTotalAmount = () => {
    return expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
  };

  // Determine balance status
  const getBalanceStatus = (balance) => {
    if (balance > 0) return { text: 'To Receive', color: 'text-green-600' };
    if (balance < 0) return { text: 'To Pay', color: 'text-red-600' };
    return { text: 'Settled', color: 'text-gray-600' };
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium text-gray-900">Monthly Report</h3>
      <p className="text-sm text-gray-500 mt-1">
        Generate a detailed expense report for {getMonthDisplay()}
      </p>
      
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
      
      <div className="mt-4">
        <button
          onClick={generateReport}
          disabled={generating || expenses.length === 0}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
          ${generating || expenses.length === 0
            ? 'bg-indigo-300 cursor-not-allowed' 
            : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
        >
          {generating ? 'Generating...' : expenses.length === 0 ? 'No Expenses to Report' : 'Generate PDF Report'}
        </button>
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        {expenses.length > 0 ? (
          <p>This will generate a PDF report with {expenses.length} expense(s) for {getMonthDisplay()}</p>
        ) : (
          <p>There are no expenses to include in the report for this month.</p>
        )}
      </div>

      {/* Hidden report template that will be converted to PDF */}
      <div className="hidden">
        <div ref={reportRef} className="p-6 bg-white" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Arial, sans-serif' }}>
          {/* Report Header */}
          <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #3366cc', paddingBottom: '10px' }}>
            <h1 style={{ fontSize: '24px', color: '#3366cc', marginBottom: '6px' }}>{groupName} - Monthly Expense Report</h1>
            <p style={{ fontSize: '14px', color: '#555' }}>Period: {getMonthDisplay()}</p>
            <p style={{ fontSize: '14px', color: '#555' }}>Generated: {new Date().toLocaleDateString()}</p>
            <p style={{ fontSize: '14px', color: '#555' }}>Total Expenses: ${formatAmount(getTotalAmount())}</p>
            <p style={{ fontSize: '14px', color: '#555' }}>Members: {Object.keys(members || {}).length}</p>
          </div>

          {/* Member Summary */}
          <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '18px', color: '#3366cc', marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Member Summary</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f5ff' }}>
                  <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'left' }}>Member</th>
                  <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>Paid</th>
                  <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>Share</th>
                  <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>Balance</th>
                  <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(getMemberSummaries()).map(([memberId, data], index) => {
                  const balance = data.paid - data.share;
                  const status = getBalanceStatus(balance);
                  let statusColor;
                  if (balance > 0) statusColor = '#007700';
                  else if (balance < 0) statusColor = '#cc0000';
                  else statusColor = '#666666';
                  
                  return (
                    <tr key={memberId} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#ffffff' }}>
                      <td style={{ border: '1px solid #ccc', padding: '6px' }}>{data.name}</td>
                      <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>${formatAmount(data.paid)}</td>
                      <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>${formatAmount(data.share)}</td>
                      <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>${formatAmount(balance)}</td>
                      <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', color: statusColor }}>{status.text}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Page Break */}
          <div style={{ pageBreakAfter: 'always' }}></div>

          {/* Expense Details */}
          <div style={{ pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '18px', color: '#3366cc', marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Expense Details</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f5ff' }}>
                  <th style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'left' }}>Date</th>
                  <th style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'left' }}>Description</th>
                  <th style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'left' }}>Paid By</th>
                  <th style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right' }}>Amount</th>
                  <th style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center' }}>Split Type</th>
                </tr>
              </thead>
              <tbody>
                {getSortedExpenses().map((expense, index) => (
                  <tr key={expense.id} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#ffffff' }}>
                    <td style={{ border: '1px solid #ccc', padding: '5px' }}>{formatReportDate(expense.expenseDate)}</td>
                    <td style={{ border: '1px solid #ccc', padding: '5px' }}>{expense.description}</td>
                    <td style={{ border: '1px solid #ccc', padding: '5px' }}>{members[expense.paidBy]?.name || 'Unknown'}</td>
                    <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right' }}>${formatAmount(expense.amount)}</td>
                    <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center' }}>{expense.splitType.toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Footer */}
          <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '10px', fontSize: '10px', color: '#999', textAlign: 'center' }}>
            <p>Generated by Expense Tracker App</p>
          </div>
        </div>
      </div>
    </div>
  );
} 