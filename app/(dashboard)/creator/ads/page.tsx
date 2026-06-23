import { redirect } from "next/navigation";

// A kampányok a publikus feedben élnek.
export default function CreatorAdsRedirect() {
  redirect("/ads");
}
