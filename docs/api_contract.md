# Gabayan API Contract

## 1. Purpose and Status

This document is the canonical HTTP contract shared by:

- the Vue PWA;
- the JSON Server-based development API; and
- the future FastAPI production backend.

Status: proposed v1 contract. Implement the mock and frontend against this contract first. The future FastAPI service may use different persistence/domain internals, but it must preserve these public paths and JSON shapes or publish a versioned migration.

Aquaculture values in the mock are demo values. A rule becomes production-trusted only when `sourceStatus` is `VERIFIED` and its source metadata has passed product/domain review.

## 2. Transport Conventions

### Base URLs

```text
Development: http://localhost:3001/api/v1
Production:  ${VITE_API_BASE_URL}/api/v1
```

If `VITE_API_BASE_URL` already contains `/api/v1`, the client must not append it again. Choose one environment convention during scaffolding and enforce it in environment validation. Recommended: store the full API root, including `/api/v1`.

### General rules

| Concern          | Contract                                                                   |
| ---------------- | -------------------------------------------------------------------------- |
| Encoding         | UTF-8 JSON; `Content-Type: application/json`                               |
| Wire naming      | `camelCase`                                                                |
| IDs              | Opaque strings; UUID-compatible but never parsed by clients                |
| Timestamps       | RFC 3339 UTC strings, e.g. `2026-09-21T08:00:00Z`                          |
| Calendar dates   | `YYYY-MM-DD`                                                               |
| Display timezone | Client defaults to `Asia/Manila`                                           |
| Currency         | Integer minor units plus ISO currency; PHP centavos                        |
| Measurements     | Numeric value plus explicit unit, or fields whose unit is in the name      |
| Authentication   | `Authorization: Bearer <accessToken>` unless marked Public                 |
| Refresh          | Secure HttpOnly refresh cookie in production; simulated cookie in mock     |
| Idempotency      | `Idempotency-Key` header on order creation and high-impact record creation |
| Correlation      | Optional `X-Request-Id`; server returns/generates `requestId`              |

Do not use formatted strings such as `"₱1,299"`, `"30 m³"`, or `"Feb 20"` as model values. Formatting belongs to the client.

### Success envelopes

Single resource:

```json
{
  "data": {},
  "meta": {
    "requestId": "req_01K..."
  }
}
```

Collection:

```json
{
  "data": [],
  "page": {
    "cursor": null,
    "nextCursor": null,
    "limit": 20,
    "total": 0
  },
  "meta": {
    "requestId": "req_01K..."
  }
}
```

Mutation endpoints return the updated/created resource unless the endpoint explicitly returns `204 No Content`.

