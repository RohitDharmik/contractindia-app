# API Inventory

Source: `src/services/api.jsx` and its consumers. Paths below are relative to the configured base URL. Success responses are unwrapped by Axios to `response.data`; observed fields include `status`, `message`, `remark`, `value`, and `data`, but exact schemas are endpoint-specific and not consistently typed. “Backend auth” is unknown unless stated: the active interceptor does **not** attach its read access token because Authorization code is commented out. Do not infer that an endpoint is safe or public from that client behavior.

## Client behavior and headers

- Base URL priority: `VITE_API_URL`, `VITE_BASE_URL`, `BASE_URL`.
- Timeout 30s; request headers: `Accept: text/plain`, `Content-Type: application/json`; conditionally `X-Tenant-Id`; `Accept-Language` default `en`; `X-Timezone`; `X-Request-Id` generated with `crypto.randomUUID()`.
- Authorization is not currently attached. Refresh endpoint and refresh flow are commented out. The current 401 branch retries the same request once and is not a valid token refresh implementation.
- Successful response returns the response body, not the Axios response. Errors are converted to `{ status, message, errors }`.
- Existing client logs request configs and response bodies. Mobile must avoid logging credentials, OTPs, tokens, personal data, payment callbacks, and document contents.
- Request bodies described as “payload” below are passed through unchanged unless fields are explicitly listed; the web source does not define a schema. Confirm these with backend/OpenAPI before treating them as stable contracts.

## Authentication and registration

| Method | Endpoint | Request | Observed response/use | Auth / feature / error behavior |
|---|---|---|---|---|
| POST | `/Authentication/authenticate` | `{ emailId, password }`; login hashes password with SHA-256 in the web UI | `isLoginSuccessful`, `userType`, `mobileNo`, `value`, `remark` used | Auth contract; no token persistence evidenced; errors toast message |
| GET | `/Common/commonlist/userType` | None | List of `{ value, label }`-like records | Registration/admin verification selectors; error surfaced in query/form |
| GET | `/Common/commonlist/membershipType` | None | Not confirmed | Common-list data |
| POST | `/UserRegistration/save` | Pass-through payload; observed fields: `name`, `emailId`, `mobileNo`, `stateId`, `stateName`, `cityName`, `userType`, `companyName`, `serviceId`, `serviceName` | `status`, `message/remark`, `value` (GUID/ID) | Public registration; form displays validation/API errors |
| GET | `/UserRegistration/get${Param}` | Caller-supplied suffix/query | Consumed as registration records / `data` | Registration lookup; query construction varies by caller |
| GET | `/UserRegistration/get?isVerifiedByAdmin={status}&userType={type}` | Optional query parameters | `data` list | Admin verification; request retries in query |
| GET | `/UserRegistration/get?userId={id}` | User ID query | `data` registration record/list | Profile/company details; response shape normalized in caller |
| GET | `/UserRegistration/get?isVerifiedByAdmin=1&userType=2&serviceId={serviceId}` | Service ID query | `data` list | Verified contractor discovery |
| GET | `/UserRegistration/homeoageuserdetails?{params}` | Caller params; observed verified and userType filters | `data` list | Public companies/homepage; query failures have retry/loading handling |
| POST | `/UserRegistration/verify/email` | `{ id, otp }` | `status`, `message/error` | Registration verification; invalid result keeps current step |
| POST | `/UserRegistration/verify/mobile` | `{ id, otp }` | `status`, `message/error` | Login/registration verification; on success login routes by userType |
| POST | `/UserRegistration/userpassword` | `{ id, password }`; password is SHA-256 hashed in web | `status`, `message/error` | Registration completion; errors shown in UI |
| POST | `/UserRegistration/otp/resend/email` or `/UserRegistration/otp/resend/mobile` | `{ id }`; selected by `type` | Not confirmed | OTP resend; countdown is client-side 30 seconds |

## Common data, services, and plans

