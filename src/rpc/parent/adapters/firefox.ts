import { Child } from "./shared.js"
import { z } from "zod"
import * as Standard from "../../standard.js"

/**
 * @description Firefox child. Since we build an MV2 extension while targeting Firefox, we can
 */
export class FxChild extends Child {
    frame?: HTMLIFrameElement

    constructor() {
        super()

        window.addEventListener("message", ({ data }) => {
            // check if this is a good CTPRequest
            const { success, data: final } = Standard.CTPRequest.safeParse(data)

            if (!success) return // return if it's not
            this.processRequest(final) // process if it is
        })
    }

    async destroy() {
        if (!this.frame) return
        this.frame.src = ""
        this.frame.remove()
        this.frame = undefined
    }

    async spawn() {
        {
            /*

                We don't need to generate a new document
                to make use of iframes in Firefox, and so
                instead we'll just open an iframe straight
                to Discord and respond to messages on that.

            */

            this.frame = document.createElement("iframe")
            this.frame.src =
                "https://discord.com/humans.txt?__feather_rpc_slave"

            // won't load if we don't append it to body
            document.body.append(this.frame)
        }
    }

    sendRequest(message: z.infer<typeof Standard.PTCRequest>) {
        if (!this.frame) return
        this.frame.contentWindow?.postMessage(message, "https://discord.com")
    }
}
