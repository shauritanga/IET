import { useEffect, useRef } from "react";
import { v4 as uuidV4 } from "uuid";

type Options = {
    prefix?: string;

    generator?: () => string;
};

export const generateUniqueId = () => uuidV4();

/**
 * Returns a stable array of IDs with the requested length.
 * - IDs remain stable for the lifecycle of the component.
 * - When `count` increases, new IDs are appended.
 * - When `count` decreases, extra IDs are dropped.
 */
export const useStableIds = (count: number, options: Options = {}) => {
    const { prefix = "", generator = generateUniqueId } = options;
    const idsRef = useRef<string[]>([]);

    // Initialize once
    if (idsRef.current.length === 0 && count > 0) {
        idsRef.current = Array.from({ length: count }, () => generator());
    }

    useEffect(() => {
        const current = idsRef.current.length;
        if (count > current) {
            // Add new IDs to reach the new count
            idsRef.current.push(
                ...Array.from({ length: count - current }, () => generator())
            );
        } else if (count < current) {
            idsRef.current = idsRef.current.slice(0, count);
        }
    }, [count, generator]);

    return prefix
        ? idsRef.current.map((id) => `${prefix}${id}`)
        : idsRef.current;
};
