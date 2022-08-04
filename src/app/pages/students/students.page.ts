import {
	AfterViewInit,
	Component,
	HostListener,
	OnInit,
	ViewChild,
} from "@angular/core";
import {
	IonButton,
	IonContent,
	IonModal,
	ModalController,
	PopoverController,
	ViewWillEnter,
	ViewWillLeave,
} from "@ionic/angular";
import { DataTableDirective } from "angular-datatables";
import { SchoolSetting } from "src/app/interfaces/school-setting";
import { Student } from "src/app/interfaces/student";
import { TablePage } from "src/app/interfaces/table-page";
import { timestampToDate } from "src/app/modules/shared/components/date-picker/date-picker.component";
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
	hasScrollbar = false;
	active_enrollments: SchoolSetting[] = [];
	isSearching: boolean = false;
	private students: Student[] = [];
	segment_value: string = "ALL";
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

	@ViewChild(IonModal) modal: IonModal;
	@ViewChild("registerBtn") modalTrigger: IonButton;

	dtOptions = {
		data: this.students,
		columns: [
			{
				title: "ID",
				data: "id",
			},
			{
				title: "Student Number",
				data: "student_number",
			},
			{
				title: "Program",
				data: "program.code",
			},
			{
				title: "Level",
				data: "level.code",
			},
			{
				title: "Last name",
				data: null,
				render: function (data, type, row) {
					return (
						row.registration.last_name +
						" " +
						row.registration.name_suffix
					).trim();
				},
			},
			{
				title: "First name",
				data: "registration.first_name",
			},
			{
				title: "Middle Name",
				data: "registration.middle_name",
			},
			{
				title: "Birth Date",
				data: "registration.birth_date",
			},
			{
				title: "Status",
				data: null,
				render: function (data, type, row) {
					return row.deleted_at ? "INACTIVE" : "ACTIVE";
				},
			},
		],
		paging: false,
		responsive: true,
		searching: true,
		ordering: true,
		colReorder: true,
		order: [[0, "desc"]],
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
				// customize: (doc) => {
				// 	doc.pageMargins = [38, 120, 38, 38];
				// 	doc.defaultStyle.alignment = "center";
				// 	doc.pageOrientation =
				// 		this.export_setup.page_orientation;
				// 	doc.pageSize = this.export_setup.page_size;
				// 	doc.content[0] = {
				// 		text: this.export_setup.page_title,
				// 		style: { fontSize: 14, bold: true },
				// 		margin: this.export_setup.page_title
				// 			? [0, 0, 0, 15]
				// 			: 0,
				// 	};
				// 	doc.content[1].table.widths = Array(
				// 		doc.content[1].table.body[0].length + 1
				// 	)
				// 		.join("*")
				// 		.split("");
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
				// },
				download: "download",
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
				this.createContextMenu(e, data);
			});
		},
	};

	table_name = "studentsTable";
	table_settings;

	@ViewChild("tableContent", { static: false }) private content: IonContent;

	constructor(
		private storage: StorageService,
		private apiService: ApiService,
		private popoverController: PopoverController,
		private modalController: ModalController
	) {}

	async ionViewWillEnter(): Promise<void> {
		this.getActiveEnrollments(true);
	}

	async ionViewWillLeave(): Promise<void> {
		this.active_enrollments = [];
		// await this.saveTableSettings();
	}

	async ngOnInit() {
		// this.getActiveEnrollments();
		// await this.loadTableSettings();
		await this.loadMoreData();
	}

	async addNewRows(response: any) {
		if (!response.data) return;
		this.table_data_status.current_page = response.current_page;
		this.table_data_status.last_page = response.last_page;
		this.students.concat(response.data);
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

	private async createContextMenu(e: any, student: Student) {
		const menu = await this.popoverController.create({
			component: RowContextMenuComponent,
			event: e.originalEvent,
			componentProps: {
				student_number: student.student_number,
				options: [
					{
						label: "View Profile",
						icon_name: "eye-outline",
						callback: () => {
							this.viewProfile(student);
						},
					},
					{
						label: student.deleted_at ? "Activate" : "Deactivate",
						icon_name: student.deleted_at
							? "checkmark-circle-outline"
							: "close-circle-outline",
						callback: () => {
							this.toggleStatus(student);
						},
					},
				],
			},
			backdropDismiss: true,
			showBackdrop: false,
		});
		return await menu.present();
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
			})
			.catch((er) => {
				return null;
			});
		if (students) this.addNewRows(students);
	}

	async getActiveEnrollments(fresh: boolean = false) {
		const school_settings: SchoolSetting[] = await this.apiService
			.getSchoolSettings(fresh)
			.catch((res) => {
				return [];
			});
		this.active_enrollments = school_settings.filter(
			(value) =>
				new Date() >= timestampToDate(value.enrollment_start_date) &&
				new Date() <= timestampToDate(value.enrollment_end_date)
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
		if (event) event?.target.complete();
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

	async showColVisMenu(event: any) {
		if (!this.dataTableElement) return;

		/*prevent the closing of fab on click of an item */
		event.stopPropagation();
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

	private async showRegistrationForm(student: Student = null) {
		const modal = await this.modalController.create({
			component: StudentRegistrationFormComponent,
			componentProps: {
				trigger: "",
				active_enrollments: this.active_enrollments,
				student: student,
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

	private toggleStatus(student: Student) {}

	private async viewProfile(student: Student) {
		await this.showRegistrationForm(student);
	}
}
