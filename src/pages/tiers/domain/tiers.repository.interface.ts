import type { Envelope, Page } from '@core/http'

import type { AccountTier, CreateUpgradeRequest, TierPlan, UpgradeRequest } from './tiers.model'

export interface TiersRepository {
  listPlans(accessToken: string): Promise<Page<TierPlan>>
  getAccountTier(accessToken: string): Promise<Envelope<AccountTier>>
  createUpgradeRequest(
    body: CreateUpgradeRequest,
    accessToken: string,
  ): Promise<Envelope<UpgradeRequest>>
}
