# Bakery API Consumer Inventory

This document records the current HTTP consumers of `frontend-bakery`. It is a route-organization baseline and preserves the existing paths, methods, authentication modes, and response contracts.

## HTTP Configuration And Sessions

- Base URL: `VITE_API_BASE`, normalized by `src/config/api.ts` and consumed through `apiUrl()`.
- Tenant resolution: `src/config/tenant.ts` derives the slug from local host aliases, configured public host, or subdomain; it falls back to `admin-panificadora`.
- HTTP transport: native `fetch`; no axios client is used.
- Admin session keys: `bread_admin_token`, `bread_admin_refresh`, and `bread_admin_user`.
- Customer session keys: `bread_customer_token`, `bread_customer_refresh`, and `bread_customer_user`.
- Session helpers validate the Bakery ecosystem and the expected role before returning a token.

## Authentication

| Method | Path | Auth | Body and response |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/bakery/login/admin/` | Public | `{ login, password, tenant_slug }`; returns access/refresh tokens, professional, role, ecosystem, and tenant. |
| POST | `/api/v1/auth/bakery/login/customer/` | Public | `{ login, password, tenant_slug }`; returns access/refresh tokens, role, and customer. |

Login consumers are `src/hooks/useAdminLogin.ts` and `src/hooks/useCustomerLogin.ts`. Validation errors read `detail`, `non_field_errors`, and field-level errors such as `login` and `password`.

## Customers

| Method | Path | Auth | Query/body and response |
| --- | --- | --- | --- |
| POST | `/api/v1/bakery/customers/register/` | Admin when present, otherwise public flow | Customer registration fields including nickname, customer type, identity, phone, and address; returns customer and customer tokens. |
| GET | `/api/v1/bakery/customers/nickname-availability/` | Public | Query: `nickname`, `tenant_slug`; returns `{ available }`. |
| GET | `/api/v1/bakery/customers/field-availability/` | Public | Query: `field`, `value`, `tenant_slug`; returns `{ available }`. |
| GET | `/api/v1/bakery/customers/` | Customer or admin | Optional status/search/open-balance/page-size filters; accepts array or paginated `results`. |
| GET | `/api/v1/bakery/customers/{id}/` | Admin | Loads a customer detail. |
| GET | `/api/v1/bakery/customers/{id}/balance/` | Customer or admin | Returns financial balance data. |
| GET | `/api/v1/bakery/customers/stats/` | Admin | Returns active, pending, blocked, and open-balance statistics. |
| POST | `/api/v1/bakery/customers/{id}/approve/` | Admin | Approves a customer; response can include `password_plain_text`. |
| POST | `/api/v1/bakery/customers/{id}/block/` | Admin | Body: `admin_password`, `reason`; returns the updated customer. |
| POST | `/api/v1/bakery/customers/{id}/unblock/` | Admin | Body: `admin_password`, `reason`; returns the updated customer. |
| POST | `/api/v1/bakery/customers/{id}/reveal-password/` | Admin | Body: `admin_password`; returns `password_plain_text`. |
| POST | `/api/v1/bakery/customers/{id}/set-password/` | Admin | Body: `admin_password`; returns a generated `password_plain_text`. |
| PATCH | `/api/v1/bakery/customers/{id}/` | Customer | Updates nickname, company, phone, and delivery address fields; persists `bread_customer_user`. |

Main consumers are `src/services/api.ts`, `src/hooks/useCustomerAuth.ts`, and `src/hooks/useAdminCustomers.ts`. Admin listing supports status, search, open-balance, ordering, and pagination filters. The UI normalizes API statuses such as `PENDING`, `APPROVED`, and `BLOCKED` to its display values.

## Products

| Method | Path | Auth | Body/response |
| --- | --- | --- | --- |
| GET | `/api/v1/bakery/products/` | Admin or customer | Returns an array or paginated `results` of products. |
| POST | `/api/v1/bakery/products/` | Admin | Body: `name`, `description`, `price`, `is_active`; returns the created product. |
| PATCH | `/api/v1/bakery/products/{id}/` | Admin | Partial product fields; returns the updated product. |
| DELETE | `/api/v1/bakery/products/{id}/` | Admin | Deletes a product; accepts `204 No Content` or JSON response. |

Consumers include `src/hooks/useProducts.ts`, `src/hooks/useCreateProduct.ts`, `src/hooks/useUpdateProduct.ts`, and `src/hooks/useDeleteProduct.ts`.

## Orders

| Method | Path | Auth | Query/body and response |
| --- | --- | --- | --- |
| GET | `/api/v1/bakery/orders/` | Customer or admin | Customer flow reads orders; admin flow supports status, customer, open-only, date, ordering, and pagination filters. |
| POST | `/api/v1/bakery/orders/` | Customer | Body includes customer, delivery date, payment method, notes, delivery address, and `{ product_id, quantity }` items. |
| POST | `/api/v1/bakery/orders/{id}/cancel/` | Customer or admin | Customer body: `reason`, `customer_password`; admin body: `reason`, `refund_method`, `admin_password`. |
| PATCH | `/api/v1/bakery/orders/{id}/status/` | Admin | Body: `status`, `admin_password`; returns updated status data. |

Consumers include `src/hooks/useCreateOrder.ts`, `src/hooks/useCustomerOrders.ts`, `src/hooks/useAdminOrders.ts`, `src/hooks/useCancelOrder.ts`, and `src/hooks/useUpdateOrderStatus.ts`. Responses use order fields such as `id`, `order_number`, `status`, dates, total value, and items.

## Ledger

| Method | Path | Auth | Response |
| --- | --- | --- | --- |
| GET | `/api/v1/bakery/ledger-entries/` | Customer | Array or paginated `results` of credit/debit transactions. |

The consumer is `src/hooks/useCustomerTransactions.ts`.

## Tenant And Current Identity

| Method | Path | Auth | Query/body and response |
| --- | --- | --- | --- |
| GET | `/api/v1/bakery/tenant/identity/` | Public | Query: `tenant_slug`; returns public Bakery tenant identity. |
| GET | `/api/v1/bakery/tenant/profile/` | Admin | Returns the authenticated tenant profile. |
| PATCH | `/api/v1/bakery/tenant/profile/` | Admin | Updates editable profile fields; identity fields such as name, slug, and ecosystem remain protected. |
| GET | `/register/professionals/me/` | Admin token when available | Returns current professional data used by the admin interface. |

Tenant consumers are centralized in `src/services/api.ts` and used by login, home, customer, and admin pages.

## CEP Lookup

| Method | Path | Auth | Body and response |
| --- | --- | --- | --- |
| POST | `/api/v1/bakery/customers/lookup-cep/` | Existing flow | Body: `{ zip_code }`; returns address fields or an `erro`/`detail` error. |

`src/hooks/useViaCEPLookup.ts` debounces lookup after eight digits and exposes success, error, and auto-focus callbacks.

## Telegram Professional Settings

These consumers use shared professional routes from the Bakery admin interface:

| Method | Path | Auth | Body/response |
| --- | --- | --- | --- |
| GET | `/register/professionals/telegram/link-start/` | Admin | Returns bot configuration, start token, link URL, and expiration. |
| POST | `/register/professionals/telegram/link-verify/` | Admin | Body: `{ start_token }`; returns Telegram link state and username. |
| POST | `/register/professionals/telegram/test-send/` | Admin | Empty object body; sends a test message. |
| GET | `/register/professionals/settings/` | Admin | Returns Telegram linked/active state, username, and last error. |

The client is `src/services/telegramLink.ts`.

## External Links

- `src/utils/whatsapp.ts` opens `https://wa.me/{phone}?text=...` for approved-customer access messages. This is a browser link, not a backend API consumer.
- No additional upload or multipart API consumer was identified in the reviewed flows.

## Validation Scripts

From the frontend Bakery root:

```bash
npm test -- --run
npm run lint
npm run build
```

These commands validate the current consumer code without changing the documented route contracts.
