export interface EmojiRole {
    emoji: string;
    role_id: string;
}


export interface Guild {
    id: string;
    name: string;
    icon: string | null;
    bot_joined: boolean;
}
