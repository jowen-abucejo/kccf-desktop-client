import { Component, Input, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { CheckboxCustomEvent, SearchbarCustomEvent } from "@ionic/angular";

@Component({
	selector: "app-searchable-select",
	templateUrl: "./searchable-select.component.html",
	styleUrls: ["./searchable-select.component.scss"],
})
export class SearchableSelectComponent implements OnInit {
	@Input() backdropDismiss: boolean = false;
	@Input() disableSelectedItems: boolean = false;
	@Input() formControlRef: FormControl;
	@Input() items: any[] = [];
	@Input() multipleSelectItem: boolean = false;
	@Input() multipleTextDisplay: boolean = false;
	@Input() search_placeholder: string = "Search...";
	@Input() textFieldRef: string;
	@Input() title: string = "SELECT";
	@Input() textDisplaySeparator: string = " : ";
	@Input() valueRef: string;

	isOpen: boolean = false;
	private cached_default_items: any[] = [];
	private selected_items: any = null;

	constructor() {}

	ngOnInit() {}

	cancel() {
		if (this.cached_default_items.length > 0)
			this.items = this.cached_default_items;
		this.isOpen = false;
	}

	confirm() {
		this.formControlRef.setValue(this.selected_items);
		this.formControlRef.markAsDirty();
		this.cancel();
	}

	displayText(item: any) {
		if (!this.multipleTextDisplay)
			return this.leaf(this.textFieldRef, item) + " ";

		let text = "";
		this.textFieldRef.split(",").forEach((value, index) => {
			if (index > 0) {
				text += this.textDisplaySeparator + this.leaf(value, item);
			} else {
				text = this.leaf(value, item);
			}
		});
		return text + " ";
	}

	isSelected(item: any) {
		return this.multipleSelectItem
			? this.formControlRef.value.includes(
					+this.leaf(this.valueRef, item)
			  )
			: this.formControlRef.value == item;
	}

	leaf(value_for: string, item: any) {
		if (item === null || item === undefined || item === "") return "";
		return value_for.split(".").reduce((value, el) => value[el], item);
	}

	onSearchChange(event: SearchbarCustomEvent) {
		if (this.cached_default_items.length === 0)
			this.cached_default_items = JSON.parse(JSON.stringify(this.items));

		let search = event.detail.value.toLowerCase().trim();

		if (search == "") this.items = this.cached_default_items;
		else
			this.items = this.cached_default_items.filter(
				(value) =>
					this.displayText(value).toLowerCase().indexOf(search) > -1
			);
	}

	open() {
		if (this.formControlRef.disabled) return;
		this.selected_items = JSON.parse(
			JSON.stringify(this.formControlRef.value)
		);
		this.isOpen = true;
	}

	selectedTexts() {
		return (this.multipleSelectItem &&
			this.formControlRef.value.length === 0) ||
			!this.formControlRef.value
			? ""
			: this.multipleSelectItem
			? this.items
					.filter((item) =>
						this.formControlRef.value.includes(
							this.leaf(this.valueRef, item)
						)
					)
					.map((item) => {
						return this.displayText(item);
					})
					.join(", ")
			: this.displayText(
					this.items.find(
						(item) =>
							this.formControlRef.value ==
							this.leaf(this.valueRef, item)
					)
			  );
	}

	updateSelected(event: CheckboxCustomEvent) {
		if (event.detail.checked) {
			this.selected_items.push(event.detail.value);
		} else {
			this.selected_items = this.selected_items.filter(
				(value) => value != event.detail.value
			);
		}
	}
}
