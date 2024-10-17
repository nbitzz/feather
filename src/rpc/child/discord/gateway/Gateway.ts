import EventEmitter from "@feather-ext/events"
import Discord from "discord-api-types/v9"
import Preprocess, { PreprocessNoCompression } from "./Preprocess.js"
import Heart from "./Heart.js"
import {
    ClientCloseCodes,
    CloseReason,
    CodeFatality,
    NO_REASON,
} from "./GatewayLogic.js"

const VERSION = 9 /* We're using apiv9 here because that's what the
                     Discord web client still seemingly seems to
                     connect to the gateway with.
                  */

const baseUrl = `https://discord.com/api/v${VERSION}`

type SendPayloadByOpcode = {
    [x in Discord.GatewaySendPayload["op"]]: Discord.GatewaySendPayload & {
        op: x
    }
}

export interface GatewaySession {
    /**
     * @description The session's ID.
     */
    id: string
    /**
     * @description The last sequence number provided by the gateway.
     */
    sequence: number
    /**
     * @description gateway_resume_url provided by the Discord gateway.
     */
    resumeUrl: string
    /**
     * @description The user that the session operates under.
     */
    user: Discord.APIUser
}

export default class Gateway extends EventEmitter<
    {
        close: [{ code: CloseReason; message?: string; fatal: boolean }]
        open: []
        ready: [GatewaySession]
    } & {
        [x in Discord.GatewayDispatchEvents as `dispatch:${Discord.GatewayDispatchEvents}`]: [
            (Discord.GatewayDispatchPayload & {
                t: x
            })["d"]
        ]
    }
