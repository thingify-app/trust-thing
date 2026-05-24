const currentDomain = document.getElementById('currentDomain') as HTMLDivElement;
const hashList = document.getElementById('hashList') as HTMLUListElement;
const clearAllButton = document.getElementById('clearAll') as HTMLButtonElement;
const hashText = document.getElementById('hashText') as HTMLInputElement;
const setHashButton = document.getElementById('setHash') as HTMLButtonElement;

// Initial page setup:
document.addEventListener('DOMContentLoaded', async () => {
    const domain = await getCurrentTabDomain();
    if (domain) {
        currentDomain.innerHTML = `<h2>${domain}</h2>`;

        renderHashList(await getHashesForDomain(domain));

        setHashButton.disabled = false;
    } else {
        currentDomain.innerText = `Domain not available on this page.`;
        setHashButton.disabled = true;
        renderHashList([]);
    }
});

clearAllButton.addEventListener('click', async () => {
    const domain = await getCurrentTabDomain();
    if (domain) {
        await chrome.storage.sync.remove(domain);
        renderHashList(await getHashesForDomain(domain));
    }
});

setHashButton.addEventListener('click', async () => {
    const domain = (await getCurrentTabDomain())!;
    const hashes = await getHashesForDomain(domain);

    const hash = hashText.value;
    if (!validateHash(hash)) {
        alert('Invalid hash!');
    }
    hashes.push(hash);

    renderHashList(hashes);
    await chrome.storage.sync.set({[domain]: hashes});
});

async function getCurrentTabDomain(): Promise<string|null> {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    const currentTab = tabs[0];
    if (currentTab && currentTab.url) {
        const url = URL.parse(currentTab.url);
        return url?.host ?? null;
    } else {
        return null;
    }
}

async function getHashesForDomain(domain: string): Promise<string[]> {
    const storedData = await chrome.storage.sync.get({[domain]: []});
    return storedData[domain] as string[];
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

function validateHash(hash: string): boolean {
    return hash.startsWith('sha256-') || hash.startsWith('sha384-') || hash.startsWith('sha512-');
}
