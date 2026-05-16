// ═══════════════════════════════════════════════════════════════════════════
// LUMIX SOLUTIONS — Site Configuration
// ═══════════════════════════════════════════════════════════════════════════

// Announcement Banner Configuration
// Set enabled to false to hide the banner
export const announcementBanner = {
    enabled: true,
    announcements: [
        {
            id: "1", 
            text: "Limited FiveM servers stock available - intentionally capped to maintain performance and reliability.",
            link: "/services"
        },
        {
            id: "2",
            text: "Dallas and Miami datacenters are now live - choose your region for lower latency.",
            link: "/services"
        },
        {
            id: "3",
            text: "Expanded bot hosting capacity - more space, better isolation, smoother deployments."
        },
        {
            id: "4",
            text: "Production and development are better than ever - faster builds, cleaner systems, and improved stability."
        },
        {
            id: "5",
            text: "Join our Discord for updates, support, and collaboration.",
            link: "https://discord.com/invite/uaNYBJQtvn"
        }
    ],
};


export const siteConfig = {
    name: "Lumix Solutions LLC",
    domain: "lumixsolutions.org",
    description: "Infrastructure built by engineers. Node.js servers, game services, voice infrastructure, and enterprise DDoS protection.",
    logo: "/images/logo.png",
    links: {
        billing: "https://billing.lumixsolutions.org",
        panel: "https://panel.lumixsolutions.org",
        status: "/status",
        github: "https://github.com/lumixsolutions",
        discord: "https://discord.com/invite/uaNYBJQtvn",
    },
    contact: {
        email: "contact@lumixsolutions.org",
        support: "support@lumixsolutions.org",
        partners: "partners@lumixsolutions.org",
        career: "career@lumixsolutions.org",
    },
};

export const navigation = [
    { name: "Services", href: "/services" },
    { name: "Partners", href: "/partners" },
    { name: "Staff", href: "/staff" },
    { name: "Careers", href: "/career" },
    { name: "Status", href: "/status" },
    { name: "Contact", href: "/contact" },
];

export const services = [
    /*{
        id: "ddos-protection",
        name: "DDoS Protection",
        shortName: "DDOS_SHIELD",
        description: "Enterprise-grade Layer 3/4/7 mitigation with 10Tbps+ global scrubbing capacity. Always-on protection with sub-second detection.",
        features: [
            "10Tbps+ mitigation capacity",
            "Layer 3/4/7 protection",
            "Sub-second attack detection",
            "Global anycast network",
            "Zero false positives",
        ],
        status: "operational",
        icon: "shield",
    },
    {
        id: "compute",
        name: "Compute Infrastructure",
        shortName: "COMPUTE",
        description: "High-performance virtual machines and dedicated servers deployed on enterprise hardware. Full root access with hourly billing.",
        features: [
            "NVMe SSD storage",
            "AMD EPYC & Intel Xeon",
            "Up to 100Gbps networking",
            "Hourly billing",
            "Full root access",
        ],
        status: "operational",
        icon: "server",
    }, */
    {
        id: "game-hosting",
        name: "Game Server Hosting",
        shortName: "GAME_SRV",
        description: "Optimized game server infrastructure with low-latency networking and DDoS protection included. Support for all major titles.",
        features: [
            "Low-latency networking",
            "Included DDoS protection",
            "One-click game deployment",
            "Automatic backups",
            "24/7 monitoring",
        ],
        status: "operational",
        icon: "gamepad",
    },
    {
        id: "voice-servers",
        name: "Voice Infrastructure",
        shortName: "VOICE_SRV",
        description: "Professional voice communication servers including TeamSpeak and Mumble. Crystal-clear audio with priority traffic routing.",
        features: [
            "TeamSpeak & Mumble",
            "Priority traffic routing",
            "Low-latency audio codec",
            "Custom branding",
            "DDoS protected",
        ],
        status: "operational",
        icon: "mic",
    },
    {
        id: "application-hosting",
        name: "Application Hosting",
        shortName: "APP_HOST",
        description: "Managed Node.js, Python, and container deployments. Push-to-deploy with automatic scaling and zero-downtime updates.",
        features: [
            "Node.js & Python support",
            "Docker containers",
            "Auto-scaling",
            "Zero-downtime deploys",
            "Custom domains & SSL",
        ],
        status: "operational",
        icon: "code",
    },
    /*{
        id: "managed-services",
        name: "Managed Services",
        shortName: "MANAGED",
        description: "Let our team handle your infrastructure. 24/7 monitoring, security hardening, performance optimization, and incident response.",
        features: [
            "24/7 expert monitoring",
            "Security hardening",
            "Performance tuning",
            "Incident response",
            "Monthly reporting",
        ],
        status: "operational",
        icon: "wrench",
    },*/
];

export type ServiceStatus = "operational" | "degraded" | "down" | "checking";

export interface StatusService {
    id: string;
    name: string;
    endpoint: string;
    pingUrl: string;
    status: ServiceStatus;
    uptime: number;
    responseTime: number;
}

