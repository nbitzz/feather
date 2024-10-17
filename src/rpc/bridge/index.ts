import * as Standard from "../standard.js"
import type { z } from "zod"
const frame = document.createElement("iframe")
frame.src = "https://discord.com/humans.txt?__feather_rpc_slave"

chrome.runtime.onMessage.addListener(message => {
    if (message.target != "bridge") return // this isn't meant for us

    // we can assume that this is probably a PTCRequest
    const { request }: { request: z.infer<typeof Standard.PTCRequest> } =
        message

    // okay, let's send this PTCRequest down to the child
    frame.contentWindow?.postMessage(request, "https://discord.com")
})

window.addEventListener("message", ({ data: request }) => {
    // let's send this up to our background to be processed
    chrome.runtime.sendMessage({
        target: "browser",
        request,
    })
})
