/**
 * A utility function that stops the propagation and default behavior of an event,
 * and then executes a user-provided callback.
 *
 * @remarks
 * This function is particularly useful when you want to suppress the default browser
 * event behavior and event bubbling while performing a specific action via the callback.
 * It is typically used in event handlers.
 *
 * @param callback - A function to execute after stopping the event propagation and prevention.
 * @returns A function that takes an event object, prevents the event's default behavior and propagation,
 * and executes the provided callback.
 *
 * @example
 * ```typescript
 * const handleClick = stopEventWithCallback(() => {
 *     console.log("Event stopped and callback executed!");
 * });
 *
 * // Usage in an onClick handler
 * <button onClick={handleClick}>Click Me</button>
 * ```
 */
export const stopEventWithCallback =
    (callback: () => void) =>
    (e: { stopPropagation: () => void; preventDefault: () => void }) => {
        e.stopPropagation();
        e.preventDefault();
        callback();
    };
