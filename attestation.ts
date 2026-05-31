export async function verifyOrigin(origin: string): Promise<string[]|null> {
    try {
        const response = await fetch(`${origin}/signatures.json`);
        if (response.ok) {
            const signatures = await response.json();
            return signatures;
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
}

export async function saveHashes(origin: string, hashes: string[]) {
    await chrome.storage.sync.set({[origin]: hashes});
}

export async function clearHashes(origin: string) {
    await chrome.storage.sync.remove(origin);
}

export async function getHashes(origin: string): Promise<string[]|null> {
    const storageData = await chrome.storage.sync.get(origin) as {[name: string]: string[]|undefined};
    return storageData[origin] ?? null;
}

export async function isEnabledForOrigin(origin: string): Promise<boolean> {
    const results = await chrome.storage.sync.get(origin);
    return Object.hasOwn(results, origin);
}

export function compareHashes(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((val, index) => val === b[index]);
}

function validateHash(hash: string): boolean {
    return hash.startsWith('sha256-') || hash.startsWith('sha384-') || hash.startsWith('sha512-');
}
