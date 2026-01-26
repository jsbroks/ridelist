import { authRouter } from "./router/auth";
import { conversationRouter } from "./router/conversation";
import { placesRouter } from "./router/places";
import { reviewRouter } from "./router/review";
import { rideRouter } from "./router/ride";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  conversation: conversationRouter,
  places: placesRouter,
  review: reviewRouter,
  ride: rideRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
