import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import {
	Component,
	EventEmitter,
	Input,
	OnInit,
	Output,
	ViewChild,
} from "@angular/core";
import {
	FormArray,
	FormBuilder,
	FormControl,
	FormGroup,
	Validators,
} from "@angular/forms";
import {
	AlertController,
	LoadingController,
	ModalController,
} from "@ionic/angular";
import { Course } from "src/app/interfaces/course";
import { Level } from "src/app/interfaces/level";
import { SchoolSetting } from "src/app/interfaces/school-setting";
import { Student } from "src/app/interfaces/student";
import { StudentType } from "src/app/interfaces/student-type";
import { ApiService } from "src/app/services/api.service";
import SwiperCore, {
	Autoplay,
	Keyboard,
	Pagination,
	Scrollbar,
	SwiperOptions,
	Zoom,
} from "swiper";
import { SwiperComponent } from "swiper/angular";
export interface SlideTriggerOptions {
	direction: string;
	unique_validation: boolean;
}
export interface SiblingFieldEventOptions {
	delete_field: boolean;
	field_index: number;
}
export const regex_tests = {
	name: /^[a-zA-ZÑñ][a-zA-ZÑñ ]*[a-zA-ZÑñ]$/,
	//Regex for name suffix (JR,SR,I-XXXIX only)
	suffix: /^[jJsS][rR]$|^[iI]([iI]{0,2}(?<!x|X|v|V)|[vV]{1}|[xX]{1})$|^[vV]([iI]{0,3})$|^[xX]{1,3}([iI]{0,3}|[iI][vVxX]|[vV][iI]{0,3})$/,
	zip: /^[0-9]{4}$/,
	mobile: /^[9][0-9]{9}$/,
	academic_year: /^(19|20)\d{2}[-](19|20)\d{2}$/,
	// date: /^[0-9]{4}[-][0-9]{2}[-][0-9]{2}$/,
	// date_time:
	// 	/^(((\d{4})(-)(0[13578]|10|12)(-)(0[1-9]|[12][0-9]|3[01]))|((\d{4})(-)(0[469]|11)(-)([0][1-9]|[12][0-9]|30))|((\d{4})(-)(02)(-)(0[1-9]|1[0-9]|2[0-8]))|(([02468][048]00)(-)(02)(-)(29))|(([13579][26]00)(-)(02)(-)(29))|(([0-9][0-9][0][48])(-)(02)(-)(29))|(([0-9][0-9][2468][048])(-)(02)(-)(29))|(([0-9][0-9][13579][26])(-)(02)(-)(29)))(\s([0-1][0-9]|2[0-4]):([0-5][0-9]):([0-5][0-9]))$/,
};

SwiperCore.use([Autoplay, Keyboard, Pagination, Scrollbar, Zoom]);
@Component({
	selector: "app-student-registration-form",
	templateUrl: "./student-registration-form.component.html",
	styleUrls: ["./student-registration-form.component.scss"],
})
export class StudentRegistrationFormComponent implements OnInit {
	@Input() trigger: string;
	@Input() active_enrollments: SchoolSetting[] = [];
	@Input() levels: Level[] = [];
	@Input() programs: Course[] = [];
	@Input() row_index: number = -1;
	@Input() student: Student = null;
	@Input() student_types: StudentType[] = [];
	@Output() success_registration: EventEmitter<{
		new_student: Student;
		row_index: number;
	}> = new EventEmitter<{
		new_student: Student;
		row_index: number;
	}>();
	registration: FormGroup;
	selection_levels: Level[] = [];
	private validating_email: boolean = false;

	swiper_config: SwiperOptions = {
		slidesPerView: 1,
		loop: false,
		pagination: { type: "fraction" },
		allowTouchMove: false,
	};

	constructor(
		private apiService: ApiService,
		private formBuilder: FormBuilder,
		private alertController: AlertController,
		private modalController: ModalController,
		private loadingController: LoadingController
	) {}

	@ViewChild("swiper", { static: false }) swiper: SwiperComponent;
	async ngOnInit() {
		if (this.programs.length === 0) this.getPrograms();
		if (this.levels.length === 0) this.getLevels();
		if (this.student_types.length === 0) {
			this.getStudentTypes().finally(() => {
				this.initialFormSetUp();
			});
		} else {
			this.initialFormSetUp();
		}
	}

