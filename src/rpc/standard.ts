import { z } from "zod"

/**
 * @description Request to the parent to notify it that the child has disconnected from the gateway.
 */
export const ChildDisconnectedFromGateway = z.object({
    type: z.literal("disconnect"),
    fatal: z.boolean(),
    message: z.string(),
})

/**
 * @description Request to the parent to notify it that the child has connected to the gateway.
 */
export const ChildConnectedToGateway = z.object({
    type: z.literal("connect"),
})

/**
 * @description Request to the parent to notify it that the child has authenticated to the gateway.
 */
export const ChildAuthenticated = z.object({
    type: z.literal("authenticated"),
    user: z.object({
        name: z.string(),
    }),
})

/**
 * @description Request to the child to set the current activity.
 */
export const ParentSetActivity = z.object({
    type: z.literal("setActivity"),
})

/**
 * @description A request from the child targeting the parent.
 */
export const CTPRequest = z.discriminatedUnion("type", [
    ChildDisconnectedFromGateway,
    ChildConnectedToGateway,
    ChildAuthenticated,
])

/**
 * @description A request from the parent targeting the child.
 */
export const PTCRequest = z.discriminatedUnion("type", [ParentSetActivity])
