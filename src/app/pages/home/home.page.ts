import { Component, OnInit, ViewChild } from "@angular/core";
import { DataTableDirective } from "angular-datatables";

@Component({
	selector: "app-home",
	templateUrl: "./home.page.html",
	styleUrls: ["./home.page.scss"],
})
export class HomePage implements OnInit {
	dtOptions: any = {};
	test_data = [
		// [1, 2, 3, ],
		{ id: "Fname1", firstName: "Fname2", lastName: "Fname3" },
		{ id: "Lname1", firstName: "Lname2", lastName: "Lname3" },
	];

	@ViewChild(DataTableDirective, { static: false })
	datatableElement: DataTableDirective;
	// @ViewChild('tableContent', { static: false }) private content: IonContent;
	constructor() {}

	ngOnInit() {
		this.dtOptions = {
			data: this.test_data,
			columns: [
				{
					title: "ID",
					data: "id",
				},
				{
					title: "First name",
					data: "firstName",
				},
				{
					title: "Last name",
					data: "lastName",
				},
			],
			paging: false,
			responsive: true,
			searching: true,
			ordering: true,
			colReorder: true,
			order: [
				// [5, "desc"],
				[0, "desc"],
			],
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
		};
	}
}
