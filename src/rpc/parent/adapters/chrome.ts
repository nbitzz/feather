import { Child } from "./shared.js"
import { z } from "zod"
import * as Standard from "../../standard.js"

export class CrChild extends Child {
    constructor() {
        super()
        // Let's listen to messages from a potential document
        chrome.runtime.onMessage.addListener(({ target, request }) => {
            if (target != "browser") return // this isn't for us

            // check if this is a good CTPRequest
            const { success, data: final } =
                Standard.CTPRequest.safeParse(request)

            if (!success) return // return if it's not
            this.processRequest(final) // process if it is
        })
    }

    async spawn() {
        const {
            offscreen: { Reason },
            runtime: { ContextType },
        } = chrome

        // Check first if we have any open offscreen documents
        const contexts = await chrome.runtime.getContexts({
            contextTypes: [ContextType.OFFSCREEN_DOCUMENT],
        })

        if (contexts.length > 0) return

        // Looks like we don't. Let's make a new one.
        return chrome.offscreen.createDocument({
            url: chrome.runtime.getURL("/src/rpc/bridge/index.html"),
            reasons: [Reason.IFRAME_SCRIPTING],
            justification: "to be used to communicate with the Discord gateway",
        })
    }

    destroy() {
        return chrome.offscreen.closeDocument()
    }

    sendRequest(request: z.infer<typeof Standard.PTCRequest>) {
        return chrome.runtime.sendMessage({
            target: "bridge",
            request,
        })
    }
}
