import { memberProcedure, router } from "../index";

export const menuRouter = router({
	current: memberProcedure.query(async () => {
		return { menu: null };
	}),
});
