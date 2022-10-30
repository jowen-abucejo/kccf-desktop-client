import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { SlideTriggerOptions } from "../student-registration-form.component";

@Component({
	selector: "app-guardian-info-page",
	templateUrl: "./guardian-info-page.component.html",
	styleUrls: ["./guardian-info-page.component.scss"],
})
export class GuardianInfoPageComponent implements OnInit {
	@Input() guardianInfoFormGroup: FormGroup;
	@Input() target: number = 0;

	@Output() triggerSlide: EventEmitter<SlideTriggerOptions> =
		new EventEmitter<SlideTriggerOptions>();

	targets: string[] = ["Mother", "Father", "Guardian"];
	constructor() {}

	ngOnInit() {}

	slide(direction: string = "next", validate: boolean = false) {
		this.triggerSlide.emit({
			direction: direction,
			unique_validation: validate,
		});
	}

	toggleDeceasedAttribute(event) {
		if (event.detail.checked) {
			this.guardianInfoFormGroup.controls.occupation.disable();
			this.guardianInfoFormGroup.controls.address.disable();
			this.guardianInfoFormGroup.controls.email.disable();
			this.guardianInfoFormGroup.controls.contact_number.disable();
			this.guardianInfoFormGroup.controls.same_address.disable();
			this.guardianInfoFormGroup.controls.same_address.setValue(false);
		} else {
			this.guardianInfoFormGroup.controls.occupation.enable();
			this.guardianInfoFormGroup.controls.address.enable();
			this.guardianInfoFormGroup.controls.email.enable();
			this.guardianInfoFormGroup.controls.contact_number.enable();
			this.guardianInfoFormGroup.controls.same_address.enable();
		}
	}

	toggleGuardianChange(event) {
		const relationship = event.detail.value;
		if (relationship == "other") {
			this.guardianInfoFormGroup.enable();
			this.guardianInfoFormGroup.parent
				.get("mother_info.is_guardian")
				.setValue(false);
			this.guardianInfoFormGroup.parent
				.get("father_info.is_guardian")
				.setValue(false);
		} else {
			this.guardianInfoFormGroup.disable();
			this.guardianInfoFormGroup.controls.same_address.setValue(false);
			this.guardianInfoFormGroup.controls.relationship.enable();
			this.guardianInfoFormGroup.parent
				.get(`${relationship}_info.is_guardian`)
				.setValue(true);
		}
	}

	toggleSameAddressAttribute(event) {
		if (this.guardianInfoFormGroup.controls.same_address.disabled) return;
		if (event.detail.checked) {
			this.guardianInfoFormGroup.controls.address.disable();
		} else {
			this.guardianInfoFormGroup.controls.address.enable();
		}
	}
}
