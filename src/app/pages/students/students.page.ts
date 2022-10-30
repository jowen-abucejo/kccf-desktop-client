import { formatDate } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import {
	Component,
	EventEmitter,
	HostListener,
	OnInit,
	ViewChild,
} from "@angular/core";
import {
	AlertController,
	IonContent,
	IonFab,
	LoadingController,
	ModalController,
	PopoverController,
	ViewWillEnter,
	ViewWillLeave,
} from "@ionic/angular";
import { DataTableDirective } from "angular-datatables";
import { Course } from "src/app/interfaces/course";
import { CourseSubject } from "src/app/interfaces/course-subject";
import { EnrollmentHistory } from "src/app/interfaces/enrollment-history";
import { Level } from "src/app/interfaces/level";
import { SchoolSetting } from "src/app/interfaces/school-setting";
import { Student } from "src/app/interfaces/student";
import { StudentType } from "src/app/interfaces/student-type";
import { TablePage } from "src/app/interfaces/table-page";
import { EnrollmentFormComponent } from "src/app/modules/shared/components/enrollment-form/enrollment-form.component";
import { RowContextMenuComponent } from "src/app/modules/shared/components/row-context-menu/row-context-menu.component";
import { StudentRegistrationFormComponent } from "src/app/modules/shared/components/student-registration-form/student-registration-form.component";
import { ApiService } from "src/app/services/api.service";
import {
	StorageService,
	TABLE_SETTINGS_PREFIX,
} from "../../services/storage.service";

