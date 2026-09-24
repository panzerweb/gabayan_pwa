import { apiRequest, envelopeSchema, pageSchema } from '@core/http'
import { ENDPOINTS } from '@core/url_paths'

import {
  accountTierSchema,
  tierPlanSchema,
  upgradeRequestSchema,
  type CreateUpgradeRequest,
} from '../domain/tiers.model'

export async function listPlansApi(accessToken: string) {
  return apiRequest(ENDPOINTS.tiers.root, {
    method: 'GET',
    accessToken,
    schema: pageSchema(tierPlanSchema),
  })
}

export async function getAccountTierApi(accessToken: string) {
  return apiRequest(ENDPOINTS.tiers.account, {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(accountTierSchema),
  })
}

// Refused with 409 CONFLICT while an earlier request is still pending.
export async function createUpgradeRequestApi(body: CreateUpgradeRequest, accessToken: string) {
  return apiRequest(ENDPOINTS.tiers.upgradeRequests, {
    method: 'POST',
    body,
    accessToken,
    schema: envelopeSchema(upgradeRequestSchema),
  })
}