### Error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Enter dimensions greater than zero.",
    "fields": {
      "waterDepthM": ["Must be greater than 0."]
    },
    "details": null,
    "requestId": "req_01K..."
  }
}
```

Stable error codes:

| HTTP | Codes                                                                             |
| ---- | --------------------------------------------------------------------------------- |
| 400  | `BAD_REQUEST`, `INCOMPATIBLE_SELECTION`, `RULE_INPUT_INCOMPLETE`                  |
| 401  | `AUTH_REQUIRED`, `INVALID_CREDENTIALS`, `TOKEN_EXPIRED`                           |
| 403  | `FORBIDDEN`, `EMAIL_NOT_VERIFIED`                                                 |
| 404  | `NOT_FOUND`                                                                       |
| 409  | `CONFLICT`, `DUPLICATE_EMAIL`, `IDEMPOTENCY_CONFLICT`, `INVALID_STATE_TRANSITION` |
| 422  | `VALIDATION_ERROR`                                                                |
| 429  | `RATE_LIMITED`                                                                    |
| 500  | `INTERNAL_ERROR`, `CALCULATION_ERROR`                                             |
| 503  | `SERVICE_UNAVAILABLE`                                                             |

Validation paths use request JSON field names. The mock must not expose JSON Server/Express internals; FastAPI must translate default validation output into this envelope.

### Pagination, filter, and sort

- Cursor parameters: `cursor`, `limit` (default 20, maximum 100).
- Multi-value filters repeat the key: `status=ACTIVE&status=PRE_HARVEST`.
- Search uses `search` and is case-insensitive in the mock.
- Sort uses `sort=<field>` and `order=asc|desc`; each endpoint lists allowed sort fields.
- Unknown filters/sorts return `400 BAD_REQUEST` rather than silently changing behavior.

### Conditional and stale writes

Mutable resources expose integer `version`. Update requests may send `If-Match: <version>`. A stale version returns `409 CONFLICT` with the latest version in `details.currentVersion`. The mock should support this for cultivation/profile/cart settings where practical.

## 3. Resource Relationships

```mermaid
erDiagram
    USER ||--o{ CULTIVATION : owns
    USER ||--o{ ADDRESS : has
    USER ||--|| CART : owns
    USER ||--o{ ORDER : places
    USER ||--o{ NOTIFICATION : receives
    SPECIES ||--o{ CULTIVATION : configures
    CULTURE_ENVIRONMENT ||--o{ CULTIVATION : configures
    CULTIVATION ||--o{ FARM_TASK : schedules
    CULTIVATION ||--o{ GROWTH_MEASUREMENT : records
    CULTIVATION ||--o{ MORTALITY_RECORD : records
    CULTIVATION ||--o{ FEEDING_RECORD : records
    CULTIVATION ||--o{ WATER_CHECK : records
    CULTIVATION ||--o| HARVEST_RECORD : completes
    PRODUCT ||--o{ CART_ITEM : selected
    PRODUCT ||--o{ ORDER_ITEM : snapshots
    ORDER ||--o{ ORDER_ITEM : contains
    ORDER ||--o{ TRACKING_EVENT : tracks
```

## 4. Shared Types and Enums

### Primitive value objects

#### Money

| Field         | Type        | Required | Rules                    |
| ------------- | ----------- | -------: | ------------------------ |
| `amountMinor` | integer     |      yes | `>= 0`; centavos for PHP |
| `currency`    | string enum |      yes | `PHP` in v1              |

#### Quantity

| Field   | Type   | Required | Rules                                                     |
| ------- | ------ | -------: | --------------------------------------------------------- |
| `value` | number |      yes | finite; domain endpoint sets min/max                      |
| `unit`  | enum   |      yes | `G`, `KG`, `M`, `M2`, `M3`, `CELSIUS`, `COUNT`, `PERCENT` |

#### MediaAsset

| Field    | Type    | Required | Rules                                                            |
| -------- | ------- | -------: | ---------------------------------------------------------------- |
| `url`    | string  |      yes | HTTPS in production; local path allowed in mock                  |
| `alt`    | string  |      yes | Useful, non-decorative description or empty for decorative image |
| `width`  | integer |       no | Pixels, positive                                                 |
| `height` | integer |       no | Pixels, positive                                                 |

#### AuditFields

`createdAt`, `updatedAt` are RFC 3339 timestamps. Mutable resources also contain integer `version >= 1`.

### Enums

| Name                     | Values                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SourceStatus`           | `DEMO`, `DRAFT`, `VERIFIED`, `RETIRED`                                                                                                           |
| `CompatibilityStatus`    | `COMPATIBLE`, `CAUTION`, `NOT_RECOMMENDED`                                                                                                       |
| `StockingResultStatus`   | `BELOW_RANGE`, `RECOMMENDED`, `ABOVE_RANGE`                                                                                                      |
| `CultivationStatus`      | `PLANNING`, `ACTIVE`, `GROWING`, `PRE_HARVEST`, `COMPLETED`, `CANCELLED`                                                                         |
| `TaskType`               | `FEEDING`, `WATER_CHECK`, `WATER_MAINTENANCE`, `EQUIPMENT_INSPECTION`, `GROWTH_SAMPLING`, `CAGE_NET_INSPECTION`, `HARVEST_PREPARATION`, `CUSTOM` |
| `TaskStatus`             | `UPCOMING`, `DUE`, `COMPLETED`, `MISSED`, `CANCELLED`                                                                                            |
| `MortalityReason`        | `UNKNOWN`, `WATER_QUALITY`, `DISEASE`, `HANDLING`, `PREDATION`, `OTHER`                                                                          |
| `OrderStatus`            | `TO_PAY`, `PROCESSING`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`                                                                  |
| `PaymentMethodType`      | `CASH_ON_DELIVERY`, `GCASH`, `CARD`                                                                                                              |
| `ProductAvailability`    | `AVAILABLE`, `LOW_STOCK`, `OUT_OF_STOCK`                                                                                                         |
| `NotificationCategory`   | `CULTIVATION`, `ORDER`, `EDUCATION`, `SYSTEM`                                                                                                    |
| `NotificationType`       | `FEEDING_DUE`, `WATER_CHECK_DUE`, `GROWTH_SAMPLE_DUE`, `HARVEST_APPROACHING`, `ORDER_UPDATE`, `EDUCATIONAL_TIP`, `SYSTEM`                        |
| `HarvestReadinessStatus` | `NOT_READY`, `MONITOR`, `READY_SOON`, `POTENTIALLY_READY`, `INSUFFICIENT_DATA`                                                                   |

## 5. Endpoint Catalog

Every body and response name below is defined in the schema sections that follow. `Envelope<T>` means the single-resource envelope; `Page<T>` means the collection envelope.

### System

| Method and path |   Auth | Query/body | Success response        |
| --------------- | -----: | ---------- | ----------------------- |
| `GET /health`   | Public | none       | `200 Envelope<Health>`  |
| `GET /meta`     | Public | none       | `200 Envelope<ApiMeta>` |

### Authentication

| Method and path              |   Auth | Request body            | Success response                                       |
| ---------------------------- | -----: | ----------------------- | ------------------------------------------------------ |
| `POST /auth/register`        | Public | `RegisterRequest`       | `201 Envelope<AuthSession>` and refresh cookie         |
| `POST /auth/login`           | Public | `LoginRequest`          | `200 Envelope<AuthSession>` and refresh cookie         |
| `POST /auth/google`          | Public | `GoogleLoginRequest`    | `200 Envelope<AuthSession>`                            |
| `POST /auth/password/forgot` | Public | `ForgotPasswordRequest` | `202 Envelope<MessageResult>`                          |
| `POST /auth/password/reset`  | Public | `ResetPasswordRequest`  | `200 Envelope<MessageResult>` and revokes old sessions |
| `POST /auth/refresh`         | Cookie | none                    | `200 Envelope<AccessToken>`; rotates refresh cookie    |
| `POST /auth/logout`          |    yes | none                    | `204` and clears refresh cookie                        |

### Current user, farm, addresses, and preferences

| Method and path                          | Query/body                  | Success response                     |
| ---------------------------------------- | --------------------------- | ------------------------------------ |
| `GET /users/me`                          | none                        | `200 Envelope<UserProfile>`          |
| `PATCH /users/me`                        | `UpdateUserRequest`         | `200 Envelope<UserProfile>`          |
| `GET /users/me/farm`                     | none                        | `200 Envelope<FarmProfile>`          |
| `PUT /users/me/farm`                     | `UpsertFarmRequest`         | `200 Envelope<FarmProfile>`          |
| `GET /users/me/addresses`                | none                        | `200 Page<Address>`                  |
| `POST /users/me/addresses`               | `AddressWrite`              | `201 Envelope<Address>`              |
| `PATCH /users/me/addresses/{addressId}`  | `AddressPatch`              | `200 Envelope<Address>`              |
| `DELETE /users/me/addresses/{addressId}` | none                        | `204`                                |
| `GET /users/me/notification-settings`    | none                        | `200 Envelope<NotificationSettings>` |
| `PATCH /users/me/notification-settings`  | `NotificationSettingsPatch` | `200 Envelope<NotificationSettings>` |

Deleting a default address returns `409 CONFLICT` unless another address is promoted in the same product flow.

### Reference profiles and compatibility

| Method and path                             |   Auth | Query/body                            | Success response                    |
| ------------------------------------------- | -----: | ------------------------------------- | ----------------------------------- |
| `GET /species`                              | Public | `active=true`; `cursor`, `limit`      | `200 Page<SpeciesSummary>`          |
| `GET /species/{speciesId}`                  | Public | none                                  | `200 Envelope<SpeciesProfile>`      |
| `GET /culture-environments`                 | Public | `active=true`; pagination             | `200 Page<CultureEnvironment>`      |
| `GET /culture-environments/{environmentId}` | Public | none                                  | `200 Envelope<CultureEnvironment>`  |
| `GET /compatibility`                        | Public | required `speciesId`, `environmentId` | `200 Envelope<CompatibilityResult>` |
| `POST /stocking-estimates`                  |    yes | `StockingEstimateRequest`             | `200 Envelope<StockingEstimate>`    |

The reference reads are Public: they hold shared profile data and no account's records, and the setup wizard reads them before the farmer signs up.

### Dashboard and cultivations

| Method and path                                               | Query/body                                     | Success response                         |
| ------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------- |
| `GET /dashboard/home`                                         | optional `date=YYYY-MM-DD`                     | `200 Envelope<HomeDashboard>`            |
| `GET /cultivations`                                           | `status`, `cursor`, `limit`, `sort=createdAt   | estimatedHarvestDate`, `order`           | `200 Page<CultivationSummary>` |
| `POST /cultivations`                                          | `CreateCultivationRequest` + `Idempotency-Key` | `201 Envelope<CultivationDetail>`        |
| `GET /cultivations/{cultivationId}`                           | none                                           | `200 Envelope<CultivationDetail>`        |
| `PATCH /cultivations/{cultivationId}`                         | `UpdateCultivationRequest`                     | `200 Envelope<CultivationDetail>`        |
| `GET /cultivations/{cultivationId}/timeline`                  | none                                           | `200 Envelope<CultivationTimeline>`      |
| `GET /cultivations/{cultivationId}/equipment-recommendations` | optional `categoryId`                          | `200 Envelope<EquipmentRecommendations>` |

`PATCH /cultivations/{id}` permits name and editable planning metadata only. Stock, growth, mortality, and harvest values change through dedicated event endpoints.

### Tasks and operational records

| Method and path                               | Query/body                                                      | Success response                         |
| --------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------- |
| `GET /tasks`                                  | `date`, `cultivationId`, repeatable `status`, `cursor`, `limit` | `200 Page<FarmTask>`                     |
| `GET /tasks/{taskId}`                         | none                                                            | `200 Envelope<FarmTask>`                 |
| `POST /tasks/{taskId}/complete`               | `CompleteTaskRequest` + `Idempotency-Key`                       | `200 Envelope<TaskCompletionResult>`     |
| `POST /tasks/{taskId}/reopen`                 | `ReopenTaskRequest`                                             | `200 Envelope<FarmTask>`                 |
| `GET /cultivations/{id}/growth-measurements`  | `cursor`, `limit`, `sort=measuredOn`, `order`                   | `200 Page<GrowthMeasurement>`            |
| `POST /cultivations/{id}/growth-measurements` | `CreateGrowthMeasurementRequest` + idempotency                  | `201 Envelope<GrowthMutationResult>`     |
| `GET /cultivations/{id}/mortality-records`    | pagination/date filters                                         | `200 Page<MortalityRecord>`              |
| `POST /cultivations/{id}/mortality-records`   | `CreateMortalityRequest` + idempotency                          | `201 Envelope<MortalityMutationResult>`  |
| `GET /cultivations/{id}/feeding-plan`         | optional `date`                                                 | `200 Envelope<FeedingPlan>`              |
| `GET /cultivations/{id}/feeding-records`      | pagination/date filters                                         | `200 Page<FeedingRecord>`                |
| `POST /cultivations/{id}/feeding-records`     | `CreateFeedingRecordRequest` + idempotency                      | `201 Envelope<FeedingMutationResult>`    |
| `GET /cultivations/{id}/water-checks`         | pagination/date filters                                         | `200 Page<WaterCheck>`                   |
| `POST /cultivations/{id}/water-checks`        | `CreateWaterCheckRequest` + idempotency                         | `201 Envelope<WaterCheckMutationResult>` |

Task completion is atomic. For a feeding task, it updates the task and creates exactly one linked feeding record. Retrying with the same idempotency key returns the original response.

### Harvest

| Method and path                            | Query/body                                 | Success response                  |
| ------------------------------------------ | ------------------------------------------ | --------------------------------- |
| `GET /cultivations/{id}/harvest-readiness` | none                                       | `200 Envelope<HarvestReadiness>`  |
| `POST /cultivations/{id}/harvest`          | `CreateHarvestRequest` + `Idempotency-Key` | `201 Envelope<HarvestCompletion>` |

### Catalog and favorites

| Method and path                         |   Auth | Query/body                                                                                        | Success response               |
| --------------------------------------- | -----: | ------------------------------------------------------------------------------------------------- | ------------------------------ |
| `GET /product-categories`               | Public | none                                                                                              | `200 Page<ProductCategory>`    |
| `GET /products`                         |    yes | `search`, `categoryId`, `suitableSpeciesId`, `suitableEnvironmentId`, `availability`, `sort=price | rating                         | name`, `order`, pagination | `200 Page<ProductSummary>` |
| `GET /products/{productId}`             |    yes | none                                                                                              | `200 Envelope<ProductDetail>`  |
| `PUT /products/{productId}/favorite`    |    yes | none                                                                                              | `200 Envelope<FavoriteResult>` |
| `DELETE /products/{productId}/favorite` |    yes | none                                                                                              | `200 Envelope<FavoriteResult>` |

### Cart and checkout

| Method and path                 | Query/body              | Success response              |
| ------------------------------- | ----------------------- | ----------------------------- |
| `GET /cart`                     | none                    | `200 Envelope<Cart>`          |
| `POST /cart/items`              | `AddCartItemRequest`    | `201 Envelope<Cart>`          |
| `PATCH /cart/items/{itemId}`    | `UpdateCartItemRequest` | `200 Envelope<Cart>`          |
| `DELETE /cart/items/{itemId}`   | none                    | `200 Envelope<Cart>`          |
| `DELETE /cart/items`            | none                    | `200 Envelope<Cart>` (empty)  |
| `GET /checkout/payment-options` | none                    | `200 Page<PaymentOption>`     |
| `POST /checkout/quote`          | `CheckoutQuoteRequest`  | `200 Envelope<CheckoutQuote>` |

The server re-reads product prices and stock for every cart mutation and quote. The client never submits trusted totals.

### Orders

| Method and path                  | Query/body                                                | Success response              |
| -------------------------------- | --------------------------------------------------------- | ----------------------------- |
| `POST /orders`                   | `CreateOrderRequest` + `Idempotency-Key`                  | `201 Envelope<OrderDetail>`   |
| `GET /orders`                    | repeatable `status`, pagination, `sort=placedAt`, `order` | `200 Page<OrderSummary>`      |
| `GET /orders/{orderId}`          | none                                                      | `200 Envelope<OrderDetail>`   |
| `GET /orders/{orderId}/tracking` | none                                                      | `200 Envelope<OrderTracking>` |
| `POST /orders/{orderId}/cancel`  | `CancelOrderRequest`                                      | `200 Envelope<OrderDetail>`   |

Cancellation is allowed only in server-defined states. Invalid cancellation returns `409 INVALID_STATE_TRANSITION`.

### Notifications

| Method and path                             | Query/body                                                           | Success response             |
| ------------------------------------------- | -------------------------------------------------------------------- | ---------------------------- |
| `GET /notifications`                        | repeatable `category`, `read`, pagination, `sort=createdAt`, `order` | `200 Page<Notification>`     |
| `GET /notifications/unread-count`           | none                                                                 | `200 Envelope<UnreadCount>`  |
| `POST /notifications/{notificationId}/read` | none                                                                 | `200 Envelope<Notification>` |
| `POST /notifications/read-all`              | optional `ReadAllNotificationsRequest`                               | `200 Envelope<UnreadCount>`  |

## 6. Identity and User Schemas

### Health and API metadata

- `Health`: `{ status: "ok" | "degraded", service: string, version: string, timestamp: string }`.
- `ApiMeta`: `{ apiVersion: "v1", environment: string, demoData: boolean, serverTime: string, defaultTimezone: "Asia/Manila" }`.

### RegisterRequest

| Field                  | Type    | Required | Validation                                                   |
| ---------------------- | ------- | -------: | ------------------------------------------------------------ |
| `fullName`             | string  |      yes | 2-100 trimmed characters                                     |
| `email`                | string  |      yes | valid email, normalized lowercase                            |
| `mobileNumber`         | string  |      yes | E.164 preferred; Philippine formats accepted then normalized |
| `password`             | string  |      yes | 8-128 characters; server policy may strengthen               |
| `confirmPassword`      | string  |      yes | must match `password`; never persisted                       |
| `acceptedTerms`        | boolean |      yes | must be true                                                 |
| `acceptedTermsVersion` | string  |      yes | current displayed version                                    |

### Login and Google requests

- `LoginRequest`: `{ identifier: string, password: string }`, where identifier is email or mobile number.
- `GoogleLoginRequest`: `{ idToken: string }`. The mock recognizes a documented fixture token only.
- `ForgotPasswordRequest`: `{ identifier: string }`, where identifier is email or mobile number. The response is identical whether or not an account exists.
- `ResetPasswordRequest`: `{ token: string, password: string, confirmPassword: string }`; passwords follow registration rules and must match.
- `MessageResult`: `{ message: string }`. The mock exposes its reset token only through a documented test fixture, never in this response.

Development mock fixtures only:

| Purpose             | Fixture value                          |
| ------------------- | -------------------------------------- |
| Existing demo login | `juan@example.com` / `Gabayan123!`     |
| Google placeholder  | `idToken: "demo-google-token"`         |
| Password-reset test | query/request token `demo-reset-token` |

These values are deterministic test fixtures, not production credentials. FastAPI must integrate
with the selected identity provider and must not accept these fixture tokens.

### AccessToken and AuthSession

- `AccessToken`: `{ accessToken: string, tokenType: "Bearer", expiresInSeconds: integer }`.
- `AuthSession`: `{ accessToken, tokenType, expiresInSeconds, user: UserProfile, onboarding: { hasCultivation: boolean, suggestedRoute: string } }`.

### UserProfile

| Field                               | Type                 | Required |
| ----------------------------------- | -------------------- | -------: |
| `id`                                | string               |      yes |
| `fullName`                          | string               |      yes |
| `email`                             | string               |      yes |
| `mobileNumber`                      | string               |      yes |
| `avatar`                            | `MediaAsset \| null` |      yes |
| `emailVerified`                     | boolean              |      yes |
| `mobileVerified`                    | boolean              |      yes |
| `locale`                            | string               |      yes |
| `timezone`                          | string               |      yes |
| `createdAt`, `updatedAt`, `version` | audit fields         |      yes |

`UpdateUserRequest` permits `fullName`, `mobileNumber`, `avatarUrl`, `locale`, and `timezone`; at least one field is required. Email changes require a future verification flow and are not in v1.

### FarmProfile

| Field             | Type                                      | Required |
| ----------------- | ----------------------------------------- | -------: |
| `id`              | string                                    |      yes |
| `ownerUserId`     | string                                    |      yes |
| `name`            | string                                    |      yes |
| `region`          | string or null                            |      yes |
| `province`        | string or null                            |      yes |
| `municipality`    | string or null                            |      yes |
| `experienceLevel` | `BEGINNER \| INTERMEDIATE \| EXPERIENCED` |      yes |
| `notes`           | string or null                            |      yes |
| audit fields      | audit                                     |      yes |

`UpsertFarmRequest` contains the writable fields above, with `name` required on first creation.

### Address

| Field                  | Type           |        Required |
| ---------------------- | -------------- | --------------: |
| `id`                   | string         |   response only |
| `label`                | string         |             yes |
| `recipientName`        | string         |             yes |
| `mobileNumber`         | string         |             yes |
| `line1`                | string         |             yes |
| `line2`                | string or null |              no |
| `barangay`             | string         |             yes |
| `cityMunicipality`     | string         |             yes |
| `province`             | string         |             yes |
| `region`               | string         |             yes |
| `postalCode`           | string         |             yes |
| `countryCode`          | string         | yes; `PH` in v1 |
| `deliveryInstructions` | string or null |              no |
| `isDefault`            | boolean        |             yes |
| audit fields           | audit          |   response only |

`AddressWrite` requires all yes fields. `AddressPatch` permits any writable subset.

### NotificationSettings

| Field                  | Type            |
| ---------------------- | --------------- |
| `feedingReminders`     | boolean         |
| `waterMaintenance`     | boolean         |
| `growthSampling`       | boolean         |
| `harvestReminders`     | boolean         |
| `orderUpdates`         | boolean         |
| `educationalTips`      | boolean         |
| `morningFeedingTime`   | `HH:mm` or null |
| `afternoonFeedingTime` | `HH:mm` or null |
| `timezone`             | IANA timezone   |
| `updatedAt`, `version` | audit subset    |

`NotificationSettingsPatch` permits any non-empty subset and validates feeding times when reminders are enabled.

## 7. Reference, Rules, and Estimate Schemas

### SpeciesSummary

`{ id, commonName, localName, slug, shortDescription, beginnerFriendly, image, estimatedCultureDays: { minimum, maximum }, active, sourceStatus }`.

Initial mock species: Tilapia, Milkfish/Bangus, Catfish/Hito, and Carp.

### SpeciesProfile

Extends `SpeciesSummary` with:

| Field                      | Type                | Notes                                   |
| -------------------------- | ------------------- | --------------------------------------- |
| `compatibleEnvironmentIds` | string[]            | Never infer that all environments work  |
| `growthStages`             | `GrowthStageRule[]` | Configurable; may be demo               |
| `stockingRules`            | `StockingRule[]`    | Environment-specific                    |
| `feedingRules`             | `FeedingRule[]`     | Stage-specific                          |
| `waterGuidance`            | `GuidanceRule[]`    | Environment-aware language              |
| `targetHarvestWeight`      | `Quantity \| null`  | Range may be preferable later           |
| `sources`                  | `RuleSource[]`      | Human-readable provenance               |
| `ruleVersion`              | string              | Immutable version identifier            |
| `disclaimer`               | string              | Required for non-verified/demo guidance |

### CultureEnvironment

`{ id, code, name, shortDescription, image, active, dimensionModel: "RECTANGULAR_VOLUME", guidanceSummary, sourceStatus }`.

Initial mock environments: Pond, Tank/Container, and Fish Cage. The rectangular calculator is a planning approximation and may require future environment-specific shapes.

### Rule models

- `GrowthStageRule`: `{ id, name, minimumDay, maximumDay, expectedWeightRange: { minimum: Quantity, maximum: Quantity }, sourceStatus }`.
- `StockingRule`: `{ id, speciesId, environmentId, basis: "SURFACE_AREA" | "WATER_VOLUME", minimumDensity, maximumDensity, densityUnit: "FISH_PER_M2" | "FISH_PER_M3", sourceStatus, ruleVersion }`.
- `FeedingRule`: `{ id, speciesId, growthStage, feedRatePercentRange, feedingsPerDay, sourceStatus, ruleVersion }`.
- `GuidanceRule`: `{ id, title, message, trigger, sourceStatus, ruleVersion }`.
- `RuleSource`: `{ title, organization, url: string | null, reviewedAt: string | null, reviewedBy: string | null }`.

### CompatibilityResult

`{ speciesId, environmentId, status, title, message, alternatives: [{ environmentId, name }], sourceStatus, ruleVersion }`.

### StockingEstimateRequest

| Field                    | Type    | Required | Rules                                        |
| ------------------------ | ------- | -------: | -------------------------------------------- |
| `speciesId`              | string  |      yes | active species                               |
| `environmentId`          | string  |      yes | active environment                           |
| `dimensions.lengthM`     | number  |      yes | `> 0` and within configured safe input bound |
| `dimensions.widthM`      | number  |      yes | `> 0`                                        |
| `dimensions.waterDepthM` | number  |      yes | `> 0`                                        |
| `plannedFingerlings`     | integer |      yes | `> 0`                                        |

### StockingEstimate

| Field                    | Type                   | Notes                                           |
| ------------------------ | ---------------------- | ----------------------------------------------- |
| `estimateId`             | string                 | Referenced during cultivation creation          |
| `species`                | `SpeciesSummary`       | Snapshot                                        |
| `environment`            | `CultureEnvironment`   | Snapshot                                        |
| `dimensions`             | request dimensions     | Meters                                          |
| `surfaceAreaM2`          | number                 | Server-derived                                  |
| `estimatedWaterVolumeM3` | number                 | Server-derived                                  |
| `plannedFingerlings`     | integer                | User value                                      |
| `recommendedMinimum`     | integer                | Rule-derived                                    |
| `recommendedMaximum`     | integer                | Rule-derived                                    |
| `status`                 | `StockingResultStatus` | Below/recommended/above                         |
| `differenceToRange`      | integer                | 0 in range; signed nearest-bound difference     |
| `suggestedFingerlings`   | integer                | A reasonable point in range, not forced maximum |
| `basis`                  | `EstimateBasis`        | Explainability                                  |
| `compatibility`          | `CompatibilityResult`  | Explicit compatibility                          |
| `isDemo`                 | boolean                | Required                                        |
| `sourceStatus`           | `SourceStatus`         | Required                                        |
| `ruleVersion`            | string                 | Required                                        |
| `expiresAt`              | timestamp              | Prevent stale plan creation                     |
| `disclaimer`             | string                 | Required                                        |

`EstimateBasis` is `{ type, densityMinimum, densityMaximum, densityUnit, inputAreaM2, inputVolumeM3, explanation }`.

Representative response:

```json
{
  "data": {
    "estimateId": "est_demo_tilapia_pond_500",
    "species": { "id": "sp_tilapia", "commonName": "Tilapia", "localName": "Tilapia" },
    "environment": { "id": "env_pond", "code": "POND", "name": "Pond" },
    "dimensions": { "lengthM": 5, "widthM": 4, "waterDepthM": 1.5 },
    "surfaceAreaM2": 20,
    "estimatedWaterVolumeM3": 30,
    "plannedFingerlings": 500,
    "recommendedMinimum": 450,
    "recommendedMaximum": 550,
    "status": "RECOMMENDED",
    "differenceToRange": 0,
    "suggestedFingerlings": 500,
    "basis": {
      "type": "WATER_VOLUME",
      "densityMinimum": 15,
      "densityMaximum": 18.3333,
      "densityUnit": "FISH_PER_M3",
      "inputAreaM2": 20,
      "inputVolumeM3": 30,
      "explanation": "Demo density range for this prototype profile."
    },
    "compatibility": {
      "speciesId": "sp_tilapia",
      "environmentId": "env_pond",
      "status": "COMPATIBLE",
      "title": "This setup can be planned",
      "message": "This demo profile supports Tilapia in a pond.",
      "alternatives": [],
      "sourceStatus": "DEMO",
      "ruleVersion": "demo-2026-09"
    },
    "isDemo": true,
    "sourceStatus": "DEMO",
    "ruleVersion": "demo-2026-09",
    "expiresAt": "2026-09-21T09:00:00Z",
    "disclaimer": "Gabayan's recommendations are estimates and may vary based on water quality, climate, fish health, feed quality, management practices, and local conditions."
  },
  "meta": { "requestId": "req_demo_001" }
}
```

## 8. Cultivation Schemas

### CreateCultivationRequest

| Field                       | Type           |    Required | Notes                                              |
| --------------------------- | -------------- | ----------: | -------------------------------------------------- |
| `name`                      | string         |          no | Server generates `Species - Batch #NNN` if omitted |
| `estimateId`                | string         |         yes | Unexpired estimate                                 |
| `speciesId`                 | string         |         yes | Must match estimate                                |
| `environmentId`             | string         |         yes | Must match estimate                                |
| `dimensions`                | object         |         yes | Must match estimate                                |
| `initialFingerlings`        | integer        |         yes | May differ if user adjusts and re-estimates        |
| `stockedOn`                 | date or null   |          no | Null keeps status `PLANNING`                       |
| `acceptedAboveRangeWarning` | boolean        | conditional | Must be true for `ABOVE_RANGE`                     |
| `aboveRangeReason`          | string or null |          no | Optional audit note                                |

### UpdateCultivationRequest

Non-empty subset of `{ name, stockedOn, notes }`. Setting `stockedOn` on a planning cultivation may activate it; state transitions remain server-owned.

### CultivationSummary

| Field                               | Type                                           |
| ----------------------------------- | ---------------------------------------------- |
| `id`, `name`                        | string                                         |
| `species`                           | compact `{ id, commonName, localName, image }` |
| `environment`                       | compact `{ id, code, name }`                   |
| `status`                            | `CultivationStatus`                            |
| `dayNumber`                         | integer or null                                |
| `estimatedDurationDays`             | integer or null                                |
| `progressPercent`                   | number 0-100                                   |
| `initialFingerlings`                | integer                                        |
| `estimatedLiveFish`                 | integer                                        |
| `estimatedHarvestDate`              | date or null                                   |
| `nextTaskAt`                        | timestamp or null                              |
| `stockingStatus`                    | `StockingResultStatus`                         |
| `createdAt`, `updatedAt`, `version` | audit                                          |

### CultivationDetail

Extends `CultivationSummary` with:

| Field                      | Type                                                                     |
| -------------------------- | ------------------------------------------------------------------------ |
| `dimensions`               | `{ lengthM, widthM, waterDepthM }`                                       |
| `surfaceAreaM2`            | number                                                                   |
| `estimatedWaterVolumeM3`   | number                                                                   |
| `stockedOn`                | date or null                                                             |
| `recordedMortality`        | integer                                                                  |
| `latestGrowthMeasurement`  | `GrowthMeasurement \| null`                                              |
| `growthStage`              | `{ code, name, isEstimated }`                                            |
| `feedingSummary`           | `{ dailyFeed: Quantity, feedingsPerDay, nextFeedingAt, planId } \| null` |
| `harvestSummary`           | `{ targetWeight, readinessStatus, estimatedHarvestDate }`                |
| `stockingEstimateSnapshot` | `StockingEstimate`                                                       |
| `recommendationDisclaimer` | string                                                                   |
| `notes`                    | string or null                                                           |

### Timeline

- `CultivationTimeline`: `{ cultivationId, currentStage, events: TimelineEvent[] }`.
- `TimelineEvent`: `{ id, type, label, status: "COMPLETED" | "CURRENT" | "UPCOMING", occurredOn: date | null, estimatedOn: date | null, detail: string | null }`.

### HomeDashboard

| Field                     | Type                                                                           |
| ------------------------- | ------------------------------------------------------------------------------ |
| `date`                    | date                                                                           |
| `greetingName`            | string                                                                         |
| `primaryCultivation`      | `CultivationSummary \| null`                                                   |
| `taskSummary`             | `{ completed, total }`                                                         |
| `tasks`                   | `FarmTask[]`                                                                   |
| `farmOverview`            | `{ fishAgeDays, estimatedAverageWeight, dailyFeed, daysUntilHarvest } \| null` |
| `tip`                     | `EducationalTip`                                                               |
| `unreadNotificationCount` | integer                                                                        |

`EducationalTip`: `{ id, title, message, image: MediaAsset | null, learnMoreUrl: string | null, sourceStatus, isDemo, ruleVersion, disclaimer }`.

Demo tips must expose their rule version and a visible disclaimer so general guidance cannot be
mistaken for site-specific professional advice.

### EquipmentRecommendations

`{ cultivationId, context: { species, environment, initialFingerlings, estimatedWaterVolumeM3 }, sections: [{ category: ProductCategory, reason, products: RecommendedProduct[] }], isDemo, ruleVersion, disclaimer }`.

`RecommendedProduct` extends `ProductSummary` with `{ recommendationBadge, whyRelevant, suggestedQuantity, mandatory: false }`.

## 9. Task and Operational Record Schemas

### FarmTask

| Field                  | Type               |
| ---------------------- | ------------------ |
| `id`, `cultivationId`  | string             |
| `type`                 | `TaskType`         |
| `title`, `instruction` | string             |
| `scheduledAt`, `dueAt` | timestamp          |
| `status`               | `TaskStatus`       |
| `recommendedAmount`    | `Quantity \| null` |
| `completedAt`          | timestamp or null  |
| `completionRecordType` | string or null     |
| `completionRecordId`   | string or null     |
| `deepLink`             | app-relative route |
| audit fields           | audit              |

### CompleteTaskRequest and result

| Field              | Type               |                           Required |
| ------------------ | ------------------ | ---------------------------------: |
| `completedAt`      | timestamp          |                                yes |
| `actualAmount`     | `Quantity`         |          for feeding; otherwise no |
| `notes`            | string or null     |                                 no |
| `waterObservation` | `WaterObservation` | for water-check task; otherwise no |

`TaskCompletionResult`: `{ task: FarmTask, linkedRecord: FeedingRecord | WaterCheck | null, cultivationSnapshot: CultivationSummary }`.

`ReopenTaskRequest`: `{ reason: string }`. Reopening reverses only a record explicitly marked reversible; otherwise returns `409`.

### GrowthMeasurement

| Field                 | Type                             |
| --------------------- | -------------------------------- |
| `id`, `cultivationId` | string                           |
| `measuredOn`          | date                             |
| `numberOfFishSampled` | integer `> 0`                    |
| `averageWeight`       | `Quantity` with unit `G` or `KG` |
| `notes`               | string or null                   |
| `recordedBy`          | compact user                     |
| audit fields          | audit                            |

`CreateGrowthMeasurementRequest`: `{ measuredOn, numberOfFishSampled, averageWeight, notes? }`.

`GrowthMutationResult`: `{ record: GrowthMeasurement, previousAverageWeight: Quantity | null, change: Quantity | null, feedingPlan: FeedingPlan, harvestReadiness: HarvestReadiness }`.

### MortalityRecord

`{ id, cultivationId, occurredOn, fishCount, reason, notes, recordedBy, createdAt }`.

`CreateMortalityRequest`: `{ occurredOn: date, fishCount: integer > 0, reason: MortalityReason, notes?: string | null }`.

`MortalityMutationResult`: `{ record, stock: { initialFingerlings, recordedMortality, estimatedLiveFish }, feedingPlan }`.

The server rejects mortality that would make estimated live fish negative.

### FeedingPlan and record

`FeedingPlan`:

| Field                                                 | Type                                          |
| ----------------------------------------------------- | --------------------------------------------- |
| `id`, `cultivationId`                                 | string                                        |
| `date`                                                | date                                          |
| `dailyTotal`                                          | `Quantity`                                    |
| `feedings`                                            | `[{ label, scheduledAt, recommendedAmount }]` |
| `estimatedLiveFish`                                   | integer                                       |
| `estimatedAverageWeight`                              | `Quantity`                                    |
| `growthStage`                                         | string                                        |
| `feedRatePercent`                                     | number                                        |
| `explanation`                                         | string                                        |
| `isDemo`, `sourceStatus`, `ruleVersion`, `disclaimer` | provenance                                    |

`FeedingRecord`: `{ id, cultivationId, taskId: string | null, fedAt, amount: Quantity, notes, recordedBy, createdAt }`; `taskId` is null for a feeding recorded without a task.

`CreateFeedingRecordRequest`: `{ fedAt, amount, taskId?: string | null, notes?: string | null }`.

`FeedingMutationResult`: `{ record, completedTask: FarmTask | null, dailyProgress: { recorded: Quantity, planned: Quantity } }`.

### Water check

`WaterObservation` permits optional `{ temperatureC, dissolvedOxygenMgL, ph, clarity, odor, fishBehavior, unusualChanges: boolean }`; v1 UI may expose only the qualitative fields.

`WaterCheck`: `{ id, cultivationId, checkedAt, observation: WaterObservation, actionTaken, notes, guidance, recordedBy, createdAt }`.

`CreateWaterCheckRequest`: `{ checkedAt, observation, actionTaken?: string | null, notes?: string | null }`.

`WaterCheckMutationResult`: `{ record: WaterCheck, generatedTasks: FarmTask[], guidance: GuidanceMessage[] }`.

`GuidanceMessage`: `{ severity: "INFO" | "CAUTION" | "ACTION", title, message, sourceStatus, ruleVersion, disclaimer }`. Guidance must use conditional language; never universally instruct full water replacement.

## 10. Harvest Schemas

### HarvestReadiness

| Field                                                 | Type                                               |
| ----------------------------------------------------- | -------------------------------------------------- |
| `cultivationId`                                       | string                                             |
| `status`                                              | `HarvestReadinessStatus`                           |
| `estimatedAverageWeight`                              | `Quantity \| null`                                 |
| `targetWeightRange`                                   | `{ minimum: Quantity, maximum: Quantity } \| null` |
| `estimatedLiveFish`                                   | integer                                            |
| `estimatedBiomass`                                    | `Quantity \| null`                                 |
| `estimatedHarvestDate`                                | date or null                                       |
| `latestMeasurementOn`                                 | date or null                                       |
| `basis`                                               | string[]                                           |
| `message`                                             | string                                             |
| `isDemo`, `sourceStatus`, `ruleVersion`, `disclaimer` | provenance                                         |

When current measurements are missing or stale, return `INSUFFICIENT_DATA` or `MONITOR`, not a false readiness claim.

### CreateHarvestRequest

| Field                | Type                      | Required |
| -------------------- | ------------------------- | -------: |
| `harvestDate`        | date                      |      yes |
| `numberHarvested`    | integer `> 0`             |      yes |
| `totalHarvestWeight` | `Quantity` in `KG`        |      yes |
| `averageFishWeight`  | `Quantity` in `G` or `KG` |      yes |
| `sellingPricePerKg`  | `Money`                   |      yes |
| `notes`              | string or null            |       no |

### HarvestRecord and completion

`HarvestRecord`: request fields plus `{ id, cultivationId, estimatedRevenue: Money, createdAt, recordedBy }`.

`HarvestCompletion`: `{ cultivation: CultivationDetail, harvest: HarvestRecord, summary: CultivationCompletionSummary }`.

`CultivationCompletionSummary`: `{ cultureDurationDays, fingerlingsStocked, fishHarvested, recordedMortality, survivalRatePercent, totalHarvestWeight, estimatedFeedUsed, estimatedExpenses, estimatedRevenue, isDemo }`.

Revenue equals total harvest kilograms multiplied by price per kilogram using decimal-safe server arithmetic and rounded once to minor units. `estimatedExpenses` may be null until expense tracking exists.

## 11. Catalog, Cart, and Order Schemas

### ProductCategory

`{ id, code, name, icon, sortOrder }`. Initial categories: Feeds, Aeration, Water Pumps, Testing, Nets, Tanks, Filters, and Tools.

### ProductSummary

| Field                                   | Type                  |
| --------------------------------------- | --------------------- |
| `id`, `sku`, `name`, `shortDescription` | string                |
| `primaryImage`                          | `MediaAsset`          |
| `price`                                 | `Money`               |
| `rating`                                | number 0-5 or null    |
| `ratingCount`, `soldCount`              | integer               |
| `availability`                          | `ProductAvailability` |
| `stockQuantity`                         | integer or null       |
| `category`                              | `ProductCategory`     |
| `badges`                                | string[]              |
| `isFavorite`                            | boolean               |

### ProductDetail

Extends `ProductSummary` with `{ images, description, specifications: [{ label, value }], suitableSpeciesIds, suitableEnvironmentIds, recommendation: { cultivationId, why } | null, maximumOrderQuantity }`.

`FavoriteResult`: `{ productId, isFavorite }`.

### Cart requests and model

- `AddCartItemRequest`: `{ productId: string, quantity: integer > 0 }`.
- `UpdateCartItemRequest`: `{ quantity: integer > 0 }`.
- `CartItem`: `{ id, product: ProductSummary, quantity, unitPrice: Money, lineTotal: Money, addedAt }`.
- `Cart`: `{ id, items: CartItem[], itemCount, subtotal: Money, estimatedDeliveryFee: Money, estimatedTotal: Money, updatedAt, version }`.

Adding an existing product increments its quantity unless doing so violates stock or maximum quantity, in which case the server returns `409 CONFLICT`.

### PaymentOption

`{ type: PaymentMethodType, label, description, enabled, disabledReason: string | null }`.

### Checkout quote

`CheckoutQuoteRequest`: `{ addressId, contact: { fullName, mobileNumber, email }, paymentMethod, cartVersion }`.

`CheckoutQuote`: `{ quoteId, cartVersion, items: OrderItem[], deliveryAddress: AddressSnapshot, contact, paymentMethod, subtotal, deliveryFee, total, expiresAt, warnings: string[] }`.

### CreateOrderRequest

`{ quoteId: string, acceptedTotal: Money }`. `acceptedTotal` detects a price change; the server remains authoritative. Expired/changed quotes return `409 CONFLICT` and include a new quote hint.

### Order models

`OrderItem` snapshots `{ id, productId, sku, name, image, quantity, unitPrice, lineTotal }` so catalog changes do not rewrite order history.

`OrderSummary`:

| Field                   | Type           |
| ----------------------- | -------------- |
| `id`, `orderNumber`     | string         |
| `status`                | `OrderStatus`  |
| `itemCount`             | integer        |
| `previewImages`         | `MediaAsset[]` |
| `total`                 | `Money`        |
| `placedAt`              | timestamp      |
| `estimatedDeliveryDate` | date or null   |

`OrderDetail` extends summary with `{ items, subtotal, deliveryFee, paymentMethod, paymentStatus, deliveryAddress, contact, courier, cancellation, updatedAt, version }`.

`AddressSnapshot` contains the address fields without mutable audit/version metadata.

`CancelOrderRequest`: `{ reason: string }`.

### OrderTracking

`{ orderId, orderNumber, status, courier: CourierInfo | null, estimatedDeliveryDate, deliveryAddress: AddressSnapshot, events: TrackingEvent[], items: OrderItem[], total: Money }`.

- `CourierInfo`: `{ name, trackingNumber, contactUrl: string | null }`.
- `TrackingEvent`: `{ id, status, label, description, occurredAt: timestamp | null, completed: boolean, current: boolean }`.

The mock order `GBY-10245` should expose: Order Placed, Payment Confirmed, Preparing Order, Shipped (current), Out for Delivery, Delivered.

Representative order creation request:

```json
{
  "quoteId": "quote_01K...",
  "acceptedTotal": { "amountMinor": 269800, "currency": "PHP" }
}
```

## 12. Notification Schemas

### Notification

| Field                                | Type                          |
| ------------------------------------ | ----------------------------- |
| `id`                                 | string                        |
| `category`                           | `NotificationCategory`        |
| `type`                               | `NotificationType`            |
| `title`, `message`                   | string                        |
| `recommendedAmount`                  | `Quantity \| null`            |
| `occurredAt`                         | timestamp                     |
| `readAt`                             | timestamp or null             |
| `action`                             | `{ label, deepLink } \| null` |
| `cultivationId`, `orderId`, `taskId` | string or null                |

`UnreadCount`: `{ count: integer }`.

`ReadAllNotificationsRequest`: optional `{ category: NotificationCategory | null, through: timestamp | null }`.

Notifications are grouped by localized date on the client. The API returns precise timestamps, not labels such as “Yesterday.”

## 13. State Transition Rules

### Cultivation

```text
PLANNING -> ACTIVE/GROWING -> PRE_HARVEST -> COMPLETED
     \-> CANCELLED         \--------------> CANCELLED
```

- The server owns transitions.
- `stockedOn` is required before active growth operations.
- `COMPLETED` requires a harvest record.
- Historical operational records remain readable after completion.

### Task

```text
UPCOMING -> DUE -> COMPLETED
              \-> MISSED
UPCOMING/DUE/MISSED -> CANCELLED (server policy)
```

Reopen is an audited exception, not a general status patch.

### Order

```text
TO_PAY -> PROCESSING -> SHIPPED -> OUT_FOR_DELIVERY -> DELIVERED
   \          \
    ---------> CANCELLED
```

Mock tracking advancement may be fixture-driven; the frontend must not manufacture order status.

## 14. Derived-Data Ownership and Invalidation

| Mutation           | Server recalculates/returns                          | Client invalidates                       |
| ------------------ | ---------------------------------------------------- | ---------------------------------------- |
| Cultivation create | status, dates, tasks, recommendation context         | Home, cultivation lists/detail           |
| Task complete      | task, linked record, task progress                   | Home, tasks, detail, notifications       |
| Growth create      | latest weight, growth stage, feeding plan, readiness | Detail, growth, feed, readiness, Home    |
| Mortality create   | mortality total, live fish, feeding plan             | Detail, mortality, feed, readiness, Home |
| Feeding create     | daily recorded/planned progress                      | Tasks, records, Home                     |
| Water check create | guidance and generated tasks                         | Tasks, water checks, Home                |
| Cart change        | line totals and all cart totals                      | Cart/badge/checkout quote                |
| Order create       | order snapshot and tracking seed; clears cart        | Orders, cart, Home notifications         |
| Harvest create     | revenue, summary, completed status                   | Detail/list/Home/readiness               |

Client-side optimistic updates are acceptable for notification read state and favorites. Use pessimistic updates for biological records, checkout, order placement, and harvest completion.

## 15. JSON Server Compatibility Requirements

### Required approach

Use JSON Server as a persistence/router component inside `mock-api/server.mjs`, with custom middleware/action handlers. Do not expose raw collection URLs to the Vue app.

Suggested persisted collections:

```text
users, farms, addresses, notificationSettings,
species, cultureEnvironments, compatibilityRules, stockingRules,
cultivations, tasks, growthMeasurements, mortalityRecords,
feedingPlans, feedingRecords, waterChecks, harvestRecords,
productCategories, products, favorites, carts, cartItems,
orders, orderItems, trackingEvents, notifications, idempotencyRecords
```

### Parity checklist

- Mount all public routes under `/api/v1`.
- Wrap raw resources in the success envelopes above.
- Normalize not-found, validation, auth, and conflict errors.
- Generate resource IDs and audit timestamps server-side.
- Enforce ownership and state transitions in middleware.
- Perform derived calculations server-side for all domain/action endpoints.
- Snapshot rule version, product price, address, and estimate data where specified.
- Return `camelCase` exactly.
- Implement `Idempotency-Key` storage and replay for protected mutations.
- Support deterministic clock/ID hooks in automated tests.
- Add configurable latency; disable it in contract/E2E tests.
- Add explicit seeded error users/scenarios rather than frontend-only failures.
- Reset from immutable fixtures through `npm run mock:reset` (final script name may vary but must be documented).

### Forbidden frontend dependencies

The Vue app must not depend on JSON Server's `_page`, `_limit`, `_sort`, `_order`, `_expand`, `_embed`, raw plural collection routes, generated numeric IDs, or default error pages. The mock adapter translates the public cursor/filter contract to JSON Server behavior internally.

## 16. FastAPI Implementation Notes

- Publish an OpenAPI 3.1 document for `/api/v1`.
- Use Pydantic alias generation so external models serialize in `camelCase` while Python remains idiomatic.
- Create shared response/error envelope generics and exception handlers before feature routes.
- Use `Decimal` for quantities requiring controlled precision and integer minor units for money.
- Use database transactions for task+record completion, order placement+cart clearing, mortality+derived updates, and harvest+status completion.
- Persist immutable rule/estimate snapshots used for user decisions.
- Validate ownership on every nested resource; do not trust a cultivation ID from the client.
- Store refresh tokens only through a secure, `HttpOnly`, `SameSite` cookie strategy appropriate to the deployed origins.
- Configure CORS explicitly for known frontend origins; credentials require non-wildcard origins.
- Make idempotency records user-, route-, and key-scoped, with request hash conflict detection.
- Treat the source/provenance model as required domain data rather than presentation metadata.

## 17. Contract Verification

Before switching an environment from mock to FastAPI:

1. Run the same client contract suite against both servers.
2. Verify every cataloged route has the documented status, envelope, field casing, and error structure.
3. Run the priority end-to-end flow without conditional frontend code.
4. Compare calculated response invariants, not necessarily demo numeric values.
5. Confirm auth refresh, cookies/CORS, idempotency, and stale-write behavior.
6. Confirm unknown/extra response fields are tolerated, but missing required fields fail loudly in development.

Any breaking change requires a new API version or a coordinated compatibility window. A frontend edit that checks which server is running is not an acceptable migration strategy.
