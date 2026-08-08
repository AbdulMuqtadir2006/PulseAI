import { HeartPulse, ScanLine, MessageCircleHeart, PhoneCall } from "lucide-react";

export const features = [
  {
    id: "monitoring",
    icon: HeartPulse,
    name: "Continuous Monitoring",
    copy: "Heart rate, HRV, SpO2, and blood pressure watched constantly, not just at a checkup.",
  },
  {
    id: "scoring",
    icon: ScanLine,
    name: "Explainable Risk Scoring",
    copy: "Every score is a transparent, reference-range comparison — never a black box.",
  },
  {
    id: "guidance",
    icon: MessageCircleHeart,
    name: "Plain-Language Guidance",
    copy: "An AI narrative explains what's happening and what to do next, in plain language.",
  },
  {
    id: "escalation",
    icon: PhoneCall,
    name: "Emergency Escalation",
    copy: "A critical reading automatically notifies the emergency contact you've set up.",
  },
];
