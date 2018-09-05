export interface Song {
    title: string;
    artist: string;
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

export type SongStyle = 'single';

export interface SongMetadata {
    title: string;
    artist: string;
    styles: SongStyleMetadata[];
}

export interface SongStyleMetadata {
    style: SongStyle;
    difficulties: SongStyleDifficultyMetadata[];
}

export type SongStyleDifficultyName = 'beginner' | 'basic' | 'difficult' | 'expert' | 'challenge';;

export interface SongStyleDifficultyMetadata {
    name: SongStyleDifficultyName
    score?: number;
}