import { useRef, useState } from "react";
import type { Event } from "../types";

export default function useEventQueue(processEvent: (event: Event) => Promise<void>) {
    const refEventQueue = useRef<Event[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const enqueue = (event: Event) => {
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
