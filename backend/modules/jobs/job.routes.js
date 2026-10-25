import { Router } from 'express';
import { optionalAuth, requireAuth } from '../../middlewares/auth.middleware.js';
import {
    apply, deleteJob, extractJob, getApplicants, getJob, getJobOptions, getJobs, patchJob, postJob, setApplicationStatus,
} from './job.controller.js';
import {
    getAdminQueue, getSuggestion, getWins, rejectSuggestion, setQuest, suggestJob, toggleInsider, verifyProof,
} from './job.quest.js';

const router = Router();

router.get('/options', getJobOptions);
router.get('/wins', getWins); // before /:slug
router.get('/admin/queue', requireAuth, getAdminQueue);
router.post('/suggestions', requireAuth, suggestJob);
router.get('/suggestions/:id', requireAuth, getSuggestion);
router.patch('/suggestions/:id', requireAuth, rejectSuggestion);
router.post('/quests/:id/verify', requireAuth, verifyProof);
router.post('/extract', requireAuth, extractJob);
router.get('/', getJobs);
router.post('/', requireAuth, postJob);
router.get('/:slug', optionalAuth, getJob);
router.patch('/:id', requireAuth, patchJob);
router.delete('/:id', requireAuth, deleteJob);
router.post('/:id/apply', requireAuth, apply);
router.put('/:id/quest', requireAuth, setQuest);
router.post('/:id/insider', requireAuth, toggleInsider);
router.get('/:id/applicants', requireAuth, getApplicants);
router.patch('/:id/applicants/:applicationId', requireAuth, setApplicationStatus);

export default router;
