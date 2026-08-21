# SSSO Open Mode React SPA Demo

This is a minimal React single page application (SPA) showing how to authenticate using an SSSO **Open Mode** workspace subdomain.

In **Open Mode**, the user can directly visit the workspace subdomain (`https://<workspace>.ssso.in/login` or `/signup`) or initiate a standard OAuth 2.0 PKCE flow. 

This demo uses the **OAuth 2.0 PKCE Flow** to redirect users to the subdomain for sign-in/registration and exchange the resulting auth code securely.

---

## Workspace Setup

1. Go to your SSSO Operator Dashboard.
2. In **Settings**, set **Login Mode** to **Open** (Default).
3. Under **Applications**, create a new client application:
   *   **Application Name**: `Open Mode Demo App`
   *   **Redirect URIs**: `http://localhost:5173` (or your current web server address)
4. Copy the **Client ID** generated.

---

## App Integration Code

Edit `src/App.tsx` and configure your credentials:

```typescript
const CONFIG = {
  clientId: "YOUR_CLIENT_ID",       // Paste your copied Client ID here
  workspaceSlug: "YOUR_SLUG",       // Paste your workspace slug here
  tenantDomain: "ssso.in",          // Main platform domain
  redirectUri: window.location.origin,
};
```

---

## How the Flow Works

1. **Initiate Sign-In**:
   The app generates a cryptographically secure `code_verifier` (saved locally in `localStorage`) and derives the matching SHA-256 `code_challenge`. It then redirects the browser to the workspace subdomain's `/authorize` endpoint:
   `https://<workspace-slug>.ssso.in/authorize?response_type=code&client_id=...&code_challenge=...`

2. **Authenticate on Subdomain**:
   Since the workspace is set to **Open Mode**, if the user is not authenticated, they can log in or register an account directly on the subdomain page.

3. **Consent & Redirect**:
   The user consents to log in, and the workspace redirects the user back to the application's `redirect_uri` (e.g. `http://localhost:5173/?code=AUTHORIZATION_CODE`).

4. **Exchange Code for Access Token**:
   The React app parses the `code` parameter from the URL, retrieves the `code_verifier` from `localStorage`, and makes a POST call to SSSO's token exchange endpoint (`https://ssso.in/api/oauth/token`) to trade them for a secure access token.

5. **Access Profile**:
   The app attaches the token to the header (`Authorization: Bearer <token>`) to request the user's profile information from `/api/oauth/userinfo`.

---

## Running the Demo

Install dependencies and start the local development server:

```bash
# Navigate to the demo directory
cd examples/open-mode-demo

# Install dependencies
npm install

# Start local server
npm run dev
```

Open your browser and navigate to [http://localhost:5173](http://localhost:5173).
