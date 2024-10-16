type EventList = Record<string, any[]>
type EventCallback<Events extends EventList, Event extends keyof Events> =
    (...emissions: Events[Event]) => void
type EventEmitterListener<Events extends EventList, ForEvent extends keyof Events> =
    {
        callback: EventCallback<Events, ForEvent>,
        once: boolean
    }
type EventEmitterListeners<Events extends EventList> =
    {
        [Evt in keyof Events]:
            EventEmitterListener<Events, Evt>[] | undefined
    }

/**
 * @description Reimplementation of NodeJS.EventEmitter, with a few extras.
 */
export default class EventEmitter<Events extends EventList> {
    
    private readonly listeners: EventEmitterListeners<Events> = {} as EventEmitterListeners<Events>

    private getListenersFor<ChosenEvent extends keyof Events>(event: ChosenEvent) {
        if (!this.listeners[event])
            this.listeners[event] = []

        return this.listeners[event]!
    }

    on<ChosenEvent extends keyof Events>(
        event: ChosenEvent,
        callback: EventCallback<Events, ChosenEvent>,
        settings: { once?: boolean, index?: number } = {}
    ) {
        const EventListenerList = this.getListenersFor(event)
        const { once = false, index = EventListenerList.length } = settings

        EventListenerList.splice(
            index,
            0,
            {
                callback,
                once
            }
        )

        return this
    }

    removeListener<ChosenEvent extends keyof Events>(event: ChosenEvent, callback: EventCallback<Events, ChosenEvent>) {
        const EventListenerList = this.getListenersFor(event)
        
        const idx =
            EventListenerList.findIndex(e => e.callback == callback)
            
        if (idx)
            EventListenerList.splice(idx, 1)
    }

    async emit<ChosenEvent extends keyof Events>(event: ChosenEvent, ...emissions: Events[ChosenEvent]) {
        const EventListenerList = this.getListenersFor(event)

        for (let [index, listener] of EventListenerList.entries()) {
            // Remove listeners marked with `once`
            if (listener.once)
                EventListenerList.splice(index, 1)
            
            // Try executing the listener
            try {
                await listener.callback(...emissions.slice(0) as Events[ChosenEvent])
            } catch (e) {
                console.error(e)
            }
        }
    }

}