import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <CartDrawer />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
