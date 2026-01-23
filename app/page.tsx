"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-white/90 border border-neutral-200 flex items-center justify-center shadow-soft">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
              <path d="M3 12h18M12 3v18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="text-lg font-semibold">Medflow.</div>
            <div className="text-xs text-muted-foreground">
              Hospital Information System
            </div>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-neutral-700">
          <button className="px-3 py-1 rounded-full hover:bg-neutral-100">
            Home
          </button>
          <button className="px-3 py-1 rounded-full hover:bg-neutral-100">
            Services
          </button>
          <button className="px-3 py-1 rounded-full hover:bg-neutral-100">
            Doctors
          </button>
          <button className="px-3 py-1 rounded-full hover:bg-neutral-100">
            Contact
          </button>

          <button
            onClick={() => router.push('/auth/signin')}
            className="rounded-full px-4 py-2 bg-primary text-white"
          >
            Staff Login
          </button>
        </nav>

        {/* Mobile login button */}
        <button
          onClick={() => router.push('/auth/signin')}
          className="md:hidden rounded-full px-4 py-2 bg-primary text-white"
        >
          Staff Login
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-20">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="text-sm font-medium tracking-wide text-primary">WELCOME TO MEDFLOW</div>
            <h1 className="text-4xl md:text-5xl font-serif leading-tight">
              Stay Safe, <span className="text-primary">Stay Healthy</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Comprehensive hospital services with real-time management and compassionate care. Book consultations, access records and keep track of treatments — all in one reliable system.
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/contact')}
                className="inline-flex items-center gap-2 rounded-full bg-primary text-white px-6 py-3 shadow-lift"
              >
                Get in touch
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button
                onClick={() => router.push('/services')}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-5 py-3 text-sm text-neutral-800 bg-white/80"
              >
                Learn More
              </button>
            </div>

            <div className="mt-6 grid grid-cols-4 gap-4">
              <div className="rounded-xl bg-white border border-neutral-200 shadow-soft p-4 text-center">
                <div className="text-2xl font-bold text-primary">140+</div>
                <div className="text-xs text-muted-foreground mt-1">Doctors At Work</div>
              </div>
              <div className="rounded-xl bg-white border border-neutral-200 shadow-soft p-4 text-center">
                <div className="text-2xl font-bold text-primary">1040+</div>
                <div className="text-xs text-muted-foreground mt-1">Satisfied Patients</div>
              </div>
              <div className="rounded-xl bg-white border border-neutral-200 shadow-soft p-4 text-center">
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-xs text-muted-foreground mt-1">Bed Facility</div>
              </div>
              <div className="rounded-xl bg-white border border-neutral-200 shadow-soft p-4 text-center">
                <div className="text-2xl font-bold text-primary">80+</div>
                <div className="text-xs text-muted-foreground mt-1">Available Hospitals</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <figure className="relative w-full max-w-lg">
              <div className="rounded-3xl bg-white/75 backdrop-blur border border-neutral-200 shadow-panel p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-primary">
                        <path d="M12 2a4 4 0 0 1 4 4v1h-8V6a4 4 0 0 1 4-4zM6 20v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold">Dr. A. Sharma</div>
                      <div className="text-xs text-neutral-500">Cardiology • Available</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">Next: 10:30 AM</div>
                </div>

                <div className="mt-6 grid gap-4">
                  <div className="rounded-xl bg-white border border-neutral-100 p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">Free Checkups</div>
                      <div className="text-xs text-muted-foreground">Basic health screening</div>
                    </div>
                    <div className="text-sm text-primary">Learn</div>
                  </div>

                  <div className="rounded-xl bg-white border border-neutral-100 p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">24/7 Ambulance</div>
                      <div className="text-xs text-muted-foreground">Emergency transport</div>
                    </div>
                    <div className="text-sm text-primary">Learn</div>
                  </div>

                  <div className="rounded-xl bg-white border border-neutral-100 p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">Expert Doctors</div>
                      <div className="text-xs text-muted-foreground">Specialised care</div>
                    </div>
                    <div className="text-sm text-primary">Learn</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-primary">
                  <path d="M12 2v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
            </figure>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold">Our Services</h2>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white border border-neutral-200 shadow-soft p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">📋</div>
                <div>
                  <div className="font-medium">Free Checkups</div>
                  <div className="text-xs text-muted-foreground mt-1">Routine screenings and consultations</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-neutral-200 shadow-soft p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">🚑</div>
                <div>
                  <div className="font-medium">24/7 Ambulance</div>
                  <div className="text-xs text-muted-foreground mt-1">Emergency transport and support</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-neutral-200 shadow-soft p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">👨‍⚕️</div>
                <div>
                  <div className="font-medium">Expert Doctors</div>
                  <div className="text-xs text-muted-foreground mt-1">Specialised medical professionals</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 mb-20">
          <h3 className="text-lg font-semibold">Meet Our Doctors</h3>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg bg-white border border-neutral-200 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">AS</div>
              <div>
                <div className="font-medium">Dr. A. Sharma</div>
                <div className="text-xs text-muted-foreground">Cardiologist</div>
              </div>
            </div>

            <div className="rounded-lg bg-white border border-neutral-200 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">RK</div>
              <div>
                <div className="font-medium">Dr. R. Kapoor</div>
                <div className="text-xs text-muted-foreground">Orthopedist</div>
              </div>
            </div>

            <div className="rounded-lg bg-white border border-neutral-200 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">SS</div>
              <div>
                <div className="font-medium">Dr. S. Singh</div>
                <div className="text-xs text-muted-foreground">Pediatrics</div>
              </div>
            </div>

            <div className="rounded-lg bg-white border border-neutral-200 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">KP</div>
              <div>
                <div className="font-medium">Dr. K. Patel</div>
                <div className="text-xs text-muted-foreground">General</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
