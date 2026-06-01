import { redirect } from "next/navigation";

// A hirdetések a publikus feedben élnek.
export default function CreatorAdsRedirect() {
  redirect("/ads");
}
