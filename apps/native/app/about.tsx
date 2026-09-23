import {
	FormHero,
	FormRow,
	FormScreen,
	FormSection,
} from "@/components/form/form";

export default function AboutSeenmark() {
	return (
		<FormScreen>
			<FormHero
				image={require("@/assets/images/icon.png")}
				eyebrow="About your record"
				title="Your photos are yours."
				description="Seenmark keeps your check-in photos private to your account. You choose how to describe what you see, and we do not interpret or diagnose a photo."
			/>
			<FormSection footer="A clinic is the last step, not the front door.">
				<FormRow
					icon="camera"
					title="Camera only"
					subtitle="Check-ins come from your camera, never your photo library."
				/>
				<FormRow
					icon="steps"
					title="Your band, your words"
					subtitle="Early, mid, or late is how you describe your hair. It is not a diagnosis."
				/>
				<FormRow
					icon="privacy"
					title="Nothing is sent for you"
					subtitle="An introduction request stays on your record until you choose to continue."
				/>
			</FormSection>
		</FormScreen>
	);
}
