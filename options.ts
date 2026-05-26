const settings = document.getElementById('settings') as HTMLDivElement;

// Initial page setup:
document.addEventListener('DOMContentLoaded', async () => {
    const storageData = await chrome.storage.sync.get() as {[name: string]: string[]};

    settings.innerHTML = '';

    for (const [domain, hashes] of Object.entries(storageData)) {
        const heading = document.createElement('h2');
        heading.textContent = domain;
        settings.appendChild(heading);

        const hashList = document.createElement('ul');
        for (const hash of hashes) {
            const hashListItem = document.createElement('li');
            hashListItem.textContent = hash;
            hashList.appendChild(hashListItem);
        }

        settings.appendChild(hashList);
    }
});
