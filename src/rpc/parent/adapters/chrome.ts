import { Child } from "./shared.js"

export class CrChild extends Child {
    constructor() {
        super()
    }

    async _reset() {}

    async destroy() {
        throw new Error(`not implemented for CrChild`)
    }

    sendRequest() {
        throw new Error(`not implemented for CrChild`)
    }
}
