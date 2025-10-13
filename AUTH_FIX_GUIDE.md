# Authentication Fix Guide

## Problem Analysis
Your GET requests work but POST requests fail with 401 Unauthorized. This indicates:

1. **Token Format Mismatch**: Backend expects different auth formats for different endpoints
2. **Multiple Auth Services**: You mentioned 10+ files handling authentication causing conflicts

## Quick Fix Steps

### Step 1: Check Current Token Format
Open browser console and run:
```javascript
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));
```

### Step 2: Test Different Auth Formats
The fix I've implemented will automatically try:
1. `Bearer ${token}` (standard format)
2. `Token ${token}` (Django REST framework format)

### Step 3: Verify the Fix
1. Try the toggle status button again
2. Check console for debug logs showing which format works
3. Look for "✅ Token format worked for POST request" message

## Root Cause Solutions

### Immediate Fix (Applied)
- Modified `apiUtils.ts` to try both `Bearer` and `Token` formats
- Added automatic retry for failed POST requests
- Added debug logging to identify working format

### Long-term Fix (Recommended)
1. **Consolidate Auth Services**: Remove duplicate auth handling files
2. **Standardize Token Format**: Use consistent format across all endpoints
3. **Add Token Refresh**: Implement automatic token refresh on expiry

## Files Modified
- `src/utils/apiUtils.ts` - Enhanced auth header handling
- `src/utils/authDebug.ts` - Debug utilities (new)
- `src/components/VendorHeader.tsx` - Added debug logging

## Testing
1. Open browser console
2. Try any POST operation (like toggle status)
3. Check for debug logs showing auth details
4. Verify POST requests now work

## Expected Console Output
```
🔍 AUTH DEBUG START
📋 Auth Status: { hasToken: true, tokenLength: 40, ... }
💾 Direct Storage: { directToken: "abc123...", ... }
🔄 POST request failed with 401, trying Token format...
✅ Token format worked for POST request
```

## If Still Not Working
1. Check if token is valid by testing a GET request
2. Verify backend expects the token format we're sending
3. Check if CSRF tokens are required for POST requests
4. Ensure user has proper permissions for the endpoint

## Backend Token Formats to Try
If automatic retry doesn't work, manually test these formats:

```javascript
// Format 1: Bearer (OAuth2 standard)
headers: { 'Authorization': 'Bearer your_token_here' }

// Format 2: Token (Django REST)
headers: { 'Authorization': 'Token your_token_here' }

// Format 3: JWT
headers: { 'Authorization': 'JWT your_token_here' }

// Format 4: Custom header
headers: { 'X-Auth-Token': 'your_token_here' }
```

## Next Steps
1. Test the fix with POST operations
2. If working, remove debug logs for production
3. Consider consolidating multiple auth services
4. Implement proper error handling for expired tokens