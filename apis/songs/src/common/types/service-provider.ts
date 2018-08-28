import { SongsService } from "../../common/services/songs";

export interface ServiceProvider {
    songs: SongsService;
}