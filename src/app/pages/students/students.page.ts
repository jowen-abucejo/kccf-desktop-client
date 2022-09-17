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
import { Level } from "src/app/interfaces/level";
import { SchoolSetting } from "src/app/interfaces/school-setting";
import { Student } from "src/app/interfaces/student";
import { StudentType } from "src/app/interfaces/student-type";
import { TablePage } from "src/app/interfaces/table-page";
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
		this.getSchoolSettings(true);
		this.getPrograms(true);
	}

	async ionViewWillLeave(): Promise<void> {
		this.school_settings = [];
		this.programs = [];
		// await this.saveTableSettings();
	}

	async ngOnInit() {
		// await this.loadTableSettings();
		this.getLevels();
		this.getStudentTypes().then(async () => {
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

	private async createContextMenu(e: any, student: Student, index: number) {
		const menu = await this.popoverController.create({
			component: RowContextMenuComponent,
			event: e.originalEvent,
			componentProps: {
				subtitle: "Student ID: " + student.student_number,
				options: [
					{
						label: "View Registration",
						icon_name: "eye-outline",
						callback: () => {
							this.viewProfile(student, index);
						},
					},
					{
						label: student.deleted_at ? "Activate" : "Deactivate",
						icon_name: student.deleted_at
							? "checkmark-circle-outline"
							: "close-circle-outline",
						callback: () => {
							this.toggleStatus(student, index);
						},
					},
				],
			},
			backdropDismiss: true,
			showBackdrop: false,
		});
		return await menu.present();
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
				"st[]": this.filters.student_types,
				student_status: this.filters.student_status,
				"l[]": this.filters.levels,
				"p[]": this.filters.programs,
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

		await this.loadMoreData().then(() => this.checkForScrollbar());
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

		this.filters.programs = this.programs.map((p) => p.id);
	}

	/**
	 * Get all levels
	 */
	async getLevels() {
		this.levels = await this.apiService.getLevels().catch((er) => {
			return [];
		});
		this.filters.levels = this.levels.map((l) => l.id);
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
		this.filters.student_types = this.student_types.map((s) => s.id);
	}

	async getSchoolSettings(fresh: boolean = false) {
		this.school_settings = await this.apiService
			.getSchoolSettings(fresh)
			.catch((res) => {
				return [];
			});
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

	private async showRegistrationForm(
		student: Student = null,
		row_index: number
	) {
		let event_emitter = new EventEmitter();
		event_emitter.subscribe(
			async (res: { new_student: Student; row_index: number }) => {
				if (!res.new_student) return;
				if (
					res.row_index > -1 &&
					this.filters.levels.includes(res.new_student.level_id) &&
					this.filters.programs.includes(
						res.new_student.program_id
					) &&
					this.filters.student_types.includes(
						res.new_student.student_type_id
					) &&
					(res.new_student.registration.last_name.indexOf(
						this.table_data_status.search
					) > -1 ||
						res.new_student.registration.first_name.indexOf(
							this.table_data_status.search
						) > -1)
				) {
					//update row data and redraw
					const dtInstance = await this.dataTableElement.dtInstance;
					const data_index = dtInstance.rows().indexes()[
						res.row_index
					];
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
		);

		//create modal
		const modal = await this.modalController.create({
			component: StudentRegistrationFormComponent,
			componentProps: {
				active_enrollments: student
					? this.school_settings
					: this.school_settings.filter(
							(value) =>
								new Date() >=
									new Date(value.enrollment_start_date) &&
								new Date() <=
									new Date(value.enrollment_end_date)
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

	private async viewProfile(student: Student, row_index: number) {
		await this.showRegistrationForm(student, row_index);
	}
}
