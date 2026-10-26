# Route and Screen Inventory

Active routes below are from `src/routes.jsx`. “Auth” means the UI workflow expects the user to be logged in; the current router does not enforce it. Role is inferred from the destination or page purpose, not enforced by the router. Direct URL and Back behavior in the mobile column are implementation requirements, not claims about the current web app.

## Public routes

| Web route | Web component | Auth / role | Observed API dependency | Mobile destination and entry |
|---|---|---|---|---|
| `/` | `HomePage` | Public | Header/service data may use `ServiceMenuGet`, `ServiceRootGet`; page-specific calls require validation | Public home tab; logo/home navigation; direct link opens home |
| `/about` | `AboutUs` | Public | None confirmed | Public informational screen; Header/footer navigation |
| `/company-list` | `Companies` | Public | `UserRegistration/homeoageuserdetails`, user verification, document image | Company directory/list screen; public nav and detail links |
| `/company/:userId` | `CompanyDetailPage` | Public | Registration by user ID, basic information, user services, verified company list, document image | Company detail stack screen; directory card/deep link; preserve `userId`; Back to list |
| `/contact` | `ContactPage` | Public | No service endpoint confirmed | Contact screen; public navigation |
| `/projects` | `Projects` | Public | No endpoint confirmed in route-level evidence | Projects screen; public navigation |
| `/marketplace` | `Marketplace` | Public | No endpoint confirmed in route-level evidence | Marketplace screen; public navigation |
| `/service/:serviceId` | `CompanySubServices` | Public browse; service activation/payment expects signed-in user | Service menu, subscriptions, validity, plans, contractors, user service save, registration detail, payment-history write | Service catalog/detail stack screen; public service entry/deep link; preserve ID; login return destination; payment blocked pending backend verification |
| `/services/buy` | `BuyingService` | Public UI; checkout interaction needs validation | No confirmed server checkout contract; source generates client order IDs | Buy-services/cart screen; public navigation; no real payment until backend contract exists |
| `/services/buy2` | `BuyingService2` | Public | API usage not confirmed in route evidence | Alternative buy-services screen; public navigation |
| `/services/contractor` | `ContractorService` | Public | Service/company endpoints need page-level confirmation | Service information screen; public nav |
| `/services/consulting` | `ConsultingService` | Public | Service/company endpoints need page-level confirmation | Service information screen; public nav |
| `/services/assets-management` | `AssetsManagement` | Public | Not confirmed | Service information screen; public nav |
| `/services/brand-development` | `BrandDevelopment` | Public | Not confirmed | Service information screen; public nav |
| `/services/legal-contracts` | `LegalContracts` | Public | Not confirmed | Service information screen; public nav |
| `/services/marketing` | `MarketingManagement` | Public | Not confirmed | Service information screen; public nav |
| `/services/material-manufacturing` | `MaterialManufacture` | Public | Not confirmed | Service information screen; public nav |
| `/services/material-supply` | `MaterialSuppler` | Public | Not confirmed | Service information screen; public nav |
| `/services/tender` | `TenderServices` | Public | Not confirmed | Service information screen; public nav |
| `/services/contraction-audit` | `ContractionAudit` | Public | Not confirmed | Service information screen; public nav |

## Authentication routes

| Web route | Web component | Auth / role | APIs / behavior | Mobile destination and entry |
|---|---|---|---|---|
| `/login` | `LoginForm` | Public | `POST /Authentication/authenticate`; then OTP verification | Login screen; public Header/login; after success route to OTP and retain safe continuation state |
| `/register` | `RegisterForm` | Public | User types, states, root services, cities, registration save | Registration form; public Header/register; API-backed selectors |
| `/otp` | `OtpVerification` | Public with transient registration/login state | Email/mobile verify, resend OTP, set password | OTP/password setup stack; preserve flow ID and step through app restarts only if safely supported; Back to originating auth flow |
| `/admin/login` | `AdminLogin` | Currently demo-only; intended admin | No backend; hardcoded demo credential comparison | **Blocked** as production admin login until real admin auth endpoint/policy exists; do not port demo credential |

## Commercial dashboard routes

