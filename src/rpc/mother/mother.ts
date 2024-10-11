import browser from "webextension-polyfill"

/**
 * @description Adds declarativeNetRequest rules that allow discord.com to load in an iframe for the child content script if they don't already exist.
 */
async function putRules() {

    let rules = await browser.declarativeNetRequest.getDynamicRules({
        ruleIds: [1]
    })

    if (rules) return

    await browser.declarativeNetRequest.updateDynamicRules({
        addRules: [
            {
                id: 1,
                action: {
                    responseHeaders: [
                        {
                            header: "X-Frame-Options",
                            operation: "remove"
                        }
                    ],
                    type: "modifyHeaders"
                },
                condition: {
                    urlFilter: "https://discord.com/humans.txt?__feather_rpc_slave",
                    tabIds: [ browser.tabs.TAB_ID_NONE ]
                }
            }
        ]
    })
    
}