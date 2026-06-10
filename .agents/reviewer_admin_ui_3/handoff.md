# Handoff Report — Milestone 2 Review

## 1. Observation
- **File path**: `frontend/src/components/CartDrawer.jsx`
  - Lines 56–66:
    ```javascript
    const addressString = `${formData.address_line1}, ${formData.address_line2 ? formData.address_line2 + ', ' : ''}${formData.city}, ${formData.state} - ${formData.postal_code}`;
    
    const checkoutData = {
      amount: totalAmount,
      currency: 'INR',
      customer_name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: addressString,
      items: cartItems,
      user_id: user ? user.id : null
    };
    ```
- **File path**: `backend/server.js`
  - Line 612:
    ```javascript
    const addressStr = `${address.address_line1 || ''}, ${address.address_line2 || ''}, ${address.city || ''}, ${address.state || ''} - ${address.postal_code || ''}, ${address.country || ''}`;
    ```
- **File path**: `frontend/src/pages/AdminDashboard.jsx`
  - Line 238:
    ```javascript
    const addressStr = `${o.address.address_line1 || ''}, ${o.address.address_line2 || ''}, ${o.address.city || ''}, ${o.address.state || ''} - ${o.address.postal_code || ''}, ${o.address.country || ''}`;
    ```
- **Test Server execution outcome**:
  - Verification tests (`backend/test_verification.js` and `backend/tests/integration.js`) pass successfully, but they bypass this frontend mismatch by submitting a structured address object instead of a flat string:
    ```javascript
    address: {
      address_line1: '456 Forest Rd',
      ...
    }
    ```

## 2. Logic Chain
1. In `CartDrawer.jsx` (Lines 56–66), the frontend constructs a flat `addressString` (e.g. `"123 Street, City - 560001"`) and passes it as `address` in the checkout body.
2. In `backend/server.js` (Line 333, 358), the backend stringifies the value and inserts it into the SQLite database.
3. In `backend/server.js` (Line 570) and `frontend/src/pages/AdminDashboard.jsx` (Line 238), the database output is retrieved and parsed using `JSON.parse(order.address)`. Since the stored value is `'"123 Street, City - 560001"'`, parsing returns the raw string `"123 Street, City - 560001"`.
4. However, the receipt generator in `server.js` (Line 612) and the order card display in `AdminDashboard.jsx` (Line 238) both perform dot-notation property accesses (e.g. `address.address_line1`, `address.city`) expecting `address` to be an object.
5. Evaluating properties on a string returns `undefined`. Thus, the formatted addresses are evaluated as `", , ,  - , "` on both the receipts and the dashboard view.

## 3. Caveats
- Since the integration and verification tests use object structures for address parameters, they pass without revealing this frontend integration bug.
- Real Razorpay payment gateway integration was tested using mock sandboxed endpoints since active client API keys were not loaded in the local environment.

## 4. Conclusion
The implementation of the Frontend Admin Dashboard and Backend security policies meets the safety and interface contracts specified in `PROJECT.md` and successfully blocks parameter injection, price manipulation, and unauthorized requests. However, a major data contract mismatch between `CartDrawer.jsx` and `server.js`/`AdminDashboard.jsx` prevents the successful display and recording of customer shipping addresses in real user transactions. A verdict of `REQUEST_CHANGES` is issued.

## 5. Verification Method
1. Start the backend server:
   ```bash
   cd backend
   node server.js
   ```
2. Place an order through the web user interface (mock checkout flow) by adding a product to the cart, opening the cart drawer, filling out shipping information, and clicking "Place Order & Pay".
3. Check the written receipt files in `backend/logs/receipts/` or view the order registry in the Admin Dashboard (`admin@aariniya.com` / `admin123`).
4. **Invalidation Condition**: The shipping address displays empty placeholders `", , ,  - , "` instead of the inputted customer address details.
