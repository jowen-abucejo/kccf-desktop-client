import { Component, OnInit, ViewChild } from "@angular/core";
import { IonModal } from "@ionic/angular";
import { DataTableDirective } from "angular-datatables";
import { SchoolSetting } from "src/app/interfaces/school-setting";
import { TablePage } from "src/app/interfaces/table-page";
import { Term } from "src/app/interfaces/term";
import { ApiService } from "src/app/services/api.service";
import {
	StorageService,
	TABLE_SETTINGS_PREFIX,
} from "src/app/services/storage.service";

@Component({
	selector: "app-school-settings",
	templateUrl: "./school-settings.page.html",
	styleUrls: ["./school-settings.page.scss"],
})
export class SchoolSettingsPage implements OnInit, TablePage {
	isSearching: boolean = false;
	school_settings: SchoolSetting[] = [];
	segment_value: string = "ALL";
	terms: Term[] = [];

	@ViewChild(DataTableDirective, { static: false })
	dataTableElement: DataTableDirective;

	@ViewChild(IonModal) modal: IonModal;
	// @ViewChild('tableContent', { static: false }) private content: IonContent;

	dtOptions = {
		data: this.school_settings,
		columns: [
			{
				title: "Academic Year",
				data: "academic_year",
			},
			{
				title: "Term",
				data: "term.code",
			},
			{
				title: "Enrollment Start",
				data: "enrollment_start_date",
			},
			{
				title: "Enrollment End",
				data: "enrollment_end_date",
			},
			{
				title: "Encoding Start",
				data: "encoding_start_date",
			},
			{
				title: "Encoding End",
				data: "encoding_end_date",
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
			// {
			// 	targets: [0],
			// 	visible: false,
			// },
			// { targets: [1, 2, 3, 8], searchable: true },
			// { targets: "_all", searchable: false, visible: true },
			// {
			// 	targets: [9],
			// 	className: "dynamic-text-alignment ion-padding-right",
			// },
		],
		rowCallback: (row: Node, data: any[] | Object, index: number) => {
			// Unbind first in order to avoid any duplicate handler
			// (see https://github.com/l-lin/angular-datatables/issues/87)
			// Note: In newer jQuery v3 versions, `unbind` and `bind` are
			// deprecated in favor of `off` and `on`
			$("td", row).off("contextmenu");
			$("td", row).on("contextmenu", (e) => {
				e.preventDefault();
				alert(data); //!process data
			});
			return row;
		},
	};
	private table_columns: any[] = [];
	table_name = "schoolSettingsTable";
	table_settings;

	constructor(
		private storage: StorageService,
		private apiService: ApiService
	) {}

	async ionViewWillLeave(): Promise<void> {
		// await this.saveTableSettings();
	}

	async ngOnInit() {
		await this.fetchRecords();

		// await this.loadTableSettings();
	}

	async addNewRows(response) {
		if (!response) return;
		this.school_settings.concat(response);
		const dtInstance = await this.dataTableElement.dtInstance;
		dtInstance.rows.add(response);
		dtInstance.rows().draw();
	}

	changeView(event) {}

	async fetchRecords(
		page: number = 0,
		limit: number = 0,
		order: string = "desc",
		search: string = ""
	) {
		const settings = await this.apiService.getSchoolSettings(true);
		this.addNewRows(settings);
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
		const dtInstance = await this.dataTableElement.dtInstance;
		dtInstance.columns().every((index) => {
			// if (index > 0) {
			const col = dtInstance.column(index);
			const column = {
				label: col.header().textContent,
				checked: col.visible(),
				callback: () => {
					this.toggleColumnVisibility(index);
				},
			};
			this.table_columns.push(column);
			// }
		});
	}

	async toggleColumnVisibility(index: number) {
		if (!this.dataTableElement) return;

		const dtInstance: any = await this.dataTableElement.dtInstance;
		const col = dtInstance.column(index);
		const v = col.visible();
		col.visible(!v);

		dtInstance.columns.adjust();
	}
}
