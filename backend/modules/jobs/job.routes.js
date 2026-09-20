import { Router } from 'express';
import { optionalAuth, requireAuth } from '../../middlewares/auth.middleware.js';
import {
    apply, deleteJob, extractJob, getApplicants, getJob, getJobOptions, getJobs, patchJob, postJob, setApplicationStatus,
} from './job.controller.js';

const router = Router();

router.get('/options', getJobOptions);
router.post('/extract', requireAuth, extractJob);
router.get('/', getJobs);
router.post('/', requireAuth, postJob);
router.get('/:slug', optionalAuth, getJob);
router.patch('/:id', requireAuth, patchJob);
router.delete('/:id', requireAuth, deleteJob);
router.post('/:id/apply', requireAuth, apply);
router.get('/:id/applicants', requireAuth, getApplicants);
router.patch('/:id/applicants/:applicationId', requireAuth, setApplicationStatus);

export default router;
