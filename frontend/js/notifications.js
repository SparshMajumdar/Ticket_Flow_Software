/**
 * SupportFlow Precision Enterprise - Notifications & Alerts Module
 * Manages slide-over drawer, SLA breach alerts, and badge counters.
 */

const NotificationsCenter = (function() {
  let currentCategory = 'all';

  function init() {
    setupEventListeners();
    updateUnreadCount();
  }

  function setupEventListeners() {
    // Category tabs in drawer
    const tabs = document.querySelectorAll('#notifFilterTabs .filter-pill');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCategory = tab.getAttribute('data-notif-filter') || 'all';
        renderDrawerNotifications();
      });
    });
  }

  async function updateUnreadCount() {
    const notifs = await Api.getNotifications();
    const unreadCount = notifs.filter(n => n.unread).length;
    const badge = document.getElementById('topNotifBadge');
    if (badge) {
      if (unreadCount > 0) {
        badge.style.display = 'flex';
        badge.textContent = unreadCount;
      } else {
        badge.style.display = 'none';
      }
    }
  }

  async function openDrawer() {
    const backdrop = document.getElementById('notificationsDrawerBackdrop');
    if (backdrop) {
      backdrop.classList.add('open');
      await renderDrawerNotifications();
    }
  }

  function closeDrawer() {
    const backdrop = document.getElementById('notificationsDrawerBackdrop');
    if (backdrop) {
      backdrop.classList.remove('open');
    }
  }

  async function renderDrawerNotifications() {
    const container = document.getElementById('drawerNotifFeed');
    if (!container) return;

    const notifs = await Api.getNotifications();
    let filtered = notifs;

    if (currentCategory === 'unread') {
      filtered = filtered.filter(n => n.unread);
    } else if (currentCategory === 'sla') {
      filtered = filtered.filter(n => n.category === 'sla');
    } else if (currentCategory === 'mentions') {
      filtered = filtered.filter(n => n.category === 'mentions');
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--color-outline);">
          <span class="material-symbols-outlined text-[36px] mb-2">notifications_off</span>
          <p class="font-medium text-xs">No alerts found</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(n => {
      const isUrgent = n.urgent;
      const isUnread = n.unread;
      const icon = n.category === 'sla' ? 'crisis_alert' : (n.category === 'mentions' ? 'alternate_email' : 'notifications');

      return `
        <div class="notif-card ${isUrgent ? 'urgent' : ''} ${isUnread ? 'unread' : ''}" onclick="NotificationsCenter.handleNotifClick('${n.ticketId}')" style="cursor: pointer;">
          <div style="width: 32px; height: 32px; border-radius: var(--radius-full); background: ${isUrgent ? 'var(--status-escalated)' : 'var(--color-primary)'}; color: #fff; display: flex; align-items: center; justify-content: center; shrink-0;">
            <span class="material-symbols-outlined text-[18px]">${icon}</span>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${isUrgent ? 'var(--status-escalated)' : 'var(--color-primary)'};">${n.category}</span>
              <span style="font-size: 11px; font-family: 'JetBrains Mono', monospace; color: var(--color-outline);">${n.timeAgo}</span>
            </div>
            <p style="font-size: 12px; font-weight: 600; color: var(--color-on-surface); line-height: 1.3;">${escapeHtml(n.title)}</p>
            <p style="font-size: 11px; color: var(--color-on-surface-variant); margin-top: 2px; line-height: 1.3;">${escapeHtml(n.message)}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  async function markAllAsRead() {
    await Api.markAllNotificationsRead();
    App.showToast('All notifications marked as read.');
    await updateUnreadCount();
    await renderDrawerNotifications();
  }

  function handleNotifClick(ticketId) {
    closeDrawer();
    if (ticketId) {
      if (App.getCurrentRole() === 'customer') {
        CustomerPortal.openTicketDetails(ticketId);
      } else {
        AdminPortal.openTriageConsole(ticketId);
      }
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return {
    init,
    openDrawer,
    closeDrawer,
    markAllAsRead,
    handleNotifClick,
    updateUnreadCount
  };
})();
