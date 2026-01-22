import { authRouter } from "./router/auth";
import { placesRouter } from "./router/places";
import { postRouter } from "./router/post";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  places: placesRouter,
  post: postRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
