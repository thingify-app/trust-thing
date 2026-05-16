const rules: chrome.declarativeNetRequest.Rule[] = [
    {
        id: 1,
        action: {
            type: 'modifyHeaders',
            responseHeaders: [{
                header: 'Content-Security-Policy',
                operation: "set",
                value: 'foobar'
            }]
        },
        condition: {}
    }
];


export async function updateRules() {
    await chrome.declarativeNetRequest.updateDynamicRules({addRules: rules});
}
