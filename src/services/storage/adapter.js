import { R2StorageAdapter } from './r2Storage.js';
import { LocalStorageAdapter } from './localStorage.js';

let storageAdapter = null;

export function getStorageAdapter() {
  if (!storageAdapter) {
    // Use R2 if credentials are configured, otherwise fall back to local storage
    if (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME) {
      storageAdapter = new R2StorageAdapter();
    } else {
      storageAdapter = new LocalStorageAdapter();
    }
  }
  
  return storageAdapter;
}