	closeRegistrationModal() {
		this.modalController.dismiss();
	}

	/**
	 * Get all courses and programs
	 */
	async getPrograms(fresh: boolean = true) {
		this.programs = await this.apiService
			.getPrograms(fresh, { withTrashed: this.student != null })
			.catch((er) => {
				return [];
			});
	}

	/**
	 * Get all levels
	 */
	async getLevels() {
		this.levels = await this.apiService.getLevels().catch((er) => {
			return null;
		});
	}

	/**
	 * Get all student types
	 */
	async getStudentTypes() {
		this.student_types = await this.apiService
			.getStudentTypes()
			.catch((er) => {
				return [];
			});
	}

	/**
	 * Dynamically add or remove form controls on siblings form group
	 * @param options specify what operation to be made
	 */
	handleSiblingFieldOperation(
		options: SiblingFieldEventOptions,
		sibling: any = null
	) {
		let siblings_array: FormArray =
			this.registration["controls"].family_info["controls"].siblings;
		if (options.delete_field) {
			siblings_array.removeAt(options.field_index);
		} else {
			let new_sibling = this.formBuilder.group({
				id: [sibling ? sibling.id : ""],
				last_name: [
					sibling
						? sibling.last_name
						: this.registration["controls"].basic_info["controls"]
								.last_name.value,
					[Validators.required, Validators.pattern(regex_tests.name)],
				],
				first_name: [
					sibling ? sibling.first_name : "",
					[Validators.required, Validators.pattern(regex_tests.name)],
				],
				middle_name: [
					sibling
						? sibling.middle_name
						: this.registration["controls"].basic_info["controls"]
								.middle_name.value,
					[Validators.pattern(regex_tests.name)],
				],
				name_suffix: [
					sibling ? sibling.name_suffix : "",
					[Validators.pattern(regex_tests.suffix)],
				],
				birth_date: [
					sibling ? new Date(sibling.birth_date).toJSON() : "",
					[Validators.required],
				],
			});

			siblings_array.push(new_sibling);
		}
	}

