import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { Student } from "src/app/interfaces/student";
import {
	SiblingFieldEventOptions,
	SlideTriggerOptions,
} from "../student-registration-form.component";

@Component({
	selector: "app-family-info-page",
	templateUrl: "./family-info-page.component.html",
	styleUrls: ["./family-info-page.component.scss"],
})
export class FamilyInfoPageComponent implements OnInit {
	@Input() familyInfoFormGroup: FormGroup;
	@Input() student: Student = null;
	@Output() triggerSlide: EventEmitter<SlideTriggerOptions> =
		new EventEmitter<SlideTriggerOptions>();

	@Output() register: EventEmitter<boolean> = new EventEmitter<boolean>();
	@Output() siblingFieldOperation: EventEmitter<SiblingFieldEventOptions> =
		new EventEmitter<SiblingFieldEventOptions>();

	constructor() {}

	ngOnInit() {}

	slide(direction: string = "next", validate: boolean = false) {
		this.triggerSlide.emit({
			direction: direction,
			unique_validation: validate,
		});
	}

	submitForm() {
		this.register.emit(true);
	}

	addSiblingField(delete_field: boolean = false, id: number = 0) {
		const options: SiblingFieldEventOptions = {
			delete_field: delete_field,
			field_index: id,
		};
		this.siblingFieldOperation.emit(options);
	}
}
