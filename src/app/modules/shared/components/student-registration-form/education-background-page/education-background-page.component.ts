import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { Course } from "src/app/interfaces/course";
import { SlideTriggerOptions } from "../student-registration-form.component";

@Component({
	selector: "app-education-background-page",
	templateUrl: "./education-background-page.component.html",
	styleUrls: ["./education-background-page.component.scss"],
})
export class EducationBackgroundPageComponent implements OnInit {
	@Input() educationFormGroup: FormGroup;
	@Input() selected_program: Course;
	@Input() hide_college_background: boolean = true;
	@Output() triggerSlide: EventEmitter<SlideTriggerOptions> =
		new EventEmitter<SlideTriggerOptions>();

	constructor() {}

	ngOnInit() {}

	slide(direction: string = "next", validate: boolean = false) {
		this.triggerSlide.emit({
			direction: direction,
			unique_validation: validate,
		});
	}
}