	/**
	 * Defines and initialize all fields needed in student registration form
	 */
	initializeRegistrationForm() {
		const read = this.student ? this.student.registration : null;
		const education = read ? <any[]>read.education_backgrounds : [];
		this.registration = this.formBuilder.group({
			admission_details: this.formBuilder.group({
				school_setting_id: [
					read ? read.school_setting_id : null,
					Validators.required,
				],
				program_id: [
					read ? read.program_id : null,
					Validators.required,
				],
				level_id: [read ? read.level_id : null, Validators.required],
				student_type_id: [
					read ? read.student_type_id : 2,
					Validators.required,
				],
				registration_date: read
					? [
							new Date(read.created_at).toJSON(),
							[Validators.required],
					  ]
					: [""],
			}),
			basic_info: this.formBuilder.group({
				last_name: [
					read ? read.last_name : "",
					[Validators.required, Validators.pattern(regex_tests.name)],
				],
				first_name: [
					read ? read.first_name : "",
					[Validators.required, Validators.pattern(regex_tests.name)],
				],
				middle_name: [
					read ? read.middle_name : "",
					[Validators.pattern(regex_tests.name)],
				],
				name_suffix: [
					read ? read.name_suffix : "",
					[Validators.pattern(regex_tests.suffix)],
				],
				sex: [read ? read.sex : "male", Validators.required],
				civil_status: [
					read ? read.civil_status : "single",
					Validators.required,
				],
				birth_date: [
					read ? new Date(read.birth_date).toJSON() : "",
					[Validators.required],
				],
				birth_place: [
					read ? read.birth_place : "",
					[Validators.required],
				],
				address: this.formBuilder.group({
					line_1: [read ? read.address.line1 : ""],
					line_2: [read ? read.address.line2 : ""],
					city: [read ? read.address.city : "", Validators.required],
					province: [
						read ? read.address.province : "",
						Validators.required,
					],
					zip: [
						read ? read.address.zip : "",
						[
							Validators.required,
							Validators.pattern(regex_tests.zip),
						],
					],
				}),
				email: [
					read ? read.email : "",
					[Validators.required, Validators.email],
				],
				contact_number: [
					read ? read.contact_number : "",
					[
						Validators.required,
						Validators.pattern(regex_tests.mobile),
					],
				],
			}),
			mother_info: this.formBuilder.group({
				id: [read ? read.guardians[0].id : ""],
				is_guardian: [read ? read.guardians[0].is_guardian : false],
				relationship: ["mother"],
				is_deceased: [read ? read.guardians[0].is_deceased : false],
				last_name: [
					read ? read.guardians[0].last_name : "",
					[Validators.required, Validators.pattern(regex_tests.name)],
				],
				first_name: [
					read ? read.guardians[0].first_name : "",
					[Validators.required, Validators.pattern(regex_tests.name)],
				],
				middle_name: [
					read ? read.guardians[0].middle_name : "",
					[Validators.pattern(regex_tests.name)],
				],
				occupation: [
					read ? read.guardians[0].occupation : "",
					Validators.required,
				],
				birth_date: [
					read ? new Date(read.guardians[0].birth_date).toJSON() : "",
					[Validators.required],
				],
				same_address: [false],
				address: this.formBuilder.group({
					line_1: [read ? read.guardians[0].address.line1 : ""],
					line_2: [read ? read.guardians[0].address.line2 : ""],
					city: [
						read ? read.guardians[0].address.city : "",
						Validators.required,
					],
					province: [
						read ? read.guardians[0].address.province : "",
						Validators.required,
					],
					zip: [
						read ? read.guardians[0].address.zip : "",
						[
							Validators.required,
							Validators.pattern(regex_tests.zip),
						],
					],
				}),
				email: [
					read ? read.guardians[0].email : "",
					[Validators.required, Validators.email],
				],
				contact_number: [
					read ? read.guardians[0].contact_number : "",
					[
						Validators.required,
						Validators.pattern(regex_tests.mobile),
					],
				],
			}),
			father_info: this.formBuilder.group({
				id: [read ? read.guardians[1].id : ""],
				is_guardian: [read ? read.guardians[1].is_guardian : false],
				relationship: ["father"],
				is_deceased: [read ? read.guardians[1].is_deceased : false],
				last_name: [
					read ? read.guardians[1].last_name : "",
					[Validators.required, Validators.pattern(regex_tests.name)],
				],
				first_name: [
					read ? read.guardians[1].first_name : "",
					[Validators.required, Validators.pattern(regex_tests.name)],
				],
				middle_name: [
					read ? read.guardians[1].middle_name : "",
					[Validators.pattern(regex_tests.name)],
				],
				name_suffix: [
					read ? read.guardians[1].name_suffix : "",
					[Validators.pattern(regex_tests.suffix)],
				],
				occupation: [
					read ? read.guardians[1].occupation : "",
					Validators.required,
				],
				birth_date: [
					read ? new Date(read.guardians[1].birth_date).toJSON() : "",
					[Validators.required],
				],
				same_address: [false],
				address: this.formBuilder.group({
					line_1: [read ? read.guardians[1].address.line1 : ""],
					line_2: [read ? read.guardians[1].address.line2 : ""],
					city: [
						read ? read.guardians[1].address.city : "",
						Validators.required,
					],
					province: [
						read ? read.guardians[1].address.province : "",
						Validators.required,
					],
					zip: [
						read ? read.guardians[1].address.zip : "",
						[
							Validators.required,
							Validators.pattern(regex_tests.zip),
						],
					],
				}),
				email: [
					read ? read.guardians[1].email : "",
					[Validators.required, Validators.email],
				],
				contact_number: [
					read ? read.guardians[1].contact_number : "",
					[
						Validators.required,
						Validators.pattern(regex_tests.mobile),
					],
				],
			}),
			guardian_info: this.formBuilder.group({
				id: [
					read && read.guardians.length > 2
						? read.guardians[2].id
						: "",
				],
				relationship: [
					read
						? read.guardians[0].is_guardian
							? "mother"
							: read.guardians[1].is_guardian
							? "father"
							: "other"
						: "other",
				],
				is_guardian: [true],
				last_name: [
					read && read.guardians.length > 2
						? read.guardians[2].last_name
						: "",
					[Validators.required, Validators.pattern(regex_tests.name)],
				],
				first_name: [
					read && read.guardians.length > 2
						? read.guardians[2].first_name
						: "",
					[Validators.required, Validators.pattern(regex_tests.name)],
				],
				middle_name: [
					read && read.guardians.length > 2
						? read.guardians[2].middle_name
						: "",
					[Validators.pattern(regex_tests.name)],
				],
				name_suffix: [
					read && read.guardians.length > 2
						? read.guardians[2].name_suffix
						: "",
					[Validators.pattern(regex_tests.suffix)],
				],
				occupation: [
					read && read.guardians.length > 2
						? read.guardians[2].occupation
						: "",
					Validators.required,
				],
				birth_date: [
					read && read.guardians.length > 2
						? new Date(read.guardians[2].birth_date).toJSON()
						: "",
					[Validators.required],
				],
				same_address: [false],
				address: this.formBuilder.group({
					line_1: [
						read && read.guardians.length > 2
							? read.guardians[2].address.line1
							: "",
					],
					line_2: [
						read && read.guardians.length > 2
							? read.guardians[2].address.line2
							: "",
					],
					city: [
						read && read.guardians.length > 2
							? read.guardians[2].address.city
							: "",
						Validators.required,
					],
					province: [
						read && read.guardians.length > 2
							? read.guardians[2].address.province
							: "",
						Validators.required,
					],
					zip: [
						read && read.guardians.length > 2
							? read.guardians[2].address.zip
							: "",
						[
							Validators.required,
							Validators.pattern(regex_tests.zip),
						],
					],
				}),
				email: [
					read && read.guardians.length > 2
						? read.guardians[2].email
						: "",
					[Validators.required, Validators.email],
				],
				contact_number: [
					read && read.guardians.length > 2
						? read.guardians[2].contact_number
						: "",
					[
						Validators.required,
						Validators.pattern(regex_tests.mobile),
					],
				],
			}),
			education: this.formBuilder.group({
				preschool: this.formBuilder.group({
					id: [education.length > 0 ? education[0].id : ""],
					school_name: [
						education.length > 0 ? education[0].school_name : "",
						Validators.required,
					],
					school_address: [
						education.length > 0 ? education[0].school_address : "",
						Validators.required,
					],
					academic_year: [
						education.length > 0 ? education[0].academic_year : "",
						[
							Validators.required,
							Validators.pattern(regex_tests.academic_year),
						],
					],
					program: ["PRESCHOOL"],
				}),
				grade_school: this.formBuilder.group({
					id: [education.length > 1 ? education[1].id : ""],
					school_name: [
						education.length > 1 ? education[1].school_name : "",
						Validators.required,
					],
					school_address: [
						education.length > 1 ? education[1].school_address : "",
						Validators.required,
					],
					academic_year: [
						education.length > 1 ? education[1].academic_year : "",
						[
							Validators.required,
							Validators.pattern(regex_tests.academic_year),
						],
					],
					program: ["GRADE SCHOOL"],
				}),
				junior_high: this.formBuilder.group({
					id: [education.length > 2 ? education[2].id : ""],

					school_name: [
						education.length > 2 ? education[2].school_name : "",
						Validators.required,
					],
					school_address: [
						education.length > 2 ? education[2].school_address : "",
						Validators.required,
					],
					academic_year: [
						education.length > 2 ? education[2].academic_year : "",
						[
							Validators.required,
							Validators.pattern(regex_tests.academic_year),
						],
					],
					program: ["JUNIOR HIGH SCHOOL"],
				}),
				senior_high: this.formBuilder.group({
					id: [education.length > 3 ? education[3].id : ""],
					school_name: [
						education.length > 3 ? education[3].school_name : "",
						Validators.required,
					],
					school_address: [
						education.length > 3 ? education[3].school_address : "",
						Validators.required,
					],
					academic_year: [
						education.length > 3 ? education[3].academic_year : "",
						[
							Validators.required,
							Validators.pattern(regex_tests.academic_year),
						],
					],
					program: [
						education.length > 3 ? education[3].program : "",
						[Validators.required],
					],
				}),
				college: this.formBuilder.group({
					id: [education.length > 4 ? education[4].id : ""],
					school_name: [
						education.length > 4 ? education[4].school_name : "",
						Validators.required,
					],
					school_address: [
						education.length > 4 ? education[4].school_address : "",
						Validators.required,
					],
					academic_year: [
						education.length > 4 ? education[4].academic_year : "",
						[
							Validators.required,
							Validators.pattern(regex_tests.academic_year),
						],
					],
					program: [
						education.length > 4 ? education[4].program : "",
						[Validators.required],
					],
				}),
			}),
			family_info: this.formBuilder.group({
				other_info: this.formBuilder.group({
					parent_annual_income: [
						read ? read.other_info.parent_annual_income : 0,
						[Validators.required],
					],
					parent_marital_status: [
						read
							? read.other_info.parent_marital_status
							: "married",
						[Validators.required],
					],
				}),
				siblings: this.formBuilder.array([]),
				religion_info: this.formBuilder.group({
					religion: [read ? read.religion.religion : ""],
					church_name: [read ? read.religion.church_name : ""],
					church_address: [read ? read.religion.church_address : ""],
				}),
			}),
		});

		if (read) {
			//display all siblings of the student
			for (let index = 0; index < read.siblings.length; index++) {
				this.handleSiblingFieldOperation(
					{ delete_field: false, field_index: 0 },
					read.siblings[index]
				);
			}
		}

		// for (let index = 0; index < education.length; index++) {
		// 	let e: FormGroup;
		// 	switch (index) {
		// 		case 0:
		// 			e = this.registration.controls.education.get(
		// 				"preschool"
		// 			) as FormGroup;
		// 			e.addControl("id", new FormControl(education[index].id));
		// 			break;
		// 		case 1:
		// 			e = this.registration.controls.education.get(
		// 				"grade_school"
		// 			) as FormGroup;
		// 			e.addControl("id", new FormControl(education[index].id));
		// 			break;
		// 		case 2:
		// 			e = this.registration.controls.education.get(
		// 				"junior_high"
		// 			) as FormGroup;
		// 			e.addControl("id", new FormControl(education[index].id));
		// 			break;
		// 		case 3:
		// 			e = this.registration.controls.education.get(
		// 				"senior_high"
		// 			) as FormGroup;
		// 			e.addControl("id", new FormControl(education[index].id));
		// 			break;
		// 		case 4:
		// 			e = this.registration.controls.education.get(
		// 				"college"
		// 			) as FormGroup;
		// 			e.addControl("id", new FormControl(education[index].id));
		// 			break;
		// 		default:
		// 			break;
		// 	}
		// }
	}

