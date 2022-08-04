import { Injectable } from "@angular/core";
import { Storage } from "@ionic/storage-angular";
import { BehaviorSubject, from, of } from "rxjs";
import { filter, switchMap, take } from "rxjs/operators";

export const TABLE_SETTINGS_PREFIX = "settings_";

@Injectable({
	providedIn: "root",
})
export class StorageService {
	private isReady = new BehaviorSubject(false);
	private cached_prefix: string = "temp_data_";
	private _storage: Storage | null = null;

	constructor(private storage: Storage) {
		this.init();
	}

	/**
	 * Create a new instance of storage
	 */
	async init() {
		// If using, define drivers here: await this.storage.defineDriver(/*...*/);
		// await this.storage.defineDriver(Drivers.IndexedDB);
		const storage = await this.storage.create();
		this._storage = storage;

		this.isReady.next(true);
	}

	/**
	 * Get the value associated with the given key.
	 * @param key the key to identify this value
	 * @returns Returns a promise with the value of the given key
	 */
	public async get(key: string) {
		// return await this._storage.get(key);
		const data = this.isReady
			.pipe(
				filter((ready) => ready),
				switchMap((_) => {
					return this._storage.get(key);
				})
			)
			.pipe(take(1))
			.toPromise();
		return data;
	}

	/**
	 * Get the cached data for the given url
	 * @param url the url where the data was retrieved from
	 * @returns Returns a promise that resolves with the data for the requested url
	 */
	getCachedData(url: string) {
		const key = this.cached_prefix + url;
		return this.get(key);
	}

	/**
	 * Set the value for the given key.
	 * @param key the key to identify this value
	 * @param value the value for this key
	 * @returns Returns a promise that resolves when the key and value are set
	 */
	public async set(key: string, value: any) {
		return this._storage?.set(key, value);
	}

	/**
	 * Cache the data with the given url
	 * @param url the url where the data was retrieved from
	 * @param value the data retrieve from the server
	 * @returns Returns a promise that resolves when the url and value are set
	 */
	setCachedData(url: string, value: any) {
		const key = this.cached_prefix + url;
		return this.set(key, value);
	}

	/**
	 * Remove any value associated with this key.
	 * @param key the key to identify this value
	 * @returns Returns a promise that resolves when the value is removed
	 */
	public async remove(key: string) {
		await this._storage.remove(key);
	}

	/**
	 * Remove the cached data associated with the url
	 * @param url the url where the data was retrieved from
	 * @returns Returns a promise that resolves when the data was removed.
	 */
	removeCachedData(url: string) {
		const key = this.cached_prefix + url;
		return this.remove(key);
	}

	/**
	 * Removes all cached data
	 */
	async removeAllCachedData() {
		const keys = await this._storage.keys();
		keys.map(async (key) => {
			if (key.startsWith(this.cached_prefix)) {
				await this.remove(key);
			}
		});
	}
}
