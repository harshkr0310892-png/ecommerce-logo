import { Layout } from "@/components/layout/Layout";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="font-display text-3xl font-bold">Privacy Policy</h1>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          We respect your privacy. This page explains what information we collect, how we use it,
          and the choices you have. If you have questions, reach us via the contact details on your invoice.
        </p>

        <div className="space-y-4 max-w-3xl">
          <section className="bg-card border border-border/50 rounded-xl p-5 space-y-2">
            <h2 className="font-display text-xl font-semibold">Information we collect</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Contact details you provide at checkout (name, phone, email, address).</li>
              <li>Order details (items purchased, totals, coupon usage).</li>
              <li>Basic analytics and device data used to keep the site secure and improve performance.</li>
            </ul>
          </section>

          <section className="bg-card border border-border/50 rounded-xl p-5 space-y-2">
            <h2 className="font-display text-xl font-semibold">How we use your data</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Process and deliver your orders.</li>
              <li>Send order updates and support responses.</li>
              <li>Improve our store experience and prevent fraud.</li>
            </ul>
          </section>

          <section className="bg-card border border-border/50 rounded-xl p-5 space-y-2">
            <h2 className="font-display text-xl font-semibold">Sharing</h2>
            <p className="text-muted-foreground">
              We do not sell your data. We only share with providers needed to operate the store
              (e.g., payment, hosting) under strict confidentiality.
            </p>
          </section>

          <section className="bg-card border border-border/50 rounded-xl p-5 space-y-2">
            <h2 className="font-display text-xl font-semibold">Your choices</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Update or delete your info by contacting support.</li>
              <li>Opt out of marketing where applicable.</li>
              <li>Request details of the data we hold about you.</li>
            </ul>
          </section>
           <section className="bg-card border border-border/50 rounded-xl p-5 space-y-2">
            <h2 className="font-display text-xl font-semibold">payment method</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>we use razorpay as payment method for secure payment</li>
              <li>we did not use any kind of untrusted cookies</li>
              <li>we also do not hold or store any kind of your banking data or credit data because we use razorpay as a trusted payment gateway</li>
              <li>we do not leak any of our user order details</li>
            </ul>
          </section>
        </div>
      </div>
    </Layout>
  );
}

