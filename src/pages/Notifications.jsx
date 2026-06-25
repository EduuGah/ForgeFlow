import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../services/api";
import {
  DEFAULT_LIFESTYLE_REMINDERS,
  cancelCustomReminder,
  rescheduleCustomReminders,
} from "../services/nativeNotificationService";
import { generateSmartNotifications } from "../utils/notificationUtils";
import {
  clearLegacyForgeFlowStorage,
  getUserStorageData,
  saveUserStorageData,
} from "../utils/userStorage";

import { normalizeNotificationFromApi } from "../features/notifications/notificationUtils";
import NotificationsPageSections from "../features/notifications/components/NotificationsPageSections";

import AppPageIntro from "../components/app/AppPageIntro";

const REMINDER_STORAGE_KEY = "notification-reminders-v1";

function createReminderId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `reminder-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

function normalizeReminder(reminder = {}) {
  return {
    id: reminder.id || createReminderId(),
    title: reminder.title || "Lembrete ForgeFlow",
    body: reminder.body || "Seu lembrete esta na hora.",
    time: reminder.time || "18:00",
    days: Array.isArray(reminder.days) ? reminder.days : [],
    enabled: reminder.enabled !== false,
    actionUrl: reminder.actionUrl || "/notifications",
    preset: Boolean(reminder.preset),
  };
}

function getInitialReminderDraft() {
  return {
    title: "",
    body: "",
    time: "18:00",
    days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    enabled: true,
    actionUrl: "/notifications",
  };
}

function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [, setUnreadCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [visibleCount, setVisibleCount] = useState(30);
  const [, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("local");
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [customReminders, setCustomReminders] = useState([]);
  const [reminderDraft, setReminderDraft] = useState(getInitialReminderDraft);
  const openedNotificationTargetRef = useRef("");

  const unlockNotificationScroll = useCallback(() => {
    if (typeof document === 'undefined') return;

    document.documentElement.classList.remove(
      'ff-notification-menu-open',
      'ff-notification-detail-open',
      'ff-modal-open',
      'overflow-hidden',
    );

    document.body.classList.remove(
      'ff-notification-menu-open',
      'ff-notification-detail-open',
      'ff-modal-open',
      'overflow-hidden',
    );

    document.documentElement.style.overflow = '';
    document.documentElement.style.position = '';
    document.documentElement.style.height = '';

    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.height = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
  }, []);

  const notifyBellToRefresh = useCallback(() => {
    window.dispatchEvent(new CustomEvent("forgeflow:notifications-changed"));
  }, []);

  const showToast = useCallback((type, title, message = "") => {
    setToast({
      type,
      title,
      message,
    });

    window.setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  const loadNotifications = useCallback(
    async (filter = statusFilter) => {
      if (!user) return;

      clearLegacyForgeFlowStorage(["notifications"]);

      const cachedNotifications = getUserStorageData(user, "notifications", []);
      const normalizedCached = Array.isArray(cachedNotifications)
        ? cachedNotifications.map(normalizeNotificationFromApi)
        : [];

      setNotifications(normalizedCached);
      setUnreadCount(
        normalizedCached.filter((item) => item.status === "unread").length,
      );
      setLoading(normalizedCached.length === 0);
      setSyncing(true);

      try {
        const query = filter ? `?status=${filter}&limit=80` : "?limit=80";
        const data = await apiFetch(`/notifications${query}`);

        const normalizedNotifications = Array.isArray(data?.notifications)
          ? data.notifications.map(normalizeNotificationFromApi)
          : [];

        setNotifications(normalizedNotifications);
        setUnreadCount(Number(data?.unreadCount) || 0);
        saveUserStorageData(user, "notifications", normalizedNotifications);
        notifyBellToRefresh();
        setSource("database");
      } catch (error) {
        console.error(error);
        setSource("local");
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    },
    [notifyBellToRefresh, statusFilter, user],
  );

  const markNotificationAsRead = useCallback(
    async (notificationId) => {
      const notification = notifications.find(
        (item) => String(item.id) === String(notificationId),
      );

      if (!notification || notification.status !== "unread") {
        return notification || null;
      }

      try {
        const updatedFromApi = await apiFetch(
          `/notifications/${notificationId}/read`,
          {
            method: "PATCH",
          },
        );

        const updatedNotification =
          normalizeNotificationFromApi(updatedFromApi);

        setNotifications((current) => {
          const updated = current.map((item) =>
            String(item.id) === String(notificationId)
              ? updatedNotification
              : item,
          );

          saveUserStorageData(user, "notifications", updated);

          return updated;
        });

        setUnreadCount((current) => Math.max(0, current - 1));
        notifyBellToRefresh();

        return updatedNotification;
      } catch {
        const updatedNotification = {
          ...notification,
          status: "read",
          readAt: new Date().toISOString(),
        };

        setNotifications((current) => {
          const updated = current.map((item) =>
            String(item.id) === String(notificationId)
              ? updatedNotification
              : item,
          );

          saveUserStorageData(user, "notifications", updated);

          return updated;
        });

        setUnreadCount((current) => Math.max(0, current - 1));
        notifyBellToRefresh();

        return updatedNotification;
      }
    },
    [notifications, notifyBellToRefresh, user],
  );

  const handleOpenNotification = useCallback(
    async (notification) => {
      const notificationId = notification?.id;

      if (!notificationId) return;

      const updatedNotification = await markNotificationAsRead(notificationId);

      setSelectedNotification(updatedNotification || notification);
    },
    [markNotificationAsRead],
  );

  useEffect(() => {
    setNotifications([]);
    setUnreadCount(0);
    setSelectedNotification(null);
    openedNotificationTargetRef.current = "";

    if (!user) {
      setLoading(false);
      return;
    }

    loadNotifications();
  }, [loadNotifications, statusFilter, user]);

  useEffect(() => {
    if (!user) {
      setCustomReminders([]);
      return;
    }

    const stored = getUserStorageData(user, REMINDER_STORAGE_KEY, null);
    const reminders = Array.isArray(stored)
      ? stored.map(normalizeReminder)
      : DEFAULT_LIFESTYLE_REMINDERS.map((reminder) =>
          normalizeReminder({ ...reminder, preset: true }),
        );

    setCustomReminders(reminders);
    saveUserStorageData(user, REMINDER_STORAGE_KEY, reminders);

    rescheduleCustomReminders(reminders).catch((error) => console.error(error));
  }, [user]);

  useEffect(() => {
    setVisibleCount(30);
  }, [deferredSearch, statusFilter]);

  useEffect(() => {
    unlockNotificationScroll();

    return () => {
      unlockNotificationScroll();
    };
  }, [location.pathname, unlockNotificationScroll]);

  useEffect(() => {
    if (!notifications.length) return;

    const params = new URLSearchParams(location.search);
    const notificationIdFromUrl = params.get("notification");
    const notificationIdFromState =
      location.state?.selectedNotificationId ||
      location.state?.openNotificationId;

    const notificationIdFromStorage = (() => {
      try {
        return (
          window.sessionStorage.getItem("forgeflow:selected-notification-id") ||
          ""
        );
      } catch {
        return "";
      }
    })();

    const targetId =
      notificationIdFromUrl ||
      notificationIdFromState ||
      notificationIdFromStorage;

    if (!targetId) return;

    const targetNotification = notifications.find(
      (item) => String(item.id) === String(targetId),
    );

    if (!targetNotification) return;
    if (openedNotificationTargetRef.current === String(targetId)) return;

    openedNotificationTargetRef.current = String(targetId);
    unlockNotificationScroll();
    setSelectedNotification(targetNotification);

    if (targetNotification.status === "unread") {
      markNotificationAsRead(targetNotification.id).then((updatedNotification) => {
        if (updatedNotification) {
          setSelectedNotification(updatedNotification);
        }
      });
    }

    window.setTimeout(() => {
      unlockNotificationScroll();

      const scroller = document.querySelector(".ff-page-scroll-shell");
      scroller?.scrollTo?.({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }, 80);

    try {
      window.sessionStorage.removeItem("forgeflow:selected-notification-id");
    } catch {
      // Ignora bloqueio do WebView.
    }
  }, [
    notifications,
    location.search,
    location.state,
    markNotificationAsRead,
    unlockNotificationScroll,
  ]);

  const stats = useMemo(() => {
    const unread = notifications.filter(
      (item) => item.status === "unread",
    ).length;
    const read = notifications.filter((item) => item.status === "read").length;
    const archived = notifications.filter(
      (item) => item.status === "archived",
    ).length;

    return {
      unread,
      read,
      archived,
      total: notifications.length,
    };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const term = deferredSearch.toLowerCase().trim();

    if (!term) return notifications;

    return notifications.filter((notification) => {
      return `${notification.title} ${notification.message} ${notification.type} ${notification.status}`
        .toLowerCase()
        .includes(term);
    });
  }, [notifications, deferredSearch]);

  const visibleNotifications = useMemo(() => {
    return filteredNotifications.slice(0, visibleCount);
  }, [filteredNotifications, visibleCount]);

  async function handleGenerateNotifications() {
    try {
      const data = await generateSmartNotifications({
        user,
        reason: "manual-check",
        force: true,
      });

      const normalizedNotifications = Array.isArray(data?.notifications)
        ? data.notifications.map(normalizeNotificationFromApi)
        : [];

      setNotifications(normalizedNotifications);
      setUnreadCount(Number(data?.unreadCount) || 0);
      saveUserStorageData(user, "notifications", normalizedNotifications);
      notifyBellToRefresh();

      showToast(
        "success",
        "Notificações verificadas",
        data?.created > 0
          ? `${data.created} nova(s) notificação(ões) criada(s).`
          : "Nenhuma nova notificação no momento.",
      );
    } catch (error) {
      console.error(error);

      showToast(
        "error",
        "Erro ao verificar",
        error.message || "Não foi possível gerar notificações.",
      );
    }
  }

  async function handleMarkAsRead(notificationId) {
    const updatedNotification = await markNotificationAsRead(notificationId);

    if (updatedNotification) {
      showToast(
        "success",
        "Notificação lida",
        "A notificação foi marcada como lida.",
      );
    }
  }

  async function handleMarkAsUnread(notificationId) {
    const notification = notifications.find(
      (item) => String(item.id) === String(notificationId),
    );

    if (!notification || notification.status === "unread") return;

    const updatedNotification = {
      ...notification,
      status: "unread",
      readAt: null,
      updatedAt: new Date().toISOString(),
    };

    try {
      const updatedFromApi = await apiFetch(
        `/notifications/${notificationId}/unread`,
        { method: "PATCH" },
      );

      Object.assign(updatedNotification, normalizeNotificationFromApi(updatedFromApi));
    } catch {
      // Mantem o fallback local quando o backend ainda nao tiver esse endpoint.
    }

    setNotifications((current) => {
      const updated = current.map((item) =>
        String(item.id) === String(notificationId) ? updatedNotification : item,
      );

      saveUserStorageData(user, "notifications", updated);

      return updated;
    });

    setSelectedNotification((current) =>
      String(current?.id) === String(notificationId) ? updatedNotification : current,
    );
    setUnreadCount((current) => current + 1);
    notifyBellToRefresh();

    showToast(
      "success",
      "Notificacao marcada",
      "A notificacao voltou para nao lida.",
    );
  }

  function persistReminders(nextReminders) {
    setCustomReminders(nextReminders);
    saveUserStorageData(user, REMINDER_STORAGE_KEY, nextReminders);
    rescheduleCustomReminders(nextReminders).catch((error) => console.error(error));
  }

  function handleReminderDraftChange(field, value) {
    setReminderDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleReminderDayToggle(dayKey) {
    setReminderDraft((current) => {
      const currentDays = Array.isArray(current.days) ? current.days : [];
      const days = currentDays.includes(dayKey)
        ? currentDays.filter((item) => item !== dayKey)
        : [...currentDays, dayKey];

      return {
        ...current,
        days,
      };
    });
  }

  function handleCreateReminder(event) {
    event.preventDefault();

    const title = reminderDraft.title.trim();
    const body = reminderDraft.body.trim();

    if (!title || !reminderDraft.time) {
      showToast("error", "Lembrete incompleto", "Informe titulo e horario.");
      return;
    }

    const nextReminder = normalizeReminder({
      ...reminderDraft,
      id: createReminderId(),
      title,
      body: body || title,
      enabled: true,
      preset: false,
    });

    const nextReminders = [nextReminder, ...customReminders];
    persistReminders(nextReminders);
    setReminderDraft(getInitialReminderDraft());
    showToast("success", "Lembrete criado", "O lembrete foi salvo no app.");
  }

  function handleToggleReminder(reminderId) {
    const nextReminders = customReminders.map((reminder) =>
      String(reminder.id) === String(reminderId)
        ? { ...reminder, enabled: !reminder.enabled }
        : reminder,
    );

    persistReminders(nextReminders);
  }

  function handleDeleteReminder(reminderId) {
    const reminder = customReminders.find((item) => String(item.id) === String(reminderId));
    const nextReminders = customReminders.filter((item) => String(item.id) !== String(reminderId));

    setCustomReminders(nextReminders);
    saveUserStorageData(user, REMINDER_STORAGE_KEY, nextReminders);
    cancelCustomReminder(reminder).catch((error) => console.error(error));
    showToast("success", "Lembrete removido", "O lembrete foi apagado.");
  }

  async function handleMarkAllAsRead() {
    try {
      await apiFetch("/notifications/read-all", {
        method: "PATCH",
      });

      const updatedNotifications = notifications.map((item) => ({
        ...item,
        status: item.status === "unread" ? "read" : item.status,
        readAt:
          item.status === "unread" ? new Date().toISOString() : item.readAt,
      }));

      setNotifications(updatedNotifications);
      saveUserStorageData(user, "notifications", updatedNotifications);
      setUnreadCount(0);
      notifyBellToRefresh();

      if (selectedNotification?.status === "unread") {
        setSelectedNotification({
          ...selectedNotification,
          status: "read",
          readAt: new Date().toISOString(),
        });
      }

      showToast(
        "success",
        "Notificações lidas",
        "Todas as notificações foram marcadas como lidas.",
      );
    } catch (error) {
      console.error(error);

      showToast(
        "error",
        "Erro ao marcar todas",
        error.message || "Não foi possível marcar todas como lidas.",
      );
    }
  }

  async function handleArchiveNotification(notificationId) {
    try {
      const notificationBeforeUpdate = notifications.find(
        (item) => String(item.id) === String(notificationId),
      );

      const updatedFromApi = await apiFetch(
        `/notifications/${notificationId}/archive`,
        {
          method: "PATCH",
        },
      );

      const updatedNotification = normalizeNotificationFromApi(updatedFromApi);

      setNotifications((current) => {
        const updated = current.map((item) =>
          String(item.id) === String(notificationId)
            ? updatedNotification
            : item,
        );

        saveUserStorageData(user, "notifications", updated);

        return updated;
      });

      setSelectedNotification((current) =>
        String(current?.id) === String(notificationId)
          ? updatedNotification
          : current,
      );

      if (notificationBeforeUpdate?.status === "unread") {
        setUnreadCount((current) => Math.max(0, current - 1));
      }

      notifyBellToRefresh();

      showToast(
        "success",
        "Notificação arquivada",
        "A notificação foi arquivada.",
      );
    } catch {
      const notificationBeforeUpdate = notifications.find(
        (item) => String(item.id) === String(notificationId),
      );
      const updatedNotification = {
        ...notificationBeforeUpdate,
        status: "archived",
        archivedAt: new Date().toISOString(),
      };

      setNotifications((current) => {
        const updated = current.map((item) =>
          String(item.id) === String(notificationId)
            ? updatedNotification
            : item,
        );

        saveUserStorageData(user, "notifications", updated);

        return updated;
      });

      setSelectedNotification((current) =>
        String(current?.id) === String(notificationId)
          ? updatedNotification
          : current,
      );

      if (notificationBeforeUpdate?.status === "unread") {
        setUnreadCount((current) => Math.max(0, current - 1));
      }

      notifyBellToRefresh();
      showToast(
        "success",
        "Notificação arquivada",
        "A notificação foi arquivada localmente.",
      );
    }
  }

  function handleDeleteNotification(notificationId) {
    const notification = notifications.find(
      (item) => String(item.id) === String(notificationId),
    );

    setConfirmModal({
      title: "Excluir notificação?",
      description: `A notificação "${
        notification?.title || "selecionada"
      }" será removida.`,
      confirmText: "Excluir",
      variant: "danger",
      onConfirm: async () => {
        try {
          await apiFetch(`/notifications/${notificationId}`, {
            method: "DELETE",
          });

          const updatedNotifications = notifications.filter(
            (item) => String(item.id) !== String(notificationId),
          );

          setNotifications(updatedNotifications);
          saveUserStorageData(user, "notifications", updatedNotifications);
          setUnreadCount(
            updatedNotifications.filter((item) => item.status === "unread")
              .length,
          );
          notifyBellToRefresh();
          setSelectedNotification((current) =>
            String(current?.id) === String(notificationId) ? null : current,
          );
          setConfirmModal(null);

          showToast(
            "success",
            "Notificação excluída",
            "A notificação foi removida.",
          );
        } catch {
          const updatedNotifications = notifications.filter(
            (item) => String(item.id) !== String(notificationId),
          );

          setNotifications(updatedNotifications);
          saveUserStorageData(user, "notifications", updatedNotifications);
          setUnreadCount(
            updatedNotifications.filter((item) => item.status === "unread")
              .length,
          );
          notifyBellToRefresh();
          setSelectedNotification((current) =>
            String(current?.id) === String(notificationId) ? null : current,
          );
          setConfirmModal(null);

          showToast(
            "success",
            "Notificação excluída",
            "A notificação foi removida localmente.",
          );
        }
      },
    });
  }

  function handleOpenAction(notification) {
    if (!notification?.actionUrl) return;

    setSelectedNotification(null);
    navigate(notification.actionUrl);
  }

  return (
    <div className="ff-hevy-page ff-hevy-page-notifications">
      <AppPageIntro
        eyebrow="Central"
        title="Notificações"
        description="Avisos, lembretes e alertas agrupados em uma experiência mais nativa."
        metrics={[
          { label: "Total", value: stats.total },
          { label: "Não lidas", value: stats.unread },
          { label: "Status", value: source === "database" ? "Sincronizado" : "Offline" },
        ]}
      />

      <div className="ff-notifications-body ff-page-mobile-main-grid">
        <NotificationsPageSections
          source={source}
          loading={loading}
          stats={stats}
          search={search}
          statusFilter={statusFilter}
          filteredNotifications={filteredNotifications}
          visibleNotifications={visibleNotifications}
          visibleCount={visibleCount}
          selectedNotification={selectedNotification}
          customReminders={customReminders}
          reminderDraft={reminderDraft}
          confirmModal={confirmModal}
          toast={toast}
          onRefresh={() => loadNotifications()}
          onGenerate={handleGenerateNotifications}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          onMarkAllAsRead={handleMarkAllAsRead}
          onLoadMore={() => setVisibleCount((current) => current + 30)}
          onOpenNotification={handleOpenNotification}
          onMarkAsRead={handleMarkAsRead}
          onMarkAsUnread={handleMarkAsUnread}
          onArchiveNotification={handleArchiveNotification}
          onDeleteNotification={handleDeleteNotification}
          onOpenAction={handleOpenAction}
          onReminderDraftChange={handleReminderDraftChange}
          onReminderDayToggle={handleReminderDayToggle}
          onCreateReminder={handleCreateReminder}
          onToggleReminder={handleToggleReminder}
          onDeleteReminder={handleDeleteReminder}
          onCloseDetail={() => setSelectedNotification(null)}
          onCancelConfirm={() => setConfirmModal(null)}
          onCloseToast={() => setToast(null)}
        />
      </div>
    </div>
  );
}

export default Notifications;
