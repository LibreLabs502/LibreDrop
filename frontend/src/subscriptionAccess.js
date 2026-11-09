export const hasAdminSubscriptionAccess = (subscription, isSuperuser = false) =>
  isSuperuser || ['active', 'past_due'].includes(subscription?.status)
