import { GatewayCloseCodes } from "discord-api-types/v10"

/**
 * @description Close codes used by the Feather RPC client
 */
export enum ClientCloseCodes {
    Invalidate = 1000,
    InternalClientError = 1001,
    InvalidHeartbeat = 1002,
    GatewayRequestedReconnect = 1003,
}

/**
 * @description Replace closeCode with this value
 */
export const NO_REASON = Symbol("NO_REASON")

/**
 * @description All close reasons.
 */
export type CloseReason =
    | ClientCloseCodes
    | GatewayCloseCodes
    | typeof NO_REASON

/**
 * @description Codes and whether or not they are fatal. If true, do not resume. If false, we can attempt to resume.
 */
export const CodeFatality: Record<CloseReason, boolean> = {
    [ClientCloseCodes.Invalidate]: true,
    [ClientCloseCodes.InternalClientError]: true,
    [ClientCloseCodes.InvalidHeartbeat]: false,
    [ClientCloseCodes.GatewayRequestedReconnect]: false,
    [GatewayCloseCodes.UnknownError]: false,
    [GatewayCloseCodes.UnknownOpcode]: false,
    [GatewayCloseCodes.DecodeError]: false,
    [GatewayCloseCodes.NotAuthenticated]: false,
    [GatewayCloseCodes.AuthenticationFailed]: true,
    [GatewayCloseCodes.AlreadyAuthenticated]: false,
    [GatewayCloseCodes.InvalidSeq]: false,
    [GatewayCloseCodes.RateLimited]: false,
    [GatewayCloseCodes.SessionTimedOut]: false,
    [GatewayCloseCodes.InvalidShard]: true,
    [GatewayCloseCodes.ShardingRequired]: true,
    [GatewayCloseCodes.InvalidAPIVersion]: true,
    [GatewayCloseCodes.InvalidIntents]: true,
    [GatewayCloseCodes.DisallowedIntents]: true,
    [NO_REASON]: false,
}
