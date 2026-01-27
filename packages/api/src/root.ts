import { authRouter } from "./router/auth";
import { conversationRouter } from "./router/conversation";
import { driversRouteRouter } from "./router/drivers-route";
import { placesRouter } from "./router/places";
import { reviewRouter } from "./router/review";
import { searchRouter } from "./router/search";
import { statsRouter } from "./router/stats";
import { tripRouter } from "./router/trip";
import { userRouter } from "./router/user";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  conversation: conversationRouter,
  places: placesRouter,
  review: reviewRouter,
  stats: statsRouter,
  user: userRouter,
  trip: tripRouter,
  search: searchRouter,
  driversRoute: driversRouteRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