@Component({
	selector: "app-students",
	templateUrl: "./students.page.html",
	styleUrls: ["./students.page.scss"],
})
export class StudentsPage
	implements OnInit, ViewWillLeave, ViewWillEnter, TablePage
{
	buttons: {
		label: string;
		callback: () => any;
	}[] = [
		{
			label: "CSV",
			callback: () => {
				this.exportAs(1);
			},
		},
		{
			label: "EXCEL",
			callback: () => {
				this.exportAs(2);
			},
		},
		{
			label: "PDF",
			callback: () => {
				this.exportAs(3);
			},
		},
	];
	categories: {
		name: string;
		filter_key: string;
		items: Level[] | Course[] | StudentType[];
	}[] = [];
	filters = {
		student_status: "ALL",
		levels: [],
		programs: [],
		student_types: [],
	};
	hasScrollbar = false;
	levels: Level[] = [];
	isSearching: boolean = false;
	programs: Course[] = [];
	school_settings: SchoolSetting[] = [];
	student_types: StudentType[] = [];
	private students: Student[] = [];
	private table_columns: any[] = [];
	private table_data_status = {
		current_page: 0,
		end_date: "",
		last_page: 2,
		limit: 15,
		order: "DESC",
		search: "",
		start_date: "",
	};

	// checks if there's a scrollbar when the user resizes the window or zooms in/out
	@HostListener("window:resize", ["$event"])
	async onResize() {
		await this.checkForScrollbar();
	}

	@ViewChild(DataTableDirective, { static: false })
	dataTableElement: DataTableDirective;

	dtOptions = {
		data: this.students,
		columns: [
			{ title: "ID", data: "id" },
			{ title: "Student Number", data: "student_number" },
			{ title: "Program", data: "program.code" },
			{ title: "Level", data: "level.code" },
			{
				title: "Last name",
				data: null,
				render: (data, type, row) => {
					return (
						row.registration.last_name +
						" " +
						row.registration.name_suffix
					).trim();
				},
			},
			{ title: "First name", data: "registration.first_name" },
			{ title: "Middle Name", data: "registration.middle_name" },
			{
				title: "Birth Date",
				data: "registration.birth_date",
				render: (data, type, row) => {
					return formatDate(data, "mediumDate", "en-US");
				},
			},
			{
				title: "Status",
				data: null,
				render: (data, type, row) => {
					return row.deleted_at ? "INACTIVE" : "ACTIVE";
				},
			},
		],
		paging: false,
		responsive: true,
		searching: true,
		ordering: true,
		colReorder: true,
		order: [[1, "desc"]],
		autoWidth: true,
		info: false,
		dom: "rtip",
		processing: false,
		buttons: [
			"colvis",
			{
				extend: "csv",
				text: "CSV",
				exportOptions: {
					columns: ":visible",
				},
			},
			{
				extend: "excel",
				name: "excel",
				text: "Excel",
				exportOptions: {
					columns: ":visible",
				},
				// title: () => {return this.export_setup.page_title;},
				// messageTop: () => {return this.export_setup.page_subtitle;},
			},
			{
				extend: "pdf",
				text: "PDF",
				exportOptions: {
					columns: ":visible",
				},
				customize: (doc) => {
					// doc.pageMargins = [38, 120, 38, 38];
					doc.defaultStyle.alignment = "center";
					// doc.pageOrientation =
					// 	this.export_setup.page_orientation;
					// doc.pageSize = this.export_setup.page_size;
					// doc.content[0] = {
					// 	text: this.export_setup.page_title,
					// 	style: { fontSize: 14, bold: true },
					// 	margin: this.export_setup.page_title
					// 		? [0, 0, 0, 15]
					// 		: 0,
					// };
					doc.content[1].table.widths = Array(
						doc.content[1].table.body[0].length + 1
					)
						.join("*")
						.split("");
					// 	if (this.export_setup.page_subtitle) {
					// 		doc.content.splice(1, 0, {
					// 			text: this.export_setup.page_subtitle,
					// 			style: {
					// 				fontSize: 11,
					// 				bold: false,
					// 				lineHeight: 1.5,
					// 				alignment: "left",
					// 			},
					// 			margin: [0, 0, 0, 15],
					// 		});
					// 	}
					// 	doc.images = this.pdfHeader
					// 		? { headerTemplate: this.pdfHeader }
					// 		: {};
					// 	doc.header = {
					// 		columns: [
					// 			this.pdfHeader
					// 				? {
					// 						image: "headerTemplate",
					// 						height: 50,
					// 						width: 50,
					// 						absolutePosition: {
					// 							x: -240,
					// 							y: 35,
					// 						},
					// 				  }
					// 				: "",
					// 			{
					// 				stack: [
					// 					{
					// 						columns: [
					// 							{
					// 								text: "Republic of the Philippines",
					// 								width: "*",
					// 								style: { fontSize: 11 },
					// 							},
					// 						],
					// 					},
					// 					{
					// 						columns: [
					// 							{
					// 								text: "Province of Cavite",
					// 								width: "*",
					// 								style: { fontSize: 11 },
					// 							},
					// 						],
					// 					},

					// 					{
					// 						columns: [
					// 							{
					// 								text: "Municipality of Naic",
					// 								width: "*",
					// 								style: {
					// 									fontSize: 15,
					// 									bold: true,
					// 								},
					// 							},
					// 						],
					// 					},
					// 				],
					// 				width: "*",
					// 			},
					// 		],
					// 		margin: [this.pdfHeader ? -50 : 0, 38, 0, 38],
					// 	};
					// 	if (!this.pdfHeader) {
					// 		doc.header.columns.splice(0, 1);
					// 	}
				},
				download: "open",
			},
		],
		columnDefs: [
			{
				targets: [0],
				visible: false,
			},
			// { targets: [1, 2, 3, 8], searchable: true },
			// { targets: "_all", searchable: false, visible: true },
			// {
			// 	targets: [9],
			// 	className: "dynamic-text-alignment ion-padding-right",
			// },
		],
		rowCallback: (row: Node, data: Student, index: number) => {
			// Unbind first in order to avoid any duplicate handler
			// (see https://github.com/l-lin/angular-datatables/issues/87)
			// Note: In newer jQuery v3 versions, `unbind` and `bind` are
			// deprecated in favor of `off` and `on`
			$("td", row).off("contextmenu");
			$("td", row).on("contextmenu", (e) => {
				e.preventDefault();
				this.createContextMenu(e, data, index);
			});
		},
	};

	table_name = "studentsTable";
	table_settings;

	@ViewChild("tableContent", { static: false }) private content: IonContent;

	@ViewChild(IonFab) fab: IonFab;

	constructor(
		private storage: StorageService,
		private apiService: ApiService,
		private popoverController: PopoverController,
		private modalController: ModalController,
		private loadingController: LoadingController,
		private alertController: AlertController
	) {}

	async ionViewWillEnter(): Promise<void> {
		if (this.school_settings.length === 0) this.getSchoolSettings(true);
		if (this.programs.length === 0)
			this.getPrograms(true).finally(() => {
				this.filters.programs = this.programs.map((p) => p.id);
			});
	}

	async ionViewWillLeave(): Promise<void> {
		this.school_settings = [];
		this.programs = [];
		// await this.saveTableSettings();
	}

	async ngOnInit() {
		// await this.loadTableSettings();
		this.getLevels().finally(() => {
			this.filters.levels = this.levels.map((l) => l.id);
		});
		await this.getPrograms(true).finally(() => {
			this.filters.programs = this.programs.map((p) => p.id);
		});
		this.getStudentTypes().finally(async () => {
			this.filters.student_types = this.student_types.map((s) => s.id);
			await this.loadMoreData();
		});
	}

	async addNewRows(response: any) {
		if (!response.data) return;
		this.table_data_status.current_page = response.current_page;
		this.table_data_status.last_page = response.last_page;
		const dtInstance = await this.dataTableElement.dtInstance;
		dtInstance.rows.add(response.data);
		dtInstance.rows().draw();
	}

	async checkForScrollbar(ignoreSearchingStatus = false) {
		const scrollElement = await this.content.getScrollElement();
		this.hasScrollbar =
			scrollElement.scrollHeight > scrollElement.clientHeight;
		while (
			//   !this.isDateFilterApplied &&
			!this.hasScrollbar &&
			this.table_data_status.current_page <
				this.table_data_status.last_page
		) {
			if (!this.isSearching || ignoreSearchingStatus) {
				await this.fetchRecords().then(() => {
					this.hasScrollbar =
						scrollElement.scrollHeight > scrollElement.clientHeight;
				});
			}
		}
		return;
	}

	async confirmDelete(id: number, row_index: number) {
		const confirm_alert = await this.alertController.create({
			header: "Confirm Delete",
			subHeader: "Are you sure to permanently delete student records?",
			buttons: [
				"Cancel",
				{
					text: "Delete",
					handler: (v) => this.deleteStudent(id, row_index),
				},
			],
		});
		await confirm_alert.present();
	}

	private async createContextMenu(e: any, student: Student, index: number) {
		let options = [
			{
				label: "View Admission",
				icon_name: "eye-outline",
				callback: () => {
					this.viewProfile(student, index);
				},
			},
			{
				label: "Enroll Student",
				icon_name: "log-in-outline",
				callback: (parent_event: any = null) => {
					this.showOpenEnrollments(parent_event, student, index);
				},
			},
		];

		if (student.enrollment_histories_count > 0) {
			//push enrollment histories option
			options.push({
				label: "Enrollment History",
				icon_name: "list-circle-outline",
				callback: (parent_event: any = null) => {
					this.showEnrollmentHistories(parent_event, student, index);
				},
			});
		}

		options.push({
			label: student.deleted_at ? "Activate" : "Deactivate",
			icon_name: student.deleted_at
				? "checkmark-circle-outline"
				: "close-circle-outline",
			callback: () => {
				this.toggleStatus(student, index);
			},
		});

		if (student.enrollment_histories_count === 0) {
			options.push({
				//push delete student option
				label: "Delete",
				icon_name: "trash-outline",
				callback: () => {
					this.confirmDelete(student.id, index);
				},
			});
		}

		const menu = await this.popoverController.create({
			component: RowContextMenuComponent,
			event: e.originalEvent,
			componentProps: {
				subtitle: "Student ID: " + student.student_number,
				options: options,
			},
			backdropDismiss: true,
			showBackdrop: false,
		});
		return await menu.present();
	}

	async deleteStudent(id: number, row_index: number) {
		const loading = await this.loadingController.create({
			spinner: "bubbles",
			backdropDismiss: false,
		});
		await loading.present();
		const result = await this.apiService
			.deleteStudent(id, true, false)
			.catch(async (res: HttpErrorResponse) => {
				const alert = await this.alertController.create({
					header: res.error.error ?? "Unable to Delete Student!",
					message: res.error.message,
					buttons: ["OK"],
				});
				await alert.present();
				return null;
			})
			.finally(async () => {
				await loading.dismiss();
			});
		if (result) {
			const alert = await this.alertController.create({
				header: "Student Deleted Successfully!",
				buttons: ["OK"],
			});
			await alert.present();
			const dtInstance = await this.dataTableElement.dtInstance;
			const data_index = dtInstance.rows().indexes()[row_index];
			dtInstance.row(data_index).remove();
			dtInstance.rows().draw();
			this.popoverController.dismiss();
		}
	}

	async exportAs(button_index: number) {
		const dtInstance = <any>await this.dataTableElement.dtInstance;
		dtInstance.table().button(button_index).trigger();
	}

	async fetchRecords(
		page: number = this.table_data_status.current_page + 1,
		limit: number = this.table_data_status.limit,
		order: string = this.table_data_status.order,
		search: string = this.table_data_status.search,
		start_date: string = this.table_data_status.start_date,
		end_date: string = this.table_data_status.end_date
	) {
		if (this.table_data_status.last_page <= page) return;
		const students = await this.apiService
			.getStudents({
				page,
				limit,
				order,
				search,
				start_date,
				end_date,
				"st[]":
					this.filters.student_types.length > 0
						? this.filters.student_types
						: [0],
				student_status: this.filters.student_status,
				"l[]":
					this.filters.levels.length > 0 ? this.filters.levels : [0],
				"p[]":
					this.filters.programs.length > 0
						? this.filters.programs
						: [0],
			})
			.catch((er) => {
				return null;
			});
		if (students) this.addNewRows(students);
	}

	async filterStudents(event: any = null) {
		//check if event is new set of filters
		if (event !== null && "programs" in event) this.filters = event;

		const dtInstance = await this.dataTableElement.dtInstance;
		dtInstance.rows().remove();
		dtInstance.rows().draw();

		//resets table data status
		this.table_data_status.current_page = 0;
		this.table_data_status.last_page = 2;
		this.table_data_status.limit = 15;
		this.table_data_status.order = "DESC";

		await this.loadMoreData(event).then(() => this.checkForScrollbar());
	}

	/**
	 * Get all programs
	 */
	async getPrograms(fresh: boolean = false) {
		this.programs = await this.apiService
			.getPrograms(fresh, { withTrashed: 1 })
			.catch((er) => {
				return [];
			});
	}

	/**
	 * Get all levels
	 */
	async getLevels() {
		this.levels = await this.apiService.getLevels().catch((er) => {
			return [];
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
	 * Get school setting with all offer subjects
	 * @param school_setting_id id of school_setting
	 */
	private async getSchoolSetting(
		school_setting_id: number,
		params: any = null
	) {
		params
			? (params["withTrashed"] = 1)
			: (params = {
					withTrashed: 1,
			  });
		return this.apiService
			.getSchoolSetting(school_setting_id, params)
			.catch((er) => {
				return null;
			});
	}

	async getSchoolSettings(fresh: boolean = false) {
		this.school_settings = await this.apiService
			.getSchoolSettings(fresh)
			.catch((res) => {
				return [];
			});
	}

	private isCurrentlyOpen(start_date: string, end_date: string): boolean {
		let now = new Date().getTime();
		return (
			now >= new Date(start_date).getTime() &&
			now <= new Date(end_date).getTime()
		);
	}

	async loadTableSettings() {
		const raw_data_settings = await this.storage
			.get(TABLE_SETTINGS_PREFIX + this.table_name)
			.catch((res) => {
				return null;
			});
		this.table_settings =
			JSON.parse(raw_data_settings) ?? this.table_settings;

		if (this.dataTableElement) {
			const dtInstance: any = await this.dataTableElement.dtInstance;

			if (this.table_settings.reorder.length > 0) {
				dtInstance.colReorder.order(this.table_settings.reorder);
			}

			if (this.table_settings.visibility.length > 0) {
				const hidden_columns = this.table_settings.visibility
					.map((v, i) => (!v ? i : -1))
					.filter((v) => v > -1);

				if (hidden_columns.length > 0) {
					dtInstance.columns(hidden_columns).visible(false);
				}
			}

			/*Update table settings on reorder of columns*/
			dtInstance.on("column-reorder", async () => {
				this.table_settings.reorder = dtInstance.colReorder.order();
			});
		}
	}

	async loadMoreData(event = null) {
		if (this.isSearching) return;
		this.isSearching = true;
		await this.fetchRecords();
		if (event) event?.target?.complete();
		this.isSearching = false;
	}

	async saveTableSettings() {
		const dtInstance: any = await this.dataTableElement.dtInstance;
		this.table_settings.visibility = dtInstance
			.columns()
			.visible()
			.toArray();
		await this.storage
			.set(
				TABLE_SETTINGS_PREFIX + this.table_name,
				JSON.stringify(this.table_settings)
			)
			.catch((res) => {});
	}

	async showColVisMenu(event: Event) {
		if (!this.dataTableElement) return;

		/*prevent the closing of fab on click of an item */
		// event.stopPropagation();
		this.fab.activated = false;

		this.table_columns = [];
		const dtInstance = <DataTables.Api>(
			await this.dataTableElement.dtInstance
		);
		dtInstance.columns().every((index) => {
			if (index > 0) {
				const col = dtInstance.column(index);
				const column = {
					label: col.header().textContent,
					checked: col.visible(),
					callback: () => {
						this.toggleColumnVisibility(index);
					},
				};
				this.table_columns.push(column);
			}
		});
	}

	async showEnrollmentHistoryForm(
		student: Student,
		enrollment: EnrollmentHistory = null,
		school_setting: SchoolSetting = null,
		row_index: number
	) {
		//!LOGIC FOR NEW ENROLLMENT
		if (!enrollment) {
			if (!school_setting) return;

			enrollment = {
				id: 0,
				school_setting: school_setting,
				enrolled_subjects: [],
				student_id: student.id,
				school_setting_id: school_setting.id,
				program: null,
				program_id: student.program_id,
				level: null,
				level_id: student.level_id,
				student_type: null,
				student_type_id: student.student_type_id,
				status: "ENLISTED",
				created_at: "",
				created_by: 0,
				updated_at: "",
				updated_by: 0,
				deleted_at: "",
				deleted_by: 0,
				reg_form_generated: 0,
			};
		}

		let event_emitter = new EventEmitter();
		event_emitter.subscribe(
			async (res: { new_student: Student; row_index: number }) =>
				this.updateTableRow(res)
		);

		let offered_subjects: CourseSubject[] = [];
		if (
			this.isCurrentlyOpen(
				enrollment.school_setting.enrollment_start_date,
				enrollment.school_setting.enrollment_end_date
			)
		) {
			let settings_with_subjects = await this.getSchoolSetting(
				enrollment.school_setting.id,
				{
					student_id: enrollment.student_id,
					program_id: enrollment.program_id,
				}
			);
			offered_subjects = settings_with_subjects
				? settings_with_subjects.subjects
				: [];
		}

		//create modal
		const modal = await this.modalController.create({
			component: EnrollmentFormComponent,
			componentProps: {
				enrollment: enrollment,
				student: student,
				offered_subjects: offered_subjects,
				row_index: row_index,
				student_types: this.student_types,
				levels: this.levels,
				programs: this.programs,
				success_enrollment: event_emitter,
			},
			cssClass: "modal-fullscreen",
			backdropDismiss: false,
		});
		return await modal.present();
	}

	async showEnrollmentHistories(
		e: any = null,
		student: Student,
		row_index: number
	) {
		let options = [];
		for (const history of student.enrollment_histories) {
			options.push({
				label: `A.Y. : ${history.school_setting.academic_year} TERM: ${history.school_setting.term.code}`,
				icon_name: "open-outline",
				callback: () => {
					this.showEnrollmentHistoryForm(
						student,
						history,
						null,
						row_index
					).finally(() => this.popoverController.dismiss());
				},
			});
		}

		const menu = await this.popoverController.create({
			component: RowContextMenuComponent,
			event: e,
			componentProps: {
				title: "View Enrollment",
				subtitle: "Student ID: " + student.student_number,
				options: options,
			},
			backdropDismiss: true,
			showBackdrop: false,
		});
		return await menu.present();
	}

	async showExportMenu(event: Event) {
		if (!this.dataTableElement) return;

		/*prevent the closing of fab on click of an item */
		// event.stopPropagation();
		this.fab.activated = false;
	}

	async showFilterMenu(event: Event) {
		this.categories = [];
		/*prevent the closing of fab on click of an item */
		// event.stopPropagation;
		this.fab.activated = false;

		this.categories.push(
			{ name: "Levels", filter_key: "levels", items: this.levels },
			{ name: "Programs", filter_key: "programs", items: this.programs },
			{
				name: "Student Types",
				filter_key: "student_types",
				items: this.student_types,
			}
		);
	}

	async showOpenEnrollments(
		e: any = null,
		student: Student,
		row_index: number
	) {
		let open_enrollments = this.school_settings.filter((s) => {
			return (
				this.isCurrentlyOpen(
					s.enrollment_start_date,
					s.enrollment_end_date
				) &&
				(student.enrollment_histories_count === 0 ||
					!student.enrollment_histories
						.map((s) => s.school_setting_id)
						.includes(s.id)) &&
				(student.registration.school_setting.academic_year >
					s.academic_year ||
					(student.registration.school_setting.academic_year ==
						s.academic_year &&
						student.registration.school_setting.term_id >=
							s.term_id))
			);
		});

		let options = [];
		let title = "Enroll Student";
		if (open_enrollments.length === 0) {
			title = "No Open Enrollments!";
		} else {
			for (const school_setting of open_enrollments) {
				options.push({
					label: `A.Y. : ${school_setting.academic_year} TERM: ${school_setting.term.code}`,
					icon_name: "open-outline",
					callback: () => {
						this.showEnrollmentHistoryForm(
							student,
							null,
							school_setting,
							row_index
						).finally(() => this.popoverController.dismiss());
					},
				});
			}
		}

		const menu = await this.popoverController.create({
			component: RowContextMenuComponent,
			event: e,
			componentProps: {
				title: title,
				subtitle: "Student ID: " + student.student_number,
				options: options,
			},
			backdropDismiss: true,
			showBackdrop: false,
		});
		return await menu.present();
	}

	private async showRegistrationForm(
		student: Student = null,
		row_index: number
	) {
		let event_emitter = new EventEmitter();
		event_emitter.subscribe(
			async (res: { new_student: Student; row_index: number }) =>
				this.updateTableRow(res)
		);

		//create modal
		const modal = await this.modalController.create({
			component: StudentRegistrationFormComponent,
			componentProps: {
				active_enrollments: student
					? this.school_settings
					: this.school_settings.filter((value) =>
							this.isCurrentlyOpen(
								value.enrollment_start_date,
								value.enrollment_end_date
							)
					  ),
				levels: this.levels,
				programs: student
					? this.programs
					: this.programs.filter((value) => value.deleted_at == null),
				row_index: row_index,
				student: student,
				student_types: this.student_types,
				trigger: "",
				success_registration: event_emitter,
			},
			cssClass: "modal-fullscreen",
			backdropDismiss: false,
		});
		return await modal.present();
	}

	async toggleColumnVisibility(index: number) {
		if (!this.dataTableElement) return;

		const dtInstance: any = await this.dataTableElement.dtInstance;
		const col = dtInstance.column(index);
		const v = col.visible();
		col.visible(!v);

		dtInstance.columns.adjust();
	}

	private async toggleStatus(student: Student, index: number) {
		const loading = await this.loadingController.create({
			spinner: "bubbles",
			backdropDismiss: false,
		});
		await loading.present();

		let result: any = await this.apiService
			.deleteStudent(student.id)
			.catch(async (res: HttpErrorResponse) => {
				await loading.dismiss();
				const alert = await this.alertController.create({
					header: "Status Update Failed!",
					buttons: ["OK"],
				});
				await alert.present();
			});

		if (result) {
			await loading.dismiss();
			const alert = await this.alertController.create({
				header: "Status Update Success.",
				buttons: ["OK"],
			});
			await alert.present();

			//update row data and redraw
			const dtInstance = await this.dataTableElement.dtInstance;
			const data_index = dtInstance.rows().indexes()[index];
			if (this.filters.student_status == "ALL") {
				dtInstance.row(data_index).data()["deleted_at"] =
					result.deleted_at;
				dtInstance.row(data_index).invalidate("data").draw();
			} else {
				dtInstance.row(data_index).remove();
				dtInstance.rows().draw();
			}
			this.popoverController.dismiss();
		}
	}

	private async updateTableRow(res: {
		new_student: Student;
		row_index: number;
	}) {
		{
			if (!res.new_student) return;
			if (
				res.row_index > -1 &&
				this.filters.levels.includes(res.new_student.level_id) &&
				this.filters.programs.includes(res.new_student.program_id) &&
				this.filters.student_types.includes(
					res.new_student.student_type_id
				) &&
				(this.table_data_status.search == "" ||
					res.new_student.registration.last_name
						.toLowerCase()
						.indexOf(this.table_data_status.search.toLowerCase()) >
						-1 ||
					res.new_student.registration.first_name
						.toLowerCase()
						.indexOf(this.table_data_status.search.toLowerCase()) >
						-1)
			) {
				//update row data and redraw
				console.log("🚀 ~ file: students.page.ts ~ line 994 ~ redraw");
				const dtInstance = await this.dataTableElement.dtInstance;
				const data_index = dtInstance.rows().indexes()[res.row_index];
				dtInstance.row(data_index).data(res.new_student);
				dtInstance.row(data_index).invalidate("data").draw();
				this.popoverController.dismiss();
			} else {
				//add new row and redraw
				const dtInstance = await this.dataTableElement.dtInstance;
				dtInstance.row.add(res.new_student);
				dtInstance.rows().draw();
			}
		}
	}

	private async viewProfile(student: Student, row_index: number) {
		await this.showRegistrationForm(student, row_index);
	}
}
