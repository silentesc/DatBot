import { EmojiRole } from "../api/models";


export let reactionRoles: Array<{ [key: string]: string | Array<EmojiRole> }> = [];

export enum ReactionRoleType {
    STANDARD = "STANDARD",
    UNIQUE = "UNIQUE"
}

export function setReactionRoles(newReactionRoles: Array<{ [key: string]: string | Array<EmojiRole> }>) {
    reactionRoles = newReactionRoles;
}
