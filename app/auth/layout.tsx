import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Bytes 2 Knowledge",
  description: "Login to your B2K account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
