/**
 * SupportFlow Precision Enterprise - API & State Abstraction Client
 * Automatically manages persistent state in localStorage and is pre-configured
 * to toggle seamlessly to the backend REST API once created.
 */

const Api = (function() {
  const STORAGE_KEYS = {
    TICKETS: 'supportflow_tickets_v1',
    NOTIFICATIONS: 'supportflow_notifs_v1',
    ACTIVE_ROLE: 'supportflow_role_v1',
    SESSION: 'supportflow_session_v1',
    CUSTOMERS: 'supportflow_customers_v1',
    STAFF: 'supportflow_staff_v1'
  };

  const CONFIG = {
    USE_REMOTE_API: false,
    API_BASE_URL: 'http://localhost:5000/api'
  };

  // Initialize storage if empty
  function initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.TICKETS)) {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([
        { ...INITIAL_USERS.customer, password: 'password123' },
        { id: 'usr_9420', name: 'Robert Hastings', email: 'robert@globex.io', company: 'Globex Corp', role: 'customer', avatarText: 'RH', password: 'password123' },
        { id: 'usr_9430', name: 'Michael Chen', email: 'mchen@infinisys.com', company: 'InfiniSys Global', role: 'customer', avatarText: 'MC', password: 'password123' }
      ]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.STAFF)) {
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(INITIAL_USERS.staff));
    }
  }

  initStorage();

  function loadTickets() {
    initStorage();
    try {
      const tickets = JSON.parse(localStorage.getItem(STORAGE_KEYS.TICKETS) || '[]');
      // Dynamically re-calculate minutes remaining on every load
      return tickets.map(t => calculateSla(t));
    } catch (e) {
      console.error('Error loading tickets from localStorage', e);
      return [];
    }
  }

  function saveTickets(tickets) {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  }

  function calculateSla(ticket) {
    if (!ticket.sla || !ticket.sla.deadline) return ticket;
    const now = Date.now();
    const deadline = new Date(ticket.sla.deadline).getTime();
    const diffMinutes = Math.round((deadline - now) / 60000);

    let state = 'Safe';
    if (diffMinutes < 0) {
      state = 'Overdue';
    } else if (diffMinutes <= 120) {
      state = 'At Risk';
    }

    return {
      ...ticket,
      sla: {
        ...ticket.sla,
        minutesRemaining: diffMinutes,
        state: state
      }
    };
  }

  return {
    config: CONFIG,

    getSession() {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    setSession(user, role) {
      const session = {
        user,
        role: role || user.role || 'customer',
        token: 'jwt_' + Math.random().toString(36).substring(2, 15),
        loggedInAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, session.role);
      return session;
    },

    clearSession() {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    },

    getActiveUser(role) {
      const session = this.getSession();
      if (session && session.user) {
        if (!role || session.role === role) {
          return session.user;
        }
      }
      if (role === 'customer') {
        return INITIAL_USERS.customer;
      }
      return INITIAL_USERS.staff[0]; // Default staff Marcus Vance
    },

    getRegisteredCustomers() {
      initStorage();
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
      } catch (e) {
        return [INITIAL_USERS.customer];
      }
    },

    registerCustomer({ name, email, company, password }) {
      initStorage();
      const customers = this.getRegisteredCustomers();
      const normalizedEmail = email.trim().toLowerCase();

      const existing = customers.find(c => c.email.toLowerCase() === normalizedEmail);
      if (existing) {
        return { success: false, message: 'An account with this corporate email already exists.' };
      }

      const initials = name.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CU';
      const newCustomer = {
        id: 'usr_' + Math.floor(1000 + Math.random() * 9000),
        name: name.trim(),
        email: normalizedEmail,
        company: company ? company.trim() : 'Enterprise Partner',
        role: 'customer',
        avatarText: initials,
        password: password || 'password123',
        createdAt: new Date().toISOString()
      };

      customers.push(newCustomer);
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));

      // Push a welcome notification
      try {
        const notifs = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
        notifs.unshift({
          id: 'notif_' + Date.now(),
          title: 'Welcome to SupportFlow',
          message: `Hello ${newCustomer.name}! Your customer account for ${newCustomer.company} is active.`,
          type: 'info',
          timestamp: new Date().toISOString(),
          unread: true
        });
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
      } catch (e) {}

      this.setSession(newCustomer, 'customer');
      return { success: true, user: newCustomer };
    },

    loginCustomer(email, password) {
      initStorage();
      const customers = this.getRegisteredCustomers();
      const normalizedEmail = email.trim().toLowerCase();

      let user = customers.find(c => c.email.toLowerCase() === normalizedEmail);

      // Support fallback for default demo user
      if (!user && (normalizedEmail === 'sarah@acme.com' || normalizedEmail === 'customer@supportflow.internal')) {
        user = INITIAL_USERS.customer;
      }

      if (!user) {
        return { success: false, message: 'Account not found. Please verify your email or sign up.' };
      }

      // If user has stored password, check it (demo default password123)
      if (user.password && password && user.password !== password) {
        return { success: false, message: 'Invalid password. Please check your credentials.' };
      }

      this.setSession(user, 'customer');
      return { success: true, user };
    },

    loginCustomerMagicLink(email) {
      initStorage();
      const customers = this.getRegisteredCustomers();
      const normalizedEmail = email.trim().toLowerCase();

      let user = customers.find(c => c.email.toLowerCase() === normalizedEmail);
      if (!user && (normalizedEmail === 'sarah@acme.com' || normalizedEmail === 'customer@supportflow.internal')) {
        user = INITIAL_USERS.customer;
      }

      if (!user) {
        // Auto-provision temporary demo user for frictionless magic link testing
        const domain = normalizedEmail.split('@')[1] || 'company.com';
        const companyName = domain.split('.')[0].toUpperCase();
        user = {
          id: 'usr_' + Math.floor(1000 + Math.random() * 9000),
          name: normalizedEmail.split('@')[0].replace('.', ' ').toUpperCase(),
          email: normalizedEmail,
          company: companyName,
          role: 'customer',
          avatarText: normalizedEmail.substring(0, 2).toUpperCase()
        };
      }

      this.setSession(user, 'customer');
      return { success: true, user };
    },

    resetCustomerPassword(email, newPassword) {
      initStorage();
      const customers = this.getRegisteredCustomers();
      const normalizedEmail = email.trim().toLowerCase();

      const index = customers.findIndex(c => c.email.toLowerCase() === normalizedEmail);
      if (index !== -1) {
        customers[index].password = newPassword;
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
      }
      return { success: true, message: 'Password reset successful! You can now log in with your new credentials.' };
    },

    loginStaff(email, password) {
      initStorage();
      const staffList = this.getStaffMembers();
      const normalizedEmail = email.trim().toLowerCase();

      let staffMember = staffList.find(s => s.email.toLowerCase() === normalizedEmail);

      // Also support by ID or loose matching
      if (!staffMember) {
        staffMember = staffList.find(s => s.email.toLowerCase().includes(normalizedEmail.replace('@supportflow.internal', '')));
      }

      if (!staffMember) {
        return { success: false, message: 'Internal staff record not found for this email address.' };
      }

      this.setSession(staffMember, 'staff');
      return { success: true, user: staffMember };
    },

    getStaffMembers() {
      initStorage();
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.STAFF);
        return stored ? JSON.parse(stored) : INITIAL_USERS.staff;
      } catch (e) {
        return INITIAL_USERS.staff;
      }
    },

    async getTickets() {
      if (CONFIG.USE_REMOTE_API) {
        const res = await fetch(`${CONFIG.API_BASE_URL}/tickets`);
        return await res.json();
      }
      return loadTickets();
    },

    async getTicketById(id) {
      if (CONFIG.USE_REMOTE_API) {
        const res = await fetch(`${CONFIG.API_BASE_URL}/tickets/${id}`);
        return await res.json();
      }
      const tickets = loadTickets();
      return tickets.find(t => t.id === id) || null;
    },

    async createTicket(payload) {
      if (CONFIG.USE_REMOTE_API) {
        const res = await fetch(`${CONFIG.API_BASE_URL}/tickets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        return await res.json();
      }

      const tickets = loadTickets();
      const newIdNumber = 8488 + tickets.length + Math.floor(Math.random() * 10) + 1;
      const newId = `SF-${newIdNumber}`;

      // Default 4-hour SLA deadline for standard tickets, 1-hour for Critical
      const slaMinutes = payload.priority === 'Critical' ? 60 : 240;
      const deadlineDate = new Date(Date.now() + slaMinutes * 60 * 1000);

      const newTicket = {
        id: newId,
        subject: payload.subject,
        description: payload.description,
        category: payload.category,
        priority: payload.priority,
        status: 'Open',
        customer: payload.customer || INITIAL_USERS.customer,
        assignedEmployee: null,
        sla: {
          deadline: deadlineDate.toISOString(),
          minutesRemaining: slaMinutes,
          state: 'Safe'
        },
        attachments: payload.attachments || [],
        comments: [],
        history: [
          {
            id: `h_${Date.now()}`,
            action: 'CREATED',
            user: payload.customer?.name || 'Customer',
            details: `Ticket submitted with priority ${payload.priority}`,
            timestamp: new Date().toISOString()
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      tickets.unshift(newTicket);
      saveTickets(tickets);
      return newTicket;
    },

    async updateStatus(id, newStatus, user) {
      const tickets = loadTickets();
      const index = tickets.findIndex(t => t.id === id);
      if (index === -1) throw new Error('Ticket not found');

      const oldStatus = tickets[index].status;
      tickets[index].status = newStatus;
      tickets[index].updatedAt = new Date().toISOString();

      tickets[index].history.push({
        id: `h_${Date.now()}`,
        action: 'STATUS_CHANGED',
        user: user.name,
        details: `Status updated from ${oldStatus} to ${newStatus}`,
        timestamp: new Date().toISOString()
      });

      saveTickets(tickets);
      return tickets[index];
    },

    async assignTicket(id, employeeId, user) {
      const tickets = loadTickets();
      const index = tickets.findIndex(t => t.id === id);
      if (index === -1) throw new Error('Ticket not found');

      const employee = INITIAL_USERS.staff.find(e => e.id === employeeId) || null;
      tickets[index].assignedEmployee = employee ? { id: employee.id, name: employee.name, role: employee.role } : null;
      if (tickets[index].status === 'Open' && employee) {
        tickets[index].status = 'Assigned';
      }
      tickets[index].updatedAt = new Date().toISOString();

      tickets[index].history.push({
        id: `h_${Date.now()}`,
        action: 'ASSIGNED',
        user: user.name,
        details: employee ? `Assigned to ${employee.name}` : 'Unassigned from current agent',
        timestamp: new Date().toISOString()
      });

      saveTickets(tickets);
      return tickets[index];
    },

    async escalateTicket(id, user) {
      const tickets = loadTickets();
      const index = tickets.findIndex(t => t.id === id);
      if (index === -1) throw new Error('Ticket not found');

      tickets[index].status = 'Escalated';
      tickets[index].priority = 'Critical';
      tickets[index].updatedAt = new Date().toISOString();

      tickets[index].history.push({
        id: `h_${Date.now()}`,
        action: 'ESCALATED',
        user: user.name,
        details: 'Ticket escalated: priority elevated to Critical and flagged for supervisor triage.',
        timestamp: new Date().toISOString()
      });

      saveTickets(tickets);
      return tickets[index];
    },

    async addComment(id, comment) {
      const tickets = loadTickets();
      const index = tickets.findIndex(t => t.id === id);
      if (index === -1) throw new Error('Ticket not found');

      const newComment = {
        id: `c_${Date.now()}`,
        author: comment.author,
        authorRole: comment.authorRole,
        isInternal: Boolean(comment.isInternal),
        text: comment.text,
        timestamp: new Date().toISOString()
      };

      tickets[index].comments.push(newComment);
      tickets[index].updatedAt = new Date().toISOString();

      tickets[index].history.push({
        id: `h_${Date.now()}`,
        action: comment.isInternal ? 'INTERNAL_NOTE' : 'COMMENT_ADDED',
        user: comment.author,
        details: comment.isInternal ? 'Added private internal note' : 'Added public customer reply',
        timestamp: new Date().toISOString()
      });

      saveTickets(tickets);
      return newComment;
    },

    async getNotifications() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
      } catch (e) {
        return [];
      }
    },

    async markAllNotificationsRead() {
      const notifs = await this.getNotifications();
      const updated = notifs.map(n => ({ ...n, unread: false }));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
      return updated;
    },

    async getMetrics() {
      const tickets = loadTickets();
      const total = tickets.length;
      const open = tickets.filter(t => t.status === 'Open').length;
      const assigned = tickets.filter(t => t.status === 'Assigned').length;
      const inProgress = tickets.filter(t => t.status === 'In Progress').length;
      const pending = tickets.filter(t => t.status === 'Pending Customer').length;
      const resolved = tickets.filter(t => t.status === 'Resolved').length;
      const closed = tickets.filter(t => t.status === 'Closed').length;
      const escalated = tickets.filter(t => t.status === 'Escalated').length;
      const atRiskOrOverdue = tickets.filter(t => t.sla.state === 'At Risk' || t.sla.state === 'Overdue').length;

      return {
        total,
        open,
        assigned,
        inProgress,
        pending,
        resolved,
        closed,
        escalated,
        atRiskOrOverdue,
        active: open + assigned + inProgress + pending + escalated
      };
    }
  };
})();
