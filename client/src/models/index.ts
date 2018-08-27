export interface Song {
    title: string;
    thumbnailUrl: string;
    playInfo: SongPlayInfo[];    
}

export interface SongPlayInfo {
    timestamp: string;
    difficulty: SongDifficultyInfo;
}

export interface SongDifficultyInfo {
    difficulty: string;
    score: string;
    ratingThumbnailUrl: string;
}

export type SongType = 'single';