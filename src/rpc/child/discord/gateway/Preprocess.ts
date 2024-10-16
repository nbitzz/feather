export default abstract class Preprocess {
    constructor() {}
    protected abstract encode(data: string): ArrayBuffer | string
    protected abstract decode(data: ArrayBuffer | string): string
    // Todo: Use zod to validate?
    in(data: any) {
        return this.encode(JSON.stringify(data))
    }
    out(data: any) {
        return JSON.parse(this.decode(data))
    }
}

export class PreprocessNoCompression extends Preprocess {
    encode(data: string) {
        return data
    }
    decode(data: string) {
        return data
    }
}
