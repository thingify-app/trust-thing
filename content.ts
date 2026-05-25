document.addEventListener('securitypolicyviolation', event => {
    const div = document.createElement('div');
    div.innerHTML = 'Page has violated policy!';
    div.className = 'alert';
    document.body.appendChild(div);

    updateAction(event);

    // Periodically call the extension with the violated state, as the tabId may
    // change after the initial event is fired (e.g. if Chrome prefetches the
    // page).
    setInterval(() => updateAction(event), 500);
});

function updateAction(event: SecurityPolicyViolationEvent) {
    chrome.runtime.sendMessage({
        type: 'RESOURCE_BLOCKED_BY_CSP',
        blockedUri: event.blockedURI,
        directive: event.violatedDirective
    });
}