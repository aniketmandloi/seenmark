import { bands } from "@seenmark/api/bands";
import { formatDate } from "@seenmark/api/check-in-dates";
import { router } from "expo-router";

import {
	FormButton,
	FormConfirmButton,
	FormEmptyState,
	FormErrorState,
	FormLink,
	FormReveal,
	FormRow,
	FormScreen,
	FormSection,
	FormSkeleton,
	FormStep,
	FormText,
} from "@/components/form/form";
import { useMemberActions, useNextSteps } from "@/lib/use-member-loop";

// Check-ins pushes this screen, but a link can open it with nothing underneath.
function backToCheckIns() {
	if (router.canGoBack()) router.back();
	else router.replace("/");
}

export default function NextStepsScreen() {
	const steps = useNextSteps();
	const actions = useMemberActions();
	const menu = steps.menu;
	const bandLabel = bands.find((band) => band.value === menu?.band)?.label;

	if (steps.isLoading) {
		return (
			<FormScreen>
				<FormSection>
					<FormSkeleton shape="steps" label="Loading your next steps" />
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
				<FormErrorState
					message="Your next steps could not load."
					footer="Nothing was changed. Pull down or try again."
					retrying={steps.isRefreshing}
					onRetry={() => void steps.refresh()}
				/>
			) : menu ? (
				<FormSection title={bandLabel ? `${bandLabel} band` : undefined}>
					<FormText muted>
						A short menu to read at your pace. These are not a treatment plan.
					</FormText>
					{menu.steps.map((step, index) => (
						<FormReveal key={step} index={index}>
							<FormStep
								number={index + 1}
								total={menu.steps.length}
								text={step}
							/>
						</FormReveal>
					))}
					<FormButton label="Change band" onPress={backToCheckIns} />
				</FormSection>
			) : (
				<>
					<FormEmptyState
						icon="steps"
						title="No band chosen yet"
						description="Choose the band that feels right on your check-ins, and the next steps for it appear here."
					/>
					<FormButton
						label="Go to your check-ins"
						onPress={backToCheckIns}
						prominent
					/>
				</>
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
							<FormReveal>
								<FormRow
									icon="done"
									title="Request saved"
									value={formatDate(steps.introduction.filedAt)}
								/>
							</FormReveal>
							<FormConfirmButton
								label={
									actions.isDeletingIntroduction
										? "Deleting…"
										: "Delete request"
								}
								icon="delete"
								title="Delete your introduction request?"
								message="This request will be removed from your record. Nothing has been sent."
								confirmLabel="Delete request"
								cancelLabel="Keep request"
								onConfirm={() => void actions.takeBackIntroduction()}
								disabled={actions.isBusy}
								pending={actions.isDeletingIntroduction}
							/>
						</>
					) : (
						<FormButton
							label={actions.isFiling ? "Filing…" : "File an introduction"}
							onPress={() => void actions.fileAnIntroduction()}
							disabled={actions.isBusy}
							pending={actions.isFiling}
						/>
					)}
				</FormSection>
			) : null}

			{/* ADR 0006: the paid link never moves to draw the eye, so it gets no FormReveal. */}
			{steps.paidLink ? (
				<FormSection footer="Seenmark may be paid if you use this link. Who pays never changes your band or these steps.">
					<FormLink
						label={steps.paidLink.label}
						destination={steps.paidLink.destination}
					/>
				</FormSection>
			) : null}
		</FormScreen>
	);
}
