# Web Project Analysis

## Scope and confidence

Analysis is based on the current checked-in source. The React web application is the source of truth, but several screens explicitly use demo data and payment callbacks are not authoritative. Those behaviors are identified as gaps rather than mobile requirements. No `.env` values are reproduced here.

## Architecture

- Vite 7 application using React 19 and JavaScript/JSX, with one existing javaScript dashboard layout file.
- Bootstrap: `src/main.jsx`; React Router DOM 6 route tree: `src/routes.jsx`.
- `QueryClientProvider` wraps the router; query retry is 1 and focus refetch is disabled.
- Public shell: `src/routes/_public.jsx` (Header, Footer, ScrollToTop, support widget). Auth shell: `src/routes/_auth.jsx`. Commercial, individual, and admin dashboards have their own shells.
- Styles are a mixture of Tailwind, CSS, inline styles, Ant Design, Framer Motion, and Lucide icons.
- API calls are centralized as named wrappers in `src/services/api.jsx`, backed by the Axios client in `src/services/apiInterceptor.jsx`.
- Client state uses Zustand stores and browser `localStorage` (including persisted profile wizard state).

## Dependencies and structure

The web manifest includes React, React Router DOM, TanStack Query, Axios, Zustand, React Hook Form, Ant Design, Framer Motion, Lucide/React Icons, Recharts, Sonner, CryptoJS, and Vite/Tailwind tooling. It does not currently include Expo, React Native, Expo Router, SecureStore, Jest, or React Native Testing Library. No existing mobile project was present in the inspected workspace tree.

Relevant source areas are `src/routes.jsx`, `src/Component/Public`, `src/Component/auth`, `src/Component/Dashboard`, `src/services`, `src/store`, `src/data`, and `src/utils`.

## Authentication and authorization

- Login submits `emailId` and a client-side SHA-256 hash of the password to `POST /Authentication/authenticate`; it checks `isLoginSuccessful` and sends the returned user type, mobile, GUID/value, and response through router state to `/otp`.
- Successful login does not persist access/refresh tokens: the storage statements are commented out. OTP verification submits `{ id, otp }` to email/mobile endpoints. Login uses the mobile OTP step; registration uses email, then mobile, then sets a password with a SHA-256 hash through `POST /UserRegistration/userpassword`.
- Registration fetches user types, states, root services, then cities by state. It submits name, email/mobile, state/city, user type, optional company name, and service ID/name. CAPTCHA is generated and checked locally.
- The login/registration/OTP flow uses `localStorage` in places for mock or prior state and passes authentication data in navigation state. Passwords and tokens are not persistently stored by the active flow. OTP resend supports email/mobile.
- The Axios request interceptor reads an access token but the Authorization header code is commented out. Refresh-token network logic is also commented out; current 401 handling retries the same request once, not a refreshed request. Tenant, language, timezone, and request-ID headers are added when possible.
- No route-level authentication guard or role guard is visible in the active router. Dashboard destinations are selected based on `userType`, but that is navigation behavior, not access control. Dashboard shell logout clears selected browser keys/stores.
- `/admin/login` is a frontend-only demonstration using hardcoded credentials in source and `localStorage`; it is not a production authentication contract and must not be copied to mobile.

## API architecture and observed contract

The base URL resolution order is `VITE_API_URL`, `VITE_BASE_URL`, then Vite `BASE_URL`. No API base URL is embedded in this document. Axios defaults to JSON content type and `Accept: text/plain`, 30-second timeout, and unwraps successful responses to `response.data`. Error rejection is normalized to `{ status, message, errors }`. Request logging currently logs request config and response bodies; mobile should not reproduce sensitive payload logging.

Observed response conventions include `{ status, message/remark, value, data }`, but this is not uniform or formally typed. Consumers access `status`, `message`, `value`, and/or `data`; some list endpoints may return arrays directly. API details and unknown payload schemas are recorded in `API_INVENTORY.md`.

There is no explicit pagination/sort contract in the inspected API wrappers. Several screens implement local filtering or table behavior. The API layer exposes image/document retrieval, but the inspected flows do not establish a complete native upload contract or progress behavior.

## Payment architecture and security assessment

- The browser helper loads Razorpay Checkout.js. Two subscription flows instantiate browser `Razorpay` with an inline `rzp_test_...` key ID and plan amount in INR/paise.
- On a client callback, code writes a `UserPaymentHistory` record with `paymentStatus: "Success"`, then creates/activates a subscription. No order/session creation, callback signature verification, backend payment verification endpoint, or webhook verification is present in the inspected web flow. A test key ID is not a secret, but the browser implementation is not proof of payment.
- Service selection additionally saves a service record and uses subscription-validity and user-subscription APIs. Some pages use payment history write followed by subscription activation.
- `AddCredits` explicitly says no real payment is processed. `MyCredits` starts with hardcoded balances and transaction records and simulates success using a timeout.
- Mobile payment must remain blocked until the backend supplies an authoritative order/session creation and verification contract (and confirmation of webhook/signature responsibilities). Never activate entitlement based only on a native SDK callback or client-supplied payment-history status.

## Existing functionality and business rules

- Public: home, company directory/detail, service categories, service detail tree, projects, marketplace, about, contact, and buy-service views. Public company detail combines registration, basic information, and active services; company listings use verified commercial registration data.
- Auth: login, registration, email/mobile OTP, password setting, resend OTP, and an independent demo admin login.
- Individual dashboard: overview, services, plans/subscriptions, profile, and password screen. Several dashboard values and user fallback profiles are hardcoded.
- Commercial dashboard: overview, profile wizard (company/basic/registration/documents/services/banking steps), service listing, plans/subscriptions, credits, subscription history, clients, leads, settings, and invoices. Overview contains mock metrics.
- Admin dashboard is one route with in-component tabs for overview, user verification, service management, users, plans, payment history, document categories, security, and analytics; there are additional document subcategory screens represented internally.
- Service detail flow uses service menu hierarchy, subscription validity, plan selection, verified contractor list, user-service activation, and registration details. Access is conditional in the UI, but route-level protection is absent.
- Forms use a combination of React Hook Form and component-local state. Some management screens include CRUD, local filtering, CSV export, and confirmation dialogs. APIs do not expose consistent paging/sorting metadata in the wrappers.

## Mobile architecture proposal

Use an Expo javaScript app in `mobile-app/`, Expo Router route groups for public/auth/app/admin destinations, TanStack Query for server state, Axios with an explicit runtime API URL, Zustand for minimal session/UI state, React Hook Form, and SecureStore only after a real token/session contract is confirmed. Use native lists and forms, safe-area/keyboard-aware layouts, deep links for public company/service details, and role checks derived from a server-authenticated session. Keep admin screens restricted until real admin auth exists. Keep paid actions unavailable until server-side payment verification is defined. Exact route mapping is in `ROUTE_SCREEN_INVENTORY.md`.

## Known constraints before production

1. Obtain the approved API URL per environment and confirm response schemas/auth requirements.
2. Confirm whether login returns a session token and how it is refreshed/revoked; implement secure storage only for the confirmed contract.
3. Replace the demo admin login with backend authentication and server-enforced admin authorization.
4. Add server-created payment orders/sessions and authoritative verification before enabling mobile checkout or entitlements.
5. Confirm file upload endpoint/content type/limits and supported document/image formats.
6. Validate API behavior on an approved staging environment; no environment credentials are included in this analysis.