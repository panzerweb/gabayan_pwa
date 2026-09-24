import { emptySetupDraft, type SetupDraft } from '@pages/setup/domain/setup.model'
import { SETUP_DRAFT_STORAGE_KEY } from '@pages/setup/presentation/stores/setup.store'

// Puts a wizard draft in session storage, where the setup store reads it when first used.
export function seedDraft(draft: Partial<SetupDraft>) {
  window.sessionStorage.setItem(
    SETUP_DRAFT_STORAGE_KEY,
    JSON.stringify({ ...emptySetupDraft(), ...draft }),
  )
}

export function storedDraft(): SetupDraft {
  return JSON.parse(window.sessionStorage.getItem(SETUP_DRAFT_STORAGE_KEY) ?? 'null') as SetupDraft
}
