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

async function syncRules() {
    const storageData = await chrome.storage.sync.get() as {[name: string]: string[]};
    console.log(storageData);

    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    console.log(existingRules);
    const removeRuleIds = existingRules.map(rule => rule.id);

    const addRules: chrome.declarativeNetRequest.Rule[] = [];
    let currentId = 1;

    for (const [domain, hashes] of Object.entries(storageData)) {
        const hashRule = hashes.map(h => `'${h}'`).join(' ');
        addRules.push({
            id: currentId++,
            priority: 1,
            action: {
                type: 'modifyHeaders',
                responseHeaders: [{
                    header: 'Content-Security-Policy',
                    operation: 'set',
                    value: `script-src ${hashRule};`
                }]
            },
            condition: {
                urlFilter: `*://${domain}/*`,
                resourceTypes: ['main_frame', 'sub_frame']
            }
        });
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds,
        addRules,
    });
}

chrome.storage.sync.onChanged.addListener(syncRules);
chrome.runtime.onInstalled.addListener(syncRules);
chrome.runtime.onStartup.addListener(syncRules);
