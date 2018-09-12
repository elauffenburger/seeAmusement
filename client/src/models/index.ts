export interface Song {
    id: string;
    title: string;
    artist: string;
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

export interface SongMetadataLookup {
    [id: string]: SongMetadata;
}

export interface SongMetadata {
    id: string;
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
    value?: number;
}