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
  CalendarCheck,
  HeartPulse
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white selection:bg-teal-100 selection:text-teal-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">MedFlow</div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-teal-600 dark:text-teal-400">Health System</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500 dark:text-slate-400">
            <button className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Services</button>
            <button className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Doctors</button>
            <button className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">About Us</button>
            <button className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Contact</button>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/auth')}
              className="rounded-full px-6 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-lg shadow-slate-900/20 transition-all hover:scale-105 active:scale-95"
            >
              Sign in
            </Button>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 relative">
        {/* Ambient Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[100px]" />
        </div>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 mb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                Accepting new patients
              </div>

              <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-slate-900 dark:text-white">
                Modern Healthcare <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
                  Reimagined
                </span>
              </h1>

              <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                Experience the next generation of healthcare management. Streamlined workflows, patient-centric care, and advanced clinical analytics.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Button
                  onClick={() => router.push('/auth')}
                  className="h-14 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-lg shadow-xl shadow-blue-600/20 hover:shadow-blue-600/30 transition-all w-full sm:w-auto"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  className="h-14 px-8 rounded-full border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-transparent text-lg text-slate-600 dark:text-slate-300 w-full sm:w-auto"
                >
                  <Phone className="mr-2 w-5 h-5" />
                  Emergency: 911
                </Button>
              </div>

              <div className="pt-8 grid grid-cols-3 gap-8 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">15+</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Years Experience</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">24/7</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Emergency Care</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">50k+</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Happy Patients</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-teal-500 rounded-[2.5rem] opacity-20 blur-3xl dark:opacity-10"></div>
              <div className="relative rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800">
                
                {/* Abstract UI Mockup */}
                <div className="bg-slate-50 dark:bg-slate-950 p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-blue-600">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Dr. Sarah Wilson</div>
                      <div className="text-sm text-blue-600 font-medium">Cardiology Head</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                    Available Now
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">Today's Schedule</div>
                    
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 group cursor-pointer">
                      <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 dark:text-white">Routine Checkup</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">10:00 AM - 10:30 AM</div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 group cursor-pointer">
                      <div className="w-12 h-12 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 dark:text-white">Cardiac Surgery</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">11:30 AM - 02:00 PM</div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors cursor-pointer group">
                      <Users className="w-8 h-8 mx-auto text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mb-2" />
                      <div className="font-semibold text-slate-900 dark:text-white">Patients</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors cursor-pointer group">
                      <CalendarCheck className="w-8 h-8 mx-auto text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mb-2" />
                      <div className="font-semibold text-slate-900 dark:text-white">Calendar</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto px-6 py-20 bg-slate-50 dark:bg-slate-900 rounded-[3rem] relative overflow-hidden">
           {/* Decorative background for features */}
           <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px]" />
           <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-teal-500/5 rounded-full blur-[80px]" />

          <div className="relative z-10 text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Comprehensive Care Ecosystem</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">Everything you need to manage your hospital operations efficiently and effectively in one unified platform.</p>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
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
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-slate-950 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
