export interface Song {
    title: string;
    id: string;
    thumbnailUrl: string;
    playInfo: SongPlayInfo[];    
}

export type SongPlayRating = 'NONE' | 'E' | 'D' | 'C' | 'B' | 'A' | 'AA' | 'AAA';

export interface SongPlayInfo {
    timestamp?: string;
    score?: number;
    rating: SongPlayRating;
    difficulty: SongDifficultyInfo;
}

export interface SongDifficultyInfo {
    difficulty: string;
    ratingThumbnailUrl: string;
}

export type SongStyle = 'single';

export interface SongMetadata {
    title: string;
    artist: string;
    id: string;
    styles: SongStyleMetadata[];
}

export interface SongStyleMetadata {
    style: SongStyle;
    difficulties: SongStyleDifficultyMetadata[];
}

export type SongStyleDifficultyName = 'beginner' | 'basic' | 'difficult' | 'expert' | 'challenge';;

export interface SongStyleDifficultyMetadata {
    name: SongStyleDifficultyName
    value?: number;
}