import type { PublicRepository } from '../domain/public.repository.interface'
import { getHealthApi } from './public.api'

export const publicRepository: PublicRepository = {
  getHealth: getHealthApi,
}
