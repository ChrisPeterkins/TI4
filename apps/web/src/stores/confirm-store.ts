import { create } from 'zustand';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  /** localStorage key for "don't ask again" preference */
  dontAskAgainKey?: string;
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: ConfirmVariant;
  dontAskAgainKey?: string;
  resolve: ((value: boolean) => void) | null;
}

interface ConfirmActions {
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
  handleConfirm: (dontAskAgain?: boolean) => void;
  handleCancel: () => void;
  reset: () => void;
}

const initialState: ConfirmState = {
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'warning',
  dontAskAgainKey: undefined,
  resolve: null,
};

const DONT_ASK_STORAGE_KEY = 'ti4_confirm_prefs';

/**
 * Get stored "don't ask again" preferences from localStorage
 */
function getDontAskPreferences(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(DONT_ASK_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Save "don't ask again" preference to localStorage
 */
function saveDontAskPreference(key: string, value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const prefs = getDontAskPreferences();
    prefs[key] = value;
    localStorage.setItem(DONT_ASK_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if "don't ask again" is set for a key
 */
function shouldSkipConfirmation(key: string): boolean {
  const prefs = getDontAskPreferences();
  return prefs[key] === true;
}

export const useConfirmStore = create<ConfirmState & ConfirmActions>((set, get) => ({
  ...initialState,

  showConfirm: (options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      // Check if user previously said "don't ask again"
      if (options.dontAskAgainKey && shouldSkipConfirmation(options.dontAskAgainKey)) {
        resolve(true);
        return;
      }

      set({
        isOpen: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'warning',
        dontAskAgainKey: options.dontAskAgainKey,
        resolve,
      });
    });
  },

  handleConfirm: (dontAskAgain?: boolean) => {
    const { resolve, dontAskAgainKey } = get();

    // Save "don't ask again" preference if checked
    if (dontAskAgain && dontAskAgainKey) {
      saveDontAskPreference(dontAskAgainKey, true);
    }

    if (resolve) {
      resolve(true);
    }

    set(initialState);
  },

  handleCancel: () => {
    const { resolve } = get();

    if (resolve) {
      resolve(false);
    }

    set(initialState);
  },

  reset: () => {
    const { resolve } = get();

    if (resolve) {
      resolve(false);
    }

    set(initialState);
  },
}));

/**
 * Helper function to show a confirmation dialog
 *
 * @example
 * ```tsx
 * const confirmed = await confirm({
 *   title: 'Pass Turn',
 *   message: 'Are you sure you want to pass?',
 *   variant: 'warning',
 *   dontAskAgainKey: 'pass_turn',
 * });
 *
 * if (confirmed) {
 *   handlePass();
 * }
 * ```
 */
export const confirm = (options: ConfirmOptions): Promise<boolean> => {
  return useConfirmStore.getState().showConfirm(options);
};

/**
 * Reset a "don't ask again" preference
 */
export function resetDontAskPreference(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    const prefs = getDontAskPreferences();
    delete prefs[key];
    localStorage.setItem(DONT_ASK_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Reset all "don't ask again" preferences
 */
export function resetAllDontAskPreferences(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DONT_ASK_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}
