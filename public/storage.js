const ZUNOX_DB_NAME = "ZunoXWalletDB";
const ZUNOX_DB_VERSION = 1;
const ZUNOX_STORE = "wallet";

function openZunoXDB() {
    return new Promise((resolve, reject) => {

        const request = indexedDB.open(
            ZUNOX_DB_NAME,
            ZUNOX_DB_VERSION
        );

        request.onupgradeneeded = () => {

            const db = request.result;

            if (!db.objectStoreNames.contains(ZUNOX_STORE)) {
                db.createObjectStore(ZUNOX_STORE);
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}


// ==========================================
// SAVE ENCRYPTED WALLET
// ==========================================

async function saveEncryptedWallet(encryptedJson) {

    const db = await openZunoXDB();

    return new Promise((resolve, reject) => {

        const tx = db.transaction(
            ZUNOX_STORE,
            "readwrite"
        );

        const store =
            tx.objectStore(ZUNOX_STORE);

        const request = store.put(
            encryptedJson,
            "encryptedWallet"
        );

        request.onsuccess = () => {
            resolve(true);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}


// ==========================================
// GET ENCRYPTED WALLET
// ==========================================

async function getEncryptedWallet() {

    const db = await openZunoXDB();

    return new Promise((resolve, reject) => {

        const tx = db.transaction(
            ZUNOX_STORE,
            "readonly"
        );

        const store =
            tx.objectStore(ZUNOX_STORE);

        const request = store.get(
            "encryptedWallet"
        );

        request.onsuccess = () => {
            resolve(request.result || null);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}


// ==========================================
// CHECK WALLET
// ==========================================

async function hasLocalWallet() {

    const wallet =
        await getEncryptedWallet();

    return wallet !== null;
}


// ==========================================
// DELETE WALLET
// ==========================================

async function deleteLocalWallet() {

    const db = await openZunoXDB();

    return new Promise((resolve, reject) => {

        const tx = db.transaction(
            ZUNOX_STORE,
            "readwrite"
        );

        const store =
            tx.objectStore(ZUNOX_STORE);

        const request = store.delete(
            "encryptedWallet"
        );

        request.onsuccess = () => {
            resolve(true);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}