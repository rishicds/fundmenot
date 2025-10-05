
'use client';

import Lottie from "lottie-react";
import animationData from "@/lib/lottie/landing-animation.json";

export default function LandingAnimation() {
  return <Lottie animationData={animationData} loop={true} />;
};
