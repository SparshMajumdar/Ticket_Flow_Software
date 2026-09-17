/**
 * SupportFlow Precision Enterprise - Customer Portal Module
 * Manages customer ticket creation, file uploads, conversation threads, and closure.
 */

const CustomerPortal = (function() {
  let currentFilter = 'all';
  let searchQuery = '';
  let pendingAttachments = [];

  function init() {
    setupEventListeners();
  }

  function setupEventListeners() {
    // Ticket Search
    const searchInput = document.getElementById('customerSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderCustomerTickets();
      });
    }

    // Filter Tabs
    const filterTabs = document.querySelectorAll('#customerFilterTabs .filter-pill');
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.getAttribute('data-filter') || 'all';
        renderCustomerTickets();
      });
    });

    // File Input change
    const fileInput = document.getElementById('customerTicketFileInput');
    if (fileInput) {
      fileInput.addEventListener('change', handleFileSelect);
    }

    // New Ticket Form Submit
    const newTicketForm = document.getElementById('newTicketForm');
    if (newTicketForm) {
      newTicketForm.addEventListener('submit', handleTicketSubmit);
    }
  }

  function handleFileSelect(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sizeKB = Math.round(file.size / 1024);
      pendingAttachments.push({
        name: file.name,
        size: `${sizeKB} KB`,
        type: file.type || 'application/octet-stream'
      });
    }

    renderPendingAttachments();
  }

  function renderPendingAttachments() {
    const container = document.getElementById('customerAttachmentChips');
    if (!container) return;

    container.innerHTML = '';
    pendingAttachments.forEach((att, idx) => {
      const chip = document.createElement('div');
      chip.className = 'attachment-chip';
      chip.innerHTML = `
        <span class="material-symbols-outlined text-[14px]">attachment</span>
        <span>${att.name} (${att.size})</span>
        <button type="button" class="remove-btn" onclick="CustomerPortal.removeAttachment(${idx})">
          <span class="material-symbols-outlined text-[14px]">close</span>
        </button>
      `;
      container.appendChild(chip);
    });
  }

  function removeAttachment(index) {
    pendingAttachments.splice(index, 1);
    renderPendingAttachments();
  }

  async function handleTicketSubmit(e) {
    e.preventDefault();
    const subject = document.getElementById('ticketSubject').value.trim();
    const category = document.getElementById('ticketCategory').value;
    const priority = document.getElementById('ticketPriority').value;
    const description = document.getElementById('ticketDescription').value.trim();

    if (!subject || !description) {
      App.showToast('Please fill in both the subject and description.');
      return;
    }

    const currentUser = Api.getActiveUser('customer');

    try {
      const newTicket = await Api.createTicket({
        subject,
        category,
        priority,
        description,
        customer: currentUser,
        attachments: [...pendingAttachments]
      });

      // Reset form
      document.getElementById('newTicketForm').reset();
      pendingAttachments = [];
      renderPendingAttachments();

      // Close modal
      App.closeModal('newTicketModal');
      App.showToast(`Ticket #${newTicket.id} submitted successfully!`);

      // Refresh tickets
      await renderCustomerTickets();
    } catch (err) {
      console.error(err);
      App.showToast('Failed to create ticket. Please try again.');
    }
  }

  async function renderCustomerTickets() {
    const listEl = document.getElementById('customerTicketList');
    if (!listEl) return;

    const tickets = await Api.getTickets();
    const currentUser = Api.getActiveUser('customer');

    // Filter tickets belonging to customer
    let filtered = tickets.filter(t => t.customer && t.customer.id === currentUser.id);

    // Apply status filter
    if (currentFilter !== 'all') {
      filtered = filtered.filter(t => {
        if (currentFilter === 'open') return t.status === 'Open' || t.status === 'Assigned';
        if (currentFilter === 'inprogress') return t.status === 'In Progress' || t.status === 'Pending Customer';
        if (currentFilter === 'resolved') return t.status === 'Resolved';
        if (currentFilter === 'closed') return t.status === 'Closed';
        return true;
      });
    }

    // Apply Search
    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.id.toLowerCase().includes(searchQuery) ||
        t.subject.toLowerCase().includes(searchQuery) ||
        t.category.toLowerCase().includes(searchQuery)
      );
    }

    // Update customer active metrics
    const activeCount = filtered.filter(t => t.status !== 'Closed' && t.status !== 'Resolved').length;
    const resolvedCount = filtered.filter(t => t.status === 'Resolved').length;
    const metricActive = document.getElementById('custMetricActive');
    const metricResolved = document.getElementById('custMetricResolved');
    if (metricActive) metricActive.textContent = activeCount;
    if (metricResolved) metricResolved.textContent = resolvedCount;

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--color-on-surface-variant); background: #fff; border-radius: 12px; border: 1px dashed var(--color-border);">
          <span class="material-symbols-outlined text-[40px] text-outline mb-2">support_agent</span>
          <p class="font-semibold text-on-surface">No tickets found</p>
          <p class="text-xs text-outline mt-1">Submit a new request or adjust your filters.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(t => {
      const statusClass = `status-${t.status.toLowerCase().replace(/\s+/g, '')}`;
      const priorityClass = `priority-${t.priority.toLowerCase()}`;
      const timeFormatted = new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      return `
        <div class="ticket-card" onclick="CustomerPortal.openTicketDetails('${t.id}')">
          <div class="ticket-row-top">
            <div class="ticket-id-group">
              <span class="ticket-id">#${t.id}</span>
              <span class="status-pill ${statusClass}">
                <span class="status-dot"></span>
                <span>${t.status}</span>
              </span>
              <span class="priority-pill ${priorityClass}">${t.priority}</span>
            </div>
            <span class="text-xs text-outline font-mono">${timeFormatted}</span>
          </div>
          <h3 class="ticket-subject">${escapeHtml(t.subject)}</h3>
          <div class="ticket-meta-row">
            <div class="ticket-tags">
              <span class="text-xs text-secondary font-medium">${t.category}</span>
              ${t.attachments && t.attachments.length > 0 ? `
                <span class="inline-flex items-center gap-1 text-xs text-outline">
                  <span class="material-symbols-outlined text-[14px]">attach_file</span>
                  <span>${t.attachments.length}</span>
                </span>
              ` : ''}
              ${t.comments && t.comments.filter(c => !c.isInternal).length > 0 ? `
                <span class="inline-flex items-center gap-1 text-xs text-outline">
                  <span class="material-symbols-outlined text-[14px]">chat_bubble_outline</span>
                  <span>${t.comments.filter(c => !c.isInternal).length}</span>
                </span>
              ` : ''}
            </div>
            <div class="ticket-assignee">
              <span class="material-symbols-outlined text-[15px]">badge</span>
              <span>${t.assignedEmployee ? t.assignedEmployee.name : 'Pending Assignment'}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  async function openTicketDetails(ticketId) {
    const ticket = await Api.getTicketById(ticketId);
    if (!ticket) return;

    const modalBody = document.getElementById('ticketDetailsBody');
    const modalTitle = document.getElementById('ticketDetailsTitle');
    const modalActions = document.getElementById('ticketDetailsActions');

    modalTitle.innerHTML = `Ticket <span class="font-mono text-primary">#${ticket.id}</span>`;

    // 5-Stage Stepper calculation: Submitted -> Assigned -> In Progress -> Resolved -> Closed
    const steps = ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
    let currentStepIndex = 0;
    if (ticket.status === 'Assigned') currentStepIndex = 1;
    else if (ticket.status === 'In Progress' || ticket.status === 'Pending Customer' || ticket.status === 'Escalated') currentStepIndex = 2;
    else if (ticket.status === 'Resolved') currentStepIndex = 3;
    else if (ticket.status === 'Closed') currentStepIndex = 4;

    const fillPercent = (currentStepIndex / (steps.length - 1)) * 100;

    const stepperHtml = `
      <div class="progress-stepper">
        <div class="stepper-track">
          <div class="stepper-track-fill" style="width: ${fillPercent}%;"></div>
        </div>
        ${steps.map((step, idx) => {
          let stateClass = '';
          if (idx < currentStepIndex) stateClass = 'completed';
          else if (idx === currentStepIndex) stateClass = 'active';

          return `
            <div class="stepper-step ${stateClass}">
              <div class="stepper-node">
                ${idx < currentStepIndex ? '<span class="material-symbols-outlined text-[16px]">check</span>' : idx + 1}
              </div>
              <span class="stepper-label">${step}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Public Comments ONLY for Customer view
    const publicComments = (ticket.comments || []).filter(c => !c.isInternal);

    modalBody.innerHTML = `
      ${stepperHtml}

      <div style="background: var(--color-surface-container-low); padding: 1rem; border-radius: 8px; margin-bottom: 1.25rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <span class="priority-pill priority-${ticket.priority.toLowerCase()}">${ticket.priority} Priority</span>
          <span class="status-pill status-${ticket.status.toLowerCase().replace(/\s+/g, '')}">
            <span class="status-dot"></span>
            <span>${ticket.status}</span>
          </span>
        </div>
        <h2 style="font-size: 1.1rem; font-weight: 700; color: var(--color-on-surface); margin-bottom: 6px;">${escapeHtml(ticket.subject)}</h2>
        <p style="font-size: 13px; color: var(--color-on-surface-variant); white-space: pre-wrap;">${escapeHtml(ticket.description)}</p>
      </div>

      ${ticket.attachments && ticket.attachments.length > 0 ? `
        <div style="margin-bottom: 1.25rem;">
          <h4 style="font-size: 12px; font-weight: 600; color: var(--color-on-surface); margin-bottom: 6px;">Attachments (${ticket.attachments.length})</h4>
          <div class="attachment-chips">
            ${ticket.attachments.map(att => `
              <div class="attachment-chip">
                <span class="material-symbols-outlined text-[14px]">description</span>
                <span>${escapeHtml(att.name)}</span>
                <span style="color: var(--color-outline);">(${att.size})</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div>
        <h4 style="font-size: 13px; font-weight: 700; color: var(--color-on-surface); border-bottom: 1px solid var(--color-border); padding-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
          <span>Discussion Thread</span>
          <span style="font-size: 11px; font-weight: 500; color: var(--color-outline);">${publicComments.length} messages</span>
        </h4>

        <div class="conversation-thread" id="customerDiscussionThread">
          ${publicComments.length === 0 ? `
            <p style="font-size: 12px; color: var(--color-outline); text-align: center; padding: 1rem;">No replies yet. Our support agents are reviewing your ticket.</p>
          ` : publicComments.map(c => `
            <div class="message-bubble ${c.authorRole === 'customer' ? 'message-customer' : 'message-agent'}">
              <div class="message-header">
                <span class="message-author">${escapeHtml(c.author)} ${c.authorRole === 'agent' ? '(Support Lead)' : ''}</span>
                <span style="font-family: 'JetBrains Mono', monospace;">${new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p style="line-height: 1.4;">${escapeHtml(c.text)}</p>
            </div>
          `).join('')}
        </div>

        ${ticket.status !== 'Closed' ? `
          <div style="margin-top: 1rem;">
            <div class="form-group" style="margin-bottom: 6px;">
              <textarea id="customerReplyInput" class="form-control" placeholder="Type your message or clarification here..." rows="2"></textarea>
            </div>
            <div style="display: flex; justify-content: flex-end;">
              <button type="button" class="btn btn-primary btn-sm" onclick="CustomerPortal.submitReply('${ticket.id}')">
                <span class="material-symbols-outlined text-[16px]">send</span>
                <span>Send Reply</span>
              </button>
            </div>
          </div>
        ` : `
          <div style="margin-top: 1rem; padding: 8px 12px; background: var(--color-surface-container-low); border-radius: 6px; font-size: 12px; color: var(--color-outline); text-align: center;">
            This ticket is closed. If you require further assistance, please submit a new ticket.
          </div>
        `}
      </div>
    `;

    // Footer actions (Confirm Resolution button if ticket is Resolved or In Progress)
    modalActions.innerHTML = `
      ${ticket.status === 'Resolved' ? `
        <button type="button" class="btn btn-primary" onclick="CustomerPortal.confirmResolution('${ticket.id}')">
          <span class="material-symbols-outlined text-[18px]">verified</span>
          <span>Confirm Resolution & Close Ticket</span>
        </button>
      ` : ''}
      <button type="button" class="btn btn-outline" onclick="App.closeModal('ticketDetailsModal')">Close</button>
    `;

    App.openModal('ticketDetailsModal');
  }

  async function submitReply(ticketId) {
    const input = document.getElementById('customerReplyInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const currentUser = Api.getActiveUser('customer');
    await Api.addComment(ticketId, {
      author: currentUser.name,
      authorRole: 'customer',
      isInternal: false,
      text: text
    });

    input.value = '';
    App.showToast('Reply added to discussion');
    await openTicketDetails(ticketId);
    await renderCustomerTickets();
  }

  async function confirmResolution(ticketId) {
    const currentUser = Api.getActiveUser('customer');
    await Api.updateStatus(ticketId, 'Closed', currentUser);
    App.showToast(`Ticket #${ticketId} closed with resolution verified.`);
    App.closeModal('ticketDetailsModal');
    await renderCustomerTickets();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return {
    init,
    renderCustomerTickets,
    openTicketDetails,
    submitReply,
    confirmResolution,
    removeAttachment
  };
})();
