/**
 * Content script that acts as a bridge between the page's injected provider
 * and the extension's background script
 */

interface ProviderMessage {
  target: string;
  type?: string;
  data?: any;
  id?: string;
  request?: {
    method: string;
    params?: any[];
  };
  response?: any;
}

// Inject the provider script into the page
function injectScript(): void {
  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject/provider.js');
    script.onload = function() {
      const scriptElement = this as HTMLScriptElement;
      scriptElement.parentNode?.removeChild(scriptElement);
    };
    (document.head || document.documentElement).appendChild(script);
  } catch (error) {
    console.error('Failed to inject FreoWallet provider:', error);
  }
}

// Inject as early as possible
injectScript();

// Handle messages from the background script
chrome.runtime.onMessage.addListener((
  message: ProviderMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => {
  if (message.target !== 'freo-content-script') {
    return;
  }

  // Forward messages to the page's provider
  window.postMessage(
    {
      target: 'freo-provider',
      type: message.type,
      data: message.data
    } as ProviderMessage,
    window.location.origin
  );
});

// Listen for messages from the page to forward to background
window.addEventListener('message', (event: MessageEvent) => {
  // Verify message is from our window and has the correct target
  if (event.source !== window || !event.data || event.data.target !== 'freo-content-script') {
    return;
  }

  const message = event.data as ProviderMessage;

  // Forward to background script
  chrome.runtime.sendMessage({
    target: 'freo-background',
    request: message.request,
    origin: window.location.origin
  }, (response) => {
    // Send response back to page
    window.postMessage(
      {
        target: 'freo-provider',
        id: message.id,
        response
      } as ProviderMessage,
      window.location.origin
    );
  });
}); 