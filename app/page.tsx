"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Stethoscope, 
  Activity, 
  ShieldCheck, 
  Clock, 
  Users, 
  ArrowRight,
  Phone,
  CalendarCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-teal-100 selection:text-teal-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-neutral-900">MedFlow</div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-teal-600">Health System</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-500">
            <button className="hover:text-teal-600 transition-colors">Services</button>
            <button className="hover:text-teal-600 transition-colors">Doctors</button>
            <button className="hover:text-teal-600 transition-colors">About Us</button>
            <button className="hover:text-teal-600 transition-colors">Contact</button>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/auth')}
              className="rounded-full px-6 bg-neutral-900 hover:bg-neutral-800 text-white shadow-lg shadow-neutral-900/20 transition-all hover:scale-105 active:scale-95"
            >
              Sign in
            </Button>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 mb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                Accepting new patients
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-neutral-900">
                Modern Healthcare <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">
                  Reimagined
                </span>
              </h1>
              
              <p className="text-xl text-neutral-500 leading-relaxed max-w-lg">
                Experience the next generation of healthcare management. Streamlined workflows, patient-centric care, and advanced clinical analytics.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Button 
                  onClick={() => router.push('/auth')}
                  className="h-14 px-8 rounded-full bg-teal-600 hover:bg-teal-700 text-lg shadow-xl shadow-teal-600/20 hover:shadow-teal-600/30 transition-all w-full sm:w-auto"
                >
                  Patient Login
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  variant="outline"
                  className="h-14 px-8 rounded-full border-2 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-lg text-neutral-600 w-full sm:w-auto"
                >
                  <Phone className="mr-2 w-5 h-5" />
                  Emergency: 911
                </Button>
              </div>

              <div className="pt-8 grid grid-cols-3 gap-8 border-t border-neutral-100">
                <div>
                  <div className="text-3xl font-bold text-neutral-900">15+</div>
                  <div className="text-sm text-neutral-500 font-medium mt-1">Years Experience</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-neutral-900">24/7</div>
                  <div className="text-sm text-neutral-500 font-medium mt-1">Emergency Care</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-neutral-900">50k+</div>
                  <div className="text-sm text-neutral-500 font-medium mt-1">Happy Patients</div>
                </div>
              </div>
            </div>

            <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
              <div className="absolute -inset-4 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-[2.5rem] opacity-20 blur-2xl dark:opacity-10"></div>
              <div className="relative rounded-[2rem] overflow-hidden bg-white shadow-2xl border border-neutral-100">
                {/* Abstract UI Mockup */}
                <div className="bg-neutral-50 p-6 border-b border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-teal-600">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900">Dr. Sarah Wilson</div>
                      <div className="text-sm text-teal-600 font-medium">Cardiology Head</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    Available Now
                  </div>
                </div>
                
                 <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Today's Schedule</div>
                        <div className="bg-white rounded-xl border border-neutral-100 p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 group cursor-pointer">
                            <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-neutral-900">Routine Checkup</div>
                                <div className="text-sm text-neutral-500">10:00 AM - 10:30 AM</div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>

                         <div className="bg-white rounded-xl border border-neutral-100 p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 group cursor-pointer">
                            <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-neutral-900">Cardiac Surgery</div>
                                <div className="text-sm text-neutral-500">11:30 AM - 02:00 PM</div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="bg-neutral-50 rounded-xl p-4 text-center hover:bg-teal-50 transition-colors cursor-pointer group">
                             <Users className="w-8 h-8 mx-auto text-neutral-400 group-hover:text-teal-600 transition-colors mb-2" />
                             <div className="font-semibold text-neutral-900">Patients</div>
                        </div>
                        <div className="bg-neutral-50 rounded-xl p-4 text-center hover:bg-teal-50 transition-colors cursor-pointer group">
                             <CalendarCheck className="w-8 h-8 mx-auto text-neutral-400 group-hover:text-teal-600 transition-colors mb-2" />
                             <div className="font-semibold text-neutral-900">Calendar</div>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto px-6 py-20 bg-neutral-50 rounded-[3rem]">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">Comprehensive Care Ecosystem</h2>
                <p className="text-neutral-500 text-lg">Everything you need to manage your hospital operations efficiently and effectively in one unified platform.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    {
                        icon: ShieldCheck,
                        title: "Secure Records",
                        desc: "Enterprise-grade security for all patient data and medical records."
                    },
                    {
                        icon: Activity,
                        title: "Real-time Monitoring",
                        desc: "Live tracking of patient vitals and critical hospital resources."
                    },
                    {
                        icon: Users,
                        title: "Staff Management",
                        desc: "Efficient scheduling and role-based access for all hospital staff."
                    }
                ].map((feature, i) => (
                    <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="w-14 h-14 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 mb-6">
                            <feature.icon className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-neutral-900 mb-3">{feature.title}</h3>
                        <p className="text-neutral-500 leading-relaxed">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </section>

      </main>
    </div>
  );
}
