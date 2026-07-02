import { ref } from 'vue'

export interface AppErrorState {
  message: string
  info?: string
}

export const appError = ref<AppErrorState | null>(null)

export function reportAppError(error: unknown, info?: string): void {
  const message = error instanceof Error ? error.message : 'Unexpected application error'
  appError.value = {
    message,
    info,
  }
}

export function clearAppError(): void {
  appError.value = null
}