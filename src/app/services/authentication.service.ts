import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { map, switchMap, take, tap } from "rxjs/operators";
import { ApiConfiguration, Credentials } from "../interfaces/app-configuration";

import { ConfigurationService } from "./configuration.service";
import { StorageService } from "./storage.service";

export const TOKEN_KEY = "_token_";
const LOG_ENDPOINTS = {
	LOGIN: "users/login",
	LOGOUT: "users/logout",
};

@Injectable({
	providedIn: "root",
})
export class AuthenticationService {
	isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject(null);
	isSuAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject(null);
	public token: any = {};
	private api_config: ApiConfiguration = { domain: "", version: "" };
	public api: BehaviorSubject<ApiConfiguration> = new BehaviorSubject(
		this.api_config
	);

	constructor(
		private http: HttpClient,
		private storage: StorageService,
		private config: ConfigurationService
	) {
		this.loadToken();
		this.api
			.pipe(
				map((api) => {
					this.api_config = api;
				})
			)
			.subscribe();

		this.config.getApiConfiguration().then((data) => {
			this.api.next(data);
		});
	}

	/**
	 * Create a header object for api requests
	 * @param withAccessToken if authorization code and tokens are needed
	 * @returns a new request header
	 */
	createHeader(withAccessToken: boolean = true) {
		const header = new HttpHeaders({
			Accept: "application/json",
			Authorization: withAccessToken
				? `${this.token.data.token_type} ${this.token.data.access_token}`
				: "",
		});
		return header;
	}

	/**
	 * Load previous access token from storage
	 * @param logout_if_expired redirect to login page if token is expired
	 */
	async loadToken(logout_if_expired: boolean = true) {
		const token_stored = await this.storage.get(TOKEN_KEY);
		this.token = JSON.parse(token_stored);
		if (this.token !== null && this.token.expired_at > Date.now()) {
			this.isAuthenticated.next(true);
		} else if (logout_if_expired) {
			this.logout();
		}
	}

	/**
	 * Determine if user is superuser
	 * @param superuser the login credentials
	 * @returns true if given credentials match the superuser account's credentials
	 */
	async isSuperuser(superuser: Credentials) {
		const su: Credentials = await this.config.getSuperUser();
		if (
			su.username == superuser.username &&
			su.password == superuser.password
		) {
			this.isSuAuthenticated.next(true);
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Login account and request access token for the given credentials
	 * @param credentials the login credentials
	 * @param re_login redirect to login page if login attempt failed
	 */
	login(credentials: Credentials, re_login: boolean = false) {
		let url = `${this.api_config?.domain}/api/${LOG_ENDPOINTS.LOGIN}`;
		const body = {
			email: credentials.username,
			password: credentials.password,
			api_version: this.api_config?.version,
		};

		return this.http
			.post(url, body, {
				headers: this.createHeader(false),
			})
			.pipe(
				take(1),
				map((data: any) => {
					return data;
				}),
				switchMap(async (data) => {
					await this.storage.set(
						TOKEN_KEY,
						JSON.stringify({
							data,
							expired_at: Date.now() + data.expires_in,
						})
					);
					return this.loadToken(!re_login);
				}),
				tap((_) => {
					this.isAuthenticated.next(true);
				})
			)
			.toPromise();
	}

	/**
	 * Logout account and revoke access token
	 * @returns true on successful logout
	 */
	async logout() {
		if (this.token) {
			await this.http
				.post(
					`${this.api_config.domain}/api/${this.api_config.version}/${LOG_ENDPOINTS.LOGOUT}`,
					{},
					{
						headers: this.createHeader(),
					}
				)
				.toPromise()
				.catch((er) => {});
			this.storage.remove(TOKEN_KEY);
		}
		this.storage.removeAllCachedData();
		this.isAuthenticated.next(false);
	}
}
