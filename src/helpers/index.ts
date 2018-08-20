import { EAMUSEMENT_URL } from "./constants";

export function toEAmusementUrl(relativeUrl: string): string {
    return `${EAMUSEMENT_URL}${relativeUrl}`;
}