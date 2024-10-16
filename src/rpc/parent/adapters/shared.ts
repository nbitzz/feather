import EventEmitter from "../../../../packages/events/dist/index.js";
import { CrChild } from "./chrome.js";
import { FxChild } from "./firefox.js";

export abstract class Child extends EventEmitter<{ available: [], ready: [], disconnected: [], message: [] }> {
    
    available: boolean = false
    usable: boolean = false
    protected abstract _reset(): Promise<void>
    protected abstract sendRawMessage(message: string): void
    abstract destroy(): Promise<void>
    
    private processRawMessage(message: string) {
        
    }

    async reset() {
        await this.destroy();
        await this._reset();

        this.available = true;
        this.emit("available")
    }

    sendMessage(data: any) {
        this.sendRawMessage(JSON.parse(data))
    }

}

export default function makeChild() {
    switch(__BROWSER__) {
        case "chrome": return new CrChild()
        case "firefox": return new FxChild()
    }
}

export { CrChild } from "./chrome.js"
export { FxChild } from "./firefox.js"