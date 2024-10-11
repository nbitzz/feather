import { Child } from "./shared.js";

/**
 * @description Works independently of a child. Use if the user has declined permission to discord.com or does not want a discord.com origin.
 */
export class NoChild extends Child {

    frame?: HTMLIFrameElement

    constructor() {
        super()
    }

    async destroy() {
        this.frame
    }

    async _reset() {
        {
            /*

                We don't need to generate a new document
                to make use of iframes in Firefox, and so
                instead we'll just open an iframe straight
                to Discord and respond to messages on that.

            */

            this.frame = document.createElement("iframe")
            this.frame.src = "https://discord.com/humans.txt?__feather_rpc_slave"
        }
    }

    sendRawMessage() {
        this.frame
    }

}