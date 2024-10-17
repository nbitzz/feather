import { CrChild } from "./adapters/chrome.js"
import { FxChild } from "./adapters/firefox.js"
import browser from "webextension-polyfill"

/**
 * @description Adds declarativeNetRequest rules that allow discord.com to load in an iframe for the child content script if they don't already exist.
 */
async function putRules() {
    await browser.declarativeNetRequest.updateSessionRules({
        addRules: [
            {
                id: 1,
                action: {
                    responseHeaders: [
                        {
                            header: "X-Frame-Options",
                            operation: "remove",
                        },
                        {
                            // just in case Discord changes this
                            header: "Content-Type",
                            operation: "set",
                            value: "text/plain",
                        },
                    ],
                    type: "modifyHeaders",
                },
                condition: {
                    urlFilter:
                        "|https://discord.com/humans.txt?__feather_rpc_slave|",
                    tabIds: [browser.tabs.TAB_ID_NONE],
                },
            },
        ],
    })
}

await putRules() // Let's set up rules so that the Child can work.

/**
 * @description A Child which can be used by the background script for RPC.
 */
const ChildSingleton = new (__BROWSER__ == "chrome" ? CrChild : FxChild)()

export default ChildSingleton
