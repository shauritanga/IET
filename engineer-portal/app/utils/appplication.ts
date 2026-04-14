// ~/utils/application.ts
import { getFromCookie } from "~/utils/storage";

export const getApplicationId = () => getFromCookie("application-id");