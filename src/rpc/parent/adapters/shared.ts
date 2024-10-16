import { z } from "zod"
import * as Standard from "../../standard.js"
import EventEmitter from "../../../../packages/events/dist/index.js"
import { CrChild } from "./chrome.js"
import { FxChild } from "./firefox.js"

export abstract class Child extends EventEmitter<{
    connected: []
    ready: []
    disconnected: []
}> {
    available: boolean = false
    usable: boolean = false
    protected abstract _reset(): Promise<void>
    abstract sendRequest(message: z.infer<typeof Standard.PTCRequest>): void
    abstract destroy(): Promise<void>

    protected processRequest(message: z.infer<typeof Standard.CTPRequest>) {}

    async reset() {
        await this.destroy()
        await this._reset()
    }
}

export default function makeChild() {
    switch (__BROWSER__) {
        case "chrome":
            return new CrChild()
        case "firefox":
            return new FxChild()
    }
}

export { CrChild } from "./chrome.js"
export { FxChild } from "./firefox.js"
