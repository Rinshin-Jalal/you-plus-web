import { Hono } from 'hono';
import { postVoIPDebug, getVoIPDebugEvents, clearVoIPDebugEvents, getVoIPDebugSummary } from './handlers/voip-debug';
import { initVoipSession, getVoipSessionPrompts } from './handlers/voip-session';
import { testVoipCertificates, simpleVoipTest, advancedVoipTest, getVoipStatus, voipAck, getPendingCallStatusByUUID, getAllPendingCallsList, acknowledgeVoipCall } from './handlers/voip-test';
const router = new Hono();
// ===================================================================
// VoIP Debug Endpoints (@debug-only)
// These endpoints are for debugging VoIP push notifications
// Not used by iOS app in production - development/testing only
// ===================================================================
router.post('/debug/voip', postVoIPDebug);
router.get('/debug/voip', getVoIPDebugEvents);
router.delete('/debug/voip', clearVoIPDebugEvents);
router.get('/debug/voip/summary', getVoIPDebugSummary);
// ===================================================================
// VoIP Session Endpoints (Production)
// Used by iOS app for real call sessions
// ===================================================================
router.post('/session/init', initVoipSession);
router.post('/session/prompts', getVoipSessionPrompts);
// ===================================================================
// VoIP Test Endpoints (@test-only)
// These endpoints are for testing VoIP functionality
// Not used by iOS app in production - testing/validation only
// ===================================================================
router.get('/test-certificates', testVoipCertificates);
router.post('/simple-test', simpleVoipTest);
router.post('/test', advancedVoipTest);
router.get('/status', getVoipStatus);
router.post('/ack', voipAck);
router.get('/debug/pending/:callUUID', getPendingCallStatusByUUID);
router.get('/debug/pending', getAllPendingCallsList);
router.post('/acknowledge', acknowledgeVoipCall);
export default router;
