import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "@ssso/react";
import "./index.css";

// Configuration for SSSO
const CONFIG = {
  clientId: "oa_OTuko1XRVPqlnIijGvM4kg",
  workspaceSlug: "invoiceapp",
  tenantDomain: "localhost:3000",
  redirectUri: window.location.origin,
};

const tenantBaseUrl = `http://${CONFIG.workspaceSlug}.${CONFIG.tenantDomain}`;

const authConfig = {
  authUrl: tenantBaseUrl,
  clientId: CONFIG.clientId,
  redirectUri: CONFIG.redirectUri,
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <AuthProvider config={authConfig} autoHandleCallback={true}>
    <App />
  </AuthProvider>
);
export { CONFIG, tenantBaseUrl };