> {
    /**
     * @description Current WebSocket used by the gateway..
     */
    private ws: WebSocket | undefined

    /**
     * @description Cached gateway URL.
     */
    private cachedGatewayUrl: string | undefined

    /**
     * @description The Heart of the gateway.
     */
    private heart: Heart = new Heart(this)

    /**
     * @description Current session used by the Gateway, if any.
     */
    session?: GatewaySession

    /**
     * @description The token used to connect to the gateway.
     */
    token: string | undefined

    /**
     * @description A preprocessor which processes raw data going in and out of the gateway socket. Useful for implementing compression.
     */
    preprocessor: Preprocess = new PreprocessNoCompression()

    /**
     * @description Whether or not the socket is ready to use.
     */
    get canSendMessages() {
        return (
            this.ws &&
            this.ws.readyState == WebSocket.OPEN && // Is the socket open?
            this.heart.beating
        ) // Have we gotten a Hello from Discord yet?
    }

    constructor() {
        super()
    }

    /**
     * @returns A promise that resolves or rejects when the WebSocket connects or disconnects respectively.
     */
    private waitForOpen() {
        return new Promise<void>((res, rej) => {
            let ws = this.ws
            // If we aren't connecting, reject
            if (!ws || ws.readyState > WebSocket.OPEN) return rej()

            // If we are connected, resolve
            if (ws.OPEN) return res()

            ws.addEventListener(
                "open",
                () => {
                    res()
                    ws.removeEventListener("close", rej)
                    ws.removeEventListener("error", rej)
                },
                { once: true }
            )
            ws.addEventListener("close", rej, { once: true })
            ws.addEventListener("error", rej, { once: true })
        })
    }

    /**
     * @returns A promise that resolves or rejects after a Hello has been sent through the gateway.
     */
    waitForUsable() {
        return new Promise<void>(async res => {
            await this.waitForOpen() // Wait for the socket to open first

            if (this.heart.beating) res()
            else this.heart.on("start", res, { once: true })
        })
    }

    /**
     * @description Process a payload received from Discord.
     */
    private onMessage(message: Discord.GatewayReceivePayload) {
        const { d: data, op: opcode, s: sequence, t: dispatchType } = message
        switch (opcode) {
            case Discord.GatewayOpcodes.Hello:
                this.heart.startBeating(message)
                break
            case Discord.GatewayOpcodes.Heartbeat:
                this.heart.beat()
                break
            case Discord.GatewayOpcodes.HeartbeatAck:
                this.heart.acknowledged = true
                break
            case Discord.GatewayOpcodes.Reconnect:
                this.throw(
                    ClientCloseCodes.GatewayRequestedReconnect,
                    "Gateway sent opcode 7"
                )
                break
            case Discord.GatewayOpcodes.Dispatch:
                if (dispatchType == Discord.GatewayDispatchEvents.Ready) {
                    // We've got the data to construct a session.
                    this.session = {
                        resumeUrl: data.resume_gateway_url,
                        id: data.session_id,
                        sequence: sequence,
                        user: data.user,
                    }
                    // Let's tell everyone the gateway's ready for use.
                    this.emit("ready", this.session)
                } else {
                    // We get a sequence number with each Dispatch; let's save it.
                    this.session!.sequence = sequence
                    // emit dispatch event
                    this.emit(`dispatch:${dispatchType}`, data)
                }
            case Discord.GatewayOpcodes.InvalidSession:
                // Resume if we can, else identify
                if (data) this.resume()
                else this.identify()
        }
    }

    /**
     * @description Handler for the WebSocket's close event.
     */
    private onClose(code: CloseReason = NO_REASON, message?: string) {
        const fatal = CodeFatality[code]

        // Close is fatal; let's set session to undefined
        if (fatal) this.session = undefined

        // Emit close event
        this.emit("close", {
            code,
            message,
            fatal,
        })
    }

    /**
     * @description Send a message to Discord.
     * @param op Opcode.
     * @param data Payload.
     * @returns
     */
    send<T extends Discord.GatewaySendPayload["op"]>(
        op: T,
        d: SendPayloadByOpcode[T]["d"]
    ) {
        if (!this.canSendMessages) return

        this.ws!.send(
            this.preprocessor.in({
                op,
                d,
            })
        )
    }

    /**
     * @description Connects to the Discord gateway.
     * @param to URL to connect to.
     * @default to Cached gateway URL or a freshly fetched URL.
     */
    connect(to?: string) {
        return new Promise(async (res, rej) => {
            // Get gateway URL
            const url = new URL(
                to ||
                    this.cachedGatewayUrl ||
                    (this.cachedGatewayUrl = (
                        (await (
                            await fetch(`${baseUrl}/gateway`)
                        ).json()) as Discord.APIGatewayInfo
                    ).url)
            )

            // Add query params to specify version, encoding

            url.searchParams.append("v", "9")
            url.searchParams.append("encoding", "json")
            // url.searchParams.append("compression", "zlib-stream")

            // Connect to the gateway
            this.ws = new WebSocket(url)

            // Bind events
            this.ws.addEventListener("message", message =>
                this.onMessage(this.preprocessor.out(message.data))
            )

            this.ws.addEventListener(
                "close",
                ({ code, reason }) => this.onClose(code, reason),
                { once: true }
            )

            this.ws.addEventListener("open", _ => this.emit("open"), {
                once: true,
            })

            // Wait for socket to open to resolve
            this.waitForOpen().then(res).catch(rej)
        })
    }

    /**
     * @description Ensure a connection to the Discord gateway, calling connect() and waitForUsable() as needed.
     * @param to The URL to connect to if not already connected to the gateway.
     */
    async ensureConnection(to?: string) {
        if (!this.ws || this.ws.readyState > WebSocket.OPEN)
            // Not connecting or connected. Let's connect first.
            await this.connect(to)

        // Let's wait for this socket to be usable before we Resume.
        await this.waitForUsable()
    }

    /**
     * @description Logs into the Discord gateway. Calls gateway.connect() if it hasn't been called previously.
     * @param token The user's token.
     */
    async identify() {
        if (!this.token)
            throw this.throw(
                ClientCloseCodes.InternalClientError,
                "Client tried to identify with no token"
            )

        // Let's make sure we're connected to the Discord gateway.
        await this.ensureConnection()

        // Ask Discord to identify.
        this.send(Discord.GatewayOpcodes.Identify, {
            token: this.token,
            /* intents: 0,*/
            properties: {
                /* 
                    Should we impersonate the Discord client?
                    gtkcord4/Dissent doesn't, so I won't.
                */
                os: (window.navigator.userAgent.match(/\((.*)\)/) || [
                    "Unknown",
                ])[0],
                browser: __BROWSER__,
                device: `Feather`,
            },
        } as any)
    }

    /**
     * @description Tries to resume a previous connection. Reidentifies if resuming fails. Calls gateway.connect() if it hasn't been called previously.
     */
    async resume() {
        if (!this.token)
            throw this.throw(
                ClientCloseCodes.InternalClientError,
                "Client tried to resume with no token"
            )

        if (!this.session)
            throw this.throw(
                ClientCloseCodes.InternalClientError,
                "Client tried to resume a nonexistent session"
            )

        // Ensure we're connected to the Discord gateway. Try to connect to the cachedResumeUrl if any.
        await this.ensureConnection(this.session.resumeUrl)

        // Okay, now time to resume.
        this.send(Discord.GatewayOpcodes.Resume, {
            token: this.token,
            session_id: this.session.id,
            seq: this.session.sequence,
        })
    }

    /**
     * @description Sets Gateway.token and identifies with the gateway.
     * @param token The token to login with.
     */
    login(token: string) {
        this.token = token
        return this.identify() // Identify with gateway, connect if needed...
    }

    /**
     * @description Close the WebSocket connection, if any.
     * @param code Code to close the WebSocket connection with.
     * @param message Reason for closing the WebSocket.
     * @returns A throwable Error.
     */
    throw(
        code: ClientCloseCodes | typeof NO_REASON = NO_REASON,
        message: string
    ) {
        // Close the WebSocket.
        if (this.ws && this.ws.readyState < WebSocket.CLOSED)
            this.ws.close(code == NO_REASON ? undefined : code, message)

        return new Error(message)
    }

    /**
     * @description Initiate a disconnect from the gateway and terminate the session.
     * @param reason Reason for the disconnect
     */
    disconnect(reason?: string) {
        this.throw(
            ClientCloseCodes.Invalidate,
            `Feather disconnected with reason ${reason}`
        )
    }
}
