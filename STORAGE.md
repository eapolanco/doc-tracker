# Cloud Storage Integration Guide

To implement cloud storage support in DocTracker, follow these steps:

## Google Drive Integration

1. **Google Cloud Console**: Create a project and enable the Google Drive API.
2. **OAuth2**: Setup OAuth2 credentials.
3. **Frontend**: Use the [Google Identity Services](https://developers.google.com/identity/gsi/web/guides/overview) to get an access token.
4. **Backend**: Add an endpoint `/api/sync/google` that uses `googleapis` to fetch file metadata and update the SQLite database.

## OneDrive Integration

1. **Azure Portal**: Register an application in Microsoft Entra (formerly Azure AD).
2. **Permissions**: Add `Files.Read.All` and `Files.ReadWrite.All` permissions.
3. **MSAL.js**: Use `@azure/msal-react` in the frontend to handle authentication.
4. **Graph API**: Use the [Microsoft Graph SDK](https://github.com/microsoftgraph/msgraph-sdk-javascript) to sync files.

## Database Schema

The currently implemented schema already includes a `cloudSource` field:

```typescript
export const documents = sqliteTable("documents", {
  // ...
  cloudSource: text("cloud_source"), // 'google' | 'onedrive' | 'local'
  // ...
});
```

## Configuration

To make OAuth work, add the following to your `backend/.env` file:

```env
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

ONEDRIVE_CLIENT_ID=your_id
ONEDRIVE_CLIENT_SECRET=your_secret
ONEDRIVE_REDIRECT_URI=http://localhost:3001/api/auth/onedrive/callback
```

## Implementation Progress

- [x] Database schema for cloud accounts
- [x] Backend OAuth service (Google/Microsoft)
- [x] Frontend settings UI
- [ ] Background sync worker (Future)
