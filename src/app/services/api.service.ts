import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map } from "rxjs/operators";
import { ApiConfiguration } from "../interfaces/app-configuration";
import { CourseSubject } from "../interfaces/course-subject";
import { SchoolSetting } from "../interfaces/school-setting";
import { AuthenticationService } from "./authentication.service";
import { StorageService } from "./storage.service";

export const API_ENDPOINTS = {
	ENROLLMENT_HISTORIES: "enrollment-histories",
	LEVELS: "levels",
	PROGRAMS: "programs",
	PROGRAM_LEVELS: "program-levels",
	SCHOOL_SETTINGS: "school-settings",
	STUDENTS: "students",
	STUDENT_TYPES: "student-types",
	STUDENT_REGISTRATION: "student-registrations",
	SUBJECTS: "subjects",
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

	createEnrollmentHistory(data: any) {
		const url = `${this.createUrlPrefix()}/${
			API_ENDPOINTS.ENROLLMENT_HISTORIES
		}`;

		return this.http
			.post(
				url,
				{ new_enrollment: data },
				{ headers: this.auth.createHeader() }
			)
			.toPromise();
	}

	createProgram(data: any) {
		const url = `${this.createUrlPrefix()}/${API_ENDPOINTS.PROGRAMS}`;

		return this.http
			.post(
				url,
				{ new_program: data },
				{ headers: this.auth.createHeader() }
			)
			.toPromise();
	}

	createSchoolSetting(data: SchoolSetting) {
		const url = `${this.createUrlPrefix()}/${
			API_ENDPOINTS.SCHOOL_SETTINGS
		}`;

		return this.http
			.post(
				url,
				{ new_setting: data },
				{ headers: this.auth.createHeader() }
			)
			.toPromise();
	}

	createSubject(data: CourseSubject) {
		const url = `${this.createUrlPrefix()}/${API_ENDPOINTS.SUBJECTS}`;

		return this.http
			.post(
				url,
				{ new_subject: data },
				{ headers: this.auth.createHeader() }
			)
			.toPromise();
	}

	deleteProgram(
		id: number,
		forceDelete: boolean = false,
		toggle: boolean = true
	) {
		return this.http
			.delete(
				`${this.createUrlPrefix()}/${API_ENDPOINTS.PROGRAMS}/${id}`,
				{
					headers: this.auth.createHeader(),
					body: { forceDelete, toggle },
				}
			)
			.toPromise();
	}

	deleteSchoolSetting(id: number) {
		return this.http
			.delete(
				`${this.createUrlPrefix()}/${
					API_ENDPOINTS.SCHOOL_SETTINGS
				}/${id}`,
				{
					headers: this.auth.createHeader(),
				}
			)
			.toPromise();
	}

	deleteSubject(
		id: number,
		forceDelete: boolean = false,
		toggle: boolean = true
	) {
		return this.http
			.delete(
				`${this.createUrlPrefix()}/${API_ENDPOINTS.SUBJECTS}/${id}`,
				{
					headers: this.auth.createHeader(),
					body: { forceDelete, toggle },
				}
			)
			.toPromise();
	}

	deleteStudent(
		id: number,
		forceDelete: boolean = false,
		toggle: boolean = true
	) {
		return this.http
			.delete(
				`${this.createUrlPrefix()}/${API_ENDPOINTS.STUDENTS}/${id}`,
				{
					headers: this.auth.createHeader(),
					body: { forceDelete, toggle },
				}
			)
			.toPromise();
	}

	getEnrollmentHistory(id: number, params: any = null) {
		return this.http
			.get(
				`${this.createUrlPrefix()}/${
					API_ENDPOINTS.ENROLLMENT_HISTORIES
				}/${id}`,
				{
					headers: this.auth.createHeader(),
					params: params,
				}
			)
			.toPromise();
	}

	getEnrollmentHistories(params: any) {
		return this.http
			.get(
				`${this.createUrlPrefix()}/${
					API_ENDPOINTS.ENROLLMENT_HISTORIES
				}`,
				{
					headers: this.auth.createHeader(),
					params: params,
				}
			)
			.toPromise();
	}

	getProgramSubjects(program_id: number, params: any = null) {
		return this.http
			.get(
				`${this.createUrlPrefix()}/${
					API_ENDPOINTS.PROGRAMS
				}/${program_id}`,
				{
					headers: this.auth.createHeader(),
					params: params,
				}
			)
			.toPromise();
	}

	getLevels(fresh: boolean = false) {
		const url = `${this.createUrlPrefix()}/${API_ENDPOINTS.LEVELS}`;
		return this.cachedOrRequest(url, fresh);
	}

	getSchoolSetting(school_setting_id: number, params: any = null) {
		return this.http
			.get(
				`${this.createUrlPrefix()}/${
					API_ENDPOINTS.SCHOOL_SETTINGS
				}/${school_setting_id}`,
				{
					headers: this.auth.createHeader(),
					params: params,
				}
			)
			.toPromise();
	}

	getProgramLevels(fresh: boolean = false) {
		const url = `${this.createUrlPrefix()}/${API_ENDPOINTS.PROGRAM_LEVELS}`;
		return this.cachedOrRequest(url, fresh);
	}

	getPrograms(fresh: boolean = false, params: any = null) {
		const url = `${this.createUrlPrefix()}/${API_ENDPOINTS.PROGRAMS}`;
		if (params && params.withTrashed) {
			return this.http
				.get(url, {
					headers: this.auth.createHeader(),
					params: params,
				})
				.toPromise();
		}
		return this.cachedOrRequest(url, fresh);
	}

	getSchoolSettings(fresh: boolean = false, params: any = null) {
		const url = `${this.createUrlPrefix()}/${
			API_ENDPOINTS.SCHOOL_SETTINGS
		}`;

		if (params && params.withTrashed) {
			return this.http
				.get(url, {
					headers: this.auth.createHeader(),
					params: params,
				})
				.toPromise();
		}
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

	getSubjects(fresh: boolean = false, params: any = null) {
		const url = `${this.createUrlPrefix()}/${API_ENDPOINTS.SUBJECTS}`;
		if (params && params.withTrashed) {
			return this.http
				.get(url, {
					headers: this.auth.createHeader(),
					params: params,
				})
				.toPromise();
		}
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
				}`,
				{ registration: data },
				{ headers: this.auth.createHeader() }
			)
			.toPromise();
	}

	updateEnrollmentHistory(id: number, data: any) {
		return this.http
			.put(
				`${this.createUrlPrefix()}/${
					API_ENDPOINTS.ENROLLMENT_HISTORIES
				}/${id}`,
				{ new_enrollment: data },
				{ headers: this.auth.createHeader() }
			)
			.toPromise();
	}

	updateProgram(id: number, data: any) {
		return this.http
			.put(
				`${this.createUrlPrefix()}/${API_ENDPOINTS.PROGRAMS}/${id}`,
				{ new_program: data },
				{ headers: this.auth.createHeader() }
			)
			.toPromise();
	}

	updateRegistration(id: number, data: any) {
		return this.http
			.put(
				`${this.createUrlPrefix()}/${
					API_ENDPOINTS.STUDENT_REGISTRATION
				}/${id}`,
				{ registration: data },
				{ headers: this.auth.createHeader() }
			)
			.toPromise();
	}

	updateSchoolSetting(id: number, data: any) {
		return this.http
			.put(
				`${this.createUrlPrefix()}/${
					API_ENDPOINTS.SCHOOL_SETTINGS
				}/${id}`,
				{ new_setting: data },
				{ headers: this.auth.createHeader() }
			)
			.toPromise();
	}

	updateSubject(id: number, data: any) {
		return this.http
			.put(
				`${this.createUrlPrefix()}/${API_ENDPOINTS.SUBJECTS}/${id}`,
				{ new_subject: data },
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
