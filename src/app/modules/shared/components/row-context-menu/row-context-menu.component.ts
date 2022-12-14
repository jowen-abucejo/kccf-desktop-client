import { Component, Input, OnInit } from "@angular/core";

@Component({
	selector: "app-row-context-menu",
	templateUrl: "./row-context-menu.component.html",
	styleUrls: ["./row-context-menu.component.scss"],
})
export class RowContextMenuComponent implements OnInit {
	@Input() title: string = "Select Action";
	@Input() subtitle: string;
	@Input() options: {
		label: string;
		icon_name: string;
		option_callback: () => any;
	}[] = [];
	constructor() {}

	ngOnInit() {}
}
