import { AuthVisual } from "@/components/auth/auth-visual";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen flex-1 lg:grid-cols-2">
      <AuthVisual />
      {children}
    </div>
  );
}
