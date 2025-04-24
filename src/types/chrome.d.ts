declare namespace chrome {
  namespace storage {
    interface StorageArea {
      get(keys: string | string[] | object | null, callback: (items: { [key: string]: any }) => void): void;
      set(items: object, callback?: () => void): void;
      remove(keys: string | string[], callback?: () => void): void;
      clear(callback?: () => void): void;
    }

    const local: StorageArea;
  }

  namespace runtime {
    interface MessageSender {
      tab?: chrome.tabs.Tab;
      frameId?: number;
      id?: string;
      url?: string;
      tlsChannelId?: string;
    }

    interface Port {
      name: string;
      disconnect(): void;
      postMessage(message: any): void;
      onDisconnect: chrome.events.Event<() => void>;
      onMessage: chrome.events.Event<(message: any, port: chrome.runtime.Port) => void>;
    }

    interface Event<T extends (...args: any[]) => any> {
      addListener(callback: T): void;
      removeListener(callback: T): void;
      hasListener(callback: T): boolean;
    }

    function getURL(path: string): string;
    function sendMessage(
      message: any,
      responseCallback?: (response: any) => void
    ): void;

    const onMessage: Event<(
      message: any,
      sender: MessageSender,
      sendResponse: (response?: any) => void
    ) => void>;
  }

  namespace tabs {
    interface Tab {
      id?: number;
      index: number;
      windowId: number;
      openerTabId?: number;
      selected: boolean;
      highlighted: boolean;
      active: boolean;
      pinned: boolean;
      audible?: boolean;
      discarded: boolean;
      autoDiscardable: boolean;
      mutedInfo?: MutedInfo;
      url?: string;
      pendingUrl?: string;
      title?: string;
      favIconUrl?: string;
      status?: string;
      incognito: boolean;
      width?: number;
      height?: number;
      sessionId?: string;
    }

    interface MutedInfo {
      muted: boolean;
      reason?: string;
      extensionId?: string;
    }

    interface TabChangeInfo {
      status?: string;
      url?: string;
      pinned?: boolean;
      audible?: boolean;
      mutedInfo?: MutedInfo;
      favIconUrl?: string;
      title?: string;
    }

    function query(queryInfo: object, callback: (tabs: Tab[]) => void): void;
    function sendMessage(tabId: number, message: any): void;
    const onUpdated: Event<(
      tabId: number,
      changeInfo: TabChangeInfo,
      tab: Tab
    ) => void>;
  }
} 