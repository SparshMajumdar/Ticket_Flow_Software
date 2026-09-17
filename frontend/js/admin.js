/**
 * SupportFlow Precision Enterprise - Admin & Organization Operations Module
 * Manages Master Ticket Queue, assignment triage, SLA enforcement, escalation,
 * dual-channel replies (Public vs. Internal Note), and analytics dashboards.
 */

const AdminPortal = (function() {
  let currentFilter = 'all';
  let searchQuery = '';
  let activeTicketId = null;

  function init() {
    setupEventListeners();
    startSlaTicker();
  }

  function setupEventListeners() {
    // Admin Search Input
    const searchInput = document.getElementById('adminSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderMasterQueue();
      });
    }

    // Filter Pills
    const filterTabs = document.querySelectorAll('#adminFilterTabs .filter-pill');
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.getAttribute('data-filter') || 'all';
        renderMasterQueue();
      });
    });
  }

  // Periodic SLA tick every 60 seconds
  function startSlaTicker() {
    setInterval(() => {
      if (App.getCurrentRole() === 'staff') {
        renderMasterQueue();
        if (activeTicketId) {
          updateSlaBadgeInConsole(activeTicketId);
        }
      }
    }, 60000);
  }

  async function updateSlaBadgeInConsole(ticketId) {
    const ticket = await Api.getTicketById(ticketId);
    if (!ticket) return;
    const badgeEl = document.getElementById('consoleSlaBadge');
    if (badgeEl) {
      badgeEl.className = `sla-badge sla-${ticket.sla.state.toLowerCase().replace(/\s+/g, '')}`;
      badgeEl.innerHTML = `
        <span class="material-symbols-outlined text-[14px]">alarm</span>
        <span>${ticket.sla.minutesRemaining > 0 ? `${ticket.sla.minutesRemaining}m left` : `${Math.abs(ticket.sla.minutesRemaining)}m overdue`}</span>
      `;
    }
  }

  async function renderMasterQueue() {
    const listEl = document.getElementById('adminTicketList');
    if (!listEl) return;

    const tickets = await Api.getTickets();
    const metrics = await Api.getMetrics();

    // Update Top Operational Metric Cards
    const mActive = document.getElementById('adminMetricActive');
    const mUnassigned = document.getElementById('adminMetricUnassigned');
    const mRisk = document.getElementById('adminMetricRisk');
    const mEscalated = document.getElementById('adminMetricEscalated');

    const unassignedCount = tickets.filter(t => !t.assignedEmployee && t.status !== 'Closed').length;
    const atRiskCount = tickets.filter(t => (t.sla.state === 'At Risk' || t.sla.state === 'Overdue') && t.status !== 'Closed').length;
    const escalatedCount = tickets.filter(t => t.status === 'Escalated').length;

    if (mActive) mActive.textContent = metrics.active;
    if (mUnassigned) mUnassigned.textContent = unassignedCount;
    if (mRisk) mRisk.textContent = atRiskCount;
    if (mEscalated) mEscalated.textContent = escalatedCount;

    // Apply Filter
    let filtered = [...tickets];
    if (currentFilter === 'unassigned') {
      filtered = filtered.filter(t => !t.assignedEmployee && t.status !== 'Closed');
    } else if (currentFilter === 'critical') {
      filtered = filtered.filter(t => t.priority === 'Critical' && t.status !== 'Closed');
    } else if (currentFilter === 'risk') {
      filtered = filtered.filter(t => (t.sla.state === 'At Risk' || t.sla.state === 'Overdue') && t.status !== 'Closed');
    } else if (currentFilter === 'escalated') {
      filtered = filtered.filter(t => t.status === 'Escalated');
    } else if (currentFilter === 'closed') {
      filtered = filtered.filter(t => t.status === 'Closed');
    }

    // Apply Search
    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.id.toLowerCase().includes(searchQuery) ||
        t.subject.toLowerCase().includes(searchQuery) ||
        t.customer.name.toLowerCase().includes(searchQuery) ||
        (t.assignedEmployee && t.assignedEmployee.name.toLowerCase().includes(searchQuery))
      );
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 3.5rem 1rem; color: var(--color-on-surface-variant); background: #fff; border-radius: 12px; border: 1px dashed var(--color-border);">
          <span class="material-symbols-outlined text-[44px] text-outline mb-2">fact_check</span>
          <p class="font-semibold text-on-surface">Queue clear</p>
          <p class="text-xs text-outline mt-1">No tickets match the selected operational filter.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(t => {
      const statusClass = `status-${t.status.toLowerCase().replace(/\s+/g, '')}`;
      const priorityClass = `priority-${t.priority.toLowerCase()}`;
      const slaClass = `sla-${t.sla.state.toLowerCase().replace(/\s+/g, '')}`;
      const isCritical = t.priority === 'Critical' || t.status === 'Escalated';
      const isOverdue = t.sla.state === 'Overdue';

      let borderModifier = 'border-normal';
      if (isCritical || isOverdue) borderModifier = 'border-critical';
      else if (t.sla.state === 'At Risk') borderModifier = 'border-warning';

      return `
        <div class="ticket-card ${borderModifier}" onclick="AdminPortal.openTriageConsole('${t.id}')">
          <div class="ticket-row-top">
            <div class="ticket-id-group">
              <span class="ticket-id">#${t.id}</span>
              <span class="status-pill ${statusClass}">
                <span class="status-dot"></span>
                <span>${t.status}</span>
              </span>
              <span class="priority-pill ${priorityClass}">${t.priority}</span>
            </div>
            <div class="sla-badge ${slaClass}">
              <span class="material-symbols-outlined text-[13px]">alarm</span>
              <span>${t.sla.minutesRemaining > 0 ? `${t.sla.minutesRemaining}m left` : `${Math.abs(t.sla.minutesRemaining)}m overdue`}</span>
            </div>
          </div>
          <h3 class="ticket-subject">${escapeHtml(t.subject)}</h3>
          <div class="ticket-meta-row">
            <div class="ticket-tags">
              <span class="text-xs font-semibold text-on-surface">${escapeHtml(t.customer.name)} (${escapeHtml(t.customer.company)})</span>
              <span class="text-xs text-outline">•</span>
              <span class="text-xs text-secondary font-medium">${t.category}</span>
              ${t.comments && t.comments.length > 0 ? `
                <span class="inline-flex items-center gap-1 text-xs text-outline">
                  <span class="material-symbols-outlined text-[14px]">chat_bubble_outline</span>
                  <span>${t.comments.length}</span>
                </span>
              ` : ''}
            </div>
            <div class="ticket-assignee">
              <span class="material-symbols-outlined text-[15px] ${t.assignedEmployee ? 'text-primary' : 'text-outline'}">badge</span>
              <span class="${t.assignedEmployee ? 'font-semibold text-on-surface' : 'text-outline'}">${t.assignedEmployee ? t.assignedEmployee.name : 'Unassigned (Needs Triage)'}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  async function openTriageConsole(ticketId) {
    activeTicketId = ticketId;
    const ticket = await Api.getTicketById(ticketId);
    if (!ticket) return;

    const modalBody = document.getElementById('adminConsoleBody');
    const modalTitle = document.getElementById('adminConsoleTitle');
    const staffMembers = Api.getStaffMembers();

    modalTitle.innerHTML = `Admin Triage Console: <span class="font-mono text-primary">#${ticket.id}</span>`;

    const slaClass = `sla-${ticket.sla.state.toLowerCase().replace(/\s+/g, '')}`;

    modalBody.innerHTML = `
      <!-- Top Action Ribbon -->
      <div style="background: var(--color-surface-container-low); padding: 1rem; border-radius: 8px; margin-bottom: 1.25rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="ticket-id" style="font-size: 14px;">#${ticket.id}</span>
            <span class="status-pill status-${ticket.status.toLowerCase().replace(/\s+/g, '')}">
              <span class="status-dot"></span>
              <span>${ticket.status}</span>
            </span>
            <span class="priority-pill priority-${ticket.priority.toLowerCase()}">${ticket.priority}</span>
          </div>

          <div id="consoleSlaBadge" class="sla-badge ${slaClass}">
            <span class="material-symbols-outlined text-[14px]">alarm</span>
            <span>${ticket.sla.minutesRemaining > 0 ? `${ticket.sla.minutesRemaining}m left` : `${Math.abs(ticket.sla.minutesRemaining)}m overdue`}</span>
          </div>
        </div>

        <h3 style="font-size: 15px; font-weight: 700; color: var(--color-on-surface); margin-bottom: 4px;">${escapeHtml(ticket.subject)}</h3>
        <p style="font-size: 12px; color: var(--color-on-surface-variant); margin-bottom: 8px;">
          Raised by <strong>${escapeHtml(ticket.customer.name)}</strong> (${escapeHtml(ticket.customer.company)} - ${escapeHtml(ticket.customer.email)})
        </p>
        <p style="font-size: 13px; color: var(--color-on-surface); background: #fff; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--color-border); white-space: pre-wrap;">${escapeHtml(ticket.description)}</p>
      </div>

      <!-- Quick Triage Controls Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 1.25rem; background: #fff; padding: 12px; border-radius: 8px; border: 1px solid var(--color-border);">
        <!-- Assignee Select -->
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Assignee</label>
          <select class="form-control" onchange="AdminPortal.changeAssignee('${ticket.id}', this.value)">
            <option value="" ${!ticket.assignedEmployee ? 'selected' : ''}>Unassigned</option>
            ${staffMembers.map(s => `
              <option value="${s.id}" ${ticket.assignedEmployee && ticket.assignedEmployee.id === s.id ? 'selected' : ''}>
                ${s.name} (${s.role})
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Status Select -->
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Lifecycle Status</label>
          <select class="form-control" onchange="AdminPortal.changeStatus('${ticket.id}', this.value)">
            <option value="Open" ${ticket.status === 'Open' ? 'selected' : ''}>Open</option>
            <option value="Assigned" ${ticket.status === 'Assigned' ? 'selected' : ''}>Assigned</option>
            <option value="In Progress" ${ticket.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Pending Customer" ${ticket.status === 'Pending Customer' ? 'selected' : ''}>Pending Customer</option>
            <option value="Resolved" ${ticket.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
            <option value="Closed" ${ticket.status === 'Closed' ? 'selected' : ''}>Closed</option>
            <option value="Escalated" ${ticket.status === 'Escalated' ? 'selected' : ''}>Escalated</option>
          </select>
        </div>

        <!-- Escalation Action Button -->
        <div class="form-group" style="margin-bottom: 0; display: flex; flex-direction: column; justify-content: flex-end;">
          <label class="form-label">SLA Action</label>
          <button type="button" class="btn btn-danger btn-sm" onclick="AdminPortal.escalateTicket('${ticket.id}')">
            <span class="material-symbols-outlined text-[16px]">bolt</span>
            <span>Escalate Ticket</span>
          </button>
        </div>
      </div>

      <!-- Dual Channel Messaging -->
      <div style="margin-bottom: 1.25rem;">
        <h4 style="font-size: 13px; font-weight: 700; color: var(--color-on-surface); border-bottom: 1px solid var(--color-border); padding-bottom: 6px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <span>Activity &amp; Communications</span>
          <span style="font-size: 11px; font-weight: 500; color: var(--color-outline);">${ticket.comments ? ticket.comments.length : 0} items</span>
        </h4>

        <div class="conversation-thread" style="margin-top: 0;">
          ${(!ticket.comments || ticket.comments.length === 0) ? `
            <p style="font-size: 12px; color: var(--color-outline); text-align: center; padding: 0.75rem;">No communications recorded yet.</p>
          ` : ticket.comments.map(c => {
            if (c.isInternal) {
              return `
                <div class="message-bubble message-internal">
                  <div class="internal-note-banner">
                    <span class="material-symbols-outlined text-[15px]">lock</span>
                    <span>Internal Team Note (Hidden from Customer)</span>
                  </div>
                  <div class="message-header">
                    <span class="message-author">${escapeHtml(c.author)}</span>
                    <span style="font-family: 'JetBrains Mono', monospace;">${new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p style="line-height: 1.4;">${escapeHtml(c.text)}</p>
                </div>
              `;
            }

            return `
              <div class="message-bubble ${c.authorRole === 'customer' ? 'message-customer' : 'message-agent'}">
                <div class="message-header">
                  <span class="message-author">${escapeHtml(c.author)} ${c.authorRole === 'agent' ? '(Support Lead)' : '(Customer)'}</span>
                  <span style="font-family: 'JetBrains Mono', monospace;">${new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p style="line-height: 1.4;">${escapeHtml(c.text)}</p>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Add Reply Form with Public vs Internal toggle -->
        <div style="margin-top: 1rem; background: var(--color-surface-container-low); padding: 12px; border-radius: 8px; border: 1px solid var(--color-border);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <div style="display: flex; gap: 8px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">
                <input type="radio" name="replyType" value="public" checked onchange="AdminPortal.toggleNoteType(false)">
                <span>Public Reply</span>
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; cursor: pointer; color: var(--internal-note-text);">
                <input type="radio" name="replyType" value="internal" onchange="AdminPortal.toggleNoteType(true)">
                <span class="material-symbols-outlined text-[14px]">lock</span>
                <span>Internal Team Note</span>
              </label>
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 8px;">
            <textarea id="adminReplyText" class="form-control" placeholder="Write response to customer or private internal note..." rows="2"></textarea>
          </div>
          <div style="display: flex; justify-content: flex-end;">
            <button type="button" class="btn btn-primary btn-sm" onclick="AdminPortal.submitComment('${ticket.id}')">
              <span class="material-symbols-outlined text-[16px]">send</span>
              <span id="adminReplyBtnLabel">Post Public Reply</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Audit History Timeline -->
      <div>
        <h4 style="font-size: 13px; font-weight: 700; color: var(--color-on-surface); border-bottom: 1px solid var(--color-border); padding-bottom: 6px;">
          Audit History &amp; Timeline
        </h4>
        <div class="timeline-stream">
          ${ticket.history.slice().reverse().map(h => `
            <div class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <strong>${escapeHtml(h.user)}</strong> — ${escapeHtml(h.details)}
              </div>
              <div class="timeline-time">${new Date(h.timestamp).toLocaleString()}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    App.openModal('adminConsoleModal');
  }

  function toggleNoteType(isInternal) {
    const btnLabel = document.getElementById('adminReplyBtnLabel');
    if (btnLabel) {
      btnLabel.textContent = isInternal ? 'Save Internal Note' : 'Post Public Reply';
    }
  }

  async function changeAssignee(ticketId, employeeId) {
    const currentUser = Api.getActiveUser('staff');
    await Api.assignTicket(ticketId, employeeId, currentUser);
    App.showToast('Ticket assignee updated.');
    await renderMasterQueue();
    await openTriageConsole(ticketId);
  }

  async function changeStatus(ticketId, newStatus) {
    const currentUser = Api.getActiveUser('staff');
    await Api.updateStatus(ticketId, newStatus, currentUser);
    App.showToast(`Ticket status updated to ${newStatus}.`);
    await renderMasterQueue();
    await openTriageConsole(ticketId);
  }

  async function escalateTicket(ticketId) {
    const currentUser = Api.getActiveUser('staff');
    await Api.escalateTicket(ticketId, currentUser);
    App.showToast(`Ticket #${ticketId} escalated! Priority elevated to Critical.`);
    await renderMasterQueue();
    await openTriageConsole(ticketId);
  }

  async function submitComment(ticketId) {
    const input = document.getElementById('adminReplyText');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const isInternal = document.querySelector('input[name="replyType"]:checked')?.value === 'internal';
    const currentUser = Api.getActiveUser('staff');

    await Api.addComment(ticketId, {
      author: currentUser.name,
      authorRole: 'agent',
      isInternal: isInternal,
      text: text
    });

    input.value = '';
    App.showToast(isInternal ? 'Internal team note saved.' : 'Public reply dispatched.');
    await openTriageConsole(ticketId);
    await renderMasterQueue();
  }

  async function renderAnalytics() {
    const tickets = await Api.getTickets();
    const metrics = await Api.getMetrics();

    // Fill overview numbers
    const totalEl = document.getElementById('anaTotal');
    const resEl = document.getElementById('anaResolved');
    const escEl = document.getElementById('anaEscalated');
    const slaComplianceEl = document.getElementById('anaCompliance');

    if (totalEl) totalEl.textContent = metrics.total;
    if (resEl) resEl.textContent = metrics.resolved + metrics.closed;
    if (escEl) escEl.textContent = metrics.escalated;

    // SLA compliance rate: percentage not overdue
    const overdueCount = tickets.filter(t => t.sla.state === 'Overdue').length;
    const complianceRate = metrics.total > 0 ? Math.round(((metrics.total - overdueCount) / metrics.total) * 100) : 100;
    if (slaComplianceEl) slaComplianceEl.textContent = `${complianceRate}%`;

    // Status breakdown chart bars
    const statusContainer = document.getElementById('chartStatusBars');
    if (statusContainer) {
      const statuses = [
        { label: 'Open', count: tickets.filter(t => t.status === 'Open').length, color: 'var(--status-open)' },
        { label: 'Assigned', count: tickets.filter(t => t.status === 'Assigned').length, color: 'var(--status-assigned)' },
        { label: 'In Progress', count: tickets.filter(t => t.status === 'In Progress' || t.status === 'Pending Customer').length, color: 'var(--status-inprogress)' },
        { label: 'Resolved', count: tickets.filter(t => t.status === 'Resolved').length, color: 'var(--status-resolved)' },
        { label: 'Closed', count: tickets.filter(t => t.status === 'Closed').length, color: 'var(--status-closed)' },
        { label: 'Escalated', count: tickets.filter(t => t.status === 'Escalated').length, color: 'var(--status-escalated)' }
      ];

      statusContainer.innerHTML = statuses.map(s => {
        const pct = metrics.total > 0 ? (s.count / metrics.total) * 100 : 0;
        return `
          <div class="bar-row">
            <span class="bar-label">${s.label}</span>
            <div class="bar-track">
              <div class="bar-fill" style="width: ${pct}%; background: ${s.color};"></div>
            </div>
            <span class="bar-count">${s.count}</span>
          </div>
        `;
      }).join('');
    }

    // Priority breakdown chart bars
    const priorityContainer = document.getElementById('chartPriorityBars');
    if (priorityContainer) {
      const priorities = [
        { label: 'Critical', count: tickets.filter(t => t.priority === 'Critical').length, color: 'var(--status-escalated)' },
        { label: 'High', count: tickets.filter(t => t.priority === 'High').length, color: 'var(--status-pending)' },
        { label: 'Medium', count: tickets.filter(t => t.priority === 'Medium').length, color: 'var(--color-primary-container)' },
        { label: 'Low', count: tickets.filter(t => t.priority === 'Low').length, color: 'var(--status-resolved)' }
      ];

      priorityContainer.innerHTML = priorities.map(p => {
        const pct = metrics.total > 0 ? (p.count / metrics.total) * 100 : 0;
        return `
          <div class="bar-row">
            <span class="bar-label">${p.label}</span>
            <div class="bar-track">
              <div class="bar-fill" style="width: ${pct}%; background: ${p.color};"></div>
            </div>
            <span class="bar-count">${p.count}</span>
          </div>
        `;
      }).join('');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return {
    init,
    renderMasterQueue,
    openTriageConsole,
    changeAssignee,
    changeStatus,
    escalateTicket,
    submitComment,
    toggleNoteType,
    renderAnalytics
  };
})();
