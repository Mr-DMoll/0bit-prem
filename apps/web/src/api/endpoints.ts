export const endpoints = {
  // Auth
  auth: {
    register:           "/auth/register",
    verifyCode:         "/auth/verify-code",
    login:              "/auth/login",
    forgotPassword:     "/auth/forgot-password",
    resendVerification: "/auth/resend-verification",
    me:                 "/auth/me",
    logout:             "/auth/logout",
    provision:          "/auth/provision",
    resetPassword:      "/auth/reset-password",
  },

  // Users
  users: {
    profile:      "/users/me",
    password:     "/users/me/password",
    avatarPresign: "/users/profile/avatar/presign",
    list:         "/users",
    byId:         (id: string) => `/users/${id}`,
    provision:    "/users/provision",
    status:       (id: string) => `/users/${id}/status`,
    role:         (id: string) => `/users/${id}/role`,
    resendInvite: "/users/resend-invite",
    delete:       (id: string) => `/users/${id}`,
  },

  // Super Admin
  superAdmin: {
    stats:     "/super-admin/stats",
    audit:     "/super-admin/audit",
    admins:    "/super-admin/admins",
    adminInvite: "/super-admin/admins/invite",
    adminRemove: (id: string) => `/super-admin/admins/${id}`,
    settings:  "/super-admin/settings",
  },

  // Admin
  admin: {
    dashboard:    "/admin/dashboard",
    users:        "/admin/users",
    userStatus:   (id: string) => `/admin/users/${id}/status`,
    userRole:     (id: string) => `/admin/users/${id}/role`,
    userInvite:    "/admin/users/invite",
    managers:      "/admin/managers",
    managerInvite: "/admin/managers/invite",
  },

  // Music (admin content management)
  adminMusic: {
    albums:       "/admin/music/albums",
    albumById:    (id: string) => `/admin/music/albums/${id}`,
    tracks:       (albumId: string) => `/admin/music/albums/${albumId}/tracks`,
    tracksBatch:  (albumId: string) => `/admin/music/albums/${albumId}/tracks/batch`,
    tracksBulk:   (albumId: string) => `/admin/music/albums/${albumId}/tracks/bulk`,
    trackById:    (id: string) => `/admin/music/tracks/${id}`,
  },

  // Music (public browse/stream/buy)
  music: {
    albums:    "/music/albums",
    albumById: (id: string) => `/music/albums/${id}`,
    purchase:  (id: string) => `/music/albums/${id}/purchase`,
    myAlbums:  "/music/my-albums",
    sanctumMix: "/music/sanctum-mix",
  },

  // Events (admin + public)
  adminEvents: {
    list:   "/admin/events",
    byId:   (id: string) => `/admin/events/${id}`,
  },
  events: {
    list: "/events",
    byId: (id: string) => `/events/${id}`,
  },

  // Gallery (admin + public)
  adminGallery: {
    list:      "/admin/gallery",
    byId:      (id: string) => `/admin/gallery/${id}`,
    bulk:      "/admin/gallery/bulk",
    reorder:   "/admin/gallery/reorder",
    bulkMove:  "/admin/gallery/bulk-move",
    albums:    "/admin/gallery/albums",
    albumById: (id: string) => `/admin/gallery/albums/${id}`,
  },
  gallery: {
    list: "/gallery",
  },

  // Bookings (admin + public)
  adminBookings: {
    list:          "/admin/bookings",
    updateStatus:  (id: string) => `/admin/bookings/${id}/status`,
    updateNotes:   (id: string) => `/admin/bookings/${id}/notes`,
    reply:         (id: string) => `/admin/bookings/${id}/reply`,
    eventTypes:    "/admin/bookings/event-types",
    eventTypeById: (id: string) => `/admin/bookings/event-types/${id}`,
  },
  bookings: {
    submit:     "/bookings",
    eventTypes: "/bookings/event-types",
  },

  // Sessions (single-device playback enforcement)
  sessions: {
    claim: "/sessions/claim",
    check: "/sessions/check",
  },

  // Uploads (admin file uploads to R2)
  adminUploads: {
    presign: "/admin/uploads/presign",
    track:   "/admin/uploads/track",
  },

  // Content (About/Contact/Harinam text, admin + public)
  adminContent: {
    get:    "/admin/content",
    revert: (key: string) => `/admin/content/${key}/revert`,
  },
  content: {
    get: "/content",
  },

  // Merch (admin catalog management)
  adminMerch: {
    products:    "/admin/merch/products",
    productById: (id: string) => `/admin/merch/products/${id}`,
    variants:    (productId: string) => `/admin/merch/products/${productId}/variants`,
    variantById: (id: string) => `/admin/merch/variants/${id}`,
  },

  // Merch (public browse/checkout)
  merch: {
    products:    "/merch/products",
    productById: (id: string) => `/merch/products/${id}`,
    checkout:    "/merch/checkout",
    myOrders:    "/merch/my-orders",
  },

  // Merch orders (Admin + Manager fulfillment)
  merchOrders: {
    list:         "/merch-orders",
    updateStatus: (id: string) => `/merch-orders/${id}/status`,
  },

  // Projects
  projects: {
    list:         "/projects",
    create:       "/projects",
    byId:         (id: string) => `/projects/${id}`,
    update:       (id: string) => `/projects/${id}`,
    status:       (id: string) => `/projects/${id}/status`,
    addMember:    (id: string) => `/projects/${id}/members`,
    removeMember: (id: string, userId: string) => `/projects/${id}/members/${userId}`,
    delete:       (id: string) => `/projects/${id}`,
  },

  // Intake
  intake: {
    submit:  "/intake",
    list:    "/intake",
    byId:    (id: string) => `/intake/${id}`,
    convert: (id: string) => `/intake/${id}/convert`,
  },

  //Milestones
  milestones: {
    list:    (projectId: string) => `/projects/${projectId}/milestones`,
    create:  (projectId: string) => `/projects/${projectId}/milestones`,
    byId:    (projectId: string, id: string) => `/projects/${projectId}/milestones/${id}`,
    update:  (projectId: string, id: string) => `/projects/${projectId}/milestones/${id}`,
    submit:  (projectId: string, id: string) => `/projects/${projectId}/milestones/${id}/submit`,
    approve: (projectId: string, id: string) => `/projects/${projectId}/milestones/${id}/approve`,
    reject:  (projectId: string, id: string) => `/projects/${projectId}/milestones/${id}/reject`,
    delete:  (projectId: string, id: string) => `/projects/${projectId}/milestones/${id}`,
  },

  //Tasks
  tasks: {
    list:   (projectId: string) => `/projects/${projectId}/tasks`,
    create: (projectId: string) => `/projects/${projectId}/tasks`,
    byId:   (projectId: string, id: string) => `/projects/${projectId}/tasks/${id}`,
    update: (projectId: string, id: string) => `/projects/${projectId}/tasks/${id}`,
    delete: (projectId: string, id: string) => `/projects/${projectId}/tasks/${id}`,
  },
  //Documents
  documents: {
    list:   (projectId: string) => `/projects/${projectId}/documents`,
    create: (projectId: string) => `/projects/${projectId}/documents`,
    byId:   (projectId: string, id: string) => `/projects/${projectId}/documents/${id}`,
    update: (projectId: string, id: string) => `/projects/${projectId}/documents/${id}`,
    delete: (projectId: string, id: string) => `/projects/${projectId}/documents/${id}`,
  },

  //Invoices
  invoices: {
    list:         (projectId: string) => `/projects/${projectId}/invoices`,
    create:       (projectId: string) => `/projects/${projectId}/invoices`,
    byId:         (projectId: string, id: string) => `/projects/${projectId}/invoices/${id}`,
    updateStatus: (projectId: string, id: string) => `/projects/${projectId}/invoices/${id}/status`,
  },

  //Comments
  comments: {
    list:   (projectId: string) => `/projects/${projectId}/comments`,
    create: (projectId: string) => `/projects/${projectId}/comments`,
    delete: (projectId: string, id: string) => `/projects/${projectId}/comments/${id}`,
  },

  //Change Requests
  changeRequests: {
    list:         (projectId: string) => `/projects/${projectId}/change-requests`,
    create:       (projectId: string) => `/projects/${projectId}/change-requests`,
    updateStatus: (projectId: string, id: string) => `/projects/${projectId}/change-requests/${id}/status`,
    delete:       (projectId: string, id: string) => `/projects/${projectId}/change-requests/${id}`,
  },

};
