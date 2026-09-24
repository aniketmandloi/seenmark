import {
	FormButton,
	FormConfirmButton,
	FormEmptyState,
	FormLink,
	FormProgress,
	FormRow,
	FormScreen,
	FormSection,
	FormText,
} from "@/components/form/form";
import {
	BANDS,
	formatCheckInDate,
	useMemberActions,
	useNextSteps,
} from "@/lib/use-member-loop";

export default function NextStepsScreen() {
	const steps = useNextSteps();
	const actions = useMemberActions();
	const menu = steps.menu;
	const bandLabel = BANDS.find((band) => band.value === menu?.band)?.label;

	if (steps.isLoading) {
		return (
			<FormScreen>
				<FormSection>
					<FormProgress label="Loading your next steps…" />
				</FormSection>
			</FormScreen>
		);
	}

	// Filing needs the late band; a request already saved stays reachable on any band.
	const showsIntroduction = menu?.band === "late" || steps.introduction;

	return (
		<FormScreen onRefresh={steps.refresh}>
			{actions.error ? (
				<FormSection>
					<FormRow icon="error" title={actions.error} tone="destructive" />
				</FormSection>
			) : null}

			{steps.loadFailed ? (
				<FormSection footer="Nothing was changed. Pull down or try again.">
					<FormRow
						icon="error"
						title="Your next steps could not load."
						tone="destructive"
					/>
					<FormButton label="Try again" onPress={() => void steps.refresh()} />
				</FormSection>
			) : menu ? (
				<FormSection title={bandLabel ? `${bandLabel} band` : undefined}>
					{menu.steps.map((step, index) => (
						<FormText key={step}>{`${index + 1}. ${step}`}</FormText>
					))}
				</FormSection>
			) : (
				<FormEmptyState
					icon="steps"
					title="Your menu waits for a band."
					description="Choose the band that feels right on your check-ins, and the next steps for it appear here."
				/>
			)}

			{showsIntroduction ? (
				<FormSection
					title="Introduction"
					footer={
						steps.introduction
							? menu?.band === "late"
								? "Your request is saved here. Nothing has been sent."
								: "You asked on the late band. Your request is still saved here, and nothing has been sent."
							: "If you want, you can request an introduction. It will not book anything or send until you choose to continue."
					}
				>
					{steps.introduction ? (
						<>
							<FormRow
								icon="done"
								title="Request saved"
								value={formatCheckInDate(steps.introduction.filedAt)}
							/>
							<FormConfirmButton
								label="Delete request"
								icon="delete"
								title="Delete your introduction request?"
								message="This request will be removed from your record. Nothing has been sent."
								confirmLabel="Delete request"
								cancelLabel="Keep request"
								onConfirm={() => void actions.takeBackIntroduction()}
								disabled={actions.isBusy}
							/>
						</>
					) : (
						<FormButton
							label="File an introduction"
							onPress={() => void actions.fileAnIntroduction()}
							disabled={actions.isBusy}
						/>
					)}
				</FormSection>
			) : null}

			{steps.paidLink ? (
				<FormSection footer="Opens an external link.">
					<FormLink
						label={steps.paidLink.label}
						destination={steps.paidLink.destination}
					/>
				</FormSection>
			) : null}
		</FormScreen>
	);
}
