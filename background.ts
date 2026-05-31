import { compareHashes, saveHashes, verifyOrigin } from './attestation.js';

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading') {
        setBadgePositive(tabId);
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'VIOLATION_DETECTED' && sender.tab) {
        assessViolation(sender.tab);
    }
});

async function assessViolation(tab: chrome.tabs.Tab) {
    const storageData = await chrome.storage.sync.get() as {[name: string]: string[]};
    const tabId = tab.id!;
    const tabUrl = URL.parse(tab.url!);
    const origin = tabUrl?.origin!;

    // Re-fetch the rules
    const storedHashes = storageData[origin];
    const freshHashes = await verifyOrigin(origin);

    console.log('Hashes:');
    console.log(storedHashes);
    console.log(freshHashes);

    if (freshHashes) {
        if (compareHashes(storedHashes, freshHashes)) {
            // If they do not differ from saved rules, this is a violation - update the action badge and send the violation back to the tab.
            console.log('True violation');
            await setBadgeNegative(tabId);
            await chrome.tabs.sendMessage(tabId, {type: 'VIOLATION_CONFIRMED'});
        } else {
            // If they differ from saved rules, save them, re-sync, and then reload the tab.
            console.log('Possible violation, refreshing tab...');
            await saveHashes(origin, freshHashes);
            await syncRules();
            await chrome.tabs.reload(tabId);
        }
    } else {
        console.log('True violation');
        await setBadgeNegative(tabId);
        await chrome.tabs.sendMessage(tabId, {type: 'VIOLATION_CONFIRMED'});
    }
}

async function setBadgePositive(tabId: number) {
    await chrome.action.setBadgeText({tabId, text: '✓'});
    await chrome.action.setBadgeBackgroundColor({tabId, color: '#00FF00'});
}

async function setBadgeNegative(tabId: number) {
    await chrome.action.setBadgeText({tabId, text: 'x'});
    await chrome.action.setBadgeBackgroundColor({tabId, color: '#FF0000'});
}

async function syncRules() {
    const storageData = await chrome.storage.sync.get() as {[name: string]: string[]};

    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existingRules.map(rule => rule.id);

    const existingScripts = await chrome.scripting.getRegisteredContentScripts();
    const existingScriptIds = new Set(existingScripts.map(script => script.id));

    const addRules: chrome.declarativeNetRequest.Rule[] = [];
    const contentScripts: chrome.scripting.RegisteredContentScript[] = [];
    let currentId = 1;

    for (const [origin, hashes] of Object.entries(storageData)) {
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
                urlFilter: `${origin}/*`,
                resourceTypes: ['main_frame', 'sub_frame']
            }
        });

        contentScripts.push({
            id: origin,
            matches: [`${origin}/*`],
            js: ['content.js'],
            css: ['content.css'],
            runAt: 'document_start',
        });
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds,
        addRules,
    });

    const addScriptIds = new Set(contentScripts.map(s => s.id));
    const removeScriptIds = existingScriptIds.difference(addScriptIds);
    const addScripts = contentScripts.filter(s => !existingScriptIds.has(s.id));

    await chrome.scripting.registerContentScripts(addScripts);
    if (removeScriptIds.size > 0) {
        await chrome.scripting.unregisterContentScripts({ids: [...removeScriptIds]});
    }
}

chrome.storage.sync.onChanged.addListener(syncRules);
chrome.runtime.onInstalled.addListener(syncRules);
chrome.runtime.onStartup.addListener(syncRules);
