import {
	FormButton,
	FormConfirmButton,
	FormEmptyState,
	FormLink,
	FormRow,
	FormScreen,
	FormSection,
	FormText,
} from "@/components/form/form";
import { BANDS, formatCheckInDate, useMemberLoop } from "@/lib/use-member-loop";

export default function NextStepsScreen() {
	const loop = useMemberLoop();
	const menu = loop.menu;
	const bandLabel = BANDS.find((band) => band.value === menu?.band)?.label;

	if (!menu) {
		return (
			<FormScreen onRefresh={loop.refresh}>
				<FormEmptyState
					icon="steps"
					title="Your menu waits for a band."
					description="Choose the band that feels right on your check-ins, and the next steps for it appear here."
				/>
			</FormScreen>
		);
	}

	return (
		<FormScreen onRefresh={loop.refresh}>
			{loop.error ? (
				<FormSection>
					<FormRow icon="error" title={loop.error} tone="destructive" />
				</FormSection>
			) : null}

			<FormSection title={bandLabel ? `${bandLabel} band` : undefined}>
				{menu.steps.map((step, index) => (
					<FormText key={step}>{`${index + 1}. ${step}`}</FormText>
				))}
			</FormSection>

			{menu.band === "late" ? (
				<FormSection
					title="Introduction"
					footer={
						loop.introduction
							? "Your request is saved here. Nothing has been sent."
							: "If you want, you can request an introduction. It will not book anything or send until you choose to continue."
					}
				>
					{loop.introduction ? (
						<>
							<FormRow
								icon="done"
								title="Request saved"
								value={formatCheckInDate(loop.introduction.filedAt)}
							/>
							<FormConfirmButton
								label="Delete request"
								icon="delete"
								title="Delete your introduction request?"
								message="This request will be removed from your record. Nothing has been sent."
								confirmLabel="Delete request"
								cancelLabel="Keep request"
								onConfirm={() => void loop.takeBackIntroduction()}
								disabled={loop.isBusy}
							/>
						</>
					) : (
						<FormButton
							label="File an introduction"
							onPress={() => void loop.fileAnIntroduction()}
							disabled={loop.isBusy}
						/>
					)}
				</FormSection>
			) : null}

			{loop.paidLink ? (
				<FormSection footer="Opens an external link.">
					<FormLink
						label={loop.paidLink.label}
						destination={loop.paidLink.destination}
					/>
				</FormSection>
			) : null}
		</FormScreen>
	);
}
