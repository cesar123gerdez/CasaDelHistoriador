# System Health Check and Verification Steps

1. Run backend database and system health check script:
   - Open a terminal in the backend directory.
   - Run the command: `node test-connection.js`
   - Observe console output for database connectivity, table presence, admin user verification, and categories.
   - Address any errors reported by this script.

2. Start the backend server:
   - In a terminal in the backend directory, run: `node server.js`
   - Check console logs for successful startup messages.
   - Ensure database connection status is ✅ CONNECTED.
   - Note any error messages or crashes.

3. Verify the frontend:
   - Open the frontend/index.html file in a web browser.
   - Confirm the page loads without errors.
   - Open the browser console (F12) to watch for any error messages or warnings.
   - Attempt to log in with admin credentials:
     - Username: admin
     - Password: admin123
   - Confirm categories and files load successfully.
   - Test uploading, downloading, and deleting files if possible.

4. Monitor logs:
   - Watch backend terminal for logged requests and error messages.
   - Watch frontend browser console for runtime errors.

5. Troubleshooting:
   - If database connection fails, verify environment variables in `.env` file (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME).
   - Ensure MySQL server is running and accessible.
   - Adjust server.js or database.js logging if needed to increase verbosity for debugging.

Follow these steps and report any errors or unexpected behaviors to diagnose issues further.
