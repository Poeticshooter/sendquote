export const metadata = {
  title: {
    default: "SendQuote vs Competitors | Honest Comparison",
    template: "%s | SendQuote Comparison",
  },
  description:
    "See how SendQuote compares to other quoting software. Honest, detailed comparisons with PandaDoc, Proposify, Qwilr, and Better Proposals.",
};

export default function ComparisonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
