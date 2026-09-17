/**
 * SupportFlow Precision Enterprise - Main Application Controller
 * Handles role routing, active views, global keyboard shortcuts, and modals.
 */

const App = (function() {
  let currentRole = 'customer'; // 'customer' or 'staff'
  let currentStaffView = 'queue'; // 'queue' or 'analytics'

  function init() {
    setupRoleSwitcher();
    setupSubNav();
    setupKeyboardShortcuts();
    setupModalDismissal();
    setupUserMenu();

    // Initialize submodules
    CustomerPortal.init();
    AdminPortal.init();
    NotificationsCenter.init();

    // Initial render based on URL parameter or stored session
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role');
    const session = Api.getSession();

    if (roleParam === 'staff' || (!roleParam && session && session.role === 'staff')) {
      setRole('staff');
    } else {
      setRole('customer');
    }
  }

  function setupUserMenu() {
    const chip = document.getElementById('topUserChip');
    const menu = document.getElementById('topUserDropdown');
    const btnSignOut = document.getElementById('btnUserSignOut');

    if (chip && menu) {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('show');
      });

      document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !chip.contains(e.target)) {
          menu.classList.remove('show');
        }
      });
    }

    if (btnSignOut) {
      btnSignOut.addEventListener('click', () => {
        Api.clearSession();
        showToast('Signed out successfully.');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 500);
      });
    }
  }

  function setupRoleSwitcher() {
    const custBtn = document.getElementById('roleBtnCustomer');
    const staffBtn = document.getElementById('roleBtnStaff');

    if (custBtn) {
      custBtn.addEventListener('click', () => setRole('customer'));
    }
    if (staffBtn) {
      staffBtn.addEventListener('click', () => setRole('staff'));
    }
  }

  function setupSubNav() {
    const queueTab = document.getElementById('tabStaffQueue');
    const analyticsTab = document.getElementById('tabStaffAnalytics');

    if (queueTab) {
      queueTab.addEventListener('click', () => {
        setStaffView('queue');
      });
    }
    if (analyticsTab) {
      analyticsTab.addEventListener('click', () => {
        setStaffView('analytics');
      });
    }
  }

  function setRole(role) {
    currentRole = role;

    const custBtn = document.getElementById('roleBtnCustomer');
    const staffBtn = document.getElementById('roleBtnStaff');
    const userRoleText = document.getElementById('topUserRole');
    const userNameText = document.getElementById('topUserName');
    const userAvatarText = document.getElementById('topUserAvatar');

    const customerDesk = document.getElementById('customerDeskSection');
    const adminDesk = document.getElementById('adminDeskSection');
    const analyticsDesk = document.getElementById('analyticsDeskSection');
    const staffSubNav = document.getElementById('staffSubNav');
    const customerSubNav = document.getElementById('customerSubNav');

    const menuUserName = document.getElementById('menuUserName');
    const menuUserEmail = document.getElementById('menuUserEmail');

    if (role === 'customer') {
      if (custBtn) custBtn.classList.add('active');
      if (staffBtn) staffBtn.classList.remove('active');

      const user = Api.getActiveUser('customer');
      if (userNameText) userNameText.textContent = user.name;
      if (userRoleText) userRoleText.textContent = `${user.company} (Customer)`;
      if (userAvatarText) userAvatarText.textContent = user.avatarText;
      if (menuUserName) menuUserName.textContent = user.name;
      if (menuUserEmail) menuUserEmail.textContent = user.email;

      if (customerDesk) customerDesk.style.display = 'block';
      if (adminDesk) adminDesk.style.display = 'none';
      if (analyticsDesk) analyticsDesk.style.display = 'none';

      if (customerSubNav) customerSubNav.style.display = 'flex';
      if (staffSubNav) staffSubNav.style.display = 'none';

      CustomerPortal.renderCustomerTickets();
      showToast('Switched to Customer Desk');
    } else {
      if (staffBtn) staffBtn.classList.add('active');
      if (custBtn) custBtn.classList.remove('active');

      const user = Api.getActiveUser('staff');
      if (userNameText) userNameText.textContent = user.name;
      if (userRoleText) userRoleText.textContent = user.role;
      if (userAvatarText) userAvatarText.textContent = user.avatarText;
      if (menuUserName) menuUserName.textContent = user.name;
      if (menuUserEmail) menuUserEmail.textContent = user.email;

      if (customerDesk) customerDesk.style.display = 'none';
      if (customerSubNav) customerSubNav.style.display = 'none';
      if (staffSubNav) staffSubNav.style.display = 'flex';

      setStaffView(currentStaffView, false);
      showToast('Switched to Admin Operations Desk');
    }
  }

  function setStaffView(view, notify = true) {
    currentStaffView = view;
    const adminDesk = document.getElementById('adminDeskSection');
    const analyticsDesk = document.getElementById('analyticsDeskSection');
    const queueTab = document.getElementById('tabStaffQueue');
    const analyticsTab = document.getElementById('tabStaffAnalytics');

    if (view === 'queue') {
      if (adminDesk) adminDesk.style.display = 'block';
      if (analyticsDesk) analyticsDesk.style.display = 'none';
      if (queueTab) queueTab.classList.add('active');
      if (analyticsTab) analyticsTab.classList.remove('active');
      AdminPortal.renderMasterQueue();
    } else {
      if (adminDesk) adminDesk.style.display = 'none';
      if (analyticsDesk) analyticsDesk.style.display = 'block';
      if (queueTab) queueTab.classList.remove('active');
      if (analyticsTab) analyticsTab.classList.add('active');
      AdminPortal.renderAnalytics();
    }
  }

  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // ⌘K or Ctrl+K focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (currentRole === 'customer') {
          const s = document.getElementById('customerSearchInput');
          if (s) s.focus();
        } else {
          const s = document.getElementById('adminSearchInput');
          if (s) s.focus();
        }
      }

      // Escape closes modals and drawers
      if (e.key === 'Escape') {
        closeAllModals();
        NotificationsCenter.closeDrawer();
      }
    });
  }

  function setupModalDismissal() {
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('open');
        }
      });
    });
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('open');
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('open');
    }
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
  }

  function showToast(message) {
    const container = document.getElementById('actionToastContainer');
    const textEl = document.getElementById('actionToastText');
    if (!container || !textEl) return;

    textEl.textContent = message;
    container.classList.add('show');

    clearTimeout(container._toastTimeout);
    container._toastTimeout = setTimeout(() => {
      container.classList.remove('show');
    }, 3200);
  }

  return {
    init,
    getCurrentRole: () => currentRole,
    setRole,
    setStaffView,
    openModal,
    closeModal,
    showToast
  };
})();

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
