import { useRef, useState } from "react";
import type { Event } from "../types";

export default function useEventQueue(processEvent: (event: Event) => Promise<void>) {
    const refEventQueue = useRef<Event[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const enqueue = (event: Event) => {
        // Prevent duplicate events from being added to the queue
        if (refEventQueue.current.length > 0) {
            const lastEvent = refEventQueue.current[refEventQueue.current.length - 1];
            if (lastEvent.type === event.type && deepEqual(lastEvent.payload, event.payload)) {
                return;
            }
        }
        refEventQueue.current.push(event);
    }

    const processNext = async () => {
        // Prevent caller from double calling
        if (isProcessing) return
        // Prevent caller from calling when queue is empty
        if (refEventQueue.current.length === 0) {
            setIsProcessing(false);
        }

        // Process the next event in the queue
        const event = refEventQueue.current.shift();
        if (!event) return;
        setIsProcessing(true);
        await processEvent(event);
        setIsProcessing(false);
        // Recursively process all events in the queue
        processNext();
    }

    return {
        enqueue,
        processNext,
        isProcessing,
    }
}

function deepEqual(a: any, b: any) {
    if (a === b) return true;
    if (a && b && typeof a === 'object' && typeof b === 'object') {
        if (a.constructor !== b.constructor) return false;

        let keys = Object.keys(a);
        if (keys.length !== Object.keys(b).length) return false;

        for (let i = 0; i < keys.length; i++) {
            if (!deepEqual(a[keys[i]], b[keys[i]])) return false;
        }

        return true;
    }
    return false;
}
