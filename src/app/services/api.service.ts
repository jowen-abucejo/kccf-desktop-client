import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map } from "rxjs/operators";
import { ApiConfiguration } from "../interfaces/app-configuration";
import { SchoolSetting } from "../interfaces/school-setting";
import { Student } from "../interfaces/student";
import { AuthenticationService } from "./authentication.service";
import { StorageService } from "./storage.service";

export const API_ENDPOINTS = {
	LEVELS: "levels",
	PROGRAMS: "programs",
	SCHOOL_SETTINGS: "school-settings",
	STUDENTS: "students",
	STUDENT_TYPES: "student-types",
	STUDENT_REGISTRATION: "student-registrations",
	TERMS: "terms",
	USERS: "users",
};

@Injectable({
	providedIn: "root",
})
export class ApiService {
	api_config: ApiConfiguration = { domain: "", version: "" };
	constructor(
		private http: HttpClient,
		private auth: AuthenticationService,
		private storage: StorageService
	) {
		this.auth.api
			.pipe(
				map((api) => {
					this.api_config = api;
				})
			)
			.subscribe();
	}

	private async cachedOrRequest(url: string, fresh: boolean = false) {
		let data = null;
		if (!fresh) {
			data = await this.storage.getCachedData(url);
		}
		if (!data || fresh) {
			data = await this.http
				.get(url, {
					headers: this.auth.createHeader(),
				})
				.toPromise();
			if (data) this.storage.setCachedData(url, data);
		}
		return data;
	}

	private createUrlPrefix(): string {
		return `${this.api_config.domain}/api/${this.api_config.version}`;
	}

	createSchoolSetting(data: SchoolSetting) {
		const url = `${this.createUrlPrefix()}/${
			API_ENDPOINTS.SCHOOL_SETTINGS
		}/school-setting`;

		return this.http
			.post(
				url,
				{ new_setting: data },
				{ headers: this.auth.createHeader() }
			)
			.toPromise();
	}

	getLevels(fresh: boolean = false) {
		const url = `${this.createUrlPrefix()}/${API_ENDPOINTS.LEVELS}`;
		return this.cachedOrRequest(url, fresh);
	}

	getPrograms(fresh: boolean = false) {
		const url = `${this.createUrlPrefix()}/${API_ENDPOINTS.PROGRAMS}`;
		return this.cachedOrRequest(url, fresh);
	}

	getSchoolSettings(fresh: boolean = false) {
		const url = `${this.createUrlPrefix()}/${
			API_ENDPOINTS.SCHOOL_SETTINGS
		}`;
		return this.cachedOrRequest(url, fresh);
	}

	getStudents(params: any) {
		const url = `${this.createUrlPrefix()}/${API_ENDPOINTS.STUDENTS}`;
		return this.http
			.get(url, {
				headers: this.auth.createHeader(),
				params: params,
			})
			.toPromise();
	}

	getStudentTypes(fresh: boolean = false) {
		const url = `${this.createUrlPrefix()}/${API_ENDPOINTS.STUDENT_TYPES}`;
		return this.cachedOrRequest(url, fresh);
	}

	getTerms(fresh: boolean = false) {
		const url = `${this.createUrlPrefix()}/${API_ENDPOINTS.TERMS}`;
		return this.cachedOrRequest(url, fresh);
	}

	registerStudent(data: any) {
		return this.http
			.post(
				`${this.createUrlPrefix()}/${
					API_ENDPOINTS.STUDENT_REGISTRATION
				}/registration`,
				{ registration: data },
				{ headers: this.auth.createHeader() }
			)
			.toPromise();
	}

	updateRegistration(data: any, id: number) {
		return this.http
			.put(
				`${this.createUrlPrefix()}/${
					API_ENDPOINTS.STUDENT_REGISTRATION
				}/registration/${id}`,
				{ registration: data },
				{ headers: this.auth.createHeader() }
			)
			.toPromise();
	}

	validateEmailAddress(email: string, ignore_id: number) {
		return this.http
			.post(
				`${this.createUrlPrefix()}/${
					API_ENDPOINTS.USERS
				}/validate-email`,
				{ email: email, ignore_id: ignore_id },
				{ headers: this.auth.createHeader() }
			)
			.toPromise();
	}
}
