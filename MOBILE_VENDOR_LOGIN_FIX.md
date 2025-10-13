# Mobile Vendor Login Fix

## Issue Description
Vendors were able to login successfully on desktop/laptop but were being automatically logged out on mobile devices with the error "vendor status not found". The issue occurred because the mobile app was not properly sending authentication tokens with API requests.

## Root Cause
The problem was in the API utilities (`src/utils/apiUtils.ts`). The `createApiHeaders` function was only checking `localStorage` for authentication tokens, but on mobile devices, the app uses Capacitor Preferences for secure storage. This meant that:

1. Vendor logs in successfully and token is stored in Capacitor Preferences
2. Subsequent API calls to check vendor status fail because no token is sent in headers
3. Server returns 401/403 error ("vendor status not found")
4. App interprets this as invalid authentication and logs user out

## Files Modified

### 1. `src/utils/apiUtils.ts`
**Changes:**
- Made `createApiHeaders` function async
- Updated to use `authService.getToken()` instead of direct `localStorage.getItem('token')`
- Updated `apiRequest` function to await the async `createApiHeaders()`

**Why:** This ensures that authentication tokens are properly retrieved on both web (localStorage) and mobile (Capacitor Preferences) platforms.

### 2. `src/pages/vendor/VendorHome.tsx`
**Changes:**
- Replaced direct `fetch()` calls with `apiRequest()` utility
- Improved error handling for authentication failures
- Added proper mobile token handling for all API calls (wallet, orders, products)

**Why:** Ensures that the vendor dashboard properly authenticates API requests on mobile devices.

### 3. `src/pages/SplashScreen.tsx`
**Changes:**
- Updated vendor profile checking to use `apiRequest()` instead of direct `fetch()`
- Added proper error handling for authentication failures
- Improved vendor status validation logic

**Why:** Ensures that the app startup process properly validates vendor authentication on mobile devices.

### 4. `src/pages/vendor/VendorLogin.tsx`
**Changes:**
- Enhanced error handling for login failures
- Ensured `user_type` is properly set to 'vendor' for routing
- Added better logging for debugging authentication issues

**Why:** Provides better error handling and ensures proper user type setting for vendor accounts.

### 5. `src/components/VendorHeader.tsx`
**Changes:**
- Updated `fetchVendorStatus()` to use `apiRequest()` instead of direct `fetch()`
- Updated `toggleStatus()` to use `apiRequest()` instead of direct `fetch()`
- Added proper mobile authentication token handling
- Improved error handling for 401/403 responses

**Why:** The vendor header was causing "vendor status not found" errors because it wasn't properly sending authentication tokens on mobile.

### 6. `src/services/notificationService.ts`
**Changes:**
- Replaced all direct `fetch()` calls with `apiRequest()` utility
- Removed `getAuthHeaders()` method (now handled by `apiRequest`)
- Updated all notification-related API calls to use proper mobile authentication

**Why:** Notification service was causing 401 errors on mobile due to improper token handling.

### 7. `src/services/messageService.ts`
**Changes:**
- Replaced all direct `fetch()` calls with `apiRequest()` utility
- Removed `getAuthHeaders()` method (now handled by `apiRequest`)
- Updated all messaging-related API calls to use proper mobile authentication
- Fixed user ID retrieval to use `authService.getUser()` instead of localStorage

**Why:** Message service was causing 401 errors on mobile due to improper token handling.

### 8. `src/components/VendorDebugInfo.tsx` (New)
**Purpose:** 
- Debug component to help identify authentication issues
- Shows token status, user info, platform info, and vendor profile API status
- Can be temporarily added to pages for troubleshooting

## How the Fix Works

### Before Fix:
1. Vendor logs in → Token stored in Capacitor Preferences (mobile)
2. API calls use `createApiHeaders()` → Only checks localStorage → No token found
3. API requests sent without authentication headers
4. Server returns 401/403 → App logs user out

### After Fix:
1. Vendor logs in → Token stored in Capacitor Preferences (mobile)
2. API calls use `createApiHeaders()` → Uses `authService.getToken()` → Token retrieved from Capacitor Preferences
3. API requests sent with proper authentication headers
4. Server validates token → API calls succeed → User stays logged in

## Testing the Fix

1. **Build and deploy** the mobile app with these changes
2. **Test vendor login** on mobile device
3. **Verify** that vendor stays logged in and can access dashboard
4. **Check** that API calls (wallet, orders, products) work properly
5. **Use debug component** if issues persist to identify specific problems

## Debug Component Usage

If issues persist, the `VendorDebugInfo` component can be temporarily added to any page to show:
- Platform information (native vs web)
- Authentication status
- Token presence (masked for security)
- User information
- Vendor profile API status
- Any error messages

## Cleanup

After confirming the fix works:
1. Remove `VendorDebugInfo` imports and usage from production pages
2. The debug component file can be kept for future troubleshooting
3. All services now use the unified `apiRequest` utility for consistent authentication

## API Endpoints Affected

The fix ensures proper authentication for these vendor-specific endpoints:
- `/api/vendor-profiles/` - Vendor profile validation
- `/api/accounts/wallet/` - Wallet balance
- `/api/vendor/orders/` - Vendor orders
- `/api/products/` - Vendor products
- `/api/notifications/` - Notifications
- `/api/messaging/conversations/` - Message conversations
- `/api/messaging/calls/` - Voice/video calls
- All other API endpoints that require authentication

## Security Note

The fix maintains the same security level by:
- Using the existing `authService` for token management
- Not exposing tokens in logs (debug component masks tokens)
- Maintaining proper token validation on the server side