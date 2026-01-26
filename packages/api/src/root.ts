import { authRouter } from "./router/auth";
import { conversationRouter } from "./router/conversation";
import { placesRouter } from "./router/places";
import { reviewRouter } from "./router/review";
import { rideRouter } from "./router/ride";
import { rideRequestRouter } from "./router/ride-request";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  conversation: conversationRouter,
  places: placesRouter,
  review: reviewRouter,
  ride: rideRouter,
  rideRequest: rideRequestRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
