// https://discord.com/developers/docs/topics/gateway#sending-heartbeats

import { GatewayHello, GatewayOpcodes } from "discord-api-types/v10"
import type Gateway from "./Gateway.js"
import EventEmitter from "@feather-ext/events"
import { ClientCloseCodes } from "./GatewayLogic.js"

export default class Heart extends EventEmitter<{
    beat: []
    start: []
    stop: []
}> {
    /**
     * @description The Gateway this Heart belongs to.
     */
    parent: Gateway

    /**
     * @description ID of the current timeout.
     */
    private interval: ReturnType<
        typeof setInterval | typeof setTimeout
    > | null = null

    /**
     * @description Whether or not the last heartbeat has been acknowledged.
     */
    acknowledged: boolean = false

    /**
     * @description Whether or not the heart is currently beating.
     */
    get beating() {
        return this.interval === null
    }

    /**
     * @description Start beating every X seconds.
     */
    startBeating(helloMessage: GatewayHello): void
    startBeating(every: number): void
    startBeating(every: number | GatewayHello) {
        if (typeof every == "object") every = every.d.heartbeat_interval

        this.acknowledged = true

        // https://discord.com/developers/docs/topics/gateway#heartbeat-interval
        this.interval = setTimeout(() => {
            this.beat() // send a heartbeat
            this.interval = setInterval(this.beat.bind(this), every) // then start the interval
        }, every * Math.random() /* heartbeat_interval * jitter */)

        this.emit("start")
    }

    /**
     * @description Clear the heartbeat timeout, if it exists.
     */
    stopBeating() {
        if (this.interval) {
            // Remove interval
            clearTimeout(this.interval)
            this.interval = null
            this.emit("stop") // Emit event
        }
    }

    /**
     * @description Heartbeat.
     */
    beat() {
        if (!this.acknowledged)
            throw this.parent.throw(
                ClientCloseCodes.InvalidHeartbeat,
                `Previous heartbeat went unacknowledged`
            )
        this.parent.send(
            GatewayOpcodes.Heartbeat,
            this.parent.session!.sequence
        )
        this.emit("beat")
    }

    constructor(parent: Gateway) {
        super()
        this.parent = parent

        // Let's stop beating when the socket closes.
        this.parent.on("close", this.stopBeating.bind(this))
    }
}
