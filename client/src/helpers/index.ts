import { environment } from '@app/env';

export function toEAmusementUrl(relativeUrl: string): string {
    return `${environment.eamusement.url}${relativeUrl}`;
}