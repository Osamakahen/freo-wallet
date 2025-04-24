export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  public async get(key: string): Promise<any> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get([key], (result) => {
          resolve(result[key]);
        });
      } else {
        // Fallback to localStorage for development
        const value = localStorage.getItem(key);
        resolve(value ? JSON.parse(value) : null);
      }
    });
  }

  public async set(key: string, value: any): Promise<void> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ [key]: value }, () => {
          resolve();
        });
      } else {
        // Fallback to localStorage for development
        localStorage.setItem(key, JSON.stringify(value));
        resolve();
      }
    });
  }

  public async remove(key: string): Promise<void> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.remove([key], () => {
          resolve();
        });
      } else {
        // Fallback to localStorage for development
        localStorage.removeItem(key);
        resolve();
      }
    });
  }

  public async clear(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.clear(() => {
          resolve();
        });
      } else {
        // Fallback to localStorage for development
        localStorage.clear();
        resolve();
      }
    });
  }
} 