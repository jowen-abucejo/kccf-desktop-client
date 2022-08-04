import { Component, Input, OnInit } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { regex_tests } from "../student-registration-form/student-registration-form.component";

export function stringISOToTimeStamp(
	date: string,
	date_and_time: boolean = false
) {
	if (date_and_time) return date.slice(0, 19).replace("T", " ");
	return date.slice(0, 10);
}
export function timestampToDate(
	string_date: string,
	date_and_time: boolean = false
) {
	// Split timestamp into [ Y, M, D, h, m, s ]
	let t = string_date.split(/[- :]/);

	// Apply each element to the Date function
	const date = date_and_time
		? new Date(Date.UTC(+t[0], +t[1] - 1, +t[2], +t[3], +t[4], +t[5]))
		: new Date(Date.UTC(+t[0], +t[1] - 1, +t[2]));

	return date;
}

@Component({
	selector: "app-date-picker",
	templateUrl: "./date-picker.component.html",
	styleUrls: ["./date-picker.component.scss"],
})
export class DatePickerComponent implements OnInit {
	@Input() date_picker_id: string;
	@Input() label: string;
	@Input() label_position: string = "floating";
	@Input() presentation: string = "date";
	@Input() popover_vertical_offset: string = "0px";
	@Input() placeholder: string = "mm-dd-yyyy";
	@Input() dateFormControl: FormControl = new FormControl(
		"",
		Validators.required
	);
	_birth_date: FormControl = new FormControl("");

	constructor() {}

	ngOnInit() {
		let is_date_time: boolean = this.presentation == "date-time";
		let default_date: string = this.dateFormControl.value;

		let valid_format = false;
		if (default_date) {
			if (is_date_time) {
				valid_format = regex_tests.date_time.test(default_date);
			} else {
				valid_format = regex_tests.date.test(default_date);
			}
		}

		if (valid_format) {
			let date = timestampToDate(default_date, is_date_time);
			this._birth_date.setValue(date.toISOString());
		}

		this._birth_date.valueChanges.subscribe((er) => {
			if (er) {
				this.dateFormControl.setValue(
					stringISOToTimeStamp(er, is_date_time)
				);
			} else {
				this.dateFormControl.setValue("");
			}
		});
	}

	// dateToStringISO(date: Date) {
	// 	const formatted_date = formatDate(
	// 		date,
	// 		"yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
	// 		"en-US"
	// 	);

	// 	return formatted_date;
	// }
}
