import { verifyOrigin, saveHashes, clearHashes, isEnabledForOrigin } from './attestation.js';

const currentDomain = document.getElementById('currentDomain') as HTMLDivElement;
const settingsButton = document.getElementById('settings') as HTMLButtonElement;
const enableButton = document.getElementById('enable') as HTMLButtonElement;
const disableButton = document.getElementById('disable') as HTMLButtonElement;

// Initial page setup:
document.addEventListener('DOMContentLoaded', async () => {
    await renderPage();
});

settingsButton.addEventListener('click', async () => {
    await chrome.runtime.openOptionsPage();
});

enableButton.addEventListener('click', async () => {
    const origin = await getCurrentTabOrigin();
    const hashes = await verifyOrigin(origin!);
    await saveHashes(origin!, hashes!);
    await renderPage();
    await reloadTab();
});

disableButton.addEventListener('click', async () => {
    const origin = await getCurrentTabOrigin();
    await clearHashes(origin!);
    await renderPage();
    await reloadTab();
});

async function renderPage() {
    const origin = await getCurrentTabOrigin();

    if (origin) {
        const enabled = await isEnabledForOrigin(origin);
        if (enabled) {
            currentDomain.innerHTML = `<h2>${origin}</h2>TrustThing enabled.`;
            enableButton.style.display = 'none';
            disableButton.style.display = 'block';
        } else {
            const hashes = await verifyOrigin(origin);
            if (hashes) {
                currentDomain.innerHTML = `<h2>${origin}</h2>Supports attestation hashes! Enable?`;
                enableButton.style.display = 'block';
                disableButton.style.display = 'none';
            } else {
                currentDomain.innerHTML = `<h2>${origin}</h2>Does not support attestation hashes.`;
                enableButton.style.display = 'none';
                disableButton.style.display = 'none';
            }
        }
    } else {
        currentDomain.innerText = `Domain not available on this page.`;
        enableButton.style.display = 'none';
        disableButton.style.display = 'none';
    }
}

async function reloadTab() {
    const tab = await getCurrentTab();
    // Hacky - wait for rules to have a chance to apply before reloading.
    setTimeout(() => {
        chrome.tabs.reload(tab.id);
    }, 500);
}

async function getCurrentTabOrigin(): Promise<string|null> {
    const currentTab = await getCurrentTab();
    if (currentTab.url) {
        const url = URL.parse(currentTab.url);
        return url?.origin ?? null;
    } else {
        return null;
    }
}

async function getCurrentTab(): Promise<chrome.tabs.Tab> {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    return tabs[0];
}
