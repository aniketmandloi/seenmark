import { router } from "expo-router";

import {
	FormButton,
	FormHero,
	FormReveal,
	FormRow,
	FormScreen,
	FormSection,
} from "@/components/form/form";

export default function WelcomeScreen() {
	return (
		<FormScreen>
			<FormHero
				logo
				eyebrow="Private by design"
				title="Your hairline, over time."
				highlight="over time"
				description="A quiet place to keep your own check-in photos and look back when you choose."
				reveal
			/>
			<FormReveal index={4}>
				<FormSection highlighted>
					<FormRow
						icon="camera"
						title="Start with one photo"
						subtitle="Check in with your camera, and compare later photos with it."
					/>
					<FormRow
						icon="privacy"
						title="Your record stays yours"
						subtitle="Only you can see your photos. Seenmark does not interpret them."
					/>
					<FormRow
						icon="steps"
						title="Choose what feels right"
						subtitle="Describe your hair as early, mid, or late and read a short menu of next steps."
					/>
				</FormSection>
			</FormReveal>
			<FormReveal index={5}>
				<FormButton
					label="Create account"
					onPress={() => router.push("/sign-up")}
					prominent
				/>
			</FormReveal>
			<FormReveal index={6}>
				<FormSection footer="For adults in the United States. Seenmark does not diagnose or interpret photos.">
					<FormButton
						label="I already have an account"
						onPress={() => router.push("/sign-in")}
					/>
				</FormSection>
			</FormReveal>
		</FormScreen>
	);
}
