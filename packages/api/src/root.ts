import { authRouter } from "./router/auth";
import { placesRouter } from "./router/places";
import { postRouter } from "./router/post";
import { rideRouter } from "./router/ride";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  places: placesRouter,
  post: postRouter,
  ride: rideRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