| Method | Endpoint | Request | Observed response/use | Auth / feature / error behavior |
|---|---|---|---|---|
| GET | `/Common/getstate/2` | None (`payload` argument unused) | State list; consumers expect value/label-like data | Registration/profile selector |
| GET | `/Common/getcity/{StateId}` | State ID path | City list | Registration selector; fetch on state change |
| GET | `/Common/commonlist/{commenlist}` | Common-list key path | List | Profile wizard lists |
| GET | `/ServiceMaster/getmenu` | None | Service tree/menu records | Public service browsing; tree assembled client-side |
| GET | `/ServiceMaster/rootservice` | None | Root service list | Registration/service selector |
| GET | `/ServiceMaster/get` | None | Service list | Admin service management |
| GET | `/ServiceMaster/get?ParentServiceID={serviceId}` | Parent ID query | Child services | Service management/navigation |
| POST | `/ServiceMaster/save` | Pass-through payload | `status/message` style consumed | Admin service CRUD |
| PUT | `/ServiceMaster/update` | Pass-through payload | `status/message` style consumed | Admin service CRUD |
| DELETE | `/ServiceMaster/delete/{planId}` | ID path (wrapper parameter is named planId) | Not confirmed | Admin service CRUD |
| GET | `/ServiceMaster/getuserservices?{Params}` | Caller query | User service list | Public company detail/service listing |
| GET | `/ServiceMaster/userservicesdetails?serviceId={serviceId}` | Service ID query | Wrapper returns `response.data` or `[]` | Service detail/contractors |
| GET | `/ServiceMaster/userservicesdetails?{Param}` | Caller query | Wrapper returns `response.data` or `[]` | Service detail/contractors |
| GET | `/PlanMaster/get` | None | Plan list | Admin plans |
| GET | `/PlanMaster/get?{planId}` | Query fragment supplied by caller (often `userType={type}`) | `data` plans | Plan selection; wrapper name is misleadingly “ById” |
| POST | `/PlanMaster/save` | Pass-through payload | `status/message` style consumed | Admin plan CRUD |
| PUT | `/PlanMaster/update` | Pass-through payload | `status/message` style consumed | Admin plan CRUD |
| DELETE | `/PlanMaster/delete/{planId}` | Plan ID path | Not confirmed | Admin plan CRUD |

## User profile, document, and service entitlements

| Method | Endpoint | Request | Observed response/use | Auth / feature / error behavior |
|---|---|---|---|---|
| POST | `/UserBasicInformation/save` | Pass-through payload | Status envelope consumed | Profile wizard basic/company information |
| PUT | `/UserBasicInformation/Update` | Pass-through payload | Status envelope consumed | Profile update |
| GET | `/UserBasicInformation/get?{params}` | Caller query; often userId | `data` record/list | Public company and profile details |
| POST | `/UserBankDetail/save` | Pass-through payload | Status envelope consumed | Commercial profile banking step; sensitive data handling required |
| GET | `/UserBankDetail/get?{Params}` | Caller query | Not confirmed | Profile/banking retrieval |
| POST | `/UserDocumentStore/save` | Pass-through payload; encoding/content type not established | Status envelope consumed | Profile document upload; native upload contract must be confirmed |
| PUT | `/UserDocumentStore/update` | Pass-through payload | Status envelope consumed | Document update |
| DELETE | `/UserDocumentStore/delete/{planId}` | ID path (wrapper parameter named planId) | Not confirmed | Document delete |
| GET | `/UserDocumentStore/get` | None | List | Documents/admin |
| GET | `/UserDocumentStore/get?{planId}` | Query fragment supplied by caller | Not confirmed | Document query |
| GET | `/UserDocumentStore/image?{params}` | Common observed params `userId`, `documentCategoryId`, `documentSubCategoryId` | Image/body; web sometimes constructs direct URL | Company/document image retrieval |
| POST | `/UserServiceDetails/save` | Pass-through payload; observed activation fields: `userServiceID`, `userID`, `serviceID`, `serviceName`, `planID`, `planName`, `amount`, `enterredBy`, `isActive`, `CompanyUserID` | `status`, `message` | Service activation; caller invalidates/refetches service/subscription data |
| PUT | `/UserServiceDetails/update` | Pass-through payload | Status envelope not typed | Service update |
| DELETE | `/UserServiceDetails/delete/{planId}` | ID path | Not confirmed | Service delete |
| GET | `/UserServiceDetails/get` | None | List | Service details |
| GET | `/UserServiceDetails/get?{param}` | Caller query | List/data | Service detail lookup |

## Subscriptions and payment history