export const statusServices: StatusService[] = [
    // ═══════════════════════════════════════════════════════════════════════
    // EXAMPLE SERVICE (commented for reference)
    // ═══════════════════════════════════════════════════════════════════════
    // {
    //     id: "example-service",
    //     // Unique identifier for DOM elements and tracking
    //     // Used internally - not displayed to users
    //
    //     name: "Example Service",
    //     // Display name shown on the status card
    //     // This is what users see as the service title
    //
    //     endpoint: "example.lumixsolutions.org",
    //     // The hostname/domain displayed under the service name
    //     // Shown in monospace font as a technical reference
    //
    //     pingUrl: "https://example.lumixsolutions.org",
    //     // The actual URL that gets pinged when checking status
    //     // Must be a full URL with protocol (https://)
    //     // This is where the HTTP HEAD request is sent
    //
    //     status: "operational",
    //     // Initial/default status before any ping occurs
    //     // Options: "operational" | "degraded" | "down" | "checking"
    //     // Gets overwritten by real ping results on page load
    //
    //     uptime: 99.99,
    //     // Historical uptime percentage (for display purposes)
    //     // This is a static value you set manually
    //     // Not automatically calculated - just for show
    //
    //     responseTime: 12,
    //     // Initial/default response time in milliseconds
    //     // Gets overwritten by actual ping measurements
    //     // This is just a placeholder until real ping runs
    // },
    // ═══════════════════════════════════════════════════════════════════════
    {
        id: "main",
        name: "Central Network",
        endpoint: "lumixsolutions.org (protected edge)",
        pingUrl: "https://lumixsolutions.org",
        status: "operational",
        uptime: 100.0,
        responseTime: 5,
    },
    {
        id: "billing",
        name: "Billing Portal",
        endpoint: "billing.lumixsolutions.org",
        pingUrl: "https://billing.lumixsolutions.org",
        status: "operational",
        uptime: 99.99,
        responseTime: 45,
    },
    {
        id: "ptero",
        name: "Control Panel",
        endpoint: "panel.lumixsolutions.org",
        pingUrl: "https://panel.lumixsolutions.org",
        status: "operational",
        uptime: 99.99,
        responseTime: 15,
    },
];

export const stats = [
    { label: "Uptime", value: "99.99%", unit: "SLA" },
    { label: "Mitigated", value: "10+", unit: "Tbps" },
    { label: "Latency", value: "<10", unit: "ms" },
    { label: "Locations", value: "12", unit: "PoPs" },
];

// ═══════════════════════════════════════════════════════════════════════════
// Staff & Leadership
// ═══════════════════════════════════════════════════════════════════════════

export interface StaffMember {
    id: string;
    name: string;
    title: string;
    image: string;
    description: string;
}

export const leadership: StaffMember[] = [
    {
        id: "ceo-evan",
        name: "Evan V.",
        title: "Chief Executive Officer",
        image: "/images/staff/evan-v.png",
        description: "Leading Lumix Solutions with a focus on resilient, high-performance infrastructure.",
    },
    {
        id: "ceo-keaghan",
        name: "Keaghan G.",
        title: "Chief Executive Officer",
        image: "/images/staff/keaghan-g.png",
        description: "Leading Lumix Solutions with commitment to innovation and operational excellence.",
    },
    {
        id: "coo-elijah",
        name: "Elijah V.",
        title: "Chief Operating Officer",
        image: "/images/staff/elijah-clinton-demarion-vinson.png",
        description: "Overseeing operational efficiency, strategic planning, and cross-team coordination across Lumix Solutions.",
    },
    {
        id: "cmo-landon",
        name: "Landon R.",
        title: "Chief Marketing Officer",
        image: "/images/staff/landon-r.jpg",
        description: "Driving marketing strategy and brand growth for Lumix Solutions.",
    },
    {
        id: "sysadmin-david",
        name: "David Z.",
        title: "Systems Administrator",
        image: "/images/staff/david-z.jpg",
        description: "Managing core systems, automation, and platform reliability across production infrastructure.",
    },
    {
        id: "sysadmin-zachary",
        name: "Zachary C.",
        title: "Systems Administrator",
        image: "/images/staff/zachary-c.jpg",
        description: "Maintaining server health, hardening configurations, and supporting day-to-day operations.",
    },
];

export interface Team {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export const teams: Team[] = [
    {
        id: "engineering",
        name: "Engineering",
        description: "Our engineering team builds and maintains the core infrastructure that powers Lumix Solutions. From network architecture to custom tooling, they ensure everything runs at peak performance.",
        icon: "code",
    },
    {
        id: "support",
        name: "Support",
        description: "Available 24/7, our support team consists of experienced engineers who understand networking at a deep level. No script readers—just real solutions from real experts.",
        icon: "headset",
    },
    {
        id: "security",
        name: "Security",
        description: "Our security team monitors threats around the clock, develops DDoS mitigation strategies, and ensures your infrastructure stays protected against evolving attack vectors.",
        icon: "shield",
    },
    {
        id: "operations",
        name: "Operations",
        description: "The operations team handles day-to-day infrastructure management, capacity planning, and ensures our global network maintains its industry-leading uptime.",
        icon: "server",
    },
];
