import { storage } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateReportStatus } from './firestoreService';

/**
 * Saves a PDF report to Firebase Storage
 * @param {string} groupId - The group ID
 * @param {string} monthKey - The month key in YYYY-MM format
 * @param {Blob} pdfBlob - The PDF blob to upload
 * @returns {string} - The download URL of the uploaded PDF
 */
export const saveReportToStorage = async (groupId, monthKey, pdfBlob) => {
  try {
    // Create a reference to the file location in Firebase Storage
    const reportFileName = `${groupId.slice(0, 8)}-${monthKey}.pdf`;
    const storageRef = ref(storage, `reports/${groupId}/${reportFileName}`);
    
    // Upload the PDF blob
    const uploadResult = await uploadBytes(storageRef, pdfBlob);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    // Update the monthly data document with the report URL
    await updateReportStatus(groupId, monthKey, true, downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error saving report to storage:', error);
    throw error;
  }
};

/**
 * Gets the download URL for a report if it exists
 * @param {string} groupId - The group ID
 * @param {string} monthKey - The month key in YYYY-MM format
 * @returns {string|null} - The download URL or null if not found
 */
export const getReportDownloadUrl = async (groupId, monthKey) => {
  try {
    // Create a reference to the file location
    const reportFileName = `${groupId.slice(0, 8)}-${monthKey}.pdf`;
    const storageRef = ref(storage, `reports/${groupId}/${reportFileName}`);
    
    // Try to get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    // File doesn't exist or other error
    console.log('Report not found or error getting URL:', error);
    return null;
  }
};

/**
 * Deletes a report from storage
 * @param {string} groupId - The group ID
 * @param {string} monthKey - The month key in YYYY-MM format
 * @returns {boolean} - Whether the operation was successful
 */
export const deleteReportFromStorage = async (groupId, monthKey) => {
  try {
    // Create a reference to the file location
    const reportFileName = `${groupId.slice(0, 8)}-${monthKey}.pdf`;
    const storageRef = ref(storage, `reports/${groupId}/${reportFileName}`);
    
    // Delete the file
    await deleteObject(storageRef);
    
    // Update the monthly data document
    await updateReportStatus(groupId, monthKey, false, null);
    
    return true;
  } catch (error) {
    console.error('Error deleting report from storage:', error);
    throw error;
  }
}; 