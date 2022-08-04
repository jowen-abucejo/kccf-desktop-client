import { Injectable } from "@angular/core";
import { ApiConfiguration, Credentials } from "../interfaces/app-configuration";
import { StorageService } from "./storage.service";

export const API_KEY = "_api_";
export const SU_KEY = "_su_";

@Injectable({
	providedIn: "root",
})
export class ConfigurationService {
	constructor(private storage: StorageService) {
		this.init();
	}

	/**
	 * Set API for this app to connect to
	 * @param new_api_config the new api configuration
	 * @param reload restart this application
	 */
	async configureApi(
		new_api_config: ApiConfiguration,
		reload: boolean = false
	) {
		new_api_config.domain = new_api_config.domain.replace(/ /g, "") ?? "";
		new_api_config.version = new_api_config.version.replace(/ /g, "") ?? "";
		await this.storage
			.set(API_KEY, JSON.stringify(new_api_config))
			.catch((er) => {
				return null;
			});
		if (reload)
			try {
				//access electron's exposed method to save api and restart application
				(<any>window).configure.setApi(new_api_config);
			} catch (er) {}
	}

	/**
	 * Set superuser account for this application
	 * @param new_superuser new superuser credentials
	 */
	async configureSuperUser(new_superuser: Credentials) {
		await this.storage
			.set(SU_KEY, JSON.stringify(new_superuser))
			.catch((er) => {
				return null;
			});
	}

	/**
	 * get the api configuration for this application
	 * @returns returns the api configuration
	 */
	async getApiConfiguration() {
		const data = await this.storage.get(API_KEY);
		let api: ApiConfiguration = JSON.parse(data);
		return api;
	}

	/**
	 * Get the superuser account details
	 * @returns Returns an object of superuser
	 */
	async getSuperUser() {
		let superuser: Credentials = { username: "", password: "" };
		superuser = JSON.parse(await this.storage.get(SU_KEY));
		return superuser;
	}

	/**
	 * Initialize configuration of this application
	 */
	private async init() {
		let api_config: ApiConfiguration = await this.getApiConfiguration();
		let superuser: Credentials = await this.getSuperUser();

		if (api_config && api_config.domain && api_config.version) {
			await this.configureApi(api_config);
		} else {
			await this.loadDefaultApi();
		}

		if (superuser && superuser.username && superuser.password) {
			await this.configureSuperUser(superuser);
		} else {
			await this.loadDefaultSuperuser();
		}
	}

	/**
	 * Load the default api configuration
	 * @param reload restart application
	 */
	async loadDefaultApi(reload: boolean = false) {
		let default_api: ApiConfiguration = {
			domain: "kccfsystem.local",
			version: "v1",
		};
		await this.configureApi(default_api, reload);
	}

	/**
	 * Load the default superuser credentials
	 */
	async loadDefaultSuperuser() {
		let default_superuser: Credentials = {
			username: "Superuser@123",
			password: "Superuser@123",
		};
		await this.configureSuperUser(default_superuser);
	}
}
