import { HttpErrorResponse } from "@angular/common/http";
import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import {
	AlertController,
	ModalController,
	LoadingController,
	PopoverController,
} from "@ionic/angular";
import { Course } from "src/app/interfaces/course";
import { CourseSubject } from "src/app/interfaces/course-subject";
import { EnrollmentHistory } from "src/app/interfaces/enrollment-history";
import { SchoolSetting } from "src/app/interfaces/school-setting";
import { Student } from "src/app/interfaces/student";
import { StudentType } from "src/app/interfaces/student-type";
import { ApiService } from "src/app/services/api.service";

@Component({
	selector: "app-enrollment-history",
	templateUrl: "./enrollment-history.component.html",
	styleUrls: ["./enrollment-history.component.scss"],
})
export class EnrollmentHistoryComponent implements OnInit {
	@Input() enrollment_histories: EnrollmentHistory[] = [];
	@Input() programs: Course[] = [];
	@Input() school_settings: SchoolSetting[] = [];
	@Input() student: Student;
	@Input() student_types: StudentType[] = [];
	@Input() subjects: CourseSubject[] = [];

	filtered_school_settings: SchoolSetting[] = [];

	constructor(
		private apiService: ApiService,
		private formBuilder: FormBuilder,
		private alertController: AlertController,
		private modalController: ModalController,
		private loadingController: LoadingController,
		private popoverController: PopoverController
	) {}

	async ngOnInit() {
		if (this.enrollment_histories.length === 0) {
			this.enrollment_histories =
				await this.getStudentEnrollmentHistories(this.student.id);
		}
		//assign missing properties of enrollments
		// this.enrollments.forEach((e) => {
		// 	e.program = this.mapProgram(e.program_id);
		// 	e.school_setting = this.mapSchoolSetting(e.school_setting_id);
		// 	e.student_type = this.mapStudentType(e.student_type_id);
		// });

		//sort all student enrollment histories
		// this.enrollments.sort((a, b) => {
		// 	if (a.school_setting.academic_year > b.school_setting.academic_year)
		// 		return 1;
		// 	if (a.school_setting.academic_year < b.school_setting.academic_year)
		// 		return -1;
		// 	if (a.school_setting.term_id > b.school_setting.term_id) return 1;
		// 	if (a.school_setting.term_id < b.school_setting.term_id) return -1;
		// 	return 1;
		// });

		//get all open enrollment school settings
		this.filtered_school_settings = this.school_settings.filter(
			(s) =>
				!this.enrollment_histories
					.map((e) => e.school_setting_id)
					.includes(s.id) &&
				this.isCurrentlyOpen(
					s.enrollment_start_date,
					s.enrollment_end_date
				)
		);
	}

	closeEnrollmentModal() {
		this.modalController.dismiss();
	}

	private isCurrentlyOpen(start_date: string, end_date: string): boolean {
		let now = new Date().getTime();
		return (
			now >= new Date(start_date).getTime() &&
			now <= new Date(end_date).getTime()
		);
	}

	async getStudentEnrollmentHistories(student_id: number) {
		const params = {
			student_id,
			withProgram: 1,
			withSchoolSetting: 1,
			withStudentType: 1,
			withSubjects: 1,
		};
		return <EnrollmentHistory[]>(
			await this.apiService
				.getEnrollmentHistories(params)
				.catch((er: HttpErrorResponse) => [])
		);
	}

	mapProgram(id: number) {
		return this.programs.find((p) => p.id === id);
	}

	mapSchoolSetting(id: number) {
		return this.school_settings.find((s) => s.id === id);
	}

	mapStudentType(id: number) {
		return this.student_types.find((s) => s.id === id);
	}
}