	async slidePage(options: SlideTriggerOptions) {
		if (this.validating_email) return;
		if (options.direction == "next") {
			if (options.unique_validation) {
				this.validating_email = true;
				let email: string =
					this.registration.controls.basic_info.get("email").value;
				const is_valid_email = await this.apiService
					.validateEmailAddress(
						email,
						this.student ? this.student.user_id : 0
					)
					.then(
						(res: HttpResponse<any>) => {
							return true;
						},
						async (err: HttpErrorResponse) => {
							const alert = await this.alertController.create({
								header: "Email Validation Failed!",
								message: err.error.message,
							});

							await alert.present();
							return false;
						}
					);
				this.validating_email = false;
				if (!is_valid_email) return;
			}
			return this.swiper.swiperRef.slideNext();
		}
		if (options.direction == "previous") {
			return this.swiper.swiperRef.slidePrev();
		}
	}

	async submitRegistration(submit: boolean = false) {
		if (!submit) return;
		const raw_data = this.registration.value;
		const loading = await this.loadingController.create({
			spinner: "bubbles",
			backdropDismiss: false,
		});
		await loading.present();
		let new_student = this.student
			? await this.apiService
					.updateRegistration(this.student.registration.id, raw_data)
					.catch(async (res: HttpErrorResponse) => {
						const alert = await this.alertController.create({
							header: res.error.error,
							message: res.error.message,
							buttons: ["OK"],
						});
						await alert.present();
						return null;
					})
			: await this.apiService
					.registerStudent(raw_data)
					.catch(async (res: HttpErrorResponse) => {
						const alert = await this.alertController.create({
							header: res.error.error,
							message: res.error.message,
							buttons: ["OK"],
						});
						await alert.present();
						return null;
					});

		await loading.dismiss();
		if (new_student) {
			const alert = await this.alertController.create({
				header:
					this.row_index > -1
						? "Registration Update Success"
						: "Student Registration Success",
				buttons: ["OK"],
			});
			await alert.present();

			//emit new or updated data
			this.success_registration.emit({
				new_student,
				row_index: this.row_index,
			});
			this.closeRegistrationModal();
		}
	}

