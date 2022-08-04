import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { SlideTriggerOptions } from "../student-registration-form.component";

@Component({
	selector: "app-basic-info-page",
	templateUrl: "./basic-info-page.component.html",
	styleUrls: ["./basic-info-page.component.scss"],
})
export class BasicInfoPageComponent implements OnInit {
	@Input() basicInfoFormGroup: FormGroup;

	@Output() triggerSlide: EventEmitter<SlideTriggerOptions> =
		new EventEmitter<SlideTriggerOptions>();
	_birth_date: string = "";

	constructor() {}

	ngOnInit() {}

	slide(direction: string = "next", validate: boolean = false) {
		this.triggerSlide.emit({
			direction: direction,
			unique_validation: validate,
		});
	}
}
