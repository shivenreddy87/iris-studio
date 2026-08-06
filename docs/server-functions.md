# Server Function Index

All functions live behind `requireSupabaseAuth`. Mutations additionally run
`assertNotSuspended`, a role assertion, an ownership check where applicable, and
a lifecycle check.

## activity

`listPlatformActivityFeed`, `listMyActivity`, `getUpcomingActions`,
`listNotifications`, `markNotificationRead`, `markNotificationUnread`,
`markAllNotificationsRead`, `archiveNotification`, `unarchiveNotification`,
`deleteNotification`, `getNotificationPreferences`,
`updateNotificationPreferences`

## analytics (read-only)

`getPlatformAnalytics`, `getCampaignAnalytics`, `getSubmissionAnalytics`,
`getWinnerAnalytics`, `getPayoutAnalytics`, `getBusinessAnalytics`,
`getInfluencerAnalytics`, `getContestAnalytics`, `getDashboardAnalytics`

## campaign-requests

Business: `listMyCampaignRequests`, `getCampaignRequest`,
`createCampaignRequestDraft`, `updateCampaignRequestDraft`,
`submitCampaignRequest`, `deleteCampaignRequestDraft`

Admin: `listCampaignRequests`, `listAllCampaignRequests`, `listPendingRequests`,
`listRequestEvents`, `startReview`, `approveRequest`, `rejectRequest`,
`requestChanges`, `addInternalNote`, `getAdminReviewSummary`

## contests

Lifecycle (admin): `listApprovedRequestsWithoutContest`,
`createContestFromRequest`, `updateDraftContest`, `publishContest`,
`transitionContest`, `archiveContest`, `deleteDraftContest`

Reads: `getContest`, `listContests`, `listMyContests`, `listContestEvents`,
`listOpenContests`, `listMyActiveContests`, `listMyCompletedContests`,
`listAllContests`

Discovery: `listDiscoverableContests`, `searchContests`, `filterContests`,
`getContestForInfluencer`, `calculateEligibility`

Saved: `saveContest`, `unsaveContest`, `listSavedContests`

## contest-applications

`getApplicationContext`, `applyToContest`, `withdrawApplication`,
`listMyApplications`, `getMyApplicationEvents`, `listContestApplications`,
`getContestApplicationCounts`

Selection (admin): `shortlistApplication`, `selectParticipant`,
`rejectApplication`, `bulkRejectApplications`, `activateContest`,
`listContestParticipants`, `listSelectedParticipants`, `getSelectionSummary`

## contest-entries

`listMyContestEntries`, `listAllContestEntries`

## contest-submissions

`submitContestContent`, `getMySubmission`, `getSubmission`,
`listContestSubmissions`, `listSubmissionEvents`, `verifySubmission` (admin),
`flagSubmission` (admin), `getContestProgress`, `getContestExecution`,
`listMyContestExecutions`

## winner-selection

`getEvaluationBoard`, `updateSubmissionMetrics`, `calculateRankings`,
`markWinner`, `removeWinner`, `finalizeWinners`, `getContestResults`,
`listContestWinners`, `listResultEvents`, `listMyContestWins`,
`getMyContestOutcome`, `getMySubmissionMetrics`, `listMyWins`, `listAllWinners`

## manual-payouts

Admin: `listPayouts`, `getPayoutTimeline`, `getWinnerPayoutDetails`,
`openContestPayouts`, `requestPayoutDetails`, `verifyPayoutDetails`,
`beginPayoutProcessing`, `markPayoutPaid`, `markPayoutFailed`, `retryPayout`,
`cancelPayoutRecord`, `savePayoutNotes`

Influencer: `listMyRewards`, `submitMyPayoutDetails`

Business: `getContestPayoutProgress` (aggregate only)

## platform-admin

`listAdminBusinesses`, `listAdminInfluencers`, `getAdminUser`,
`suspendPlatformUser`, `reactivatePlatformUser`, `listPlatformSuspensions`,
`listModerationRecords`, `addModerationRecord`, `listPlatformCategories`,
`savePlatformCategory`, `removePlatformCategory`, `listPlatformChannels`,
`savePlatformChannel`, `removePlatformChannel`, `listContestTemplates`,
`saveContestTemplate`, `removeContestTemplate`, `getPlatformSettings`,
`getPlatformSettingsHistory`, `updatePlatformSettings`,
`generatePlatformReport`, `generateBusinessReport`, `generateInfluencerReport`

## profiles

`getMyProfile`, `upsertBusinessProfile`, `upsertInfluencerProfile`,
`completeOnboarding`
