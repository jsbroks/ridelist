import { env } from "~/env";
import { PostRideForm } from "./post-ride-form";

export default function PostRidePage() {
  const googleMapsApiKey = env.GOOGLE_MAPS_API_KEY;

  return <PostRideForm googleMapsApiKey={googleMapsApiKey} />;
}
