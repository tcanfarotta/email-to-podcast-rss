import { R2StorageAdapter } from './r2Storage.js';
import { LocalStorageAdapter } from './localStorage.js';

let storageAdapter = null;

export function getStorageAdapter() {
  if (!storageAdapter) {
    // Use R2 if credentials are configured, otherwise fall back to local storage
    if (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME) {
      console.log('Using R2 storage adapter');
      console.log('R2 Config:', {
        accountId: process.env.CF_ACCOUNT_ID?.substring(0, 8) + '...',
        bucketName: process.env.R2_BUCKET_NAME,
        hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY
      });
      storageAdapter = new R2StorageAdapter();
    } else {
      console.log('Using local storage adapter (R2 not configured)');
      console.log('Missing R2 config:', {
        hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
        hasBucket: !!process.env.R2_BUCKET_NAME
      });
      storageAdapter = new LocalStorageAdapter();
    }
  }
  
  return storageAdapter;
}