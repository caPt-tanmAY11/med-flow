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
    LucideIcon
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
        title: 'Overview',
        items: [
            {
                title: 'Dashboard',
                href: '/dashboard',
                icon: LayoutDashboard,
                roles: ['admin', 'doctor', 'nurse', 'front_desk', 'lab_technician', 'pharmacist', 'billing', 'management'],
            },
        ],
    },
    {
        title: 'Patient Management',
        items: [
            {
                title: 'Patient Registration',
                href: '/registration',
                icon: UserPlus,
                roles: ['admin', 'front_desk', 'nurse'],
            },
            {
                title: 'Patient List',
                href: '/patients',
                icon: Users,
                roles: ['admin', 'doctor', 'nurse', 'front_desk', 'lab_technician', 'pharmacist', 'billing'],
            },
            {
                title: 'OPD Queue',
                href: '/opd',
                icon: Users,
                roles: ['admin', 'doctor', 'nurse', 'front_desk'],
            },
        ],
    },
    {
        title: 'Clinical',
        items: [
            {
                title: 'Doctor Workstation',
                href: '/doctor',
                icon: Stethoscope,
                roles: ['admin', 'doctor'],
            },
            {
                title: 'Nurse Station',
                href: '/nurse',
                icon: Heart,
                roles: ['admin', 'nurse'],
            },
            {
                title: 'Emergency',
                href: '/emergency',
                icon: Ambulance,
                roles: ['admin', 'doctor', 'nurse', 'front_desk'],
                badge: '!',
                badgeType: 'critical',
            },
        ],
    },
    {
        title: 'Diagnostics',
        items: [
            {
                title: 'Lab & Radiology',
                href: '/lab',
                icon: FlaskConical,
                roles: ['admin', 'doctor', 'nurse', 'lab_technician'],
            },
        ],
    },
    {
        title: 'Pharmacy & Inventory',
        items: [
            {
                title: 'Pharmacy',
                href: '/pharmacy',
                icon: Pill,
                roles: ['admin', 'doctor', 'pharmacist'],
            },
            {
                title: 'Inventory',
                href: '/inventory',
                icon: Package,
                roles: ['admin', 'pharmacist', 'management'],
            },
        ],
    },
    {
        title: 'Operations',
        items: [
            {
                title: 'Bed Management',
                href: '/beds',
                icon: Bed,
                roles: ['admin', 'doctor', 'nurse', 'front_desk'],
            },
            {
                title: 'Operation Theatre',
                href: '/ot',
                icon: Syringe,
                roles: ['admin', 'doctor', 'nurse'],
            },
        ],
    },
    {
        title: 'Finance',
        items: [
            {
                title: 'Billing',
                href: '/billing',
                icon: Receipt,
                roles: ['admin', 'billing', 'front_desk'],
            },
            {
                title: 'Insurance & Claims',
                href: '/insurance',
                icon: Shield,
                roles: ['admin', 'billing'],
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
                roles: ['admin', 'doctor', 'nurse', 'management'],
            },
            {
                title: 'Resource Utilization',
                href: '/resources',
                icon: Activity,
                roles: ['admin', 'management'],
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
                roles: ['admin', 'management'],
            },
            {
                title: 'Nursing Admin',
                href: '/admin/nursing',
                icon: Heart,
                roles: ['admin'],
            },
            {
                title: 'Management Dashboard',
                href: '/management',
                icon: BarChart3,
                roles: ['admin', 'management'],
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
