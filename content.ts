document.addEventListener('securitypolicyviolation', event => {
    const div = document.createElement('div');
    div.innerHTML = 'Page has violated policy!';
    div.className = 'alert';
    document.body.appendChild(div);

    chrome.runtime.sendMessage({
        type: 'RESOURCE_BLOCKED_BY_CSP',
        blockedUri: event.blockedURI,
        directive: event.violatedDirective
    });
});
