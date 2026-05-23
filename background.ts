chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading') {
        chrome.action.setBadgeText({tabId, text: '✓'});
        chrome.action.setBadgeBackgroundColor({tabId, color: '#00FF00'});
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'RESOURCE_BLOCKED_BY_CSP' && sender.tab) {
        const tabId = sender.tab.id;
        chrome.action.setBadgeText({tabId, text: 'x'});
        chrome.action.setBadgeBackgroundColor({tabId, color: '#FF0000'});
    }
});
