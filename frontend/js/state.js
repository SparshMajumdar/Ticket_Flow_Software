/**
 * SupportFlow Precision Enterprise - Seed State Data
 * Holds default enterprise tickets, users, audit history, and alerts.
 */

const INITIAL_USERS = {
  customer: {
    id: 'usr_9410',
    name: 'Sarah Jenkins',
    email: 'sarah@acme.com',
    company: 'Acme Corp',
    role: 'customer',
    avatarText: 'SJ'
  },
  staff: [
    { id: 'emp_0211', name: 'Marcus Vance', email: 'marcus@supportflow.internal', role: 'L3 Platform Engineer', avatarText: 'MV' },
    { id: 'emp_0214', name: 'Elena Rostova', email: 'elena@supportflow.internal', role: 'Senior Support Lead', avatarText: 'ER' },
    { id: 'emp_0218', name: 'David Kim', email: 'david@supportflow.internal', role: 'Security & Auth Specialist', avatarText: 'DK' },
    { id: 'emp_0220', name: 'SupportFlow Admin', email: 'admin@supportflow.internal', role: 'Administrator', avatarText: 'AD' }
  ]
};

const INITIAL_TICKETS = [
  {
    id: 'SF-8488',
    subject: 'Webhook payload signature verification failing',
    description: 'Production HMAC-SHA256 headers are failing intermittently after rotating secret security keys in the dashboard. Multiple delivery attempts have dropped.',
    category: 'API & Webhooks',
    priority: 'Critical',
    status: 'In Progress',
    customer: {
      id: 'usr_9410',
      name: 'Sarah Jenkins',
      email: 'sarah@acme.com',
      company: 'Acme Corp'
    },
    assignedEmployee: {
      id: 'emp_0211',
      name: 'Marcus Vance',
      role: 'L3 Platform Engineer'
    },
    sla: {
      deadline: new Date(Date.now() + 18 * 60 * 1000).toISOString(),
      minutesRemaining: 18,
      state: 'At Risk'
    },
    attachments: [
      { name: 'webhook_payload_dump.json', size: '42 KB', type: 'application/json' },
      { name: 'error_trace.log', size: '12 KB', type: 'text/plain' }
    ],
    comments: [
      {
        id: 'c_001',
        author: 'Sarah Jenkins',
        authorRole: 'customer',
        isInternal: false,
        text: 'We started noticing 401 signature mismatches across our us-east endpoints right after the key rotation at 09:30 UTC.',
        timestamp: '2026-09-15T09:35:00Z'
      },
      {
        id: 'c_002',
        author: 'Marcus Vance',
        authorRole: 'agent',
        isInternal: true,
        text: 'INTERNAL NOTE: Rechecked crypto nonce generator in the webhook relay cluster. Key rotation replication lag seems to be 45 seconds.',
        timestamp: '2026-09-15T09:48:00Z'
      },
      {
        id: 'c_003',
        author: 'Marcus Vance',
        authorRole: 'agent',
        isInternal: false,
        text: 'Hello Sarah, our platform team is actively testing the signature cache invalidation. Can you retry a manual ping via your dashboard?',
        timestamp: '2026-09-15T10:05:00Z'
      }
    ],
    history: [
      { id: 'h_001', action: 'CREATED', user: 'Sarah Jenkins', details: 'Ticket created with priority Critical', timestamp: '2026-09-15T09:30:00Z' },
      { id: 'h_002', action: 'ASSIGNED', user: 'SupportFlow Admin', details: 'Assigned to Marcus Vance', timestamp: '2026-09-15T09:32:00Z' },
      { id: 'h_003', action: 'STATUS_CHANGED', user: 'Marcus Vance', details: 'Status changed from Open to In Progress', timestamp: '2026-09-15T09:40:00Z' }
    ],
    createdAt: '2026-09-15T09:30:00Z',
    updatedAt: '2026-09-15T10:05:00Z'
  },
  {
    id: 'SF-8490',
    subject: 'SSO SAML Assertion expiration on mobile clients',
    description: 'Corporate employees authenticate successfully on desktop Chrome, but iOS/Android clients show token expiration within 5 minutes.',
    category: 'Authentication',
    priority: 'High',
    status: 'Assigned',
    customer: {
      id: 'usr_9410',
      name: 'Sarah Jenkins',
      email: 'sarah@acme.com',
      company: 'Acme Corp'
    },
    assignedEmployee: {
      id: 'emp_0218',
      name: 'David Kim',
      role: 'Security & Auth Specialist'
    },
    sla: {
      deadline: new Date(Date.now() + 95 * 60 * 1000).toISOString(),
      minutesRemaining: 95,
      state: 'At Risk'
    },
    attachments: [
      { name: 'saml_response.xml', size: '18 KB', type: 'application/xml' }
    ],
    comments: [
      {
        id: 'c_101',
        author: 'Sarah Jenkins',
        authorRole: 'customer',
        isInternal: false,
        text: 'Please look into our IdP configuration. Attached the exported SAML assertion dump.',
        timestamp: '2026-09-15T08:15:00Z'
      }
    ],
    history: [
      { id: 'h_101', action: 'CREATED', user: 'Sarah Jenkins', details: 'Ticket created with priority High', timestamp: '2026-09-15T08:15:00Z' },
      { id: 'h_102', action: 'ASSIGNED', user: 'Elena Rostova', details: 'Assigned to David Kim', timestamp: '2026-09-15T08:20:00Z' }
    ],
    createdAt: '2026-09-15T08:15:00Z',
    updatedAt: '2026-09-15T08:20:00Z'
  },
  {
    id: 'SF-8491',
    subject: 'Automated invoice generation showing duplicate vat charges',
    description: 'Our finance team noted that enterprise billing statements for August 2026 had two separate VAT lines applied to the same subscription plan.',
    category: 'Billing & Finance',
    priority: 'Medium',
    status: 'Open',
    customer: {
      id: 'usr_9420',
      name: 'Robert Hastings',
      email: 'robert@globex.io',
      company: 'Globex'
    },
    assignedEmployee: null,
    sla: {
      deadline: new Date(Date.now() + 240 * 60 * 1000).toISOString(),
      minutesRemaining: 240,
      state: 'Safe'
    },
    attachments: [],
    comments: [],
    history: [
      { id: 'h_201', action: 'CREATED', user: 'Robert Hastings', details: 'Ticket created with priority Medium', timestamp: '2026-09-15T07:45:00Z' }
    ],
    createdAt: '2026-09-15T07:45:00Z',
    updatedAt: '2026-09-15T07:45:00Z'
  },
  {
    id: 'SF-8492',
    subject: 'Database connection pool saturation in US-West cluster',
    description: 'Postgres connection count spiked above 98% during nightly bulk indexing jobs. Query timeouts are being returned to users.',
    category: 'Infrastructure',
    priority: 'Critical',
    status: 'Escalated',
    customer: {
      id: 'usr_9430',
      name: 'Michael Chen',
      email: 'mchen@infinisys.com',
      company: 'InfiniSys'
    },
    assignedEmployee: {
      id: 'emp_0214',
      name: 'Elena Rostova',
      role: 'Senior Support Lead'
    },
    sla: {
      deadline: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      minutesRemaining: -15,
      state: 'Overdue'
    },
    attachments: [
      { name: 'pg_stat_activity.csv', size: '128 KB', type: 'text/csv' }
    ],
    comments: [
      {
        id: 'c_301',
        author: 'Elena Rostova',
        authorRole: 'agent',
        isInternal: true,
        text: 'INTERNAL NOTE: Escalated to DBA On-Call. Added PgBouncer connection throttling while indexing runs.',
        timestamp: '2026-09-15T07:10:00Z'
      }
    ],
    history: [
      { id: 'h_301', action: 'CREATED', user: 'Michael Chen', details: 'Ticket created', timestamp: '2026-09-15T06:30:00Z' },
      { id: 'h_302', action: 'ESCALATED', user: 'Elena Rostova', details: 'Ticket escalated due to SLA breach risk', timestamp: '2026-09-15T07:10:00Z' }
    ],
    createdAt: '2026-09-15T06:30:00Z',
    updatedAt: '2026-09-15T07:10:00Z'
  },
  {
    id: 'SF-8495',
    subject: 'Request for CSV export capability on usage reports',
    description: 'Our account manager requested an automated monthly CSV export for departmental seat allocations.',
    category: 'Feature Request',
    priority: 'Low',
    status: 'Resolved',
    customer: {
      id: 'usr_9410',
      name: 'Sarah Jenkins',
      email: 'sarah@acme.com',
      company: 'Acme Corp'
    },
    assignedEmployee: {
      id: 'emp_0211',
      name: 'Marcus Vance',
      role: 'L3 Platform Engineer'
    },
    sla: {
      deadline: new Date(Date.now() + 480 * 60 * 1000).toISOString(),
      minutesRemaining: 480,
      state: 'Safe'
    },
    attachments: [],
    comments: [
      {
        id: 'c_401',
        author: 'Marcus Vance',
        authorRole: 'agent',
        isInternal: false,
        text: 'This has been enabled under Account Settings > Exports. Please verify whenever convenient.',
        timestamp: '2026-09-14T16:00:00Z'
      }
    ],
    history: [
      { id: 'h_401', action: 'CREATED', user: 'Sarah Jenkins', details: 'Ticket created', timestamp: '2026-09-14T14:00:00Z' },
      { id: 'h_402', action: 'STATUS_CHANGED', user: 'Marcus Vance', details: 'Status changed to Resolved', timestamp: '2026-09-14T16:00:00Z' }
    ],
    createdAt: '2026-09-14T14:00:00Z',
    updatedAt: '2026-09-14T16:00:00Z'
  }
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif_1',
    category: 'sla',
    urgent: true,
    unread: true,
    title: 'SLA Warning: Ticket #SF-8488',
    message: 'Ticket is approaching resolution deadline (18m remaining). Urgent triage required.',
    timeAgo: '5m ago',
    ticketId: 'SF-8488'
  },
  {
    id: 'notif_2',
    category: 'sla',
    urgent: true,
    unread: true,
    title: 'SLA Overdue: Ticket #SF-8492',
    message: 'Database connection pool saturation ticket has breached SLA deadline by 15 minutes.',
    timeAgo: '15m ago',
    ticketId: 'SF-8492'
  },
  {
    id: 'notif_3',
    category: 'mentions',
    urgent: false,
    unread: true,
    title: 'New Internal Note from Marcus Vance',
    message: 'Marcus mentioned you on ticket #SF-8488 regarding key rotation replication lag.',
    timeAgo: '35m ago',
    ticketId: 'SF-8488'
  },
  {
    id: 'notif_4',
    category: 'status',
    urgent: false,
    unread: false,
    title: 'Ticket #SF-8495 marked as Resolved',
    message: 'Marcus Vance has resolved the CSV export feature request.',
    timeAgo: '1d ago',
    ticketId: 'SF-8495'
  }
];