| Method | Endpoint | Request | Observed response/use | Auth / feature / error behavior |
|---|---|---|---|---|
| GET | `/UserSubscriptionDetail/get` | None | Subscription list | Subscription history; exact envelope varies |
| GET | `/UserSubscriptionDetail/get?{params}` | Caller query, often userId | Subscription list | Service validity/plan status |
| POST | `/UserSubscriptionDetail/save` | Pass-through payload; observed fields include userID, planID, planName, remark, enterredBy, enterDate, isActive | `status`, `message` | Subscription create/activation; current web can mark active after client callback without authoritative verification |
| GET | `/UserSubscriptionDetail/checkvalidity?{params}` | Caller params, often userId | `status` used as active validity flag | Service access gating |
| POST | `/UserPaymentHistory/save` | Pass-through payload; web supplies userID, TransactionID, payment, paymentStatus, paymentMode, remark, enterredBy, enterDate, TransactionDate, isActive | `status`, `message` | Payment history write only; not a payment verification endpoint |
| PUT | `/UserPaymentHistory/update` | Pass-through payload | Not confirmed | Payment history admin CRUD |
| DELETE | `/UserPaymentHistory/delete/{planId}` | ID path | Not confirmed | Payment history admin CRUD |
| GET | `/UserPaymentHistory/get` | None | Payment records | Admin payment history |
| GET | `/UserPaymentHistory/get?{params}` | Caller query, documented example contains paymentId and userId | Payment record(s) | Payment details/history; query schema must be confirmed |

## Leads, clients, verification, and document taxonomy

| Method | Endpoint | Request | Observed response/use | Auth / feature / error behavior |
|---|---|---|---|---|
| GET | `/LeadMaster/get` | None | Array/list; screen falls back to hardcoded examples when falsy | Lead management; this fallback must not be used in mobile production |
| POST | `/LeadMaster/save` | Pass-through payload | `status` / message style | Lead create; query invalidated/refetched |
| PUT | `/LeadMaster/update` | Pass-through payload | `status` / message style | Lead update |
| DELETE | `/LeadMaster/delete/{leadId}` | Lead ID path | Not confirmed | Lead delete |
| GET | `/ClientMaster/get` | None | Client list | Commercial client history |
| POST | `/UserRegistration/verify/admin` | Observed `{ userId, approved }` | Status envelope | Admin approve/reject; should require server-enforced admin role |
| GET | `/DocumentCategory/get` | None | Category list | Admin document taxonomy |
| GET | `/DocumentCategory/get/{planId}` | ID path (parameter named planId) | Record/list | Admin document taxonomy |
| POST | `/DocumentCategory/save` | Pass-through payload | Status envelope | Admin document taxonomy CRUD |
| PUT | `/DocumentCategory/update` | Pass-through payload | Status envelope | Admin document taxonomy CRUD |
| DELETE | `/DocumentCategory/delete/{planId}` | ID path | Not confirmed | Admin document taxonomy CRUD |
| GET | `/DocumentSubCategory/get` | None | Subcategory list | Admin document taxonomy |
| GET | `/DocumentSubCategory/get/{planId}` | ID path (parameter named planId) | Record/list | Admin document taxonomy |
| POST | `/DocumentSubCategory/save` | Pass-through payload | Status envelope | Admin document taxonomy CRUD |
| PUT | `/DocumentSubCategory/update` | Pass-through payload | Status envelope | Admin document taxonomy CRUD |
| DELETE | `/DocumentSubCategory/delete/{planId}` | ID path | Not confirmed | Admin document taxonomy CRUD |

## API gaps requiring confirmation

- Formal schemas, auth requirements, token/session lifecycle, refresh endpoint, and user/admin role claims.
- Pagination/search/filter/sort query conventions; no common contract is visible in wrappers.
- File upload encoding, size limits, MIME types, progress support, and document authorization.
- Payment order/session creation, Razorpay native/hosted checkout contract, authoritative verification endpoint, webhook ownership, idempotency, refunds/cancellations, and receipt contract. None is present in the inspected wrappers.
- Whether `Accept: text/plain` is required; current code parses response bodies as JSON-shaped values after Axios unwrapping.
- `PlanMaster/get?${planId}` is parameterized by arbitrary query text; callers commonly pass `userType=...`, and the name implies an ID although it is not an ID path.