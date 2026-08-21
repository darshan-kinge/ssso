import { LandingPage } from "@/components/landing/LandingPage";
import { getPublicConfig } from "@/lib/config";

export default function LandingRoute() {
  const config = getPublicConfig();
  return <LandingPage config={config} />;
}
