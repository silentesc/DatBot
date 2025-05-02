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


export interface Channel {
    id: string;
    name: string;
    type: number;
    parent_id: string;
    position: number;
}


export interface WelcomeMessage {
    guild: Guild;
    channel: Channel;
    message: string;
}


export interface LeaveMessage {
    guild: Guild;
    channel: Channel;
    message: string;
}


export interface Role {
    id: string;
    name: string;
    color: number;
    position: number;
    managed: boolean;
}
