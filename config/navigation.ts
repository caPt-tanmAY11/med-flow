import {
    LayoutDashboard,
    UserPlus,
    Users,
    Stethoscope,
    Heart,
    FlaskConical,
    Pill,
    Package,
    Bed,
    Receipt,
    Shield,
    Syringe,
    AlertTriangle,
    Activity,
    Ambulance,
    FileText,
    BarChart3,
    LucideIcon,
    Wallet,
    CalendarDays
} from 'lucide-react';
import { UserRole } from '@/context/AuthContext';

export interface NavItem {
    title: string;
    href: string;
    icon: LucideIcon;
    roles: UserRole[];
    badge?: string;
    badgeType?: 'critical' | 'warning' | 'info';
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export const navigationConfig: NavGroup[] = [
    {
        title: 'Patient Portal',
        items: [
            {
                title: 'My Health',
                href: '/patient/dashboard',
                icon: Heart,
                roles: ['PATIENT'],
            },
            {
                title: 'Medical History',
                href: '/patient/history',
                icon: FileText,
                roles: ['PATIENT'],
            },
            {
                title: 'OPD Status',
                href: '/patient/opd',
                icon: Users,
                roles: ['PATIENT'],
            },
            {
                title: 'My Admission',
                href: '/patient/ipd',
                icon: Bed,
                roles: ['PATIENT'],
            },
            {
                title: 'EMR Record',
                href: '/patient/emr',
                icon: Activity,
                roles: ['PATIENT'],
            },
            {
                title: 'My Insurance',
                href: '/patient/insurance',
                icon: Shield,
                roles: ['PATIENT', 'ADMIN'],
            },
        ]
    },
    {
        title: 'Overview',
        items: [
            {
                title: 'Dashboard',
                href: '/dashboard',
                icon: LayoutDashboard,
                roles: ['ADMIN', 'DOCTOR', 'NURSE', 'FRONT_DESK', 'LAB_PERSON', 'PHARMACIST', 'BILLING', 'MANAGEMENT', 'NURSING_ADMIN'],
            },
        ],
    },
    {
        title: 'Smart Access and Patient Logistics',
        items: [
            {
                title: 'SmartPanjikaran',
                href: '/registration',
                icon: UserPlus,
                roles: ['ADMIN', 'FRONT_DESK', 'NURSE', 'NURSING_ADMIN'],
            },
            {
                title: 'Patient Admission',
                href: '/registration/ipd',
                icon: Bed,
                roles: ['ADMIN', 'FRONT_DESK', 'NURSE', 'NURSING_ADMIN'],
            },

            {
                title: 'Patient List',
                href: '/patients',
                icon: Users,
                roles: ['ADMIN', 'NURSE', 'FRONT_DESK', 'LAB_PERSON', 'PHARMACIST', 'BILLING', 'NURSING_ADMIN'],
            },

        ],
    },
    {
        title: 'ClinicFlow',
        items: [
            {
                title: 'OPD Dashboard',
                href: '/doctor/opd',
                icon: Stethoscope,
                roles: ['ADMIN', 'DOCTOR'],
            },
            {
                title: 'IPD Rounds',
                href: '/doctor/ipd',
                icon: Bed,
                roles: ['ADMIN', 'DOCTOR'],
            },
            {
                title: 'My Schedule',
                href: '/doctor',
                icon: CalendarDays,
                roles: ['ADMIN', 'DOCTOR'],
            },
            {
                title: 'Nurse Station',
                href: '/nurse',
                icon: Heart,
                roles: ['ADMIN', 'NURSE', 'NURSING_ADMIN'],
            },
            {
                title: 'Emergency',
                href: '/emergency',
                icon: Ambulance,
                roles: ['ADMIN', 'NURSE', 'FRONT_DESK', 'NURSING_ADMIN'],
                badge: '!',
                badgeType: 'critical',
            },
        ],
    },
    {
        title: 'LabLink',
        items: [

            {
                title: 'Lab Patient Portal',
                href: '/lab-patient',
                icon: FlaskConical,
                roles: ['ADMIN', 'PATIENT', 'FRONT_DESK'],
            },
            {
                title: 'Lab Technician',
                href: '/lab-technician',
                icon: FlaskConical,
                roles: ['ADMIN', 'LAB_PERSON'],
            },
        ],
    },
    {
        title: 'Dawakhana',
        items: [
            {
                title: 'Pharmacy',
                href: '/pharmacy',
                icon: Pill,
                roles: ['ADMIN', 'DOCTOR', 'PHARMACIST'],
            },
            {
                title: 'Inventory',
                href: '/inventory',
                icon: Package,
                roles: ['ADMIN', 'PHARMACIST', 'MANAGEMENT'],
            },
        ],
    },
    {
        title: 'Operations',
        items: [
            {
                title: 'BedBandobast',
                href: '/beds',
                icon: Bed,
                roles: ['ADMIN', 'DOCTOR', 'NURSE', 'FRONT_DESK', 'NURSING_ADMIN'],
            },
            {
                title: 'Operation Theatre',
                href: '/ot',
                icon: Syringe,
                roles: ['ADMIN', 'DOCTOR', 'NURSE', 'NURSING_ADMIN'],
            },
        ],
    },
    {
        title: 'Finance',
        items: [
            {
                title: 'My Bills',
                href: '/paisatracker-patient',
                icon: Wallet,
                roles: ['PATIENT', 'ADMIN'],
            },
            {
                title: 'PaisaTracker',
                href: '/billing',
                icon: Receipt,
                roles: ['ADMIN', 'BILLING', 'FRONT_DESK'],
            },
            {
                title: 'Dept Income',
                href: '/finance',
                icon: BarChart3,
                roles: ['ADMIN', 'BILLING', 'MANAGEMENT'],
            },
            {
                title: 'ClaimSahayak',
                href: '/insurance',
                icon: Shield,
                roles: ['ADMIN', 'BILLING'],
            },
            {
                title: 'Claims Processing',
                href: '/hospital/claims',
                icon: FileText,
                roles: ['ADMIN', 'BILLING', 'MANAGEMENT'],
            },
        ],
    },
    {
        title: 'Quality & Safety',
        items: [
            {
                title: 'Safety Dashboard',
                href: '/safety',
                icon: AlertTriangle,
                roles: ['ADMIN', 'DOCTOR', 'NURSE', 'MANAGEMENT', 'NURSING_ADMIN'],
            },
            {
                title: 'Resource Utilization',
                href: '/resources',
                icon: Activity,
                roles: ['ADMIN', 'MANAGEMENT'],
            },
        ],
    },
    {
        title: 'Administration',
        items: [
            {
                title: 'Audit Logs',
                href: '/audit',
                icon: FileText,
                roles: ['ADMIN', 'MANAGEMENT'],
            },
            {
                title: 'Nursing Admin',
                href: '/admin/nursing',
                icon: Heart,
                roles: ['ADMIN', 'NURSING_ADMIN'],
            },
            {
                title: 'Management Dashboard',
                href: '/management',
                icon: BarChart3,
                roles: ['ADMIN', 'MANAGEMENT'],
            },
            {
                title: 'TPA Dashboard',
                href: '/tpa/dashboard',
                icon: Shield,
                roles: ['TPA', 'ADMIN'],
            },
        ],
    },
];

export const getNavigationForRole = (role: UserRole): NavGroup[] => {
    return navigationConfig
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => item.roles.includes(role)),
        }))
        .filter((group) => group.items.length > 0);
};