| Web route | Web component | Intended role | APIs / behavior | Mobile destination and entry |
|---|---|---|---|---|
| `/commercial/dashboard` | `Dashboard` in `CommercialDashboard` | Commercial (`userType=2`) | Registration lookup; overview includes mock metrics | Commercial dashboard tab; auth/role guard and session restoration before render |
| `/commercial/dashboard/profile` | `ProfileWizard` | Commercial | Common lists, basic info, registration, documents, service details, bank detail; multi-step wizard | Profile wizard stack with steps, validation, native file selection; profile tab/deep link |
| `/commercial/dashboard/credits` | `AddCredits` | Commercial | None; local simulated credits, explicit demo note | Credits screen; mark unavailable until real balance/top-up APIs/payment verification exist |
| `/commercial/dashboard/subscription` | `SubscriptionHistory` | Commercial | Subscription history | Subscription history screen; dashboard shortcut |
| `/commercial/dashboard/plans-and-subscriptions` | `PlansAndSubscriptions` | Commercial | Plans, payment-history save, subscription save, Razorpay browser checkout | Plan list/details; paid checkout blocked pending verified backend flow |
| `/commercial/dashboard/mycredits` | `MyCredits` | Commercial UI route | None; hardcoded balance and transaction rows, simulated success | Credits/history screen; blocked for production balance changes pending API |
| `/commercial/dashboard/clients` | `ClientsHistory` | Commercial | Client history | Client list/detail screen; dashboard navigation |
| `/commercial/dashboard/servicesListing` | `Step5ServiceListing` | Commercial | Service selection/detail APIs | Service listing screen; profile/dashboard navigation |
| `/commercial/dashboard/leads` | `LeadManagement` | Commercial | Lead CRUD endpoints | Leads list/detail/edit screen; dashboard navigation; native cards and filter |
| `/commercial/dashboard/settings` | `SettingsPanel` | Commercial | Endpoint usage needs validation | Settings screen; dashboard navigation |
| `/commercial/dashboard/invoices` | `InvoicesPage` | Commercial | Invoice page includes local/demo data; validate APIs | Invoice list/detail screen; dashboard navigation |

## Individual dashboard routes

| Web route | Web component | Intended role | APIs / behavior | Mobile destination and entry |
|---|---|---|---|---|
| `/individual/dashboard` | `Overview` in `IndividualDashboard` | Individual (`userType=1`) | Registration lookup; overview stats partly hardcoded | Individual dashboard tab; auth/role guard |
| `/individual/dashboard/MyServices` | `IndividualMyServices` | Individual | User services/subscriptions | My services list/detail; dashboard navigation |
| `/individual/dashboard/subscription` | `SubscriptionPlan` | Individual | Subscription UI | Subscription screen; this route exists but its nav item is commented out |
| `/individual/dashboard/plans-and-subscriptions` | `PlansAndSubscriptions` | Individual | Plans/payment/subscription endpoints; browser Razorpay | Plans screen; paid checkout blocked pending verification |
| `/individual/dashboard/mycredits` | `MyCredits` | Individual UI route | Local simulated balances/history | Credits screen; no production balance mutation |
| `/individual/dashboard/profile` | `MyProfile` | Individual | Registration/profile data; some local storage | Profile screen; dashboard navigation |
| `/individual/dashboard/password` | `ChangePassword` | Individual | Endpoint not confirmed in inspected screen slice | Change-password screen; dashboard navigation |

## Admin and action routes

| Web route or internal section | Web component | Intended role | API / behavior | Mobile destination and access |
|---|---|---|---|---|
| `/admin/dashboard` | `AdminDashboard` | Admin | Internal tabs: overview, user verification, service management, users, business plans, payment history, document categories, security, analytics; some additional document subcategory sectionMap entries | Admin stack/group only after backend admin authentication and authorization |
| `/admin/user-action/:applicationId` | `ActionWrapperMain` | Admin review workflow | Dynamic action/profile APIs; route comment notes navigation state includes `actionType`, `userRow`, `userTab` | Admin action review screen; preserve application ID; support direct load by fetching required data, not relying only on router state |

## Fallback and route notes

- `*` renders `UnderMaintenance`; mobile should use a not-found screen with a route back to a valid public destination.
- Several routes in `src/routes.jsx` are commented out (generic `/dashboard` and child paths, invoice print). They are not active route declarations and are not silently treated as active routes.
- `InvoiceDetail` references `/commercial/dashboard/invoices/print/:invoiceId`, but that route is commented out in the active router. Mobile should provide invoice details/export only after clarifying the supported print/receipt contract.
- Current route tree has no explicit route guard; all role labels above are inferred from destinations and UI behavior.

## Mobile navigation model

Public tabs: Home, Services/Marketplace, Companies, About/Contact as appropriate to the existing Header. Auth and public details use stack screens. Signed-in route groups are role-specific; direct links pass through session restoration and role authorization before display. Android Back returns to the previous stack destination, closes a modal first, then exits only from a root tab. Logout clears session state and resets protected navigation. Company/service IDs are supported deep-link parameters; administrative deep links require an authorized admin session.