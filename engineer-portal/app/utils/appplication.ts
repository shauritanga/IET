// ~/utils/application.ts
import { getFromCookie } from "~/utils/storage";

export const getApplicationId = () => {
    const value = getFromCookie("application-id");
    if (!value || value === "null" || value === "undefined") return null;
    return value;
};
