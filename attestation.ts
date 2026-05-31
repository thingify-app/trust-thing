export async function verifyOrigin(origin: string): Promise<string[]|null> {
    try {
        const response = await fetch(`${origin}/signatures.json`);
        const signatures = await response.json();
        return signatures;
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

export function compareHashes(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((val, index) => val === b[index]);
}

function validateHash(hash: string): boolean {
    return hash.startsWith('sha256-') || hash.startsWith('sha384-') || hash.startsWith('sha512-');
}
