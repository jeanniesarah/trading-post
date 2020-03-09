import state from "./state";
import { Ed25519PrivateKey } from "@hashgraph/sdk";
import * as announce from "./events/announce";

const userPrivateKeyStorageKey = "trading-post:self:key";

let currentUserPrivateKey: Ed25519PrivateKey | null = getCurrentUserPrivateKey();

function getCurrentUserPrivateKey(): Ed25519PrivateKey | null {
    const keyText = window.localStorage.getItem(userPrivateKeyStorageKey);
    if (keyText == null) {
        return null;
    }

    return Ed25519PrivateKey.fromString(keyText);
}

// True if the current user exists locally (aka. visited the app before)
export function currentUserExistsLocally(): boolean {
    return currentUserPrivateKey != null;
}

// True if the user exists on the network (at this time)
export function currentUserExists(): boolean {
    return currentUserPrivateKey != null
        ? state.network.users.has(currentUserPrivateKey.publicKey.toString())
        : false;
}

// Create a new user object for the current visitor
// TODO: name?
export async function createNewUserIfNeeded() {
    if (currentUserExistsLocally()) {
        // If we locally exist, let's assume that we also exist on the network
        return;
    }

    // Generate a new key to use
    currentUserPrivateKey = await Ed25519PrivateKey.generate();

    // Publish our current user to the network
    await announce.publish(currentUserPrivateKey.publicKey);

    // Remember our key
    window.localStorage.setItem(userPrivateKeyStorageKey, currentUserPrivateKey.toString());
}