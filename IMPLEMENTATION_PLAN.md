# Mobile Implementation Plan

## Repository baseline

The checked-in app is an Expo SDK 51 / React Native 0.74 JavaScript app using React Navigation, Zustand, Axios, and AsyncStorage. It is not the Expo SDK 58 / Expo Router app described by the feature checklist. The Android JS export passed before this plan was created. No Jest or lint scripts are configured. The docs' web route inventory and API inventory are the requirements source, but all listed behavior must be checked against this repository before it is called implemented.

Status values: `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `COMPLETED`, `VERIFICATION_REQUIRED`.

## Requirements tracker

| ID | Requirement / source | Mobile surface and verified API contract | Status | Verification / gap |
|---|---|---|---|---|
| BASE-01 | Existing native app; master prompt Phase 2 | Expo SDK 51, React Navigation, existing screens and components | COMPLETED | Android JS export passed; no device build performed |
| API-01 | API client; `API_INVENTORY.md` client behavior | `src/api/client.js`; API base URL currently configured in app | IN_PROGRESS | Auth transport is being connected; base URL/environment and response schemas still need staging confirmation |
| AUTH-01 | Login + mobile OTP; `API_INVENTORY.md` Authentication and verification endpoints | Login: `POST /Authentication/authenticate` with `{ emailId, password }`; verify: `POST /UserRegistration/verify/mobile` with `{ id, otp }` | IN_PROGRESS | Implement API-backed flow; no approved staging credentials available |
| AUTH-02 | Registration, email/mobile OTP, password setting; API and route inventories | Registration: `/Common/getstate/2`, `/Common/getcity/{StateId}`, `/Common/commonlist/userType`, `/ServiceMaster/rootservice`, `/UserRegistration/save`, email/mobile verify, `/UserRegistration/userpassword` | NOT_STARTED | Existing form lacks required location/service fields and flow steps; implement only with documented fields and real backend responses |
| AUTH-03 | Session restore/logout and role protection; feature checklist | No confirmed access-token, refresh, revocation, or authenticated-session contract | BLOCKED | Do not persist fabricated credentials or claim secure session restoration; ask backend for token lifecycle and role claims |
| PUB-01 | Home and public navigation; route inventory `/` | Existing dashboard and tabs | VERIFICATION_REQUIRED | Current screens use app-specific marketplace data; reconcile with documented public-company/service workflows |
| PUB-02 | Company directory/detail; route inventory `/company-list`, `/company/:userId` | `GET /UserRegistration/homeoageuserdetails`, `GET /UserRegistration/get?userId=...`, basic info/services/image endpoints | NOT_STARTED | Existing vendor screens are not verified against these contracts; staging and response-shape checks remain |
| PUB-03 | Services and service details; `/service/:serviceId`, `/services/*` | `GET /ServiceMaster/getmenu`, `/rootservice`, `/get?ParentServiceID=...`, contractor and user-service reads | NOT_STARTED | No consistent pagination/filter contract; keep purchase/activation disabled pending validity and entitlement verification |
| PUB-04 | Marketplace/projects/buy routes | `/marketplace`, `/projects`, `/services/buy`, `/services/buy2` | VERIFICATION_REQUIRED | Do not represent sample catalog/order data as live backend functionality |
| AUTHZ-01 | Admin and protected destinations; route inventory `/admin/*` | Admin APIs exist, but admin authentication/policy is absent | BLOCKED | Do not port demo credentials or expose admin mutations without server-enforced authorization |
| WORK-01 | Leads CRUD; feature checklist commercial leads | `GET/POST/PUT/DELETE /LeadMaster/*` | VERIFICATION_REQUIRED | Verify existing lead screens against source payloads and remove any sample fallback before production use |
| WORK-02 | Clients, profile, services, subscriptions, documents | Client, profile, subscription, service entitlement, and document endpoints in `API_INVENTORY.md` | NOT_STARTED | Several payload schemas are pass-through/unknown; document upload encoding and banking data handling need backend confirmation |
| PAY-01 | Checkout, plans, subscriptions, payment history, credits | Plan/history APIs are listed; no payment order or authoritative verification endpoint | BLOCKED | Keep real payment, credit mutation, and entitlement activation unavailable until backend supplies verified order/session and signature/webhook contract |
| NAV-01 | Route and screen inventory, deep links, Android Back | Existing React Navigation stacks/tabs | VERIFICATION_REQUIRED | Expo Router guidance does not match installed app; preserve existing navigator and validate ID routes/back behavior |
| UX-01 | Native behavior, accessibility, states, performance; master prompt Phase 5/7/8 | Existing React Native components/screens | VERIFICATION_REQUIRED | Device, keyboard, safe-area, screen-reader, and network interruption review remains |
| QA-01 | Master prompt Phase 9 and feature checklist quality gates | Expo export and available package scripts | IN_PROGRESS | No Jest/lint configured; Android JS export is available, but APK/AAB, iOS, emulator, and approved staging tests remain |

## Execution order

1. Replace fabricated password/OTP authentication with the documented API contract and remove demo credentials.
2. Keep authenticated identity in memory until the backend documents a session/token lifecycle; do not persist a mock token.
3. Implement registration only after wiring the documented dynamic selectors and multi-step verification without inventing payload fields.
4. Connect public directory/service reads and lead workflows to the documented wrappers, validating response shapes before UI mapping.
5. Keep payments, credit mutations, uploads, and admin actions blocked wherever authoritative contracts or authorization are missing.
6. Add tests/build gates supported by the actual project, then update this tracker with observed results and remaining blockers.

## Known external dependencies

- Approved non-production API base URL and credentials for login/registration/OTP and data workflow verification.
- Formal endpoint schemas, authentication requirements, and token refresh/revocation/role claims.
- Native document upload encoding/limits and supported file types.
- Server-created payment order/session and authoritative verification/webhook responsibilities.