	updateLevel() {
		return this.registration.controls.admission_details
			.get("level_id")
			.valueChanges.subscribe((value) => {
				if (value)
					this.showLevelsForProgram(
						this.registration.controls.admission_details.get(
							"program_id"
						).value,
						false
					);
			});
	}

	/**
	 * Reset the value of level field and update the level options on change of selected program
	 * @returns a subscription that resets the level field and update the options on level selection
	 */
	updateLevelSelection() {
		return this.registration.controls.admission_details
			.get("program_id")
			.valueChanges.subscribe((value) => {
				this.showLevelsForProgram(value);
			});
	}

	updateStudentType() {
		return this.registration.controls.admission_details
			.get("student_type_id")
			.valueChanges.subscribe((value) => {
				const selected_type = this.student_types.find(
					(t) => t.id == value
				);
				this.updateRequiredEducation(null, selected_type);
			});
	}

	updateRequiredEducation(
		selected_program: Course = null,
		selected_student_type: StudentType = null
	) {
		if (selected_program) {
			const student_type_id =
				this.registration.controls.admission_details.get(
					"student_type_id"
				).value;
			selected_student_type = this.student_types.find(
				(t) => t.id == student_type_id
			);
		} else {
			const course_id =
				this.registration.controls.admission_details.get(
					"program_id"
				).value;
			selected_program = this.programs.find((p) => p.id == course_id);
		}

		//Disable all education background fields
		this.registration.controls.education.disable();

		//Enable preschool education background fields if student is higher level or preschool transferee
		if (
			selected_program.program_level_id < 5 ||
			(selected_program.program_level_id == 5 &&
				selected_student_type.type != "NEW")
		) {
			this.registration.controls.education.get("preschool").enable();
		}

		//Enable grade school education background fields if student is higher level or grade school transferee
		if (
			selected_program.program_level_id < 4 ||
			(selected_program.program_level_id == 4 &&
				selected_student_type.type != "NEW")
		) {
			this.registration.controls.education.get("grade_school").enable();
		}

		//Enable junior high school education background fields if student is higher level or junior high school transferee
		if (
			selected_program.program_level_id < 3 ||
			(selected_program.program_level_id == 3 &&
				selected_student_type.type != "NEW")
		) {
			this.registration.controls.education.get("junior_high").enable();
		}

		//Enable senior high school education background fields if student is higher level or senior high school transferee

		if (
			selected_program.program_level_id < 2 ||
			(selected_program.program_level_id == 2 &&
				selected_student_type.type != "NEW")
		) {
			this.registration.controls.education.get("senior_high").enable();
		}

		//Enable college education background fields if student is college transferee
		if (
			selected_program.program_level_id == 1 &&
			(selected_student_type.type != "NEW" ||
				this.registration.controls.admission_details.get("level_id")
					.value != 4)
		) {
			this.registration.controls.education.get("college").enable();
		}
	}

	private showLevelsForProgram(
		program_id: number,
		reset_level: boolean = true
	) {
		const admission_details = this.registration.controls
			.admission_details as FormGroup;
		const selected_program = this.programs.find((p) => p.id == program_id);
		this.selection_levels = this.levels.filter(
			(value) =>
				value.program_level_id === selected_program.program_level_id
		);
		if (reset_level) admission_details.controls.level_id.setValue(null);
		this.updateRequiredEducation(selected_program);
	}

	private initialFormSetUp() {
		this.initializeRegistrationForm();
		if (this.student) {
			this.showLevelsForProgram(
				this.registration.controls.admission_details.get("program_id")
					.value,
				false
			);

			if (
				this.registration.controls.mother_info.get("is_guardian")
					.value ||
				this.registration.controls.father_info.get("is_guardian").value
			) {
				this.registration.controls.guardian_info.disable();
			}
		}

		this.updateLevel();
		this.updateLevelSelection();
		this.updateStudentType();
	}
}
