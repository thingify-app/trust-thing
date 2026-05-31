let intervalHandle = 0;

document.addEventListener('securitypolicyviolation', async () => {
    updateAction();

    // Periodically call the extension with the violated state, as the tabId may
    // change after the initial event is fired (e.g. if Chrome prefetches the
    // page).
    intervalHandle = setInterval(() => updateAction(), 500);
});

function updateAction() {
    chrome.runtime.sendMessage({
        type: 'VIOLATION_DETECTED'
    });
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'VIOLATION_CONFIRMED') {
        clearInterval(intervalHandle);
        showViolationMessage();
    }
});

function showViolationMessage() {
    const div = document.createElement('div');
    div.innerHTML = 'Page has violated policy!';
    div.className = 'alert';
    document.body.appendChild(div);
}
