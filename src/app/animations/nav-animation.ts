import { AnimationController, Animation } from "@ionic/angular";

export const getIonPageElement = (element: HTMLElement) => {
	if (element.classList.contains("ion-page")) {
		return element;
	}

	const ionPage = element.querySelector(
		":scope > .ion-page, :scope > ion-nav, :scope > ion-tabs"
	);
	if (ionPage) {
		return ionPage;
	}
	// idk, return the original element so at least something animates
	// and we don't have a null pointer
	return element;
};

export const navCustomAnimation = (
	baseEl: HTMLElement,
	opts: any
): Animation => {
	const animationCtrl = new AnimationController();
	const DURATION = 300;

	// root animation with common setup for the whole transition
	const rootTransition = animationCtrl
		.create()
		.duration(opts.duration || DURATION)
		.easing("cubic-bezier(0.3,0,0.66,1)");

	// ensure that the entering page is visible from the start of the transition
	const enteringPage = animationCtrl
		.create()
		.addElement(getIonPageElement(opts.enteringEl))
		.beforeRemoveClass("ion-page-invisible");

	// create animation for the leaving page
	const leavingPage = animationCtrl
		.create()
		.addElement(getIonPageElement(opts.leavingEl));

	// actual customized animation
	if (opts.direction === "forward") {
		enteringPage.fromTo("transform", "translateX(100%)", "translateX(0)");
		leavingPage.fromTo("opacity", "1", "0.25");
	} else {
		leavingPage.fromTo("transform", "translateX(0)", "translateX(100%)");
		enteringPage.fromTo("opacity", "0.25", "1");
	}

	// include animations for both pages into the root animation
	rootTransition.addAnimation([enteringPage, leavingPage]);
	return rootTransition;
};
