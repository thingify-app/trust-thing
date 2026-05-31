import { verifyOrigin, saveHashes, clearHashes } from './attestation.js';

const currentDomain = document.getElementById('currentDomain') as HTMLDivElement;
const settingsButton = document.getElementById('settings') as HTMLButtonElement;
const hashList = document.getElementById('hashList') as HTMLUListElement;
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
});

disableButton.addEventListener('click', async () => {
    const origin = await getCurrentTabOrigin();
    await clearHashes(origin!);
    await renderPage();
});

async function getCurrentTabOrigin(): Promise<string|null> {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    const currentTab = tabs[0];
    if (currentTab && currentTab.url) {
        const url = URL.parse(currentTab.url);
        return url?.origin ?? null;
    } else {
        return null;
    }
}

async function isEnabledForOrigin(origin: string): Promise<boolean> {
    const results = await chrome.storage.sync.get(origin);
    console.log(`Results: ${results}`);
    console.log(results);
    return Object.hasOwn(results, origin);
}

async function renderPage() {
    const origin = await getCurrentTabOrigin();

    if (origin) {
        const enabled = await isEnabledForOrigin(origin);
        if (enabled) {
            currentDomain.innerHTML = `<h2>${origin}</h2> enabled.`;
            enableButton.style.display = 'none';
            disableButton.style.display = 'block';
        } else {
            const hashes = await verifyOrigin(origin);
            if (hashes) {
                currentDomain.innerHTML = `<h2>${origin}</h2>Supports attestation hashes!`;
                renderHashList(hashes);
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
        renderHashList([]);
    }
}

function renderHashList(hashes: string[]) {
    console.log(hashes);
    hashList.replaceChildren();
    for (const hash of hashes) {
        const listItem = document.createElement('li');
        listItem.textContent = hash;
        hashList.appendChild(listItem);
    }
}
