import { Course } from "./course";
import { CourseSubject } from "./course-subject";
import { Level } from "./level";
import { SchoolSetting } from "./school-setting";
import { StudentType } from "./student-type";
import { OfferSubject } from "./subject-pivot";

export interface EnrollmentHistory {
	created_at: string;
	created_by: number;
	deleted_by: number;
	deleted_at: string;
	enrolled_subjects: EnrolledSubject[];
	id: number;
	level: Level | null;
	level_id: number;
	program: Course | null;
	program_id: number;
	reg_form_generated: number;
	school_setting: SchoolSetting | null;
	school_setting_id: number;
	status: string;
	student_id: number;
	student_type: StudentType | null;
	student_type_id: number;
	updated_at: string;
	updated_by: number;
}

export interface EnrolledSubject {
	id?: number;
	enrollment_history_id: number;
	subject: CourseSubject | null;
	offer_subject_id: number;
	status: string;
}
