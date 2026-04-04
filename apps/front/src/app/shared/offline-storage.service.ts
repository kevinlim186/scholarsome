import { Injectable } from "@angular/core";
import { Card } from "@prisma/client";
import { User, Set } from "@scholarsome/shared";

@Injectable({
  providedIn: "root"
})
export class OfflineStorageService {
  private dbName = "ScholarsomeOffline";
  private dbVersion = 1;

  constructor() {}

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("studySets")) {
          db.createObjectStore("studySets", { keyPath: "id" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveStudySet(set: Set & { cards: Card[] }): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction("studySets", "readwrite");
    const store = transaction.objectStore("studySets");
    store.put(set);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getStudySet(id: string): Promise<(Set & { cards: Card[] }) | null> {
    const db = await this.openDB();
    const transaction = db.transaction("studySets", "readonly");
    const store = transaction.objectStore("studySets");
    const request = store.get(id);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllStudySets(): Promise<(Set & { cards: Card[] })[]> {
    const db = await this.openDB();
    const transaction = db.transaction("studySets", "readonly");
    const store = transaction.objectStore("studySets");
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteStudySet(id: string): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction("studySets", "readwrite");
    const store = transaction.objectStore("studySets");
    store.delete(id);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}
