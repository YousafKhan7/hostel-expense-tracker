# Group Management Design Decisions

## Member Removal

### Permissions

*   **Who can remove members?**
    *   Only group admins and the group creator are authorized to remove members from a group.
    *   Regular members do not have the permission to remove other members.
    *   No user can remove them self from the group.

### Confirmation Modal

*   **Purpose:** To prevent accidental member removals.
*   **When:** A confirmation modal is displayed when a group admin or creator clicks the "Remove" button next to a member's name in the member list.
*   **Content:**
    *   A clear message: "Are you sure you want to remove \[member name] from the group? This action cannot be undone."
    *   Two buttons:
        *   "Cancel": Closes the modal without removing the member.
        *   "Remove": Confirms the removal and proceeds with the deletion process.

### Data Deletion

*   **Scope:** When a member is removed, all data associated with that member within the group must also be deleted or updated. This includes:
    *   **Expenses:**
        *   All expenses where the removed member was the `paidBy` user.
        *   All expenses where the removed member was included in the `splitAmong` list.
        * all the related shares with that user.
    * **Settlements**:
        * all the settlements where the member is involved.
    * **Balance:**
        * balances will be updated automatically.

### Data Update Process

1.  **Identify Data:**
    *   When a member is to be removed, identify all expenses, shares, and settlements related to that member.
2.  **Delete/Update:**
    *   **Expenses:**
        *   Delete any expenses where the removed member is `paidBy`.
        *   For expenses where the member is in `splitAmong`:
            *   Remove the member's ID from the `splitAmong` array.
            *   Remove the share object related to that member from shares.
    * **Settlements**:
        * Delete the settlements where the member is involved.
    * **Group data**:
        * remove member from `members` object.
    * Update all the group data in the backend.

### Technical Considerations

*   **Firestore Security Rules:** Firebase security rules must enforce these permissions to prevent unauthorized member removals.
*   **Error Handling:** The app must gracefully handle any errors that occur during the removal or data deletion/update processes (e.g., network issues, permission errors).
*   **Consistency:** Maintain data consistency across the application.
* **Loading state:** proper loading states when removing a user.

### UI/UX Considerations

*   **Visibility:** The "Remove" button should be clearly visible to group admins and creators but hidden from regular members.
*   **Feedback:** The app should provide clear feedback to the user during the removal process (e.g., "Removing...", confirmation message).
* **Clear messages:** proper error and success messages.