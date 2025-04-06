import { db } from './firebaseConfig';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { getMonthKey, getMonthBoundaries } from '../utils/ExpenseSchema';

/**
 * Creates or updates the monthly data document for a group
 * @param {string} groupId - The ID of the group
 * @param {string} monthKey - The month key in YYYY-MM format
 * @param {Object} data - The data to update
 */
export const updateMonthlyData = async (groupId, monthKey, data) => {
  try {
    const monthlyRef = doc(db, 'monthlyData', `${groupId}_${monthKey}`);
    const monthDoc = await getDoc(monthlyRef);
    
    if (!monthDoc.exists()) {
      // Create new document
      await setDoc(monthlyRef, {
        groupId,
        month: monthKey,
        totalExpenses: data.totalExpenses || 0,
        memberBalances: data.memberBalances || {},
        reportGenerated: data.reportGenerated || false,
        reportUrl: data.reportUrl || null,
        lastExpenseId: data.lastExpenseId || null,
        settlements: data.settlements || [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      // Update existing document
      await updateDoc(monthlyRef, {
        ...data,
        updatedAt: new Date()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error updating monthly data:', error);
    throw error;
  }
};

/**
 * Gets the monthly data for a group
 * @param {string} groupId - The ID of the group
 * @param {string} monthKey - The month key in YYYY-MM format
 */
export const getMonthlyData = async (groupId, monthKey) => {
  const monthlyRef = doc(db, 'monthlyData', `${groupId}_${monthKey}`);
  const monthDoc = await getDoc(monthlyRef);
  
  if (!monthDoc.exists()) {
    return {
      groupId,
      monthKey,
      totalExpenses: 0,
      memberBalances: {},
      settlements: [],
      lastUpdated: new Date()
    };
  }
  
  return monthDoc.data();
};

/**
 * Gets all expenses for a group in a specific month
 * @param {string} groupId - The ID of the group
 * @param {string} monthKey - The month key in YYYY-MM format
 */
export const getMonthlyExpenses = async (groupId, monthKey) => {
  const { startDate, endDate } = getMonthBoundaries(monthKey);
  
  const expensesQuery = query(
    collection(db, 'expenses'),
    where('groupId', '==', groupId),
    where('expenseDate', '>=', startDate),
    where('expenseDate', '<=', endDate)
  );
  
  const querySnapshot = await getDocs(expensesQuery);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

/**
 * Updates member balances in the monthly data
 * @param {string} groupId - The ID of the group
 * @param {string} monthKey - The month key in YYYY-MM format
 * @param {Object} memberBalances - The updated member balances
 */
export const updateMemberBalances = async (groupId, monthKey, memberBalances) => {
  await updateMonthlyData(groupId, monthKey, {
    memberBalances
  });
};

/**
 * Records a settlement between members
 * @param {string} groupId - The ID of the group
 * @param {string} monthKey - The month key in YYYY-MM format
 * @param {Object} settlement - The settlement details
 */
export const recordSettlement = async (groupId, monthKey, settlement) => {
  const monthlyRef = doc(db, 'monthlyData', `${groupId}_${monthKey}`);
  const monthDoc = await getDoc(monthlyRef);
  
  if (!monthDoc.exists()) {
    throw new Error('Monthly data not found');
  }
  
  const currentData = monthDoc.data();
  const settlements = [...(currentData.settlements || []), {
    ...settlement,
    timestamp: new Date()
  }];
  
  await updateDoc(monthlyRef, {
    settlements,
    lastUpdated: new Date()
  });
};

/**
 * Gets all monthly data for a group
 * @param {string} groupId - The ID of the group
 */
export const getAllMonthlyData = async (groupId) => {
  const monthlyQuery = query(
    collection(db, 'monthlyData'),
    where('groupId', '==', groupId)
  );
  
  const querySnapshot = await getDocs(monthlyQuery);
  return querySnapshot.docs.map(doc => doc.data());
};

/**
 * Updates the report status for a month
 * @param {string} groupId - The ID of the group
 * @param {string} monthKey - The month key in YYYY-MM format
 * @param {boolean} reportGenerated - Whether the report was generated
 * @param {string} reportUrl - URL to the generated report (optional)
 */
export const updateReportStatus = async (groupId, monthKey, reportGenerated, reportUrl = null) => {
  try {
    await updateMonthlyData(groupId, monthKey, {
      reportGenerated,
      reportUrl,
      reportGeneratedAt: reportGenerated ? new Date() : null
    });
    
    return true;
  } catch (error) {
    console.error('Error updating report status:', error);
    throw error;
  }
}; 