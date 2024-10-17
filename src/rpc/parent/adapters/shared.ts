import { z } from "zod"
import * as Standard from "../../standard.js"
import EventEmitter from "@feather-ext/events"

/**
 * @description Base Child class.
 */
export abstract class Child extends EventEmitter<{
    connected: []
    ready: []
    disconnected: []
}> {
    /**
     * @description Whether or not this Child is logged in.
     */
    usable: boolean = false
    /**
     * @description Spawn the Child.
     */
    protected abstract spawn(): Promise<void>
    /**
     * @description Send a request to the Child.
     */
    abstract sendRequest(message: z.infer<typeof Standard.PTCRequest>): void
    /**
     * @description Destroy the Child.
     */
    abstract destroy(): Promise<void>

    /**
     * @description Process a message.
     */
    protected processRequest(message: z.infer<typeof Standard.CTPRequest>) {
        console.log(message)
    }

    /**
     * @description Respawn the Child.
     */
    async reset() {
        await this.destroy()
        await this.spawn()
    }

    constructor() {
        super()
    }
}
