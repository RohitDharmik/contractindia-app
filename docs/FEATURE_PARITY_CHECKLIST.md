# Feature Parity Checklist

Status key: `Implemented` means a mobile route and behavior exist; it does not imply staging/backend verification. `Partial` means an intentionally limited native counterpart exists. `Blocked` means the source lacks a production-safe backend contract. Jest coverage is focused on the API wrapper contract and session state, not end-to-end UI behavior.

## Public experience

| Feature / web routes | Mobile status | Missing / notes | Testing |
|---|---|---|---|
| Home and public navigation (`/`) | Implemented | Native home and four tabs; account links cover informational routes | Typecheck; Expo startup pending |
| About, contact (`/about`, `/contact`) | Implemented | Static source content; phone/email actions use native Linking; no contact form exists in source | Typecheck |
| Company directory/detail (`/company-list`, `/company/:userId`) | Implemented | Real verified company API, registration/basic/services data, image URL, retry/empty states | API wrappers tested; staging not run |
| Service catalog/detail (`/service/:serviceId`) | Partial | Real service menu and matching contractor query; subscription validity/plan activation and service request workflow remain incomplete | API wrappers tested; UI/backend not run |
| Service pages (`/services/*`) | Partial | Dynamic service slug route browses actual root service categories; does not reproduce every page's hardcoded sample content | Typecheck |
| Marketplace/projects (`/marketplace`, `/projects`) | Partial | Honest routes explain current web pages are sample-only and direct users to live directory/services | Typecheck |
| Buy flows (`/services/buy`, `/services/buy2`) | Blocked | Mobile checkout disabled; existing web catalog and order IDs are local demo behavior | No payment tests run |
| Not-found/maintenance behavior (`*`) | Partial | Expo Router's not-found screen replaces web maintenance fallback | Not run |

## Authentication and session

| Feature | Mobile status | Missing / notes | Testing |
|---|---|---|---|
| Login + CAPTCHA + OTP (`/login`, `/otp`) | Implemented | Backend login and mobile OTP; session remains memory-only because no token lifecycle exists | API wrapper tests; auth UI/backend not run |
| Registration, dynamic location/service fields (`/register`) | Implemented | API-driven user types/states/cities/root services; native field validation and local CAPTCHA | Typecheck; registration API not run |
| Email/mobile OTP + resend | Implemented | Six-digit validation; registration email then mobile; login mobile; 30-second resend timer | Typecheck; API wrapper tests |
| Registration password setting | Implemented | SHA-256 behavior matches web; password is not persisted | Typecheck; API wrapper test not added |
| Session restore/logout | Blocked | No active token persistence/refresh contract; current sign-in ends on app restart | Session store tests pass |
| Role-based protected navigation | Partial | Individual/commercial dashboard routes check in-memory role; server-side access rules are unverified | Session role tests pass; navigation UI tests not run |
| Admin login | Blocked | Hardcoded demo-only credentials in web source; must not be ported | Not run |

## Dashboards and workflows

| Feature / routes | Mobile status | Missing / notes | Testing |
|---|---|---|---|
| Individual dashboard, profile, password, services | Partial | Real profile/service reads and dashboard; profile edit/password-change UI is unavailable pending field/endpoint confirmation | Typecheck; API reads not run |
| Individual plans/subscriptions/history | Partial | Reads plans/subscriptions; purchase intentionally disabled | Typecheck; payment not run |
| Commercial dashboard and profile wizard | Partial | Real overview profile/service/subscription data; full six-step editing/document upload/banking workflow not implemented | Typecheck; API reads not run |
| Service listing and activation | Partial | Service categories and verified contractors are live; subscription validity and service activation mutation not wired | Typecheck; API wrapper tests |
| Leads CRUD/filter (`/commercial/dashboard/leads`) | Implemented | Native list/create/edit/delete with source payload; no sample fallback | API wrappers tested; UI/backend not run |
| Client history | Partial | API-backed record list; no detail/edit contract established | Typecheck; backend not run |
| Settings | Blocked | Web data contract/page behavior not confirmed | Not run |
| Invoices and print/detail | Blocked | Current page uses demo data and referenced print route is inactive | Not run |
| Admin overview/verification/users/services/plans | Blocked | Admin access gate shown; hardcoded demo login is not ported | Not run |
| Admin payments/document taxonomy/security/analytics | Blocked | Admin auth; inspect and confirm each section’s APIs, permissions, and data | Not run |
| Admin action review (`/admin/user-action/:applicationId`) | Blocked | Direct-load data behavior and authorization must not depend on transient router state | Not run |
| Search, filtering, sorting, pagination, export | Partial | No mobile directory filters or CSV export; web mock-only pages not copied | Not run |
| File/document upload and images | Partial | Public company profile image URL is supported; native uploads are blocked pending request encoding/schema | Not run |

## Payments and credits

| Feature | Mobile status | Missing / notes | Testing |
|---|---|---|---|
| Razorpay subscription checkout | Blocked | Browser test-key flow has no order creation or authoritative verification/signature check; do not implement success activation | Not run |
| Service plan purchase and entitlement | Blocked | Same verification gap; subscription/service must activate only after backend verification | Not run |
| Payment history | Blocked | Existing endpoint is CRUD/history, not verification; history row must come from trusted server outcome | Not run |
| Add credits | Blocked | `AddCredits` explicitly demo; no balance/top-up API | Not run |
| My credits / transactions | Blocked | Hardcoded balances/transactions and timeout-based fake success | Not run |
| Cancellation/pending/interrupted/retry/receipt | Blocked | No lifecycle/status verification/receipt contract found | Not run |

## Architecture and quality gates

| Requirement | Mobile status | Missing / notes | Testing |
|---|---|---|---|
| Expo + Expo Router app structure | Implemented | Expo SDK 58 scaffold, typed route groups, `contractsindia` scheme | Expo Doctor 18/18; Android JS export passed |
| Axios client and TanStack Query | Implemented | Env-based base URL, metadata headers, body unwrapping, error normalization; no sensitive request logs | API wrapper tests pass |
| Secure session storage | Blocked | Requires confirmed backend token/session contract | Not run |
| Native responsive UI/accessibility/safe areas | Partial | Native scroll/forms/pickers/modals; device/screen-reader review remains | Not run |
| Deep links and Android Back | Partial | IDs and service return path configured; emulator deep-link/back tests remain | Not run |
| Jest / React Native Testing Library | Implemented | 7 tests cover API paths/payloads and session transitions | 2 suites, 7 tests passed |
| Typecheck, lint, Expo startup, Android bundle | Partial | TypeScript, Expo Doctor, Jest, Android JS export passed; emulator/device UI, Android APK/AAB, ESLint, and approved staging API remain unverified | Typecheck passed; Jest passed; Expo Doctor 18/18; Android export passed |
| Approved staging API test | Blocked | Need approved non-production API URL/access; no credentials requested or embedded | Not run |